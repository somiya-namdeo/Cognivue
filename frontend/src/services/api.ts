export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface SignupResponse {
  message: string;
  user_id: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  user_id: string;
  email: string;
}

// User session helper interface
export interface UserSession {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  email: string | null;
}

// Session responses
export interface SessionResponse {
  id: string;
  user_id: string;
  title: string;
  session_type: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  focus_score: number;
  cognitive_load: number;
  fatigue_level: 'Low' | 'Medium' | 'High';
  productivity_score: number;
  created_at: string;
  top_domains?: string[];
}

export interface SessionStartRequest {
  user_id: string;
  title?: string;
  session_type?: string;
}

export interface SessionEndRequest {
  session_id: string;
  focus_score: number;
  cognitive_load: number;
  fatigue_level: 'Low' | 'Medium' | 'High';
  productivity_score: number;
}

// Cognitive metrics responses
export interface MetricCreateRequest {
  session_id: string;
  blink_rate: number;
  gaze_status: 'On Screen' | 'Off Screen' | 'Uncertain';
  posture_status: 'Upright' | 'Slouched' | 'Unknown';
  attention_state: 'Focused' | 'Distracted' | 'Neutral';
  active_tab: string;
  cognitive_load: number;
  focus_score: number;
  fatigue_score: number;
  ui_attention_label?: string;
  ui_posture_label?: string;
}

export interface MetricResponse extends MetricCreateRequest {
  id: string;
  recorded_at: string;
}

// 1. Session and Auth Helpers (Abstracted to make replacing/updating simple later)
export const getLocalSession = (): UserSession => {
  return {
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    userId: localStorage.getItem('user_id'),
    email: localStorage.getItem('email'),
  };
};

export const saveSession = (session: LoginResponse): void => {
  localStorage.setItem('access_token', session.access_token);
  if (session.refresh_token) {
    localStorage.setItem('refresh_token', session.refresh_token);
  }
  localStorage.setItem('user_id', session.user_id);
  if (session.email) {
    localStorage.setItem('email', session.email);
  }
};

export const clearActiveSession = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('email');
};

// Extracted method to resolve current user's display details
// This makes it extremely easy to swap in /auth/me API call later without scattering localStorage references everywhere.
export interface UserProfileDetails {
  email: string;
  displayName: string;
  initials: string;
}

export const getCurrentUserProfile = (): UserProfileDetails => {
  const session = getLocalSession();
  const emailVal = session.email || 'aarav@cognivue.ai';
  const userId = session.userId || 'default';
  
  const profileKey = `cognivue_profile_${userId}`;
  let rawName = '';
  
  try {
    const storedStr = localStorage.getItem(profileKey);
    if (storedStr) {
      const parsed = JSON.parse(storedStr);
      rawName = parsed.displayName || '';
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
  
  if (!rawName) {
    // Extract display name (capitalized first part of email, or custom default if no @)
    const isEmail = emailVal.includes('@');
    rawName = isEmail ? emailVal.split('@')[0] : emailVal;
    rawName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  }
  
  const displayName = rawName;
  
  // Get first two characters for initials
  const initials = displayName.substring(0, 2).toUpperCase();

  return {
    email: emailVal,
    displayName,
    initials,
  };
};

// 2. Response handling helper
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  return response.json() as Promise<T>;
}

// 3. API endpoints
export async function signupUser(fullName: string, email: string, password: string): Promise<SignupResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
    }),
  });
  return handleResponse<SignupResponse>(response);
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
  return handleResponse<LoginResponse>(response);
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/account/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<void>(response);
}

// --- FOCUS SESSION APIS ---

export async function startSession(userId: string, title?: string, sessionType?: string): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      title: title || 'Focus Session',
      session_type: sessionType || 'Deep Work',
    }),
  });
  return handleResponse<SessionResponse>(response);
}

export async function endSession(sessionData: SessionEndRequest): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/end`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sessionData),
  });
  return handleResponse<SessionResponse>(response);
}

export async function updateSession(sessionId: string, title?: string, sessionType?: string): Promise<SessionResponse> {
  const payload: any = {};
  if (title) payload.title = title;
  if (sessionType) payload.session_type = sessionType;

  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<SessionResponse>(response);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  return handleResponse<void>(response);
}

export async function getActiveSession(userId: string): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/active/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<SessionResponse>(response);
}

export async function getSessionHistory(userId: string): Promise<SessionResponse[]> {
  const response = await fetch(`${API_BASE_URL}/sessions/history/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<SessionResponse[]>(response);
}

