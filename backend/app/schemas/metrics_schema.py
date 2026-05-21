from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal
from uuid import UUID

class MetricCreateRequest(BaseModel):
    session_id: UUID
    blink_rate: int = Field(..., ge=0, le=60, description="Eye blinks detected per minute")
    gaze_status: Literal["On Screen", "Off Screen", "Uncertain"] = Field(..., description="User's gaze direction status")
    # TODO: Update backend schema later to support "Leaning" and "Fatigue Warning" directly.
    posture_status: Literal["Upright", "Slouched", "Unknown"] = Field(..., description="User's body posture status")
    attention_state: Literal["Focused", "Distracted", "Neutral"] = Field(..., description="Calculated attention focus state")
    active_tab: str = Field(..., description="Title/URL of the currently active browser tab")
    cognitive_load: int = Field(..., ge=0, le=100, description="Cognitive workload score (0 to 100)")
    focus_score: int = Field(..., ge=0, le=100, description="Instantaneous focus score (0 to 100)")
    fatigue_score: int = Field(..., ge=0, le=100, description="Instantaneous fatigue score (0 to 100)")

class MetricResponse(BaseModel):
    id: UUID
    session_id: UUID
    blink_rate: int
    gaze_status: Literal["On Screen", "Off Screen", "Uncertain"]
    posture_status: Literal["Upright", "Slouched", "Unknown"]
    attention_state: Literal["Focused", "Distracted", "Neutral"]
    active_tab: str
    cognitive_load: int
    focus_score: int
    fatigue_score: int
    recorded_at: datetime
