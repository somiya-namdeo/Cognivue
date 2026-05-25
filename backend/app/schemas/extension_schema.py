from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

class ActivitySyncRequest(BaseModel):
    user_id: UUID = Field(..., description="UUID of the user profile")
    session_id: Optional[UUID] = Field(None, description="UUID of the active tracking session")
    domain: str = Field(..., description="Active tab domain name")
    title: Optional[str] = Field(None, description="Active tab title")
    detected_mode: str = Field(..., description="Active contextual focus mode")
    activity_category: str = Field(..., description="Activity category classification")
    time_spent: int = Field(..., ge=0, description="Elapsed focus duration in seconds")
    tab_switches: int = Field(..., ge=0, description="Tab switch count during synchronization interval")
    timestamp: Optional[str] = Field(None, description="Client-side timestamp")
    heartbeat: Optional[bool] = Field(False, description="Flag indicating if this is a connection heartbeat")

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
    heartbeat: Optional[bool] = False
