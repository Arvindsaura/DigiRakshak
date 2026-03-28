/**
 * DigiRakshak API Client
 * Wraps all backend calls with error handling and type safety.
 */
import { useThreatStore } from "../store/useThreatStore";

const getBaseUrl = () =>
    useThreatStore.getState().settings.api_base_url;

async function fetchJson<T>(
    endpoint: string,
    method: "GET" | "POST",
    body?: object,
    signal?: AbortSignal
): Promise<T> {

    const url = `${getBaseUrl()}${endpoint}`;
    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-DigiRakshak-Key": "dr-mobile-app-key",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal,
    });


    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }

    return res.json();
}

export interface SMSAnalysisResult {
    label: string;
    confidence: number;
    risk_score: number;
    reasoning: string;
    features: {
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
    };
    sender?: string;
    timestamp: string;
}

export async function analyzeSMS(
    text: string,
    sender?: string,
    signal?: AbortSignal
): Promise<SMSAnalysisResult> {
    return fetchJson("/sms/analyze", "POST", { text, sender }, signal);
}


export async function checkURL(url: string): Promise<{
    url: string;
    is_blacklisted: boolean;
    is_lookalike: boolean;
    risk_level: string;
    risk_score: number;
    reason: string;
}> {
    return fetchJson("/url/check", "POST", { url });
}

export async function analyzeQR(qr_data: string): Promise<{
    raw: string;
    upi_id: string | null;
    payee_name: string | null;
    amount: string | null;
    is_merchant: boolean;
    risk_level: string;
    risk_score: number;
    reason: string;
}> {
    return fetchJson("/qr/analyze", "POST", { qr_data });
}

export async function analyzeCall(
    phone_number: string,
    call_frequency_last_hour: number = 0
): Promise<{
    phone_number: string;
    risk_level: string;
    risk_score: number;
    reason: string;
    flags: string[];
}> {
    return fetchJson("/call/analyze", "POST", { phone_number, call_frequency_last_hour });
}

export async function checkHealth(): Promise<{
    status: string;
    model_loaded: boolean;
    version: string;
    timestamp: string;
}> {
    return fetchJson("/health", "GET");
}
