from pydantic import BaseModel, Field

class UserSignup(BaseModel):
    email: str = Field(..., description="User's email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    full_name: str = Field(..., description="User's full name")

class UserLogin(BaseModel):
    email: str
    password: str

class UserSignupResponse(BaseModel):
    message: str = "Account created successfully"
    user_id: str
    email: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    user_id: str
    email: str | None = None
