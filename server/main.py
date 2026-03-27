"""
DigiRakshak FastAPI Server - Main Entry Point
"""
import sys
import os

# Make ml/ importable from server context
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import sms, url, qr, call, health

app = FastAPI(
    title="DigiRakshak API",
    description="AI-powered Digital Fraud Detection Shield",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(sms.router, prefix="/api/v1/sms", tags=["SMS Analysis"])
app.include_router(url.router, prefix="/api/v1/url", tags=["URL Safety"])
app.include_router(qr.router, prefix="/api/v1/qr", tags=["QR/UPI Guard"])
app.include_router(call.router, prefix="/api/v1/call", tags=["Call Integrity"])


@app.on_event("startup")
async def startup_event():
    print("🛡️  DigiRakshak Server starting...")
    try:
        from inference import get_engine
        get_engine()
        print("✅  ML Inference Engine loaded successfully.")
    except FileNotFoundError as e:
        print(f"⚠️  ML Model not found: {e}")
        print("    Run `python ml/train_model.py` to train the model first.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