// --- COGNITIVE METRICS APIS ---

export async function addMetric(metricData: MetricCreateRequest): Promise<MetricResponse> {
  const response = await fetch(`${API_BASE_URL}/metrics/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metricData),
  });
  return handleResponse<MetricResponse>(response);
}

export async function getSessionMetrics(sessionId: string): Promise<MetricResponse[]> {
  const response = await fetch(`${API_BASE_URL}/metrics/session/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<MetricResponse[]>(response);
}

export async function getLatestMetric(sessionId: string): Promise<MetricResponse> {
  const response = await fetch(`${API_BASE_URL}/metrics/latest/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<MetricResponse>(response);
}

// --- EXTENSION APIS ---

export interface ExtensionActivityResponse {
  id: string;
  user_id: string;
  domain: string;
  category: string;
  mode: string;
  risk_level: 'Low' | 'Medium' | 'High';
  active_duration_seconds: number;
  tab_switches: number;
  recorded_at: string;
  created_at?: string;
  timestamp?: string;
}

export async function getExtensionActivity(userId: string): Promise<ExtensionActivityResponse[]> {
  const response = await fetch(`${API_BASE_URL}/extension/activity/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<ExtensionActivityResponse[]>(response);
}

// --- DASHBOARD ANALYTICS APIS ---

export interface DashboardAnalytics {
  total_sessions: number;
  total_focus_minutes: number;
  average_focus: number;
  average_cognitive_load: number;
  average_productivity: number;
  average_fatigue_score: number;
  best_focus_score: number;
  recent_sessions: SessionResponse[];
  focus_trend: {
    time: string;
    focus: number;
    load: number;
  }[];
  productivity_trend: {
    date: string;
    productivity: number;
    focus: number;
  }[];
  coach_insights: {
    title: string;
    description: string;
    type: 'positive' | 'warning' | 'neutral';
  }[];
}

export async function getDashboardAnalytics(userId: string): Promise<DashboardAnalytics> {
  const response = await fetch(`${API_BASE_URL}/analytics/dashboard/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<DashboardAnalytics>(response);
}

// --- AI INSIGHTS APIS ---

export interface CognitiveScores {
  focus_consistency: number;
  burnout_risk: number;
  cognitive_efficiency: number;
  recovery_balance: number;
  productivity_momentum: number;
}

export interface BehaviorPatterns {
  best_time_window: string;
  weakest_time_window: string;
  deep_work_ratio: number;
  attention_stability: number;
  fatigue_drift: number;
}

export interface AIInsightCard {
  title: string;
  summary: string;
  category: string; // focus | fatigue | productivity | behavior | recovery | anomaly
  severity: string; // positive | neutral | warning | critical
  confidence: string;
  recommendation: string;
  supporting_metrics: Record<string, any>;
}

export interface FocusDriftPoint {
  time: string;
  focus: number;
  cognitive_load: number;
  fatigue: number;
}

export interface WeeklyTrendPoint {
  day: string;
  focus: number;
  fatigue: number;
  productivity: number;
  duration: number;
}

export interface FatigueCorrelationPoint {
  time: string;
  blink_rate: number;
  fatigue: number;
}

export interface ProductivityPatternPoint {
  category: string;
  score: number;
  full_mark?: number;
}

export interface AdvancedAIInsightsResponse {
  user_id: string;
  generated_at: string;
  summary: string;
  scores: CognitiveScores;
  patterns: BehaviorPatterns;
  insights: AIInsightCard[];
  recommendations: string[];
  focus_drift_timeline: FocusDriftPoint[];
  weekly_trends: WeeklyTrendPoint[];
  fatigue_correlation: FatigueCorrelationPoint[];
  productivity_patterns: ProductivityPatternPoint[];
}

export async function getAIInsights(userId: string): Promise<AdvancedAIInsightsResponse> {
  const response = await fetch(`${API_BASE_URL}/insights/generate/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<AdvancedAIInsightsResponse>(response);
}

// Initialize user profile after login/signup
export async function initUser(userId: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/users/init/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    // Silently ignore response; no blocking
  } catch {
    // intentionally ignored — non-blocking init
  }
}


