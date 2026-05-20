from fastapi import APIRouter, Depends, status
from typing import List
from datetime import datetime, timezone
from app.schemas.insights_schema import InsightCreate, InsightResponse
from app.middleware.auth_middleware import get_current_user

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
