from fastapi import APIRouter, status, HTTPException
from uuid import UUID
from app.schemas.analytics_schema import DashboardAnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard/{user_id}", response_model=DashboardAnalyticsResponse, status_code=status.HTTP_200_OK)
async def get_dashboard_analytics(user_id: UUID):
    """
    Retrieve user-specific focus session and cognitive load statistics for the dashboard.
    """
    # TODO: Protect this endpoint with JWT before production.
    try:
        analytics = await AnalyticsService.get_dashboard_analytics(user_id)
        return analytics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while loading dashboard statistics: {str(e)}"
        )
