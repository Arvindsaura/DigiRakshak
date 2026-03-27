"""
DigiRakshak Inference Engine
Handles ML predictions + Feature Extraction + Risk Scoring
"""
import os
import re
import pickle
import math
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime

MODEL_PATH = os.path.join(os.path.dirname(__file__), "fraud_model.pkl")

# ─── Threat Intelligence Patterns ────────────────────────────────────────────
URGENCY_PATTERNS = [
    r"\bURGENT\b", r"\bIMMEDIATELY\b", r"\bASAP\b", r"\bNOW\b",
    r"\bEXPIRING TODAY\b", r"\bFINAL NOTICE\b", r"\bWARNING\b",
    r"\bFINAL OPPORTUNITY\b", r"\bLAST CHANCE\b", r"\b24 hours?\b",
    r"\bACCOUNT WILL BE (BLOCKED|SUSPENDED|CLOSED|LOCKED)\b",
]

SCARCITY_PATTERNS = [
    r"\bLIMITED TIME\b", r"\b(only\s+)?\d+\s+(hours?|minutes?)\s+left\b",
    r"\bLIMITED SLOTS?\b", r"\bHURRY\b", r"\bLAST\s+\d+\s+SLOTS?\b",
    r"\bEXCLUSIVE OFFER\b", r"\bONLY TODAY\b", r"\bEXPIRES\b",
]

AUTHORITY_PATTERNS = [
    r"\b(SBI|HDFC|ICICI|AXIS|PNB|KOTAK|CANARA)\b",
    r"\b(RBI|SEBI|TRAI|UIDAI|Income Tax|IT Department)\b",
    r"\b(Police|CBI|ED|Cybercrime|Court|Legal Notice)\b",
    r"\b(PM|Prime Minister|Government of India|GOI)\b",
    r"\b(IRCTC|NPCI|UPI|Aadhaar|PAN Card|KYC)\b",
    r"\b(Google|Amazon|Facebook|WhatsApp|Netflix|PayPal)\b",
    r"\b(Jio|Airtel|BSNL|Vodafone|Vi)\b",
]

SUSPICIOUS_URL_PATTERNS = [
    r"https?://[^\s]*\.(tk|ml|xyz|gq|cf|ga|pw|top|click|download|win)\b",
    r"https?://[^\s]*(verify|kyc|secure|update|claim|refund|login|prize|reward)[^\s]*\.(com|in|net|org)",
    r"https?://[^\s]*-[^\s]*\.(com|in|net|org)",
    r"https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}",
    r"https?://[^\s]*(paypal|google|amazon|facebook|hdfc|sbi|icici|paytm)[^a-z\.][^\s]*",
]

BLACKLISTED_DOMAINS = {
    "hdfc-secure-login.tk", "sbi-verify.ml", "paytm-kyc-update.net",
    "incometax-refund.xyz", "whatsapp-secure.net", "pan-verify-india.tk",
    "bank-rekyc-india.xyz", "gpay-verify.xyz", "itr-notice.xyz",
    "sbi-unlock.xyz", "pmrelief.xyz", "aadhaar-mobile-link.xyz",
    "prizeclaim99.xyz", "apple-free-gift.tk", "invest-sure.xyz",
    "facebook-lottery.xyz", "cybercrime-settle.xyz", "mobile-protect.xyz",
    "survey-earn-cash.com", "jio-offer-free.xyz", "work-earn-online.xyz",
    "amazon-offer-99.xyz", "cibil-update.xyz", "hdfc-fraud-check.in",
}


# ─── Data Classes ─────────────────────────────────────────────────────────────
@dataclass
class ThreatFeatures:
    has_urgency: bool = False
    urgency_indicators: list = field(default_factory=list)
    has_scarcity: bool = False
    scarcity_indicators: list = field(default_factory=list)
    has_authority_impersonation: bool = False
    impersonated_entities: list = field(default_factory=list)
    suspicious_urls: list = field(default_factory=list)
    has_blacklisted_domain: bool = False
    has_lookalike_domain: bool = False
    has_money_transfer_request: bool = False
    has_otp_request: bool = False


@dataclass
class PredictionResult:
    label: str                    # "phishing" | "safe"
    confidence: float             # 0.0 – 1.0
    risk_score: int               # 0 – 100
    features: ThreatFeatures
    reasoning: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


