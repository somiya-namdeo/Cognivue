from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth_routes import router as auth_router
from app.routes.user_routes import router as user_router
from app.routes.session_routes import router as session_router
from app.routes.metrics_routes import router as metrics_router
from app.routes.insights_routes import router as insights_router
from app.routes.analytics_routes import router as analytics_router
from app.routes.extension_routes import router as extension_router
from app.routes.behavior_routes import router as behavior_router
from app.routes.monitor_routes import router as monitor_router
from app.config import settings

app = FastAPI(
    title="Cognivue API",
    version="1.0.0",
    description="Cognivue Backend API for real-time focus, fatigue, and cognitive analytics."
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://cognivue-kappa.vercel.app"
]


try:
    frontend_url = settings.FRONTEND_URL.strip()

    if frontend_url and frontend_url not in origins:
        origins.append(frontend_url)

    # Optional www variant
    if (
        frontend_url.startswith("https://")
        and not frontend_url.startswith("https://www.")
    ):
        origins.append(
            frontend_url.replace("https://", "https://www.")
        )

except Exception:
    pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handler for detailed RequestValidationError logging
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("uvicorn.error")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = exc.errors()
    logger.error(f"FastAPI Validation Error on {request.method} {request.url.path}: {errors}")
    return JSONResponse(
        status_code=400,
        content={
            "detail": "Request sync validation failed.",
            "errors": errors
        }
    )

# Register routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(session_router)
app.include_router(metrics_router)
app.include_router(insights_router)
app.include_router(analytics_router)
app.include_router(extension_router)
app.include_router(behavior_router)
app.include_router(monitor_router)

@app.get("/", tags=["Health Check"])
async def health_check():
    return {"message": "Cognivue backend running"}