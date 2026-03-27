# 🛡️ DigiRakshak — AI Digital Fraud Shield

> **Production-grade mobile-first system that proactively prevents digital fraud using Explainable AI.**
> Analyzes SMS, URLs, QR codes, and incoming calls in real time.

---

## 📐 Architecture Overview

```
DigiRakshak/
├── mobile/              # React Native (Expo) — Cross-platform mobile app
│   ├── app/             # Expo Router file-based navigation (4 tabs)
│   ├── src/
│   │   ├── store/       # Zustand global state (threats, settings, history)
│   │   ├── components/  # GlassCard, RiskGauge, ReasoningCard, ScanningPulse
│   │   ├── screens/     # Dashboard, History, Scanner, Settings
│   │   └── utils/       # Typed API client
│   ├── app.json         # Expo config (permissions, bundle IDs)
│   ├── tailwind.config.js
│   └── babel.config.js
│
├── server/              # FastAPI (Python) — REST API backend
│   ├── main.py          # App entry point, CORS, router registration
│   ├── api/routes/      # sms.py, url.py, qr.py, call.py, health.py
│   ├── core/security/   # API key auth middleware
│   ├── models/          # Pydantic schemas (strict validation)
│   ├── Dockerfile
│   └── requirements.txt
│
├── ml/                  # Machine Learning Engine
│   ├── train_model.py   # TF-IDF + MultinomialNB Scikit-Learn pipeline
│   ├── inference.py     # InferenceEngine class + URL/QR/Call analyzers
│   ├── data/
│   │   └── fraud_v1.csv # Labeled dataset (60 real-world style samples)
│   └── fraud_model.pkl  # Generated after training (gitignored)
│
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| Expo CLI | Latest |

---

### Step 1 — Train the ML Model

```bash
cd DigiRakshak

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install ML dependencies
pip install -r ml/requirements.txt

# Train the model (creates ml/fraud_model.pkl)
python ml/train_model.py
```

Expected output:
```
[DATA] Loaded 60 samples
Accuracy : 91.67%
[SAVED] Model saved to ml/fraud_model.pkl
[DONE] Model training complete.
```

---

### Step 2 — Start the FastAPI Server

```bash
# Install server dependencies
pip install -r server/requirements.txt

# Start the backend (from project root)
cd server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API live at: **http://localhost:8000**

- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/api/v1/health

---

### Step 3 — Run the Mobile App

```bash
cd mobile

# Install dependencies
npm install

# Start Expo dev server
npm start

# For specific platforms:
npm run android   # Android emulator / device
npm run ios       # iOS simulator (macOS only)
npm run web       # Web browser (fallback)
```

> **Android Emulator:** Change API URL in Settings to `http://10.0.2.2:8000/api/v1`

---

### Docker (One-Command Deploy)

```bash
docker-compose up --build
```
The server trains the ML model at build time automatically.

---

## 🧩 Feature Details

### 1. SMS Scrutiny
- ML Classification: TF-IDF (bigrams, 5000 features) + MultinomialNB
- Feature Extraction: Urgency, Scarcity, Authority Impersonation
- Background Listener Simulation cycling through 4 real-world SMS types

### 2. SafeLink URL Checker
- Blacklist check (20+ known malicious domains)
- Lookalike detection (suspicious TLDs: .tk, .ml, .xyz)
- IP-based URL detection
- Risk levels: safe / medium / high / critical

### 3. UPI / QR Guard
- Parses UPI deep-links (upi://pay?pa=...&pn=...&am=...)
- Merchant vs Personal UPI ID classification
- Large personal transfer warnings (>Rs.5,000)
- Auto-generated numeric ID detection

### 4. Call Integrity
- Spam prefix detection (140, 160, etc.)
- High-frequency caller flagging
- International + high-frequency combo warning

### 5. Explainability Dashboard
- Risk Gauge: Animated SVG 0-100 score
- Reasoning Card: Why a threat was flagged
- Feature Badges: Visual indicators per pattern
- Impersonated Entity List

---

## 🔌 API Reference

All routes accept header: `X-DigiRakshak-Key: dr-mobile-app-key`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/health | Server + model status |
| POST | /api/v1/sms/analyze | Full SMS phishing analysis |
| POST | /api/v1/sms/simulate-background | Background listener payload |
| POST | /api/v1/url/check | URL blacklist + lookalike check |
| POST | /api/v1/qr/analyze | QR/UPI fraud analysis |
| POST | /api/v1/call/analyze | Call spam/vishing analysis |

### Example: SMS Analysis

```bash
curl -X POST http://localhost:8000/api/v1/sms/analyze \
  -H "Content-Type: application/json" \
  -H "X-DigiRakshak-Key: dr-mobile-app-key" \
  -d '{"text": "URGENT: HDFC account FROZEN! Verify at http://hdfc-secure-login.tk NOW!", "sender": "VM-HDFCBK"}'
```

Response:
```json
{
  "label": "phishing",
  "confidence": 0.9821,
  "risk_score": 96,
  "reasoning": "Impersonates HDFC | Creates artificial urgency | Contains blacklisted domain"
}
```

---

## 🧠 ML Model

| Aspect | Detail |
|--------|--------|
| Algorithm | MultinomialNB |
| Features | TF-IDF bigrams, 5000 vocabulary |
| Dataset | 60 samples (32 phishing / 28 safe) |
| Accuracy | ~91%+ on test split |
| Inference | <5ms per prediction |

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| Background | #0A0A0F | App background |
| Primary | #0066FF | Electric Blue |
| Danger | #FF3B30 | Crimson |
| Warning | #FFCC00 | Amber |
| Safe | #30D158 | Green |

Style: Glassmorphism with MotiView spring animations.

---

## 📱 App Screens

| Screen | Tab | Description |
|--------|-----|-------------|
| Shield Dashboard | Shield | Live threat status, gauge, background listener, stats |
| Threat History | History | Filterable log with detail modal |
| Manual Scanner | Scan | Paste SMS/URL/QR/Call for instant analysis |
| Settings | Settings | Shield toggles, thresholds, API config |
