from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth_routes import router as auth_router
from app.routes.user_routes import router as user_router
from app.routes.session_routes import router as session_router
from app.routes.metrics_routes import router as metrics_router
from app.routes.insights_routes import router as insights_router
from app.routes.db_test_routes import router as db_test_router
from app.routes.analytics_routes import router as analytics_router
from app.routes.extension_routes import router as extension_router
from app.routes.behavior_routes import router as behavior_router

app = FastAPI(
    title="Cognivue API",
    version="1.0.0",
    description="Cognivue Backend API for real-time focus, fatigue, and cognitive analytics."
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(session_router)
app.include_router(metrics_router)
app.include_router(insights_router)
app.include_router(db_test_router)
app.include_router(analytics_router)
app.include_router(extension_router)
app.include_router(behavior_router)

@app.get("/", tags=["Health Check"])
async def health_check():
    """
    Health route to verify API operational status.
    """
    return {"message": "Cognivue backend running"}
