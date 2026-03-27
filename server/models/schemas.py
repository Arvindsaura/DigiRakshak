"""
Pydantic schemas for strict request/response validation.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class SMSAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="SMS message text")
    sender: Optional[str] = Field(None, max_length=50, description="Sender ID or phone number")

    @validator("text")
    def text_not_blank(cls, v):
        if not v.strip():
            raise ValueError("SMS text must not be blank")
        return v.strip()


class ThreatFeaturesResponse(BaseModel):
    has_urgency: bool
    urgency_indicators: List[str]
    has_scarcity: bool
    scarcity_indicators: List[str]
    has_authority_impersonation: bool
    impersonated_entities: List[str]
    suspicious_urls: List[str]
    has_blacklisted_domain: bool
    has_lookalike_domain: bool
    has_money_transfer_request: bool
    has_otp_request: bool


class SMSAnalysisResponse(BaseModel):
    label: str
    confidence: float
    risk_score: int
    reasoning: str
    features: ThreatFeaturesResponse
    sender: Optional[str] = None
    timestamp: str


class URLCheckRequest(BaseModel):
    url: str = Field(..., min_length=5, max_length=2048)

    @validator("url")
    def validate_url(cls, v):
        if not v.startswith(("http://", "https://")):
            v = "https://" + v
        return v.strip()


class URLCheckResponse(BaseModel):
    url: str
    is_blacklisted: bool
    is_lookalike: bool
    risk_level: str
    risk_score: int
    reason: str


class QRAnalysisRequest(BaseModel):
    qr_data: str = Field(..., min_length=1, max_length=1024, description="Raw QR code data string")


class QRAnalysisResponse(BaseModel):
    raw: str
    upi_id: Optional[str]
    payee_name: Optional[str]
    amount: Optional[str]
    is_merchant: bool
    risk_level: str
    risk_score: int
    reason: str


class CallAnalysisRequest(BaseModel):
    phone_number: str = Field(..., min_length=5, max_length=20)
    call_frequency_last_hour: int = Field(0, ge=0, le=100)


class CallAnalysisResponse(BaseModel):
    phone_number: str
    risk_level: str
    risk_score: int
    reason: str
    flags: List[str]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str
    timestamp: str
