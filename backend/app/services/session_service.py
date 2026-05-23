from app.schemas.session_schema import SessionStartRequest, SessionEndRequest
from app.database import supabase
from datetime import datetime, timezone
from fastapi import HTTPException, status
from uuid import UUID
from typing import Optional
import logging

logger = logging.getLogger("uvicorn.error")

class SessionService:
    """
    Business logic layer for tracking focus/productivity sessions.
    """

    @staticmethod
    async def get_active_session(user_id: UUID) -> Optional[dict]:
        """
        Retrieves the latest active session (where end_time is null) for a user.
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is currently unavailable. Supabase is not initialized."
            )
        try:
            # Query for session where end_time is null for the given user
            response = supabase.table("focus_sessions") \
                .select("*") \
                .eq("user_id", str(user_id)) \
                .is_("end_time", "null") \
                .order("created_at", desc=True) \
                .limit(1) \
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching active session: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query failed: {str(e)}"
            )

    @staticmethod
    async def start_session(session_data: SessionStartRequest) -> dict:
        """
        Creates a new tracking session record in the database.
        If an active session already exists, it returns the existing active session.
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is currently unavailable. Supabase is not initialized."
            )
        
        # 1. Check if an active session already exists
        active_session = await SessionService.get_active_session(session_data.user_id)
        if active_session:
            logger.info(f"Active session already exists for user {session_data.user_id}. Returning existing session.")
            return active_session

        try:
            # 2. Prepare the new session row with defaults
            now_iso = datetime.now(timezone.utc).isoformat()
            insert_data = {
                "user_id": str(session_data.user_id),
                "title": session_data.title,
                "session_type": session_data.session_type,
                "start_time": now_iso,
                "created_at": now_iso,
                "focus_score": 0,
                "cognitive_load": 0,
                "fatigue_level": "Low",
                "productivity_score": 0,
                "duration_minutes": 0,
                "end_time": None
            }

            # 3. Insert into Supabase 'focus_sessions'
            response = supabase.table("focus_sessions").insert(insert_data).execute()
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create session. Empty database response."
                )
            return response.data[0]
            
        except HTTPException as he:
            raise he
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to start session: {error_msg}")
            
            # Check for profiles foreign key violation or other integrity constraints
            if "foreign key constraint" in error_msg.lower() or "violates foreign key" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User profile not found in database. Please register first."
                )
            
            if "invalid input syntax for type uuid" in error_msg.lower() or "invalid uuid" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid user_id UUID format."
                )
                
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to start focus session: {error_msg}"
            )

    @staticmethod
    async def end_session(session_data: SessionEndRequest) -> dict:
        """
        Concludes an ongoing session and updates status and metrics.
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is currently unavailable. Supabase is not initialized."
            )
            
        try:
            # 1. Fetch the existing session
            fetch_response = supabase.table("focus_sessions") \
                .select("*") \
                .eq("id", str(session_data.session_id)) \
                .execute()
                
            if not fetch_response.data or len(fetch_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Focus session not found."
                )
                
            session = fetch_response.data[0]
            
            # 2. Check if the session is already ended
            if session.get("end_time") is not None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Focus session has already ended."
                )
                
            # 3. Calculate duration_minutes
            start_time_str = session.get("start_time")
            if not start_time_str:
                start_time = datetime.now(timezone.utc)
            else:
                # Robust parsing of UTC isoformat datetime (replacing Z with offset for compatibility)
                import re
                start_time_str_parsed = start_time_str.replace("Z", "+00:00")
                # Remove fractional seconds entirely to avoid Python < 3.11 fromisoformat issues
                start_time_str_parsed = re.sub(r'\.\d+', '', start_time_str_parsed)
                start_time = datetime.fromisoformat(start_time_str_parsed)
                
            end_time = datetime.now(timezone.utc)
            duration_delta = end_time - start_time
            duration_minutes_int = max(0, int(round(duration_delta.total_seconds() / 60.0)))
            
            # 4. Perform update
            update_data = {
                "end_time": end_time.isoformat(),
                "duration_minutes": duration_minutes_int,
                "focus_score": session_data.focus_score,
                "cognitive_load": session_data.cognitive_load,
                "fatigue_level": session_data.fatigue_level,
                "productivity_score": session_data.productivity_score
            }
            
            update_response = supabase.table("focus_sessions") \
                .update(update_data) \
                .eq("id", str(session_data.session_id)) \
                .execute()
                
            if not update_response.data or len(update_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update session. Empty database response."
                )
                
            return SessionService._enrich_session_duration(update_response.data[0])
            
        except HTTPException as he:
            raise he
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to end session: {error_msg}")
            
            if "invalid input syntax for type uuid" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid session_id UUID format."
                )
                
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to end focus session: {error_msg}"
            )

    @staticmethod
    async def update_session(session_id: UUID, title: str = None, session_type: str = None) -> dict:
        """
        Updates session title or session_type.
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is currently unavailable."
            )
        
        update_data = {}
        if title is not None:
            update_data["title"] = title
        if session_type is not None:
            update_data["session_type"] = session_type
            
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields provided to update.")
            
        try:
            update_response = supabase.table("focus_sessions") \
                .update(update_data) \
                .eq("id", str(session_id)) \
                .execute()
                
            if not update_response.data or len(update_response.data) == 0:
                raise HTTPException(status_code=404, detail="Session not found.")
                
            return SessionService._enrich_session_duration(update_response.data[0])
        except Exception as e:
            logger.error(f"Failed to update session: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to update session: {str(e)}")

    @staticmethod
    async def delete_session(session_id: UUID):
        """
        Deletes a session from the database.
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is currently unavailable."
            )
            
        try:
            delete_response = supabase.table("focus_sessions") \
                .delete() \
                .eq("id", str(session_id)) \
                .execute()
                
            if not delete_response.data or len(delete_response.data) == 0:
                raise HTTPException(status_code=404, detail="Session not found.")
                
            return {"detail": "Session deleted successfully."}
        except Exception as e:
            logger.error(f"Failed to delete session: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")

    @staticmethod
    async def get_user_sessions(user_id: UUID) -> list:
        """
        Retrieves history of focus sessions for a user ordered by created_at descending.
        """
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is currently unavailable. Supabase is not initialized."
            )
            
        try:
            response = supabase.table("focus_sessions") \
                .select("*") \
                .eq("user_id", str(user_id)) \
                .order("created_at", desc=True) \
                .execute()
                
            # Enrich all sessions before returning to client
            enriched_sessions = [SessionService._enrich_session_duration(s) for s in response.data]
            
            # Fetch domain aggregations dynamically
            if enriched_sessions:
                session_ids = [s["id"] for s in enriched_sessions]
                try:
                    metrics_response = supabase.table("cognitive_metrics") \
                        .select("session_id, active_tab") \
                        .in_("session_id", session_ids) \
                        .execute()
                    if metrics_response.data:
                        from collections import defaultdict
                        from urllib.parse import urlparse
                        
                        domain_counts = defaultdict(lambda: defaultdict(int))
                        for metric in metrics_response.data:
                            active_tab = metric.get("active_tab", "")
                            if active_tab and active_tab.startswith("http"):
                                try:
                                    domain = urlparse(active_tab).netloc.replace("www.", "")
                                    if domain:
                                        domain_counts[metric["session_id"]][domain] += 1
                                except Exception:
                                    pass
                                    
                        for session in enriched_sessions:
                            sid = session["id"]
                            if sid in domain_counts and domain_counts[sid]:
                                # Get top 2 domains
                                sorted_domains = sorted(domain_counts[sid].items(), key=lambda x: x[1], reverse=True)
                                session["top_domains"] = [d[0] for d in sorted_domains[:2]]
                            else:
                                session["top_domains"] = []
                    else:
                        for session in enriched_sessions:
                            session["top_domains"] = []
                except Exception as e:
                    logger.error(f"Failed to fetch metrics for domains aggregation: {e}")
                    for session in enriched_sessions:
                        session["top_domains"] = []
            
            return enriched_sessions
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to retrieve session history: {error_msg}")
            
            if "invalid input syntax for type uuid" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid user_id UUID format."
                )
                
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch session history: {error_msg}"
            )

    @staticmethod
    def _enrich_session_duration(session_dict: dict) -> dict:
        """
        Enriches a session dictionary with exact decimal duration_minutes precision.
        Since Supabase stores duration_minutes as an integer column, we compute it dynamically.
        """
        start_time_str = session_dict.get("start_time")
        end_time_str = session_dict.get("end_time")
        if start_time_str and end_time_str:
            try:
                import re
                # Robust parsing of isoformat timestamps
                start_time_str_parsed = re.sub(r'\.\d+', '', start_time_str.replace("Z", "+00:00"))
                end_time_str_parsed = re.sub(r'\.\d+', '', end_time_str.replace("Z", "+00:00"))
                start_time = datetime.fromisoformat(start_time_str_parsed)
                end_time = datetime.fromisoformat(end_time_str_parsed)
                
                duration_delta = end_time - start_time
                duration_minutes_float = max(0.1, round(duration_delta.total_seconds() / 60.0, 1))
                session_dict["duration_minutes"] = duration_minutes_float
            except Exception:
                pass
        return session_dict
