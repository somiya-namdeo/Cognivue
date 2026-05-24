import logging
import math
from uuid import UUID
from datetime import datetime, timezone, timedelta
from collections import defaultdict
from fastapi.encoders import jsonable_encoder
from app.database import supabase
from app.services.session_service import SessionService
from app.schemas.insights_schema import (
    AdvancedAIInsightsResponse,
    CognitiveScores,
    BehaviorPatterns,
    AIInsightCard,
    FocusDriftPoint,
    WeeklyTrendPoint,
    FatigueCorrelationPoint,
    ProductivityPatternPoint
)

logger = logging.getLogger("uvicorn.error")

class InsightsService:
    """
    Advanced Business Logic Layer for Cognivue's Hybrid AI Insights Engine.
    Combines statistical trend analysis, behavioral patterns, and anomalies from Supabase.
    """

    @staticmethod
    def _calculate_std_dev(values: list) -> float:
        """
        Calculate standard deviation for a list of numerical values.
        """
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
        return math.sqrt(variance)

    @staticmethod
    def _get_time_window_label(hour: int) -> str:
        """
        Map 24h hour digit to a beautiful descriptive human-readable time block.
        """
        if 5 <= hour < 12:
            return f"Morning Focus ({hour:02d}:00 - {hour+1:02d}:00)"
        elif 12 <= hour < 17:
            return f"Afternoon Block ({hour:02d}:00 - {hour+1:02d}:00)"
        elif 17 <= hour < 22:
            return f"Evening Stretch ({hour:02d}:00 - {hour+1:02d}:00)"
        else:
            return f"Late Night ({hour:02d}:00 - {hour+1:02d}:00)"

    @classmethod
    async def generate_hybrid_insights(cls, user_id: UUID) -> AdvancedAIInsightsResponse:
        """
        Generates highly personalized wellness and focus insights based on historical
        sessions and instantaneous cognitive telemetry. Returns clean defaults if no data.
        """
        logger.info(f"Generating AI insights for user_id... {user_id}")
        generated_time = datetime.now(timezone.utc).isoformat()
        
        # 1. Fallback Default Response
        default_response = AdvancedAIInsightsResponse(
            user_id=str(user_id),
            generated_at=generated_time,
            summary="Calibration in progress. Your Hybrid AI Insights Engine requires at least one completed focus session to formulate cognitive baseline parameters.",
            scores=CognitiveScores(
                focus_consistency=0.0,
                burnout_risk=0.0,
                cognitive_efficiency=0.0,
                recovery_balance=0.0,
                productivity_momentum=0.0
            ),
            patterns=BehaviorPatterns(
                best_time_window="Calibration Pending",
                weakest_time_window="Calibration Pending",
                deep_work_ratio=0.0,
                attention_stability=0.0,
                fatigue_drift=0.0
            ),
            insights=[
                AIInsightCard(
                    title="Welcome to Cognivue AI insights",
                    summary="Our hybrid telemetry engine analyses body posture drift, eye blink rate shifts, load volatility, and focus metrics in real-time.",
                    category="behavior",
                    severity="neutral",
                    confidence="Calibration Phase",
                    recommendation="Perform your first focus tracking session to populate these statistics and establish calibration curves.",
                    supporting_metrics={}
                )
            ],
            recommendations=[
                "Complete a 20-minute live monitoring session.",
                "Ensure your webcam has clear facial illumination for gaze analysis.",
                "Sit upright to calibrate the body posture sensor baseline."
            ],
            focus_drift_timeline=[],
            weekly_trends=[],
            fatigue_correlation=[],
            productivity_patterns=[]
        )

        if supabase is None:
            logger.warning("Supabase client is offline. Returning default insights.")
            return default_response

        try:
            # 2. Fetch all user sessions
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
            
            # Use all sessions for insights (even if not explicitly ended)
            ended_sessions = all_sessions

            # 3. Query all metrics for these sessions
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
                    logger.error(f"Error retrieving cognitive metrics: {me}")

            # 4. Perform Session-Level Analysis
            total_sessions = len(all_sessions)
            total_ended = len(ended_sessions)
            total_focus_minutes = sum(s.get("duration_minutes", 0.0) for s in ended_sessions)
            
            average_focus = sum((s.get("focus_score") or 0) for s in ended_sessions) / total_ended
            best_focus = max((s.get("focus_score") or 0) for s in ended_sessions)
            average_productivity = sum((s.get("productivity_score") or 0) for s in ended_sessions) / total_ended
            average_cognitive_load = sum((s.get("cognitive_load") or 0) for s in ended_sessions) / total_ended
            average_session_length = total_focus_minutes / total_ended
            session_completion_rate = (total_ended / total_sessions) * 100.0
            
            # Deep work is defined as a session with duration >= 30 mins, deep work type, or focus score >= 80
            deep_work_sessions = [
                s for s in ended_sessions 
                if s.get("session_type") == "Deep Work" 
                or s.get("duration_minutes", 0.0) >= 30.0 
                or (s.get("focus_score") or 0) >= 80
            ]
            deep_work_ratio = len(deep_work_sessions) / total_ended

            # 5. Perform Metric-Level Analysis
            focus_scores = [m["focus_score"] for m in all_metrics if m.get("focus_score") is not None]
            load_scores = [m["cognitive_load"] for m in all_metrics if m.get("cognitive_load") is not None]
            fatigue_scores = [m["fatigue_score"] for m in all_metrics if m.get("fatigue_score") is not None]
            blink_rates = [m["blink_rate"] for m in all_metrics if m.get("blink_rate") is not None]
            gaze_statuses = [m["gaze_status"] for m in all_metrics if m.get("gaze_status") is not None]
            posture_statuses = [m["posture_status"] for m in all_metrics if m.get("posture_status") is not None]
            attention_states = [m["attention_state"] for m in all_metrics if m.get("attention_state") is not None]

            # Standard deviations (volatilities)
            focus_variability = cls._calculate_std_dev(focus_scores) if focus_scores else 10.0
            load_volatility = cls._calculate_std_dev(load_scores) if load_scores else 12.0
            
            # Retention percentages
            attention_stability = (len([s for s in attention_states if s == "Focused"]) / len(attention_states)) * 100.0 if attention_states else average_focus
            gaze_distraction_pct = (len([g for g in gaze_statuses if g == "Off Screen"]) / len(gaze_statuses)) * 100.0 if gaze_statuses else 15.0
            posture_drift_pct = (len([p for p in posture_statuses if p == "Slouched"]) / len(posture_statuses)) * 100.0 if posture_statuses else 20.0
            high_load_periods_pct = (len([l for l in load_scores if l > 70]) / len(load_scores)) * 100.0 if load_scores else 10.0
            low_focus_windows_pct = (len([f for f in focus_scores if f < 40]) / len(focus_scores)) * 100.0 if focus_scores else 5.0
            blink_rate_avg = sum(blink_rates) / len(blink_rates) if blink_rates else 15.0

            # Fatigue drift: average difference between consecutive fatigue samples
            fatigue_diffs = []
            for i in range(len(fatigue_scores) - 1):
                fatigue_diffs.append(fatigue_scores[i+1] - fatigue_scores[i])
            fatigue_drift = sum(fatigue_diffs) / len(fatigue_diffs) if fatigue_diffs else 0.0

            # 6. Pattern Detection (Time window optimization)
            hour_focus = defaultdict(list)
            for m in all_metrics:
                recorded_at_str = m.get("recorded_at")
                if recorded_at_str:
                    try:
                        dt = datetime.fromisoformat(recorded_at_str.replace("Z", "+00:00"))
                        hour_focus[dt.hour].append(m.get("focus_score", 0))
                    except Exception:
                        pass
                        
            if not hour_focus:
                # Fallback to session creation hour
                for s in ended_sessions:
                    created_at_str = s.get("created_at")
                    if created_at_str:
                        try:
                            dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                            hour_focus[dt.hour].append(s.get("focus_score") or 0)
                        except Exception:
                            pass

            if hour_focus:
                avg_focus_by_hour = {h: sum(scores)/len(scores) for h, scores in hour_focus.items()}
                best_hour = max(avg_focus_by_hour, key=avg_focus_by_hour.get)
                weakest_hour = min(avg_focus_by_hour, key=avg_focus_by_hour.get)
                best_time_window = cls._get_time_window_label(best_hour)
                weakest_time_window = cls._get_time_window_label(weakest_hour)
            else:
                best_time_window = "Morning Focus (09:00 - 10:00)"
                weakest_time_window = "Afternoon Block (15:00 - 16:00)"

            # 7. Composite Scoring Logic (Weighted formulas)
            # A. Focus Consistency: highly affected by volatility and low-focus events
            focus_consistency = 100.0 - (focus_variability * 1.4) - (low_focus_windows_pct * 0.3)
            focus_consistency = max(10.0, min(100.0, focus_consistency))

            # B. Burnout Risk: drives from average load, average fatigue, load volatility, slouching posture
            avg_fatigue = sum(fatigue_scores) / len(fatigue_scores) if fatigue_scores else 20.0
            if not fatigue_scores:
                fatigue_map = {"Low": 15.0, "Medium": 50.0, "High": 85.0}
                avg_fatigue = sum(fatigue_map.get(s.get("fatigue_level", "Low"), 15.0) for s in ended_sessions) / total_ended
            
            burnout_risk = (average_cognitive_load * 0.3) + (avg_fatigue * 0.45) + (load_volatility * 0.15) + (posture_drift_pct * 0.1)
            if average_session_length > 60.0:
                burnout_risk += 12.0 # penalize long continuous blocks
            burnout_risk = max(5.0, min(100.0, burnout_risk))

            # C. Cognitive Efficiency: ratio of focus output achieved to load expended
            load_drag = average_cognitive_load * 0.25
            efficiency_ratio = average_focus - load_drag
            cognitive_efficiency = (efficiency_ratio * 0.65) + (attention_stability * 0.35)
            cognitive_efficiency = max(10.0, min(100.0, cognitive_efficiency))

            # D. Recovery Balance: high recovery balance means low fatigue and minimal slouched stress
            recovery_balance = 100.0 - (avg_fatigue * 0.8) - (posture_drift_pct * 0.2)
            recovery_balance = max(10.0, min(100.0, recovery_balance))

            # E. Productivity Momentum: scales with average productivity, completed sessions, and completion rate
            duration_completed_bonus = min(25.0, total_focus_minutes / 12.0)
            productivity_momentum = (average_productivity * 0.5) + (session_completion_rate * 0.25) + duration_completed_bonus
            productivity_momentum = max(10.0, min(100.0, productivity_momentum))

            # 8. Calculate dynamic confidence score based on telemetry quality
            if total_ended == 1:
                base_confidence = 35
            elif 2 <= total_ended <= 4:
                base_confidence = 55
            elif 5 <= total_ended <= 9:
                base_confidence = 75
            else:
                base_confidence = 90
                
            # Honest confidence penalties for poor/missing telemetry
            if average_session_length < 1.0:
                base_confidence -= 20
            elif average_session_length < 2.0:
                base_confidence -= 10
                
            if not all_metrics:
                base_confidence -= 30
            else:
                if gaze_distraction_pct > 50.0:
                    base_confidence -= 15
                
                # Check for extremely sparse metrics vs duration
                metrics_per_minute = len(all_metrics) / total_focus_minutes if total_focus_minutes > 0 else 0
                if total_focus_minutes > 1.0 and metrics_per_minute < 5.0:
                    base_confidence -= 15
                
            base_confidence = max(15, min(100, int(base_confidence)))
            conf_norm = base_confidence / 100.0

            # 9. Dynamic NLP summary generation based on metrics
            if total_ended == 0:
                overall_summary = "Calibration in progress. Your Hybrid AI Insights Engine requires at least one completed focus session to establish a predictive cognitive baseline."
            elif burnout_risk > 65.0:
                overall_summary = (
                    f"Your telemetry signals elevated cognitive exhaustion (Burnout risk: {burnout_risk:.1f}%). "
                    f"Although focus remains partially stable, visual distractions (Gaze drop: {gaze_distraction_pct:.1f}%) "
                    f"and load volatility indicate increasing strain. Scheduled tactical breaks are highly recommended."
                )
            elif average_focus >= 75.0 and avg_fatigue < 40.0:
                overall_summary = (
                    f"Your recent sessions demonstrate robust concentration consistency (Efficiency: {cognitive_efficiency:.1f}%) "
                    f"with relatively low cognitive strain, suggesting a highly sustainable productivity rhythm during deep work periods."
                )
            else:
                overall_summary = (
                    f"Your behavioral patterns show standard parameters with a stable baseline (Consistency: {focus_consistency:.1f}%). "
                    f"Moderate fatigue accumulation was detected in your {weakest_time_window} blocks. Incorporating micro-breaks will help smooth out focus volatility."
                )

            # 9. Generate AI Insight Cards
            insights_list = []
            recommendations_list = []

            # Determine confidence tier string based on session count
            if total_ended < 1:
                conf_tier = "Emerging Pattern"
            elif 1 <= total_ended <= 3:
                conf_tier = "Emerging Pattern"
            elif 4 <= total_ended <= 10:
                conf_tier = "Moderate Confidence"
            elif 11 <= total_ended <= 20:
                conf_tier = "Strong Confidence"
            else:
                conf_tier = "Stable Baseline"

            # Insight 1: Focus peak
            insights_list.append(AIInsightCard(
                title="Optimal Focus Block Detected",
                summary=f"Your focus peaks consistently during {best_time_window}, averaging {average_focus * 1.05:.1f}. Focus is stable across samples.",
                category="focus",
                severity="positive" if average_focus >= 75.0 else "neutral",
                confidence=conf_tier,
                recommendation="Lock your calendar and direct mental effort toward complex research/coding during this interval.",
                supporting_metrics={"avg_focus": round(average_focus, 1), "peak_hours": best_time_window}
            ))
            # Insight 2: Load and Volatility
            load_severity = "warning" if average_cognitive_load > 60.0 or load_volatility > 15.0 else "neutral"
            load_summary = (
                f"Cognitive workload volatility is elevated (StdDev {load_volatility:.1f}), signaling frequent context switching."
                if load_volatility > 15.0 else
                f"Cognitive load levels remain healthy (Average {average_cognitive_load:.1f}%), indicating deep engagement without excessive mental drain."
            )
            insights_list.append(AIInsightCard(
                title="Cognitive Volatility Analysis" if load_volatility > 15.0 else "Balanced Workload Capacity",
                summary=load_summary,
                category="fatigue" if load_severity == "warning" else "productivity",
                severity=load_severity,
                confidence=conf_tier,
                recommendation="Consolidate browser tabs and silence messaging apps to diminish mental switching costs." if load_volatility > 15.0 else "Continue utilizing single-task focus methodologies.",
                supporting_metrics={"avg_load": round(average_cognitive_load, 1), "load_std_dev": round(load_volatility, 1)}
            ))

            # Insight 3: Posture & Fatigue
            posture_severity = "warning" if posture_drift_pct > 35.0 else "positive"
            posture_summary = (
                f"Body posture drifted into slouching postures during {posture_drift_pct:.1f}% of tracking samples, amplifying neck tension and accelerating exhaustion."
                if posture_drift_pct > 35.0 else
                f"Upright posture posture maintained in {100.0 - posture_drift_pct:.1f}% of samples, facilitating optimized diaphragmatic breathing and focus endurance."
            )
            insights_list.append(AIInsightCard(
                title="Posture Drift Detected" if posture_drift_pct > 35.0 else "Ergonomic Balance Upheld",
                summary=posture_summary,
                category="behavior" if posture_drift_pct > 35.0 else "recovery",
                severity=posture_severity,
                confidence=conf_tier,
                recommendation="Raise screen height slightly and perform 2 neck rotations every hour." if posture_drift_pct > 35.0 else "Maintain current desk and seat adjustments.",
                supporting_metrics={"slouched_percentage": round(posture_drift_pct, 1)}
            ))

            # Insight 4: Visual Distractions
            gaze_severity = "warning" if gaze_distraction_pct > 25.0 else "positive"
            gaze_summary = (
                f"Your gaze dropped off-screen in {gaze_distraction_pct:.1f}% of telemetry frames, identifying environmental friction."
                if gaze_distraction_pct > 25.0 else
                f"Webcam tracking registered excellent focus retention. Gaze remained on screen during {100.0 - gaze_distraction_pct:.1f}% of samples."
            )
            insights_list.append(AIInsightCard(
                title="Environmental Friction Detected" if gaze_distraction_pct > 25.0 else "Exceptional Screen Retention",
                summary=gaze_summary,
                category="behavior",
                severity=gaze_severity,
                confidence=conf_tier,
                recommendation="Clear physical desk distractions and ensure optimal lighting." if gaze_distraction_pct > 25.0 else "Your physical environment is effectively supporting sustained concentration.",
                supporting_metrics={"gaze_retention": round(100.0 - gaze_distraction_pct, 1)}
            ))

            # Insight 5: Burnout & Recovery Balance
            burnout_severity = "critical" if burnout_risk > 70.0 else "warning" if burnout_risk > 45.0 else "positive"
            burnout_summary = (
                f"Burnout indicators have accumulated (Risk: {burnout_risk:.1f}%) due to continuous focus blocks and posture strain."
                if burnout_risk > 45.0 else
                f"Recovery indices are remarkably stable (Score: {recovery_balance:.1f}/100), suggesting excellent workflow timing."
            )
            insights_list.append(AIInsightCard(
                title="Elevated Burnout Markers" if burnout_risk > 45.0 else "Sustained Recovery Profile",
                summary=burnout_summary,
                category="recovery",
                severity=burnout_severity,
                confidence=conf_tier,
                recommendation="Enforce a 50-minute task block limit followed strictly by 10 minutes of active screen disconnection." if burnout_risk > 45.0 else "Maintain current recovery and exertion balance.",
                supporting_metrics={"burnout_risk_score": round(burnout_risk, 1), "recovery_balance": round(recovery_balance, 1)}
            ))

            # Insight 6: Productivity Momentum
            momentum_severity = "positive" if productivity_momentum > 60.0 else "neutral"
            momentum_summary = (
                f"Productivity momentum is currently strong (Score: {productivity_momentum:.1f}), indicating efficient task completion cycles."
                if productivity_momentum > 60.0 else
                f"Productivity momentum is building. Your recent consistency suggests you are on the verge of deeper flow states."
            )
            insights_list.append(AIInsightCard(
                title="High Velocity Productivity" if productivity_momentum > 60.0 else "Productivity Momentum Lag",
                summary=momentum_summary,
                category="productivity",
                severity=momentum_severity,
                confidence=conf_tier,
                recommendation="Capitalize on this flow state by tackling high-priority projects." if productivity_momentum > 60.0 else "Begin with smaller, easily completable tasks to rebuild momentum.",
                supporting_metrics={"momentum_score": round(productivity_momentum, 1), "avg_fatigue": round(avg_fatigue, 1)}
            ))

            # 10. Generate Recommendations Array
            recommendations_list.append(f"Perform deep work sessions during your peak focus window: {best_time_window}.")
            if posture_drift_pct > 35.0:
                recommendations_list.append("Stretch your neck and lower back to correct slouched spine positioning.")
            if load_volatility > 15.0:
                recommendations_list.append("Minimize browser-level context-switching. Block time-wasting sites.")
            if burnout_risk > 45.0:
                recommendations_list.append("Integrate a hard stop after 50 minutes of study/work. Disconnect from screens.")
            recommendations_list.append("Ensure comfortable eye level setups and clean lighting conditions.")

            # 11. Generate Chart Timelines Data
            
            # A. Focus Drift Timeline (Limit to max 20 points from recent metrics or fallback)
            # A. Focus Drift Timeline
            focus_drift_timeline = []
            if len(all_metrics) > 0:
                chunk_size = max(1, len(all_metrics) // 20)
                for i in range(0, len(all_metrics), chunk_size):
                    chunk = all_metrics[i:i+chunk_size]
                    if not chunk: continue
                    try:
                        time_dt = datetime.fromisoformat(chunk[0].get("recorded_at", datetime.now().isoformat()).replace("Z", "+00:00"))
                        time_str = time_dt.strftime("%H:%M")
                    except Exception:
                        time_str = f"{i//chunk_size}:00"
                        
                    avg_foc = sum(m.get("focus_score", 0) for m in chunk) / len(chunk)
                    avg_load = sum(m.get("cognitive_load", 0) for m in chunk) / len(chunk)
                    avg_fatigue = sum(m.get("fatigue_score", 0) for m in chunk) / len(chunk)
                    
                    focus_drift_timeline.append(FocusDriftPoint(
                        time=time_str, 
                        focus=int(avg_foc), 
                        cognitive_load=int(avg_load),
                        fatigue=int(avg_fatigue)
                    ))

            # B. Weekly Trends (Last 7 days aggregation)
            # B. Weekly Trends
            weekly_trends = []
            if total_ended >= 1:
                days_map = defaultdict(list)
                for s in ended_sessions:
                    try:
                        dt = datetime.fromisoformat(s.get("created_at").replace("Z", "+00:00"))
                        day_name = dt.strftime("%a")
                        days_map[day_name].append(s)
                    except:
                        pass
                
                day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                for d in day_names:
                    day_sessions = days_map.get(d, [])
                    if day_sessions:
                        avg_f = sum((s.get("focus_score") or 0) for s in day_sessions) / len(day_sessions)
                        avg_p = sum((s.get("productivity_score") or 0) for s in day_sessions) / len(day_sessions)
                        fatigue_map = {"Low": 15.0, "Medium": 50.0, "High": 85.0}
                        avg_fatigue_day = sum(fatigue_map.get(s.get("fatigue_level", "Low"), 15.0) for s in day_sessions) / len(day_sessions)
                        dur_day = sum(s.get("duration_minutes", 0) for s in day_sessions)
                        weekly_trends.append(WeeklyTrendPoint(day=d, focus=int(avg_f), fatigue=int(avg_fatigue_day), productivity=int(avg_p), duration=int(dur_day)))
            else:
                weekly_trends = []

            # C. Fatigue Correlation
            fatigue_correlation = []
            if len(all_metrics) > 10:
                chunk_size = max(1, len(all_metrics) // 10)
                for i in range(0, len(all_metrics), chunk_size):
                    chunk = all_metrics[i:i+chunk_size]
                    if not chunk: continue
                    try:
                        time_dt = datetime.fromisoformat(chunk[0].get("recorded_at", datetime.now().isoformat()).replace("Z", "+00:00"))
                        time_str = time_dt.strftime("%H:%M")
                    except Exception:
                        time_str = f"{i//chunk_size}:00"
                        
                    avg_blink = sum(m.get("blink_rate", 15) for m in chunk) / len(chunk)
                    avg_fatigue_m = sum(m.get("fatigue_score", 15) for m in chunk) / len(chunk)
                    fatigue_correlation.append(FatigueCorrelationPoint(time=time_str, blink_rate=int(avg_blink), fatigue=int(avg_fatigue_m)))
            else:
                fatigue_correlation = []

            # D. Productivity Patterns (Radar chart data)
            productivity_patterns = []
            real_categories = defaultdict(list)
            
            def normalize_category(raw_str: str) -> str:
                if not raw_str: return "Deep Work"
                s = raw_str.lower()
                if "code" in s or "dev" in s or "program" in s or "github" in s: return "Coding"
                if "study" in s or "learn" in s or "course" in s: return "Studying"
                if "research" in s or "search" in s or "google" in s: return "Research"
                if "meet" in s or "call" in s or "zoom" in s or "teams" in s: return "Meeting"
                if "plan" in s or "org" in s or "admin" in s or "manage" in s: return "Planning"
                if "read" in s or "doc" in s or "article" in s or "blog" in s: return "Reading"
                if "creat" in s or "design" in s or "art" in s or "figma" in s: return "Creative"
                if "deep" in s or "focus" in s: return "Deep Work"
                return raw_str.title()

            for s in ended_sessions:
                s_type = s.get("session_type")
                if s_type:
                    norm = normalize_category(s_type)
                    # We assume score is productivity, fallback to focus if prod missing
                    score = s.get("productivity_score") or s.get("focus_score") or 0
                    real_categories[norm].append(score)
                    
            if real_categories:
                for cat, scores in real_categories.items():
                    avg_sc = sum(scores) / len(scores)
                    productivity_patterns.append(ProductivityPatternPoint(category=cat, score=int(avg_sc), full_mark=100))

            # 12. Build Response Payload
            response_payload = AdvancedAIInsightsResponse(
                user_id=str(user_id),
                generated_at=generated_time,
                summary=overall_summary,
                scores=CognitiveScores(
                    focus_consistency=round(focus_consistency, 1),
                    burnout_risk=round(burnout_risk, 1),
                    cognitive_efficiency=round(cognitive_efficiency, 1),
                    recovery_balance=round(recovery_balance, 1),
                    productivity_momentum=round(productivity_momentum, 1)
                ),
                patterns=BehaviorPatterns(
                    best_time_window=best_time_window,
                    weakest_time_window=weakest_time_window,
                    deep_work_ratio=round(deep_work_ratio, 2),
                    attention_stability=round(attention_stability, 1),
                    fatigue_drift=round(fatigue_drift, 3)
                ),
                insights=insights_list,
                recommendations=recommendations_list,
                focus_drift_timeline=focus_drift_timeline,
                weekly_trends=weekly_trends,
                fatigue_correlation=fatigue_correlation,
                productivity_patterns=productivity_patterns
            )

            # 12. Save Generated Output
            try:
                print(f"Saving AI insights to Supabase for user_id: {user_id}...")
                logger.info(f"Saving AI insights to Supabase for user_id: {user_id}...")

                # Determine confidence level based on session count
                if total_sessions >= 20:
                    confidence_level = "high"
                elif total_sessions >= 5:
                    confidence_level = "medium"
                else:
                    confidence_level = "low"

                insight_record = {
                    "user_id": str(user_id),
                    "summary": overall_summary,
                    "insights": jsonable_encoder(insights_list),
                    "recommendations": jsonable_encoder(recommendations_list),
                    "focus_drift_timeline": jsonable_encoder(focus_drift_timeline),
                    "weekly_trends": jsonable_encoder(weekly_trends),
                    "productivity_patterns": jsonable_encoder(productivity_patterns),
                    "fatigue_correlation": jsonable_encoder(fatigue_correlation),
                    "confidence_level": confidence_level,
                    "generated_at": generated_time,
                    "burnout_risk": round(burnout_risk, 1),
                }

                # Log full payload for verification
                print(f"[AI Insights] Inserting payload for user {user_id}:")
                print(f"  summary       : {overall_summary[:120]}...")
                print(f"  burnout_risk  : {round(burnout_risk, 1)}")
                print(f"  confidence    : {confidence_level}")
                print(f"  insights count: {len(insights_list)}")
                print(f"  rec count     : {len(recommendations_list)}")
                print(f"  generated_at  : {generated_time}")

                # Upsert on user_id so regenerating replaces the existing row
                res = supabase.table("ai_insights").upsert(
                    insight_record,
                    on_conflict="user_id"
                ).execute()

                if res.data:
                    print(f"[AI Insights] Saved successfully — id: {res.data[0].get('id', 'unknown')}")
                    logger.info(f"AI insights saved successfully for user_id: {user_id}")
                else:
                    print(f"[AI Insights] Insert returned no data — possible RLS or schema mismatch. Response: {res}")
                    logger.warning(f"AI insights insert returned no data: {res}")

            except Exception as db_err:
                print(f"[AI Insights] Insertion error for user {user_id}: {str(db_err)}")
                logger.error(f"Insertion error details for ai_insights: {str(db_err)}")

            return response_payload

        except Exception as e:
            logger.error(f"Unexpected error in Hybrid AI Insights Engine: {e}")
            return default_response
