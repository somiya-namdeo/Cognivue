"""
One-time cleanup: delete stale test rows from ai_insights table.
Run once from project root:
  backend\venv\Scripts\python.exe scripts\cleanup_test_insights.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env")
    sys.exit(1)

supabase = create_client(url, key)

# Delete rows where summary is the test value
print("Deleting stale test rows from ai_insights...")
res = supabase.table("ai_insights").delete().eq("summary", "Test").execute()
print(f"Deleted rows with summary='Test': {res.data}")

# Also delete rows where burnout_risk=0 AND summary='Test' (belt-and-suspenders)
res2 = supabase.table("ai_insights").delete().eq("burnout_risk", 0).eq("summary", "Test").execute()
print(f"Deleted rows with burnout_risk=0 and summary='Test': {res2.data}")

# Show remaining rows
remaining = supabase.table("ai_insights").select("id, user_id, summary, confidence_level, generated_at").execute()
print(f"\nRemaining ai_insights rows ({len(remaining.data)}):")
for row in remaining.data:
    print(f"  id={row.get('id')}  user_id={row.get('user_id')}  summary={str(row.get('summary',''))[:60]}...")
