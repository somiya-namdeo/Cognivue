from pydantic import BaseModel, Field
from typing import Optional

class UserProfile(BaseModel):
    user_id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
