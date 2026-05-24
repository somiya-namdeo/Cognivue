from fastapi import APIRouter, status, HTTPException
from typing import List
from uuid import UUID
from app.schemas.session_schema import SessionStartRequest, SessionEndRequest, SessionResponse, SessionUpdateRequest
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.post("/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(session_data: SessionStartRequest):
    """
    Start a new cognitive tracking session.
    If an active session already exists for the user, it returns that active session.
    """
    try:
        session = await SessionService.start_session(session_data)
        return session
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while starting session: {str(e)}"
        )

@router.post("/end", response_model=SessionResponse, status_code=status.HTTP_200_OK)
async def end_session(session_data: SessionEndRequest):
    """
    End an active cognitive tracking session, calculating duration and updating metrics.
    """
    try:
        session = await SessionService.end_session(session_data)
        return session
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while ending session: {str(e)}"
        )

@router.put("/{session_id}", response_model=SessionResponse, status_code=status.HTTP_200_OK)
async def update_session(session_id: UUID, session_data: SessionUpdateRequest):
    """
    Update session title or session_type.
    """
    try:
        session = await SessionService.update_session(session_id, title=session_data.title, session_type=session_data.session_type)
        return session
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while updating session: {str(e)}"
        )

@router.delete("/{session_id}", status_code=status.HTTP_200_OK)
async def delete_session(session_id: UUID):
    """
    Delete a session.
    """
    try:
        result = await SessionService.delete_session(session_id)
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while deleting session: {str(e)}"
        )

@router.get("/history/{user_id}", response_model=List[SessionResponse], status_code=status.HTTP_200_OK)
async def get_history(user_id: UUID):
    """
    Retrieve session history for a specific user ordered by created_at descending.
    """
    try:
        sessions = await SessionService.get_user_sessions(user_id)
        return sessions
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while retrieving history: {str(e)}"
        )

@router.get("/active/{user_id}", response_model=SessionResponse, status_code=status.HTTP_200_OK)
async def get_active(user_id: UUID):
    """
    Get the latest active session (where end_time is null) for a specific user.
    """
    try:
        session = await SessionService.get_active_session(user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active session found for this user."
            )
        return session
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while checking active session: {str(e)}"
        )
