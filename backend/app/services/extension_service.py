"""
ExtensionService — browser activity telemetry persistence layer.

Resilience design:
  • The DB insert for /extension/activity runs inside a BackgroundTask so the
    caller receives its response before Supabase finishes the write.
  • If an insert fails (timeout, connection error, etc.) the payload is pushed
    into an in-memory retry queue.
  • A background retry loop drains the queue every 15 seconds, with individual
    error logging and health-stat tracking.
  • sync_activity() NEVER raises an HTTP exception to the caller for DB errors —
    it always returns either the inserted row (status 201) or a
    {"status": "buffered"} sentinel (status 200).  The route layer decides which
    HTTP status code to send.
"""

from __future__ import annotations

import asyncio
import time
import logging
from collections import deque
from datetime import datetime, timezone
from typing import Any, Deque, Dict, Optional
from uuid import UUID

from fastapi import HTTPException, status, BackgroundTasks

from app.schemas.extension_schema import ActivitySyncRequest
from app.database import supabase

logger = logging.getLogger("uvicorn.error")

# ─────────────────────────────────────────────────────────────────────────────
#  IN-MEMORY RETRY QUEUE
# ─────────────────────────────────────────────────────────────────────────────

# Maximum number of buffered payloads before the oldest are dropped.
_RETRY_QUEUE_MAX = 200

_retry_queue: Deque[Dict[str, Any]] = deque(maxlen=_RETRY_QUEUE_MAX)

# Health stats (monotonically increasing counters)
_stats: Dict[str, int] = {
    "successful_retries": 0,
    "failed_retries": 0,
    "total_buffered": 0,
}

# Asyncio lock so the retry loop and the main request do not race
_retry_lock = asyncio.Lock()

# Sentinel flag — only one retry loop runs at a time across all workers
_retry_loop_started = False


