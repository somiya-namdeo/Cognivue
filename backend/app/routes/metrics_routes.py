from fastapi import APIRouter, status, HTTPException
from typing import List, Optional
from uuid import UUID
from app.schemas.metrics_schema import MetricCreateRequest, MetricResponse
from app.services.metrics_service import MetricsService
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.post("/add", response_model=MetricResponse, status_code=status.HTTP_201_CREATED)
async def add_metric(metric_data: MetricCreateRequest):
    """
    Log real-time cognitive focus, fatigue, and telemetry metrics for an active session.
    """
    try:
        logger.info(f"API POST /metrics/add: session_id={metric_data.session_id}, blink={metric_data.blink_rate}, focus={metric_data.focus_score}")
        metric = await MetricsService.add_metric(metric_data)
        return metric
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while adding cognitive metric: {str(e)}"
        )

@router.get("/session/{session_id}", response_model=List[MetricResponse], status_code=status.HTTP_200_OK)
async def get_session_metrics(session_id: UUID):
    """
    Retrieve all cognitive metrics logged within a specific focus session ordered chronologically ascending.
    """
    try:
        metrics = await MetricsService.get_session_metrics(session_id)
        return metrics
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while retrieving session metrics: {str(e)}"
        )

@router.get("/latest/{session_id}", response_model=Optional[MetricResponse], status_code=status.HTTP_200_OK)
async def get_latest_metric(session_id: UUID):
    """
    Retrieve the latest cognitive metric snapshot recorded for a specific session.
    """
    try:
        logger.info(f"API GET /metrics/latest/{session_id}")
        metric = await MetricsService.get_latest_metric(session_id)
        return metric
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while retrieving the latest metric: {str(e)}"
        )

