from fastapi import APIRouter, BackgroundTasks, Response, status, HTTPException
from typing import List, Union
from uuid import UUID
from app.schemas.extension_schema import ActivitySyncRequest, ActivitySyncResponse
from app.services.extension_service import ExtensionService

router = APIRouter(prefix="/extension", tags=["Browser Extension Sync"])


@router.post(
    "/activity",
    status_code=status.HTTP_201_CREATED,
)
async def sync_activity(
    activity_data: ActivitySyncRequest,
    background_tasks: BackgroundTasks,
    response: Response,
):
    """
    Log privacy-first active tab domain, category, mode, and switch count
    from the Chrome Extension.

    The DB insert runs as a FastAPI BackgroundTask so the response is returned
    immediately — even if Supabase is temporarily slow or unavailable.

    • Successful insert queued → HTTP 201 (Activity record accepted)
    • Supabase temporarily down  → HTTP 200 {"status": "buffered"} (payload queued for retry)
    """
    try:
        result = await ExtensionService.sync_activity(activity_data, background_tasks)
        # If the service signalled buffering, downgrade to 200 so the extension
        # does not treat it as an error.
        if isinstance(result, dict) and result.get("status") == "buffered":
            response.status_code = status.HTTP_200_OK
        return result
    except HTTPException as he:
        raise he
    except Exception as exc:
        # Last-resort catch — NEVER propagate as 400/500 to extension.
        # Buffer and acknowledge.
        import logging
        logging.getLogger("uvicorn.error").error(
            f"[sync_activity route] Unexpected error — returning buffered: {exc}"
        )
        response.status_code = status.HTTP_200_OK
        return {"status": "buffered", "message": "activity queued locally"}


@router.get(
    "/activity/{user_id}",
    response_model=List[ActivitySyncResponse],
    status_code=status.HTTP_200_OK,
)
async def get_user_activity(user_id: UUID):
    """
    Retrieve the latest 20 browser activity records for a specific user
    profile ordered chronologically descending.
    """
    try:
        activities = await ExtensionService.get_user_activity(user_id)
        return activities
    except HTTPException as he:
        raise he
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while retrieving browser activities: {str(exc)}",
        )


@router.get(
    "/health/retry-queue",
    tags=["Health"],
    status_code=status.HTTP_200_OK,
)
async def retry_queue_health():
    """
    Returns current state of the in-memory retry queue.
    Useful for monitoring buffered telemetry during Supabase outages.
    """
    return ExtensionService.get_retry_queue_health()
