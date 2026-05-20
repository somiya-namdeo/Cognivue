from fastapi import APIRouter, HTTPException, status
import logging
from app.database import supabase

router = APIRouter(tags=["Database Verification"])

logger = logging.getLogger("uvicorn.error")

@router.get("/test-db")
def test_db():
    """
    Fetch all rows from the profiles table in Supabase.
    """
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase client is not initialized. Check server logs."
        )
    try:
        # Fetch all rows from profiles
        response = supabase.table("profiles").select("*").execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching from profiles: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query failed: {str(e)}"
        )

@router.post("/seed-profile")
def seed_profile():
    """
    Insert a demo profile into the profiles table in Supabase.
    """
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase client is not initialized. Check server logs."
        )
    try:
        demo_data = {
            "full_name": "Somiya Namdeo",
            "email": "demo@cognivue.ai"
        }
        # Insert row into profiles
        response = supabase.table("profiles").insert(demo_data).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            return {"message": "Demo profile insert executed.", "data": demo_data}
            
    except Exception as e:
        logger.error(f"Error seeding profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database insertion failed: {str(e)}"
        )
