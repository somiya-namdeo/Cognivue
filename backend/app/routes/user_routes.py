from fastapi import APIRouter, Depends, status
from app.schemas.user_schema import UserProfile
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """
    Get the profile details of the authenticated user (Placeholder).
    """
    # TODO: Connect with User service / Supabase Database
    return {
        "user_id": current_user.get("user_id", "placeholder_user_id_123"),
        "email": current_user.get("email", "user@example.com"),
        "full_name": "Cognitive User",
        "avatar_url": "https://placehold.co/150",
        "bio": "Focused and productive."
    }

@router.put("/profile", response_model=UserProfile)
async def update_profile(profile_data: UserProfile, current_user: dict = Depends(get_current_user)):
    """
    Update the authenticated user's profile details (Placeholder).
    """
    # TODO: Connect with User service / Supabase Database
    return profile_data
