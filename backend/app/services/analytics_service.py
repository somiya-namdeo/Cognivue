import logging
from uuid import UUID
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.database import supabase
from app.services.session_service import SessionService

logger = logging.getLogger("uvicorn.error")

class AnalyticsService:
    """
    Business logic layer for generating aggregated real-time cognitive analytics.
    """

    @staticmethod
    async def get_dashboard_analytics(user_id: UUID) -> dict:
        """
        Calculate and return user-specific dashboard analytics from Supabase data.
        Safe defaults are returned if no data is found.
        """
        # Set up safe defaults
        default_response = {
            "total_sessions": 0,
            "total_focus_minutes": 0.0,
            "average_focus": 0.0,
            "average_cognitive_load": 0.0,
            "average_productivity": 0.0,
            "average_fatigue_score": 0.0,
            "best_focus_score": 0.0,
            "recent_sessions": [],
            "focus_trend": [],
            "productivity_trend": [],
            "coach_insights": []
        }

        if supabase is None:
            logger.warning("Supabase is not initialized. Returning safe defaults for dashboard analytics.")
            return default_response

        try:
            # 1. Fetch focus sessions for the user
            sessions_response = supabase.table("focus_sessions") \
                .select("*") \
                .eq("user_id", str(user_id)) \
                .order("created_at", desc=True) \
                .execute()

            raw_sessions = sessions_response.data if sessions_response.data else []

            if not raw_sessions:
                return default_response

            # Enrich sessions to calculate duration_minutes dynamically
            all_sessions = [SessionService._enrich_session_duration(s) for s in raw_sessions]
            
            # Filter ended and active sessions
            ended_sessions = [s for s in all_sessions if s.get("end_time") is not None]
            active_sessions = [s for s in all_sessions if s.get("end_time") is None]

            # 2. Query cognitive metrics for fatigue score and focus trends
            session_ids = [s["id"] for s in all_sessions]
            all_metrics = []
            if session_ids:
                try:
                    metrics_response = supabase.table("cognitive_metrics") \
                        .select("*") \
                        .in_("session_id", [str(sid) for sid in session_ids]) \
                        .order("recorded_at", desc=False) \
                        .execute()
                    all_metrics = metrics_response.data if metrics_response.data else []
                except Exception as me:
                    logger.error(f"Error querying cognitive_metrics: {me}")

            # 3. Calculate basic metrics
            total_sessions = len(all_sessions)
            total_focus_minutes = sum(s.get("duration_minutes", 0.0) for s in ended_sessions)

            num_ended = len(ended_sessions)
            if num_ended > 0:
                average_focus = sum(s.get("focus_score", 0) for s in ended_sessions) / num_ended
                average_cognitive_load = sum(s.get("cognitive_load", 0) for s in ended_sessions) / num_ended
                average_productivity = sum(s.get("productivity_score", 0) for s in ended_sessions) / num_ended
                best_focus_score = max(s.get("focus_score", 0) for s in ended_sessions)
            else:
                average_focus = 0.0
                average_cognitive_load = 0.0
                average_productivity = 0.0
                best_focus_score = 0.0

            # Calculate fatigue average score from metrics
            metrics_with_fatigue = [m for m in all_metrics if m.get("fatigue_score") is not None]
            if metrics_with_fatigue:
                average_fatigue_score = sum(m["fatigue_score"] for m in metrics_with_fatigue) / len(metrics_with_fatigue)
            else:
                # Fallback to session average fatigue if metrics are unavailable
                # Low = 15, Medium = 50, High = 85
                fatigue_mapping = {"Low": 15.0, "Medium": 50.0, "High": 85.0}
                fatigue_vals = [fatigue_mapping.get(s.get("fatigue_level", "Low"), 15.0) for s in ended_sessions]
                average_fatigue_score = sum(fatigue_vals) / num_ended if num_ended > 0 else 0.0

            # 4. Generate focus_trend (time, focus, load)
            def format_time(recorded_at_str):
                try:
                    dt = datetime.fromisoformat(recorded_at_str.replace("Z", "+00:00"))
                    return dt.strftime("%H:%M")
                except Exception:
                    return "00:00"

            # Sort chronologically, keep the latest 20 elements
            sorted_metrics = sorted(all_metrics, key=lambda m: m.get("recorded_at", ""))
            latest_metrics = sorted_metrics[-20:] if len(sorted_metrics) > 20 else sorted_metrics

            focus_trend = []
            for m in latest_metrics:
                focus_trend.append({
                    "time": format_time(m.get("recorded_at", "")),
                    "focus": float(m.get("focus_score", 0)),
                    "load": float(m.get("cognitive_load", 0))
                })

            # 5. Generate productivity_trend (date, productivity, focus) grouped by date
            def format_date(created_at_str):
                try:
                    dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                    return dt.strftime("%d %b").lstrip("0")
                except Exception:
                    return "Unknown"

            sessions_by_date = {}
            for s in ended_sessions:
                date_str = format_date(s.get("created_at", ""))
                if date_str != "Unknown":
                    if date_str not in sessions_by_date:
                        sessions_by_date[date_str] = []
                    sessions_by_date[date_str].append(s)

            chronological_sessions = sorted(ended_sessions, key=lambda s: s.get("created_at", ""))
            seen_dates = []
            for s in chronological_sessions:
                date_str = format_date(s.get("created_at", ""))
                if date_str != "Unknown" and date_str not in seen_dates:
                    seen_dates.append(date_str)

            productivity_trend = []
            for d in seen_dates:
                day_sessions = sessions_by_date[d]
                avg_prod = sum(ds.get("productivity_score", 0) for ds in day_sessions) / len(day_sessions)
                avg_foc = sum(ds.get("focus_score", 0) for ds in day_sessions) / len(day_sessions)
                productivity_trend.append({
                    "date": d,
                    "productivity": round(avg_prod, 1),
                    "focus": round(avg_foc, 1)
                })

            # 6. Build recent_sessions (latest 5 ended sessions plus latest active session)
            recent_sessions = []
            # We want recent active session if it exists
            if active_sessions:
                recent_sessions.append(active_sessions[0])
            # Latest 5 ended sessions
            recent_sessions.extend(ended_sessions[:5])

            # 7. Generate Coach Insights
            fatigue_is_high = False
            if average_fatigue_score > 50:
                fatigue_is_high = True
            elif ended_sessions and ended_sessions[0].get("fatigue_level") == "High":
                fatigue_is_high = True

            coach_insights = []
            if ended_sessions:
                if average_focus >= 85:
                    coach_insights.append({
                        "title": "Strong focus consistency detected",
                        "description": "Your recent sessions show stable attention performance.",
                        "type": "positive"
                    })
                if average_cognitive_load > 70:
                    coach_insights.append({
                        "title": "Cognitive load is trending high",
                        "description": "Consider shorter work blocks. High mental effort detected.",
                        "type": "warning"
                    })
                if average_productivity >= 80:
                    coach_insights.append({
                        "title": "Productivity is above baseline",
                        "description": "Excellent output efficiency. Keep utilizing these optimal conditions.",
                        "type": "positive"
                    })
                if fatigue_is_high:
                    coach_insights.append({
                        "title": "Fatigue indicators suggest recovery breaks",
                        "description": "Elevated physical/mental weariness. A brief rest interval is highly recommended.",
                        "type": "warning"
                    })

            # Fallback handled gracefully by frontend empty state

            return {
                "total_sessions": total_sessions,
                "total_focus_minutes": round(total_focus_minutes, 1),
                "average_focus": round(average_focus, 1),
                "average_cognitive_load": round(average_cognitive_load, 1),
                "average_productivity": round(average_productivity, 1),
                "average_fatigue_score": round(average_fatigue_score, 1),
                "best_focus_score": float(best_focus_score),
                "recent_sessions": recent_sessions,
                "focus_trend": focus_trend,
                "productivity_trend": productivity_trend,
                "coach_insights": coach_insights
            }

        except Exception as e:
            logger.error(f"Error calculating dashboard analytics: {e}")
            return default_response
