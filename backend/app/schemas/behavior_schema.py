from pydantic import BaseModel, Field
from typing import List, Dict, Any, Literal
from uuid import UUID
from datetime import datetime

class BehaviorScores(BaseModel):
    distraction_score: int = Field(..., ge=0, le=100, description="0-100, representing distraction risk and time spent on non-productive domains")
    productivity_stability: int = Field(..., ge=0, le=100, description="0-100, consistency of focus sessions, productive time ratios, and switching frequency")
    focus_drift_probability: int = Field(..., ge=0, le=100, description="0-100, likelihood of focus drifting based on session context volatility")
    context_switching_risk: int = Field(..., ge=0, le=100, description="0-100, cost incurred by rapid alternating between tabs")
    deep_work_quality: int = Field(..., ge=0, le=100, description="0-100, high-fidelity score evaluating uninterrupted focus intervals")

class BrowserBreakdown(BaseModel):
    total_time_seconds: int = Field(..., description="Cumulative tracked browser active duration in seconds")
    productive_time_seconds: int = Field(..., description="Duration spent on development/study/learning in seconds")
    distracting_time_seconds: int = Field(..., description="Duration spent on distraction/social media in seconds")
    neutral_time_seconds: int = Field(..., description="Duration spent on system/navigation/uncategorized pages in seconds")
    productivity_ratio: float = Field(..., description="Percentage ratio of productive time relative to total tracked time")
    distraction_ratio: float = Field(..., description="Percentage ratio of distracting time relative to total tracked time")
    tab_switches: int = Field(..., description="Total tab activations recorded during tracking intervals")

class DomainMetric(BaseModel):
    domain: str = Field(..., description="Active domain name")
    duration_seconds: int = Field(..., description="Accumulated active seconds")
    visits: int = Field(..., description="Total visits/intervals recorded")

class TopDomains(BaseModel):
    productive: List[DomainMetric] = Field(..., description="Top productive domains sorted descending by duration")
    distracting: List[DomainMetric] = Field(..., description="Top distracting domains sorted descending by duration")
    most_used: List[DomainMetric] = Field(..., description="Top overall domains sorted descending by duration")

class BehaviorPatterns(BaseModel):
    best_productivity_domain: str = Field(..., description="Productive domain with longest focus duration")
    highest_distraction_domain: str = Field(..., description="Distraction domain with longest active duration")
    strongest_work_mode: str = Field(..., description="Productive contextual mode showing highest focus and duration")
    weakest_work_mode: str = Field(..., description="Productive contextual mode displaying highest fatigue or visual drift")
    context_switching_risk_label: Literal["Low", "Medium", "High"] = Field(..., description="Categorized switching threshold risk level")
    deep_work_streaks: int = Field(..., description="Consecutive hours/periods of clean work with low tab switches")

class BehaviorInsightCard(BaseModel):
    title: str = Field(..., description="Insight heading summarizing the behavioral analysis")
    summary: str = Field(..., description="Detailed paragraph outlining metrics and cognitive correlations")
    severity: Literal["positive", "neutral", "warning", "critical"] = Field(..., description="Visual styling level for the HUD/dashboard")
    confidence: int = Field(..., ge=0, le=100, description="Confidence percentage (0-100) of the analysis")
    recommendation: str = Field(..., description="Targeted actionable recommendation to optimize focus performance")
    supporting_metrics: Dict[str, Any] = Field(..., description="Supporting metrics used to generate the insight card")

class BehaviorIntelligenceResponse(BaseModel):
    user_id: UUID = Field(..., description="UUID of the requested user profile")
    generated_at: datetime = Field(..., description="Server ISO timestamp of the response generation")
    summary: str = Field(..., description="Dynamic high-level behavioral intelligence executive summary")
    scores: BehaviorScores = Field(..., description="Dynamic behaviors scores derived from mixed telemetry fusion")
    browser_breakdown: BrowserBreakdown = Field(..., description="Structured browser breakdown metrics")
    top_domains: TopDomains = Field(..., description="Top ranked domain sets")
    patterns: BehaviorPatterns = Field(..., description="Discovered behavioral pattern correlations")
    insights: List[BehaviorInsightCard] = Field(..., description="Rich dynamic insights cards")
    recommendations: List[str] = Field(..., description="Dynamic recommendations list")
