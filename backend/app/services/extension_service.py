from app.schemas.extension_schema import ActivitySyncRequest
from app.database import supabase
from datetime import datetime, timezone
from fastapi import HTTPException, status
from uuid import UUID
import logging

logger = logging.getLogger("uvicorn.error")

class ExtensionService:
    """
    Business logic layer for saving and retrieving browser activity telemetry.
    """

    @staticmethod
    async def sync_activity(activity_data: ActivitySyncRequest) -> dict:
        """
        Saves domain-level browser activity log into the database.
        Checks user ID existence against profiles table.
        Generates recorded_at timestamp on the server side.
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is currently unavailable. Supabase is not initialized."
            )
            
        try:
            # 1. Validate that the user exists in profiles table
            user_response = supabase.table("profiles") \
                .select("id") \
                .eq("id", str(activity_data.user_id)) \
                .execute()
                
            if not user_response.data or len(user_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User profile with ID {activity_data.user_id} not found."
                )

            # 2. Construct and insert activity record using backend/server time
            now_iso = datetime.now(timezone.utc).isoformat()
            
            # Dynamically resolve risk level
            risk_level = "High" if activity_data.detected_mode == "Distracting" else "Low"
            
            insert_data = {
                "user_id": str(activity_data.user_id),
                "domain": activity_data.domain,
                "category": activity_data.activity_category,
                "mode": activity_data.detected_mode,
                "risk_level": risk_level,
                "active_duration_seconds": activity_data.time_spent,
                "tab_switches": activity_data.tab_switches,
                "recorded_at": now_iso
            }
            
            insert_response = supabase.table("browser_activity").insert(insert_data).execute()
            
            if not insert_response.data or len(insert_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to record browser activity. Empty database response."
                )
                
            return insert_response.data[0]
            
        except HTTPException as he:
            raise he
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to save browser activity: {error_msg}")
            
            if "invalid input syntax for type uuid" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid user_id UUID format."
                )
                
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to record browser telemetry: {error_msg}"
            )

    @staticmethod
    async def get_user_activity(user_id: UUID) -> list:
        """
        Retrieves latest 20 browser telemetry events for a specific user, sorted desc.
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is currently unavailable. Supabase is not initialized."
            )
            
        try:
            response = supabase.table("browser_activity") \
                .select("*") \
                .eq("user_id", str(user_id)) \
                .order("recorded_at", desc=True) \
                .limit(20) \
                .execute()
                
            return response.data or []
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to retrieve browser activity: {error_msg}")
            
            if "invalid input syntax for type uuid" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid user_id UUID format."
                )
                
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query failed: {error_msg}"
            )
