-- Migration: Extend ai_insights table to store full Cognivue AI Insights payload
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

ALTER TABLE ai_insights
    ADD COLUMN IF NOT EXISTS user_id       TEXT,
    ADD COLUMN IF NOT EXISTS insights      JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS focus_drift_timeline JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS weekly_trends JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS productivity_patterns JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS fatigue_correlation JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS confidence_level TEXT DEFAULT 'low';

-- Create unique index on user_id so upsert works (one row per user)
CREATE UNIQUE INDEX IF NOT EXISTS ai_insights_user_id_idx ON ai_insights(user_id)
    WHERE user_id IS NOT NULL;

-- Verify columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ai_insights'
ORDER BY ordinal_position;
