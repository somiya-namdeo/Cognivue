from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import logging
from pydantic import BaseModel
from app.database import supabase

router = APIRouter(tags=["Monitoring"])
logger = logging.getLogger("uvicorn.error")

class PingResponse(BaseModel):
    status: str
    service: str
    timestamp: str

class KeepAliveResponse(BaseModel):
    status: str
    message: str
    timestamp: str

@router.get("/ping", response_model=PingResponse)
async def ping():
    """
    Simple health check endpoint returning a generic alive status and current UTC time.
    """
    return PingResponse(
        status="alive",
        service="Cognivue Backend",
        timestamp=datetime.now(timezone.utc).isoformat()
    )

@router.get("/keep-alive", response_model=KeepAliveResponse)
async def keep_alive():
    """
    Database heartbeat check to ensure connection to Supabase is active and
    insert a keep_alive record to prevent database suspension on idle environments.
    """
    if not supabase:
        logger.error("Supabase client is not initialized for /keep-alive.")
        raise HTTPException(status_code=500, detail="Database client not configured.")
        
    try:
        current_time = datetime.now(timezone.utc).isoformat()
        
        # Insert a heartbeat record into table keep_alive
        supabase.table("keep_alive").insert({
            "project_name": "cognivue",
            "pinged_at": current_time
        }).execute()
        
        return KeepAliveResponse(
            status="success",
            message="Heartbeat recorded successfully",
            timestamp=current_time
        )
    except Exception as e:
        logger.error(f"Failed to record keep-alive heartbeat: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to record heartbeat.")
