"""Health check router"""
import sys
import os
from datetime import datetime
from fastapi import APIRouter

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml"))

router = APIRouter()


@router.get("/health", response_model=dict, summary="Server Health Check")
async def health_check():
    model_loaded = False
    try:
        from inference import get_engine
        get_engine()
        model_loaded = True
    except Exception:
        pass

    return {
        "status": "operational",
        "model_loaded": model_loaded,
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }
