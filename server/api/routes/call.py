"""Call Integrity Analysis Route"""
import sys
import os
from fastapi import APIRouter, HTTPException

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml"))

from models.schemas import CallAnalysisRequest, CallAnalysisResponse

router = APIRouter()


@router.post("/analyze", response_model=CallAnalysisResponse, summary="Analyze call for spam signals")
async def analyze_call_route(request: CallAnalysisRequest):
    try:
        from inference import analyze_call
        result = analyze_call(request.phone_number, request.call_frequency_last_hour)
        return CallAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Call analysis failed: {str(e)}")