def _build_insert_data(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Re-construct the Supabase insert dict from a buffered payload dict."""
    return {
        "user_id": payload["user_id"],
        "session_id": payload.get("session_id"),
        "domain": payload["domain"],
        "category": payload["activity_category"],
        "mode": payload["detected_mode"],
        "risk_level": "High" if payload.get("detected_mode") == "Distracting" else "Low",
        "active_duration_seconds": payload.get("time_spent", 0),
        "tab_switches": payload.get("tab_switches", 0),
        "recorded_at": payload["recorded_at"],
        "heartbeat": payload.get("heartbeat", False),
    }


async def _retry_loop() -> None:
    """Drain the retry queue in a background asyncio Task (15 s cadence)."""
    global _retry_loop_started
    while True:
        await asyncio.sleep(15)

        if not _retry_queue:
            continue

        async with _retry_lock:
            queue_size = len(_retry_queue)
            logger.info(
                f"[RetryQueue] Attempting drain — queue_size={queue_size} "
                f"successful_retries={_stats['successful_retries']} "
                f"failed_retries={_stats['failed_retries']}"
            )

            # Drain a snapshot so new failures during the loop are appended
            # to the queue without disrupting the current iteration.
            snapshot = list(_retry_queue)
            _retry_queue.clear()

            for payload in snapshot:
                if supabase is None:
                    _retry_queue.appendleft(payload)  # push back
                    continue
                try:
                    insert_data = _build_insert_data(payload)
                    t0 = time.monotonic()
                    res = supabase.table("browser_activity").insert(insert_data).execute()
                    latency_ms = int((time.monotonic() - t0) * 1000)

                    if res.data:
                        _stats["successful_retries"] += 1
                        logger.info(
                            f"[RetryQueue] Retry success — "
                            f"user={payload['user_id']} latency={latency_ms}ms"
                        )
                    else:
                        _stats["failed_retries"] += 1
                        logger.warning(
                            f"[RetryQueue] Retry empty response — "
                            f"user={payload['user_id']}"
                        )
                        _retry_queue.append(payload)  # re-queue
                except Exception as exc:
                    _stats["failed_retries"] += 1
                    logger.error(
                        f"[RetryQueue] Retry failed — "
                        f"user={payload.get('user_id')} error={exc}"
                    )
                    _retry_queue.append(payload)  # re-queue


def _ensure_retry_loop() -> None:
    """Ensure the retry drain loop is running (called once on first insert)."""
    global _retry_loop_started
    if not _retry_loop_started:
        _retry_loop_started = True
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(_retry_loop())
            logger.info("[RetryQueue] Background retry loop started.")
        except RuntimeError:
            # No running event loop during import; the loop will be started
            # on the first actual request.
            pass


# ─────────────────────────────────────────────────────────────────────────────
#  BACKGROUND INSERT HELPER
# ─────────────────────────────────────────────────────────────────────────────

def _do_insert_in_background(insert_data: Dict[str, Any], raw_payload: Dict[str, Any]) -> None:
    """
    Synchronous function that runs the Supabase insert.
    Called by FastAPI BackgroundTasks — executes AFTER the response is sent.
    On failure the payload is pushed to the retry queue.
    """
    if supabase is None:
        logger.warning("[BG Insert] Supabase not initialised — buffering payload.")
        _retry_queue.append(raw_payload)
        _stats["total_buffered"] += 1
        return

    try:
        t0 = time.monotonic()
        res = supabase.table("browser_activity").insert(insert_data).execute()
        latency_ms = int((time.monotonic() - t0) * 1000)

        if res.data:
            logger.info(
                f"[BG Insert] Success — "
                f"user={insert_data['user_id']} "
                f"heartbeat={insert_data.get('heartbeat', False)} "
                f"latency={latency_ms}ms "
                f"queue_size={len(_retry_queue)}"
            )
        else:
            logger.warning(
                f"[BG Insert] Empty response — buffering. "
                f"user={insert_data['user_id']}"
            )
            _retry_queue.append(raw_payload)
            _stats["total_buffered"] += 1

    except Exception as exc:
        logger.error(
            f"[BG Insert] DB error — buffering payload. "
            f"user={insert_data.get('user_id')} error={exc}"
        )
        _retry_queue.append(raw_payload)
        _stats["total_buffered"] += 1


# ─────────────────────────────────────────────────────────────────────────────
#  SERVICE CLASS
# ─────────────────────────────────────────────────────────────────────────────

class ExtensionService:
    """
    Business logic layer for saving and retrieving browser activity telemetry.
    """

    @staticmethod
    async def sync_activity(
        activity_data: ActivitySyncRequest,
        background_tasks: BackgroundTasks,
    ) -> dict:
        """
        Saves domain-level browser activity log into the database.

        The DB insert is performed as a BackgroundTask — the caller receives a
        response immediately.  Any DB failure is buffered for automatic retry
        and NEVER propagated back to the extension as a 4xx error.

        Returns:
          - The inserted row dict if the user validation succeeds.
          - A {"status": "buffered"} sentinel if Supabase is temporarily down.
        """
        # ── 1. Validate user exists (fast path — small select query) ──────────
        if supabase is None:
            # Supabase not configured at all — buffer without crashing.
            raw_payload = _make_raw_payload(activity_data)
            _retry_queue.append(raw_payload)
            _stats["total_buffered"] += 1
            logger.warning(
                "[sync_activity] Supabase not initialised — payload buffered."
            )
            return {"status": "buffered", "message": "activity queued locally"}

        try:
            user_response = supabase.table("profiles") \
                .select("id") \
                .eq("id", str(activity_data.user_id)) \
                .execute()

            if not user_response.data or len(user_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User profile with ID {activity_data.user_id} not found.",
                )
        except HTTPException:
            raise
        except Exception as exc:
            # Profile lookup failed (timeout, network, etc.) — buffer and
            # return 200 so the extension stays connected.
            logger.error(
                f"[sync_activity] Profile lookup error — buffering. error={exc}"
            )
            raw_payload = _make_raw_payload(activity_data)
            _retry_queue.append(raw_payload)
            _stats["total_buffered"] += 1
            return {"status": "buffered", "message": "activity queued locally"}

        # ── 2. Sanitise optional session_id ──────────────────────────────────
        clean_session_id: Optional[str] = None
        if activity_data.session_id:
            sess_str = str(activity_data.session_id).strip()
            if sess_str and sess_str.lower() not in ("null", "none", ""):
                try:
                    clean_session_id = str(UUID(sess_str))
                except ValueError:
                    logger.warning(
                        f"[sync_activity] Invalid session_id UUID: '{sess_str}' — treated as None."
                    )

        # ── 3. Build insert dict ──────────────────────────────────────────────
        now_iso = datetime.now(timezone.utc).isoformat()
        risk_level = "High" if activity_data.detected_mode == "Distracting" else "Low"

        insert_data: Dict[str, Any] = {
            "user_id": str(activity_data.user_id),
            "session_id": clean_session_id,
            "domain": activity_data.domain,
            "category": activity_data.activity_category,
            "mode": activity_data.detected_mode,
            "risk_level": risk_level,
            "active_duration_seconds": activity_data.time_spent,
            "tab_switches": activity_data.tab_switches,
            "recorded_at": now_iso,
            "heartbeat": activity_data.heartbeat or False,
        }

        raw_payload = _make_raw_payload(activity_data, now_iso=now_iso)

        # ── 4. Schedule non-blocking background insert ────────────────────────
        background_tasks.add_task(_do_insert_in_background, insert_data, raw_payload)

        # ── 5. Ensure the retry drain loop is running ─────────────────────────
        _ensure_retry_loop()

        # Return an optimistic response — the client does not wait for the DB.
        # We mimic enough fields so the ActivitySyncResponse schema validates.
        return {
            "id": "00000000-0000-0000-0000-000000000000",
            "user_id": str(activity_data.user_id),
            "session_id": clean_session_id,
            "domain": activity_data.domain,
            "category": activity_data.activity_category,
            "mode": activity_data.detected_mode,
            "risk_level": risk_level,
            "active_duration_seconds": activity_data.time_spent,
            "tab_switches": activity_data.tab_switches,
            "recorded_at": now_iso,
            "heartbeat": activity_data.heartbeat or False,
        }

    @staticmethod
    async def get_user_activity(user_id: UUID) -> list:
        """
        Retrieves latest 20 browser telemetry events for a specific user, sorted desc.
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is currently unavailable. Supabase is not initialized.",
            )

        try:
            response = supabase.table("browser_activity") \
                .select("*") \
                .eq("user_id", str(user_id)) \
                .order("recorded_at", desc=True) \
                .limit(20) \
                .execute()

            return response.data or []
        except Exception as exc:
            error_msg = str(exc)
            logger.error(f"[get_user_activity] DB query failed: {error_msg}")

            if "invalid input syntax for type uuid" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid user_id UUID format.",
                )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query failed: {error_msg}",
            )

    @staticmethod
    def get_retry_queue_health() -> dict:
        """Returns a health snapshot of the in-memory retry queue."""
        return {
            "queue_size": len(_retry_queue),
            "total_buffered": _stats["total_buffered"],
            "successful_retries": _stats["successful_retries"],
            "failed_retries": _stats["failed_retries"],
        }


# ─────────────────────────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _make_raw_payload(
    activity_data: ActivitySyncRequest,
    now_iso: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a serialisable dict suitable for the retry queue."""
    return {
        "user_id": str(activity_data.user_id),
        "session_id": activity_data.session_id,
        "domain": activity_data.domain,
        "activity_category": activity_data.activity_category,
        "detected_mode": activity_data.detected_mode,
        "time_spent": activity_data.time_spent,
        "tab_switches": activity_data.tab_switches,
        "heartbeat": activity_data.heartbeat or False,
        "recorded_at": now_iso or datetime.now(timezone.utc).isoformat(),
    }
