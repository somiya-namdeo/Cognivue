from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal
from uuid import UUID

class SessionStartRequest(BaseModel):
    user_id: UUID
    title: str = Field(default="Focus Session")
    session_type: str = Field(default="Deep Work")

class SessionEndRequest(BaseModel):
    session_id: UUID
    focus_score: int = Field(default=0, ge=0, le=100)
    cognitive_load: int = Field(default=0, ge=0, le=100)
    fatigue_level: Literal["Low", "Medium", "High"] = Field(default="Low")
    productivity_score: int = Field(default=0, ge=0, le=100)

class SessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    session_type: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[float] = 0.0
    focus_score: int
    cognitive_load: int
    fatigue_level: Literal["Low", "Medium", "High"]
    productivity_score: int
    created_at: datetime