# ─── Inference Engine ─────────────────────────────────────────────────────────
class InferenceEngine:
    """
    Central AI inference engine for DigiRakshak.
    Wraps sklearn pipeline + deterministic rule extraction.
    """

    def __init__(self, model_path: str = MODEL_PATH):
        self._pipeline = None
        self._model_path = model_path
        self._load_model()

    def _load_model(self) -> None:
        if not os.path.exists(self._model_path):
            raise FileNotFoundError(
                f"Model not found at '{self._model_path}'. "
                "Run `python ml/train_model.py` first."
            )
        with open(self._model_path, "rb") as f:
            self._pipeline = pickle.load(f)

    def _extract_features(self, text: str) -> ThreatFeatures:
        upper_text = text.upper()
        features = ThreatFeatures()

        # Urgency
        for pat in URGENCY_PATTERNS:
            m = re.search(pat, upper_text)
            if m:
                features.has_urgency = True
                features.urgency_indicators.append(m.group().strip())

        # Scarcity
        for pat in SCARCITY_PATTERNS:
            m = re.search(pat, upper_text)
            if m:
                features.has_scarcity = True
                features.scarcity_indicators.append(m.group().strip())

        # Authority impersonation
        for pat in AUTHORITY_PATTERNS:
            m = re.search(pat, upper_text)
            if m:
                features.has_authority_impersonation = True
                if m.group().strip() not in features.impersonated_entities:
                    features.impersonated_entities.append(m.group().strip())

        # URL analysis
        urls = re.findall(r"https?://[^\s]+", text, re.IGNORECASE)
        for url in urls:
            is_suspicious = False
            # Blacklist check
            domain_match = re.search(r"https?://([^/\s]+)", url)
            if domain_match:
                domain = domain_match.group(1).lower().strip("www.")
                if domain in BLACKLISTED_DOMAINS:
                    features.has_blacklisted_domain = True
                    is_suspicious = True
            # Regex suspicious pattern
            for pat in SUSPICIOUS_URL_PATTERNS:
                if re.search(pat, url, re.IGNORECASE):
                    features.has_lookalike_domain = True
                    is_suspicious = True
                    break
            if is_suspicious:
                features.suspicious_urls.append(url)

        # OTP / money request
        features.has_otp_request = bool(re.search(r"\botp\b|\bone.time.pass", upper_text))
        features.has_money_transfer_request = bool(
            re.search(r"\b(send|transfer|provide|share)\b.*(bank|account|details|money)", upper_text)
        )

        return features

    def _build_reasoning(self, label: str, features: ThreatFeatures, confidence: float) -> str:
        reasons = []

        if label == "phishing":
            if features.has_authority_impersonation:
                entities = ", ".join(features.impersonated_entities[:3])
                reasons.append(f"Impersonates trusted entity ({entities})")
            if features.has_urgency:
                reasons.append(f"Creates artificial urgency ({features.urgency_indicators[0]})")
            if features.has_scarcity:
                reasons.append(f"Uses scarcity tactics ({features.scarcity_indicators[0]})")
            if features.has_blacklisted_domain:
                reasons.append(f"Contains known malicious domain: {features.suspicious_urls[0][:50]}")
            if features.has_lookalike_domain:
                reasons.append("URL mimics a legitimate website (lookalike domain)")
            if features.has_money_transfer_request:
                reasons.append("Requests bank/financial details directly")
            if not reasons:
                reasons.append(f"ML model flagged suspicious language patterns ({confidence*100:.0f}% confidence)")
            return "⚠️ " + " | ".join(reasons)
        else:
            return f"✅ Message appears legitimate. No phishing patterns detected. (Confidence: {confidence*100:.0f}%)"

    def _compute_risk_score(self, label: str, confidence: float, features: ThreatFeatures) -> int:
        if label == "safe":
            base = int((1 - confidence) * 30)
        else:
            base = int(confidence * 60) + 20

        bonus = 0
        if features.has_urgency:
            bonus += 8
        if features.has_scarcity:
            bonus += 6
        if features.has_authority_impersonation:
            bonus += 7
        if features.has_blacklisted_domain:
            bonus += 15
        if features.has_lookalike_domain:
            bonus += 10
        if features.has_money_transfer_request:
            bonus += 12

        return min(100, base + bonus)

    def predict(self, text: str) -> PredictionResult:
        """
        Run full inference on text input.
        Returns a PredictionResult with label, risk score, features, and human reasoning.
        """
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty.")

        proba = self._pipeline.predict_proba([text])[0]
        classes = self._pipeline.classes_
        label_idx = int(proba.argmax())
        label = classes[label_idx]
        confidence = float(proba[label_idx])

        features = self._extract_features(text)
        risk_score = self._compute_risk_score(label, confidence, features)
        reasoning = self._build_reasoning(label, features, confidence)

        return PredictionResult(
            label=label,
            confidence=round(confidence, 4),
            risk_score=risk_score,
            features=features,
            reasoning=reasoning,
        )


# ─── URL-specific checker ─────────────────────────────────────────────────────
def analyze_url(url: str) -> dict:
    """
    Standalone URL analyzer — checks blacklist + lookalike patterns.
    Returns a dict with risk assessment.
    """
    result = {
        "url": url,
        "is_blacklisted": False,
        "is_lookalike": False,
        "risk_level": "safe",
        "risk_score": 0,
        "reason": "URL appears clean.",
    }

    domain_match = re.search(r"https?://([^/\s]+)", url)
    if domain_match:
        domain = domain_match.group(1).lower().lstrip("www.")
        if domain in BLACKLISTED_DOMAINS:
            result["is_blacklisted"] = True
            result["risk_level"] = "critical"
            result["risk_score"] = 95
            result["reason"] = f"Domain '{domain}' is on the DigiRakshak blacklist."
            return result

    for pat in SUSPICIOUS_URL_PATTERNS:
        if re.search(pat, url, re.IGNORECASE):
            result["is_lookalike"] = True
            result["risk_level"] = "high"
            result["risk_score"] = 78
            result["reason"] = "URL uses suspicious TLD or mimics a legitimate brand."
            return result

    # Suspicious keywords in path
    if re.search(r"(verify|kyc|secure|login|claim|refund|prize|reward)", url, re.IGNORECASE):
        result["risk_level"] = "medium"
        result["risk_score"] = 50
        result["reason"] = "URL path contains suspicious keywords."

    return result


