"""QR / UPI Guard Route"""
import sys
import os
from fastapi import APIRouter, HTTPException

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml"))

from models.schemas import QRAnalysisRequest, QRAnalysisResponse

router = APIRouter()


@router.post("/analyze", response_model=QRAnalysisResponse, summary="Analyze QR/UPI data")
async def analyze_qr(request: QRAnalysisRequest):
    try:
        from inference import analyze_upi_qr
        result = analyze_upi_qr(request.qr_data)
        return QRAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QR analysis failed: {str(e)}")
