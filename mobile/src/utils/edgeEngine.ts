/**
 * DigiRakshak Edge AI Engine
 * Ported from Python ml/inference.py to TypeScript.
 * Handles on-device heuristics, feature extraction, and initial risk scoring.
 */

export interface ThreatFeatures {
  has_urgency: boolean;
  urgency_indicators: string[];
  has_scarcity: boolean;
  scarcity_indicators: string[];
  has_authority_impersonation: boolean;
  impersonated_entities: string[];
  suspicious_urls: string[];
  has_blacklisted_domain: boolean;
  has_lookalike_domain: boolean;
  has_money_transfer_request: boolean;
  has_otp_request: boolean;
}

export interface EdgeAnalysisResult {
  score: number;
  features: ThreatFeatures;
  reasoning: string;
}

// ─── Patterns ported from ml/inference.py ───────────────────────────────────

const URGENCY_PATTERNS = [
  /\bURGENT\b/i, /\bIMMEDIATELY\b/i, /\bASAP\b/i, /\bNOW\b/i,
  /\bEXPIRING TODAY\b/i, /\bFINAL NOTICE\b/i, /\bWARNING\b/i,
  /\bFINAL OPPORTUNITY\b/i, /\bLAST CHANCE\b/i, /\b24 hours?\b/i,
  /\bACCOUNT WILL BE (BLOCKED|SUSPENDED|CLOSED|LOCKED)\b/i,
];

const SCARCITY_PATTERNS = [
  /\bLIMITED TIME\b/i, /\b(only\s+)?\d+\s+(hours?|minutes?)\s+left\b/i,
  /\bLIMITED SLOTS?\b/i, /\bHURRY\b/i, /\bLAST\s+\d+\s+SLOTS?\b/i,
  /\bEXCLUSIVE OFFER\b/i, /\bONLY TODAY\b/i, /\bEXPIRES\b/i,
];

const AUTHORITY_PATTERNS = [
  /\b(SBI|HDFC|ICICI|AXIS|PNB|KOTAK|CANARA)\b/i,
  /\b(RBI|SEBI|TRAI|UIDAI|Income Tax|IT Department)\b/i,
  /\b(Police|CBI|ED|Cybercrime|Court|Legal Notice)\b/i,
  /\b(PM|Prime Minister|Government of India|GOI)\b/i,
  /\b(IRCTC|NPCI|UPI|Aadhaar|PAN Card|KYC)\b/i,
  /\b(Google|Amazon|Facebook|WhatsApp|Netflix|PayPal)\b/i,
  /\b(Jio|Airtel|BSNL|Vodafone|Vi)\b/i,
];

const SUSPICIOUS_URL_PATTERNS = [
  /https?:\/\/[^\s]*\.(tk|ml|xyz|gq|cf|ga|pw|top|click|download|win)\b/i,
  /https?:\/\/[^\s]*(verify|kyc|secure|update|claim|refund|login|prize|reward)[^\s]*\.(com|in|net|org)/i,
  /https?:\/\/[^\s]*-[^\s]*\.(com|in|net|org)/i,
  /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i,
  /https?:\/\/[^\s]*(paypal|google|amazon|facebook|hdfc|sbi|icici|paytm)[^a-z\.][^\s]*/i,
];

const BLACKLISTED_DOMAINS = new Set([
  "hdfc-secure-login.tk", "sbi-verify.ml", "paytm-kyc-update.net",
  "incometax-refund.xyz", "whatsapp-secure.net", "pan-verify-india.tk",
  "bank-rekyc-india.xyz", "gpay-verify.xyz", "itr-notice.xyz",
  "sbi-unlock.xyz", "pmrelief.xyz", "aadhaar-mobile-link.xyz",
  "prizeclaim99.xyz", "apple-free-gift.tk", "invest-sure.xyz",
  "facebook-lottery.xyz", "cybercrime-settle.xyz", "mobile-protect.xyz",
  "survey-earn-cash.com", "jio-offer-free.xyz", "work-earn-online.xyz",
  "amazon-offer-99.xyz", "cibil-update.xyz", "hdfc-fraud-check.in",
]);

// ─── Edge AI Layer ──────────────────────────────────────────────────────────

