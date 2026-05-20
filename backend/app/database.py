import logging
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger("uvicorn.error")

# Expose Supabase client
supabase: Client = None

if not settings.SUPABASE_URL or "placeholder" in settings.SUPABASE_URL:
    logger.warning(
        "Supabase URL is not configured. Please set a valid SUPABASE_URL in your .env file."
    )
elif not settings.SUPABASE_SERVICE_ROLE_KEY:
    logger.warning(
        "Supabase service role key is not configured. Please set a valid SUPABASE_SERVICE_ROLE_KEY in your .env file."
    )
else:
    try:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        logger.info("Supabase client initialized successfully with service role key.")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
