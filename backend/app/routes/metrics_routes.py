from fastapi import APIRouter, status, HTTPException
from typing import List
from uuid import UUID
from app.schemas.metrics_schema import MetricCreateRequest, MetricResponse
from app.services.metrics_service import MetricsService

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.post("/add", response_model=MetricResponse, status_code=status.HTTP_201_CREATED)
async def add_metric(metric_data: MetricCreateRequest):
    """
    Log real-time cognitive focus, fatigue, and telemetry metrics for an active session.
    """
    # Later this endpoint will receive data from local CV pipeline and browser extension.
    # Future WebSocket live streaming integration.
    # TODO: Protect this route with auth before production.
    try:
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
    # Future WebSocket live streaming integration.
    # TODO: Protect this route with auth before production.
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

@router.get("/latest/{session_id}", response_model=MetricResponse, status_code=status.HTTP_200_OK)
async def get_latest_metric(session_id: UUID):
    """
    Retrieve the latest cognitive metric snapshot recorded for a specific session.
    """
    # Future WebSocket live streaming integration.
    # TODO: Protect this route with auth before production.
    try:
        metric = await MetricsService.get_latest_metric(session_id)
        return metric
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while retrieving the latest metric: {str(e)}"
        )
