from app.schemas.auth_schema import UserSignup, UserLogin
from app.database import supabase
from fastapi import HTTPException, status
import logging
from datetime import datetime

logger = logging.getLogger("uvicorn.error")

class AuthService:
    """
    Business logic layer for Authentication and Authorization using Supabase.
    """
    
    @staticmethod
    async def signup_user(signup_data: UserSignup) -> dict:
        """
        Registers a new user inside Supabase Auth / users table and syncs to profiles.
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database/Auth service is currently unavailable. Supabase is not initialized."
            )
            
        try:
            # 1. Sign up the user in Supabase Auth
            auth_response = supabase.auth.sign_up({
                "email": signup_data.email,
                "password": signup_data.password,
                "options": {
                    "data": {
                        "full_name": signup_data.full_name
                    }
                }
            })
            
            user = auth_response.user
            if not user or not user.id:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Auth signup completed but failed to retrieve Supabase user session."
                )

            # 2. Synchronize to profiles table (create or update safely)
            # Match profiles.id exactly with Supabase Auth user.id
            profile_data = {
                "id": user.id,
                "full_name": signup_data.full_name,
                "email": signup_data.email
            }
            
            # Upsert safely to avoid duplicate profile entries and match profiles.id exactly with user.id
            supabase.table("profiles").upsert(profile_data).execute()
            
            return {
                "message": "Account created successfully",
                "user_id": user.id,
                "email": user.email
            }
            
        except HTTPException as he:
            raise he
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Signup failed: {error_msg}")
            
            # Check for duplicate email error messages from Supabase Auth
            if "already registered" in error_msg.lower() or "user already exists" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email already exists."
                )
                
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration failed: {error_msg}"
            )

    @staticmethod
    async def login_user(login_data: UserLogin) -> dict:
        """
        Authenticates user credentials against Supabase Auth.
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database/Auth service is currently unavailable. Supabase is not initialized."
            )
            
        try:
            # Check if email is in deleted_accounts before hitting Supabase Auth
            try:
                del_resp = supabase.table("deleted_accounts").select("email").eq("email", login_data.email).execute()
                if del_resp.data and len(del_resp.data) > 0:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="This account has been deleted and cannot be used again."
                    )
            except HTTPException as he:
                raise he
            except Exception as e:
                pass # Table might not exist or error

            # Sign in with password using Supabase Auth
            auth_response = supabase.auth.sign_in_with_password({
                "email": login_data.email,
                "password": login_data.password
            })
            
            session = auth_response.session
            user = auth_response.user
            
            if not session or not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password."
                )
                
            return {
                "access_token": session.access_token,
                "refresh_token": session.refresh_token,
                "token_type": "bearer",
                "user_id": user.id,
                "email": user.email
            }
            
        except HTTPException as he:
            raise he
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Login failed: {error_msg}")
            
            # Check for invalid credentials error messages from Supabase Auth
            if "invalid login credentials" in error_msg.lower() or "invalid credentials" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password."
                )
                
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Login failed: {error_msg}"
            )

    @staticmethod
    async def delete_user_account(user_id: str) -> dict:
        """
        Deletes or soft-deletes a user account and wipes their related data.
        Deletion order: cognitive_metrics -> browser_activity -> ai_insights -> focus_sessions -> profile -> auth
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database/Auth service is currently unavailable. Supabase is not initialized."
            )
            
        try:
            # Fetch user email before deletion for the blocklist
            user_email = "unknown"
            try:
                user_info = supabase.auth.admin.get_user_by_id(user_id)
                user_email = user_info.user.email
            except Exception as e:
                logger.warning(f"Could not fetch user email for {user_id}: {e}")
                
            try:
                supabase.table("deleted_accounts").insert({
                    "user_id": user_id,
                    "email": user_email,
                    "deleted_at": datetime.utcnow().isoformat()
                }).execute()
            except Exception as e:
                logger.warning(f"Failed to record {user_id} in deleted_accounts: {e}")

            try:
                sessions_resp = supabase.table("focus_sessions").select("id").eq("user_id", user_id).execute()
                session_ids = [s["id"] for s in sessions_resp.data] if sessions_resp.data else []
                if session_ids:
                    supabase.table("cognitive_metrics").delete().in_("session_id", session_ids).execute()
            except Exception as e:
                logger.warning(f"Failed to delete cognitive_metrics for {user_id}: {e}")
            
            try:
                supabase.table("browser_activity").delete().eq("user_id", user_id).execute()
            except Exception as e:
                logger.warning(f"Failed to delete browser_activity for {user_id}: {e}")
            
            try:
                supabase.table("ai_insights").delete().eq("user_id", user_id).execute()
            except Exception as e:
                logger.warning(f"Failed to delete ai_insights for {user_id}: {e}")
            
            try:
                supabase.table("focus_sessions").delete().eq("user_id", user_id).execute()
            except Exception as e:
                logger.warning(f"Failed to delete focus_sessions for {user_id}: {e}")
            
            try:
                supabase.table("profiles").delete().eq("id", user_id).execute()
            except Exception as e:
                logger.warning(f"Failed to delete profile for {user_id}: {e}")
                
            try:
                supabase.auth.admin.delete_user(user_id)
            except Exception as e:
                logger.warning(f"Failed to delete auth user for {user_id}: {e}")
            return {"message": "Account successfully deleted"}
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Delete account failed: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Account deletion failed: {error_msg}"
            )
