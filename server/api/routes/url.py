"""URL SafeLink Checker Route"""
import sys
import os
from fastapi import APIRouter, HTTPException

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml"))

from models.schemas import URLCheckRequest, URLCheckResponse

router = APIRouter()


@router.post("/check", response_model=URLCheckResponse, summary="Check URL safety")
async def check_url(request: URLCheckRequest):
    try:
        from inference import analyze_url
        result = analyze_url(request.url)
        return URLCheckResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL check failed: {str(e)}")
