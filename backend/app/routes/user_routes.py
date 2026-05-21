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

@router.post("/init/{user_id}", status_code=status.HTTP_200_OK)
async def init_user(user_id: str):
    """
    Ensure a user profile exists for the given user_id.
    This placeholder implementation simply returns a success response.
    In production, it would check the database and create the profile if missing.
    """
    # TODO: Connect with User service / Supabase to create profile if needed
    return {"message": "User init completed", "user_id": user_id}
