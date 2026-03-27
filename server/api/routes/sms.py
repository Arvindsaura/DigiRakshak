"""SMS Analysis Route"""
import sys
import os
from fastapi import APIRouter, HTTPException

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml"))

from models.schemas import SMSAnalysisRequest, SMSAnalysisResponse, ThreatFeaturesResponse

router = APIRouter()


@router.post("/analyze", response_model=SMSAnalysisResponse, summary="Analyze SMS for phishing")
async def analyze_sms(request: SMSAnalysisRequest):
    try:
        from inference import get_engine
        engine = get_engine()
        result = engine.predict(request.text)

        features_resp = ThreatFeaturesResponse(
            has_urgency=result.features.has_urgency,
            urgency_indicators=result.features.urgency_indicators,
            has_scarcity=result.features.has_scarcity,
            scarcity_indicators=result.features.scarcity_indicators,
            has_authority_impersonation=result.features.has_authority_impersonation,
            impersonated_entities=result.features.impersonated_entities,
            suspicious_urls=result.features.suspicious_urls,
            has_blacklisted_domain=result.features.has_blacklisted_domain,
            has_lookalike_domain=result.features.has_lookalike_domain,
            has_money_transfer_request=result.features.has_money_transfer_request,
            has_otp_request=result.features.has_otp_request,
        )

        return SMSAnalysisResponse(
            label=result.label,
            confidence=result.confidence,
            risk_score=result.risk_score,
            reasoning=result.reasoning,
            features=features_resp,
            sender=request.sender,
            timestamp=result.timestamp,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/simulate-background", summary="Simulate background SMS listener")
async def simulate_background_listener(request: SMSAnalysisRequest):
    """
    Simulates the device background SMS listener.
    In a real mobile app, this is triggered by a native SMS BroadcastReceiver.
    Returns a lightweight alert payload for real-time notification.
    """
    try:
        from inference import get_engine
        engine = get_engine()
        result = engine.predict(request.text)

        alert_level = "none"
        if result.risk_score >= 70:
            alert_level = "critical"
        elif result.risk_score >= 40:
            alert_level = "warning"

        return {
            "alert": alert_level != "none",
            "alert_level": alert_level,
            "risk_score": result.risk_score,
            "label": result.label,
            "reasoning": result.reasoning,
            "sender": request.sender,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
