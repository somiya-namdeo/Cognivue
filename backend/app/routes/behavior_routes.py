from fastapi import APIRouter, status, HTTPException
from uuid import UUID
from app.schemas.behavior_schema import BehaviorIntelligenceResponse
from app.services.behavior_service import BehaviorService

router = APIRouter(prefix="/behavior", tags=["Behavior Intelligence"])

@router.get("/intelligence/{user_id}", response_model=BehaviorIntelligenceResponse, status_code=status.HTTP_200_OK)
async def get_behavior_intelligence(user_id: UUID):
    """
    Retrieve the dynamic Behavior Intelligence report for a specific user profile.
    Fuses browser activity metrics, focus sessions, and cognitive visual attention logs.
    """
    # Keep public for development and Swagger testing
    try:
        intelligence = await BehaviorService.get_behavior_intelligence(user_id)
        return intelligence
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while generating behavioral intelligence: {str(e)}"
        )

@router.get("/health", status_code=status.HTTP_200_OK)
async def get_behavior_health():
    """
    Simple health status endpoint to verify the operational state of the Behavior Intelligence Engine.
    """
    return {
        "status": "healthy",
        "engine": "Cognivue Behavior Intelligence Engine",
        "description": "Fuses multi-table telemetry streams (browser activities, focus sessions, gaze metrics) in real-time."
    }
