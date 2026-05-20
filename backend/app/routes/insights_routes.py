from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from uuid import UUID
from datetime import datetime, timezone
from app.schemas.insights_schema import InsightCreate, InsightResponse, AdvancedAIInsightsResponse
from app.middleware.auth_middleware import get_current_user
from app.services.insights_service import InsightsService

router = APIRouter(prefix="/insights", tags=["Insights"])

@router.post("/generate", response_model=InsightResponse, status_code=status.HTTP_201_CREATED)
async def generate_insight(insight_data: InsightCreate, current_user: dict = Depends(get_current_user)):
    """
    Generate AI-driven focus and wellness insights for a tracking session (Placeholder).
    """
    # TODO: Connect with Insights service / Supabase / AI pipeline
    return {
        "insight_id": "placeholder_insight_id_333",
        "session_id": insight_data.session_id,
        "title": insight_data.title,
        "description": insight_data.description,
        "recommendations": insight_data.recommendations,
        "created_at": datetime.now(timezone.utc)
    }

@router.get("/session/{session_id}", response_model=List[InsightResponse])
async def get_session_insights(session_id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve generated insights for a specific tracking session (Placeholder).
    """
    # TODO: Connect with Insights service / Supabase Database
    return [
        {
            "insight_id": "placeholder_insight_id_333",
            "session_id": session_id,
            "title": "Cognitive Decline Trend Detected",
            "description": "Your focus dropped by 30% after 45 minutes of continuous intense task activity.",
            "recommendations": [
                "Take a 5-minute break and use the 20-20-20 eye rule.",
                "Do a brief deep breathing mindfulness exercise.",
                "Consider stepping away from screens for a light walk."
            ],
            "created_at": datetime.now(timezone.utc)
        }
    ]

@router.get("/generate/{user_id}", response_model=AdvancedAIInsightsResponse, status_code=status.HTTP_200_OK)
async def generate_user_insights(user_id: UUID):
    """
    Generate advanced hybrid AI insights (statistical trends, pattern detection, anomalies, composite scoring, and NLP recommendations) for a specific user.
    """
    # TODO: Protect this endpoint with JWT before production.
    # TODO: Replace hybrid heuristics with trained ML model later.
    # TODO: Add NLP generation model later.
    # TODO: Add RL-based personalized coaching later.
    try:
        insights = await InsightsService.generate_hybrid_insights(user_id)
        return insights
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while generating AI insights: {str(e)}"
        )

