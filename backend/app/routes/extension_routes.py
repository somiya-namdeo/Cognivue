from fastapi import APIRouter, status, HTTPException
from typing import List
from uuid import UUID
from app.schemas.extension_schema import ActivitySyncRequest, ActivitySyncResponse
from app.services.extension_service import ExtensionService

router = APIRouter(prefix="/extension", tags=["Browser Extension Sync"])

@router.post("/activity", response_model=ActivitySyncResponse, status_code=status.HTTP_201_CREATED)
async def sync_activity(activity_data: ActivitySyncRequest):
    """
    Log privacy-first active tab domain, category, mode, and switch count from the Chrome Extension.
    """
    # Keep public for development testing
    # TODO: Protect this endpoint with JWT before production.
    try:
        activity = await ExtensionService.sync_activity(activity_data)
        return activity
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while syncing browser activity: {str(e)}"
        )

@router.get("/activity/{user_id}", response_model=List[ActivitySyncResponse], status_code=status.HTTP_200_OK)
async def get_user_activity(user_id: UUID):
    """
    Retrieve the latest 20 browser activity records for a specific user profile ordered chronologically descending.
    """
    # Keep public for development testing
    # TODO: Protect this endpoint with JWT before production.
    try:
        activities = await ExtensionService.get_user_activity(user_id)
        return activities
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while retrieving browser activities: {str(e)}"
        )
