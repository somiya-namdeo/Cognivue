from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any

class FocusDriftPoint(BaseModel):
    time: str
    focus: int
    distraction: int

class WeeklyTrendPoint(BaseModel):
    day: str
    focus: int
    fatigue: int
    productivity: int
    duration: int

class FatigueCorrelationPoint(BaseModel):
    time: str
    blink_rate: int
    fatigue: int

class ProductivityPatternPoint(BaseModel):
    domain: str
    score: int
    full_mark: int = 100

class InsightCreate(BaseModel):
    session_id: Optional[str] = None
    title: str = Field(..., description="Short heading for the insight")
    description: str = Field(..., description="Detailed explanation of the cognitive fatigue/focus analytics findings")
    recommendations: List[str] = Field(..., description="Actionable AI recommendations")

class InsightResponse(BaseModel):
    insight_id: str
    session_id: Optional[str]
    title: str
    description: str
    recommendations: List[str]
    created_at: datetime

class CognitiveScores(BaseModel):
    focus_consistency: float = Field(..., ge=0, le=100)
    burnout_risk: float = Field(..., ge=0, le=100)
    cognitive_efficiency: float = Field(..., ge=0, le=100)
    recovery_balance: float = Field(..., ge=0, le=100)
    productivity_momentum: float = Field(..., ge=0, le=100)

class BehaviorPatterns(BaseModel):
    best_time_window: str
    weakest_time_window: str
    deep_work_ratio: float
    attention_stability: float
    fatigue_drift: float

class AIInsightCard(BaseModel):
    title: str
    summary: str
    category: str  # focus | fatigue | productivity | behavior | recovery | anomaly
    severity: str  # positive | neutral | warning | critical
    confidence: float
    recommendation: str
    supporting_metrics: Dict[str, Any]

class AdvancedAIInsightsResponse(BaseModel):
    user_id: str
    generated_at: str
    summary: str
    scores: CognitiveScores
    patterns: BehaviorPatterns
    insights: List[AIInsightCard]
    recommendations: List[str]
    focus_drift_timeline: List[FocusDriftPoint] = []
    weekly_trends: List[WeeklyTrendPoint] = []
    fatigue_correlation: List[FatigueCorrelationPoint] = []
    productivity_patterns: List[ProductivityPatternPoint] = []
