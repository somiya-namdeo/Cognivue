from pydantic import BaseModel
from typing import List, Optional
from app.schemas.session_schema import SessionResponse

class FocusTrendItem(BaseModel):
    time: str
    focus: float
    load: float

class ProductivityTrendItem(BaseModel):
    date: str
    productivity: float
    focus: float

class CoachInsightItem(BaseModel):
    title: str
    description: str
    type: str  # positive, warning, neutral

class DashboardAnalyticsResponse(BaseModel):
    total_sessions: int
    total_focus_minutes: float
    average_focus: float
    average_cognitive_load: float
    average_productivity: float
    average_fatigue_score: float
    best_focus_score: float
    recent_sessions: List[SessionResponse]
    focus_trend: List[FocusTrendItem]
    productivity_trend: List[ProductivityTrendItem]
    coach_insights: List[CoachInsightItem]