# ─── QR / UPI Analyzer ────────────────────────────────────────────────────────
def analyze_upi_qr(upi_string: str) -> dict:
    """
    Parse and validate UPI deep-link strings.
    Distinguishes personal vs merchant IDs and flags anomalies.
    """
    result = {
        "raw": upi_string,
        "upi_id": None,
        "payee_name": None,
        "amount": None,
        "is_merchant": False,
        "risk_level": "safe",
        "risk_score": 0,
        "reason": "UPI ID appears legitimate.",
    }

    pa_match = re.search(r"pa=([^&]+)", upi_string)
    pn_match = re.search(r"pn=([^&]+)", upi_string)
    am_match = re.search(r"am=([^&]+)", upi_string)

    if pa_match:
        result["upi_id"] = pa_match.group(1)
    if pn_match:
        result["payee_name"] = pn_match.group(1)
    if am_match:
        result["amount"] = am_match.group(1)

    if not result["upi_id"]:
        result["risk_level"] = "high"
        result["risk_score"] = 65
        result["reason"] = "QR code does not contain a valid UPI ID."
        return result

    upi_id = result["upi_id"].lower()

    # Merchant UPI IDs typically have @paytm, @razorpay, @upi, @ybl (business), @icici
    merchant_vpa_patterns = [
        r"@(paytmqr|razorpay|stripe|phonepemerchant|shopify|easebuzz)",
        r"(merchant|biz|shop|store|enterprise)\.",
    ]
    for pat in merchant_vpa_patterns:
        if re.search(pat, upi_id):
            result["is_merchant"] = True
            break

    # Red flags: random numbers-heavy IDs, suspicious patterns
    personal_but_requesting_large = (
        not result["is_merchant"]
        and result["amount"]
        and float(result["amount"] or 0) > 5000
    )

    if personal_but_requesting_large:
        result["risk_level"] = "warning"
        result["risk_score"] = 60
        result["reason"] = (
            f"Personal UPI ID '{upi_id}' is requesting a large payment of ₹{result['amount']}. "
            "Verify the recipient before proceeding."
        )
    elif not result["is_merchant"] and re.search(r"\d{6,}", upi_id):
        result["risk_level"] = "warning"
        result["risk_score"] = 40
        result["reason"] = "UPI ID has an unusual numeric pattern — may be auto-generated."

    return result


# ─── Call Integrity Analyzer ──────────────────────────────────────────────────
def analyze_call(phone_number: str, call_frequency_last_hour: int = 0) -> dict:
    """
    Analyze call metadata for spam/fraud signals.
    """
    result = {
        "phone_number": phone_number,
        "risk_level": "safe",
        "risk_score": 0,
        "reason": "Number appears legitimate.",
        "flags": [],
    }

    # Premium rate / known spam prefixes
    spam_prefixes = ["140", "160", "1800000", "9999", "0000"]
    for prefix in spam_prefixes:
        if phone_number.startswith(prefix):
            result["flags"].append(f"Starts with known spam prefix '{prefix}'")
            result["risk_score"] += 30

    # Repeated calls — potential harassment / vishing
    if call_frequency_last_hour >= 5:
        result["flags"].append(f"High frequency: {call_frequency_last_hour} calls in last hour")
        result["risk_score"] += 25

    # Short numbers (robocalls often use short sequences)
    clean_num = re.sub(r"[^\d]", "", phone_number)
    if len(clean_num) < 8:
        result["flags"].append("Unusually short number (potential spoofed CLI)")
        result["risk_score"] += 20

    # International / private numbers with high frequency
    if phone_number.startswith("+") and call_frequency_last_hour >= 3:
        result["flags"].append("International number with high call frequency")
        result["risk_score"] += 15

    result["risk_score"] = min(100, result["risk_score"])

    if result["risk_score"] >= 60:
        result["risk_level"] = "high"
        result["reason"] = "Multiple spam signals detected: " + ", ".join(result["flags"])
    elif result["risk_score"] >= 30:
        result["risk_level"] = "warning"
        result["reason"] = "Potential spam: " + ", ".join(result["flags"])

    return result


# ─── Singleton ────────────────────────────────────────────────────────────────
_engine_instance: Optional[InferenceEngine] = None


def get_engine() -> InferenceEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = InferenceEngine()
    return _engine_instance
