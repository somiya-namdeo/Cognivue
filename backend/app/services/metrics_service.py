from app.schemas.metrics_schema import MetricCreateRequest
from app.database import supabase
from datetime import datetime, timezone
from fastapi import HTTPException, status
from uuid import UUID
import logging

logger = logging.getLogger("uvicorn.error")

class MetricsService:
    """
    Business logic layer for recording and retrieving focus/fatigue cognitive metrics.
    """

    @staticmethod
    async def add_metric(metric_data: MetricCreateRequest) -> dict:
        """
        Logs a cognitive metrics snapshot into the database.
        Validates that the corresponding focus session exists and is currently active.
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is currently unavailable. Supabase is not initialized."
            )
            
        try:
            # 1. Validate that the focus session exists
            session_response = supabase.table("focus_sessions") \
                .select("id, end_time") \
                .eq("id", str(metric_data.session_id)) \
                .execute()
                
            if not session_response.data or len(session_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Focus session not found."
                )
                
            session = session_response.data[0]
            
            # 2. Validate that the focus session is active (has not ended)
            if session.get("end_time") is not None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot add metrics to an ended session."
                )
            
            # 3. Construct and insert raw cognitive metric record (no session score averaging yet)
            now_iso = datetime.now(timezone.utc).isoformat()
            insert_data = {
                "session_id": str(metric_data.session_id),
                "blink_rate": metric_data.blink_rate,
                "gaze_status": metric_data.gaze_status,
                "posture_status": metric_data.posture_status,
                "attention_state": metric_data.attention_state,
                "active_tab": metric_data.active_tab,
                "cognitive_load": metric_data.cognitive_load,
                "focus_score": metric_data.focus_score,
                "fatigue_score": metric_data.fatigue_score,
                "recorded_at": now_iso
            }
            
            insert_response = supabase.table("cognitive_metrics").insert(insert_data).execute()
            
            if not insert_response.data or len(insert_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to record cognitive metric. Empty database response."
                )
                
            return insert_response.data[0]
            
        except HTTPException as he:
            raise he
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to record cognitive metric: {error_msg}")
            
            if "invalid input syntax for type uuid" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid session_id UUID format."
                )
                
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to record cognitive telemetry: {error_msg}"
            )

    @staticmethod
    async def get_session_metrics(session_id: UUID) -> list:
        """
        Retrieves all cognitive metrics logged for a session, ordered chronologically ascending.
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is currently unavailable. Supabase is not initialized."
            )
            
        try:
            response = supabase.table("cognitive_metrics") \
                .select("*") \
                .eq("session_id", str(session_id)) \
                .order("recorded_at", desc=False) \
                .execute()
                
            return response.data
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to retrieve session metrics: {error_msg}")
            
            if "invalid input syntax for type uuid" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid session_id UUID format."
                )
                
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query failed: {error_msg}"
            )

    @staticmethod
    async def get_latest_metric(session_id: UUID) -> dict:
        """
        Retrieves the latest cognitive metric recorded for a session.
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is currently unavailable. Supabase is not initialized."
            )
            
        try:
            response = supabase.table("cognitive_metrics") \
                .select("*") \
                .eq("session_id", str(session_id)) \
                .order("recorded_at", desc=True) \
                .limit(1) \
                .execute()
                
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No metrics found for this session."
                )
                
            return response.data[0]
            
        except HTTPException as he:
            raise he
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to retrieve latest session metric: {error_msg}")
            
            if "invalid input syntax for type uuid" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid session_id UUID format."
                )
                
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query failed: {error_msg}"
            )
