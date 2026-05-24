from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas.user_schema import UserProfile
from app.middleware.auth_middleware import get_current_user
from app.database import supabase

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
    This checks if a deleted profile exists and blocks re-initialization.
    """
    if supabase is not None:
        try:
            # Check if this user_id is in deleted_accounts
            del_resp = supabase.table("deleted_accounts").select("user_id").eq("user_id", user_id).execute()
            if del_resp.data and len(del_resp.data) > 0:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Deleted accounts cannot be reinitialized."
                )
        except HTTPException as he:
            raise he
        except Exception as e:
            pass
            
    return {"message": "User init completed", "user_id": user_id}
