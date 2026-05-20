from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth_schema import UserSignup, UserLogin, TokenResponse, UserSignupResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=UserSignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(signup_data: UserSignup):
    """
    Register a new user account using Supabase Auth and synchronize their profile record.
    """
    result = await AuthService.signup_user(signup_data)
    return result

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    """
    Authenticate user credentials against Supabase Auth and return the access session.
    """
    result = await AuthService.login_user(login_data)
    return result

@router.get("/me")
async def get_me():
    """
    Get current logged-in user details (Static Placeholder for now).
    """
    return {
        "message": "Auth verification successful (placeholder)",
        "user_payload": {
            "id": "placeholder_user_id_123",
            "email": "demo@cognivue.ai"
        }
    }