export function extractFeatures(text: string): ThreatFeatures {
  const features: ThreatFeatures = {
    has_urgency: false,
    urgency_indicators: [],
    has_scarcity: false,
    scarcity_indicators: [],
    has_authority_impersonation: false,
    impersonated_entities: [],
    suspicious_urls: [],
    has_blacklisted_domain: false,
    has_lookalike_domain: false,
    has_money_transfer_request: false,
    has_otp_request: false,
  };

  const upperText = text.toUpperCase();

  // Keyword Checks
  URGENCY_PATTERNS.forEach(pat => {
    const match = text.match(pat);
    if (match) {
      features.has_urgency = true;
      features.urgency_indicators.push(match[0].trim());
    }
  });

  SCARCITY_PATTERNS.forEach(pat => {
    const match = text.match(pat);
    if (match) {
      features.has_scarcity = true;
      features.scarcity_indicators.push(match[0].trim());
    }
  });

  AUTHORITY_PATTERNS.forEach(pat => {
    const match = text.match(pat);
    if (match) {
      features.has_authority_impersonation = true;
      if (!features.impersonated_entities.includes(match[0].trim())) {
          features.impersonated_entities.push(match[0].trim());
      }
    }
  });

  // URL Analysis
  const urls = text.match(/https?:\/\/[^\s]+/gi) || [];
  urls.forEach(url => {
    let suspicious = false;
    const domainMatch = url.match(/https?:\/\/([^/\s]+)/i);
    if (domainMatch) {
      const domain = domainMatch[1].toLowerCase().replace(/^www\./, "");
      if (BLACKLISTED_DOMAINS.has(domain)) {
        features.has_blacklisted_domain = true;
        suspicious = true;
      }
    }

    SUSPICIOUS_URL_PATTERNS.forEach(pat => {
      if (url.match(pat)) {
        features.has_lookalike_domain = true;
        suspicious = true;
      }
    });

    if (suspicious) {
      features.suspicious_urls.push(url);
    }
  });

  features.has_otp_request = /\botp\b|\bone.time.pass/i.test(text);
  features.has_money_transfer_request = /\b(send|transfer|provide|share)\b.*(bank|account|details|money)/i.test(text);

  return features;
}

export function computeEdgeScore(features: ThreatFeatures): number {
  let score = 0;
  
  if (features.has_urgency) score += 20;
  if (features.has_scarcity) score += 15;
  if (features.has_authority_impersonation) score += 20;
  if (features.has_blacklisted_domain) score += 40;
  if (features.has_lookalike_domain) score += 25;
  if (features.has_money_transfer_request) score += 30;
  if (features.has_otp_request) score += 30;

  return Math.min(95, score); // Cap at 95 before Cloud ML verification
}

export function buildReasoning(features: ThreatFeatures, score: number): string {
  const reasons: string[] = [];

  if (features.has_authority_impersonation) {
    reasons.push(`Impersonates trusted entity (${features.impersonated_entities[0]})`);
  }
  if (features.has_urgency) {
    reasons.push(`Creates artificial urgency`);
  }
  if (features.has_blacklisted_domain) {
    reasons.push(`Contains known malicious domain`);
  }
  if (features.has_lookalike_domain) {
    reasons.push(`URL mimics a legitimate website`);
  }
  if (features.has_otp_request || features.has_money_transfer_request) {
      reasons.push("Requests sensitive info/transfer");
  }

  if (reasons.length === 0) {
    return score > 30 ? "⚠️ Minor suspicious patterns detected locally." : "✅ No immediate threats found locally.";
  }

  return "⚠️ Edge Alert: " + reasons.slice(0, 2).join(" | ");
}

export function analyzeQRLocally(data: string): { 
    score: number; 
    reasoning: string; 
    upi_id?: string; 
    payee_name?: string; 
    amount?: string;
    is_merchant?: boolean;
} {
    // 1. Check if it's a UPI deep link
    if (data.startsWith("upi://pay")) {
        try {
            const url = new URL(data);
            const upi_id = url.searchParams.get("pa") || "Unknown";
            const payee_name = url.searchParams.get("pn") || "Unknown";
            const amount = url.searchParams.get("am") || "0";
            
            // Suspicious merchant names (e.g. "Security Check", "Pay to Scan")
            const suspiciousNames = ["SECURITY", "VERIFY", "LOCK", "REFUND", "PRIZE", "WIN"];
            const isSuspicious = suspiciousNames.some(n => payee_name.toLocaleUpperCase().includes(n));
            
            let score = 10;
            let reasoning = "✅ Valid UPI structure detected.";
            
            if (isSuspicious) {
                score += 45;
                reasoning = `⚠️ Suspicious Payee Name (${payee_name}). Fraudulent merchants often use names like "Security Verify" to trick users.`;
            }
            
            if (parseFloat(amount) > 10000) {
                score += 20;
                reasoning += " | 💰 High-value transaction requested via QR.";
            }

            return {
                score,
                reasoning,
                upi_id,
                payee_name,
                amount,
                is_merchant: data.includes("&mc="),
            };
        } catch (e) {
            return {
                score: 40,
                reasoning: "⚠️ Malformed UPI QR code detected. This may be trying to bypass security filters.",
            };
        }
    }


    // 2. Check if it's a URL
    if (data.startsWith("http")) {
        const edge = analyzeLocally(data);
        return {
            score: edge.score,
            reasoning: "📱 QR Link: " + edge.reasoning,
        };
    }

    // 3. Generic Data
    return {
        score: 5,
        reasoning: "✅ QR data decoded. No immediate threats found.",
    };
}

export function analyzeLocally(text: string): EdgeAnalysisResult {
    const features = extractFeatures(text);
    const score = computeEdgeScore(features);
    const reasoning = buildReasoning(features, score);
    
    return { score, features, reasoning };
}

