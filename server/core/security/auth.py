"""JWT + API Key Security Utilities"""
import os
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

API_KEY_NAME = "X-DigiRakshak-Key"
API_KEY_HEADER = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# In production, load from environment variables / secrets manager
_VALID_API_KEYS = {
    "dr-dev-key-2024",   # Development key
    "dr-mobile-app-key", # Mobile app key
}


def verify_api_key(api_key: Optional[str] = Security(API_KEY_HEADER)) -> str:
    """
    Validate API key from request header.
    In production, replace with DB lookup + bcrypt comparison.
    """
    if api_key is None or api_key not in _VALID_API_KEYS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API key. Pass X-DigiRakshak-Key header.",
        )
    return api_key
