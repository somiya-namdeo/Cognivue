from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal
from uuid import UUID

class ActivitySyncRequest(BaseModel):
    user_id: UUID = Field(..., description="UUID of the user profile")
    domain: str = Field(..., description="Active tab domain name")
    category: str = Field(..., description="Activity category category classification")
    mode: str = Field(..., description="Active contextual focus mode")
    risk_level: Literal["Low", "Medium", "High"] = Field(..., description="Activity distraction risk level")
    active_duration_seconds: int = Field(..., ge=0, description="Elapsed focus duration in seconds")
    tab_switches: int = Field(..., ge=0, description="Tab switch count during synchronization interval")

class ActivitySyncResponse(BaseModel):
    id: UUID
    user_id: UUID
    domain: str
    category: str
    mode: str
    risk_level: Literal["Low", "Medium", "High"]
    active_duration_seconds: int
    tab_switches: int
    recorded_at: datetime
