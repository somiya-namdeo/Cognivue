import logging
import httpx
from supabase import create_client, Client, ClientOptions
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
        "Supabase service role key is not configured. "
        "Please set a valid SUPABASE_SERVICE_ROLE_KEY in your .env file."
    )
else:
    try:
        # Use a granular httpx.Timeout to survive Supabase cold-starts.
        # connect  30 s  – connection establishment to Supabase
        # read    120 s  – DB query / PostgREST response (most important for timeouts)
        # write   120 s  – request body upload
        # pool     30 s  – wait for a connection pool slot
        _timeout = httpx.Timeout(
            connect=30.0,
            read=120.0,
            write=120.0,
            pool=30.0,
        )
        options = ClientOptions(
            postgrest_client_timeout=_timeout,
            storage_client_timeout=120,
        )
        supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
            options=options,
        )
        logger.info(
            "Supabase client initialized with service role key. "
            "Timeouts: connect=30s read=120s write=120s pool=30s."
        )
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
