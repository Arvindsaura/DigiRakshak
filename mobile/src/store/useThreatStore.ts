/**
 * DigiRakshak Global Threat State — Zustand Store
 * Manages real-time alerts, threat history, and settings.
 */
import { create } from "zustand";

export type RiskLevel = "safe" | "warning" | "high" | "critical";

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

export interface ThreatAlert {
  id: string;
  type: "sms" | "url" | "qr" | "call";
  label: string;
  risk_score: number;
  risk_level: RiskLevel;
  reasoning: string;
  features?: ThreatFeatures;
  raw_input: string;
  sender?: string;
  timestamp: string;
  confidence?: number;
}

export interface AppSettings {
  sms_scanning: boolean;
  call_scanning: boolean;
  auto_block_threshold: number;
  api_base_url: string;
}

export interface UserConsent {
  sms_read: boolean;
  call_log: boolean;
  notifications: boolean;
  edge_ai: boolean;
}

export interface DeviceContext {
  isCallActive: boolean;
  lastCallSender: string | null;
  lastCallTimestamp: string | null;
  lastOtpReceiptTime: string | null;
}


interface ThreatStore {
  // State
  activeAlert: ThreatAlert | null;
  threatHistory: ThreatAlert[];
  settings: AppSettings;
  consent: UserConsent;
  context: DeviceContext;
  isScanning: boolean;
  isFirstLaunch: boolean;
  shieldStatus: "active" | "inactive" | "scanning";

  // Actions
  setActiveAlert: (alert: ThreatAlert | null) => void;
  addToHistory: (alert: ThreatAlert) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateConsent: (consent: Partial<UserConsent>) => void;
  updateContext: (context: Partial<DeviceContext>) => void;
  setScanning: (scanning: boolean) => void;
  setFirstLaunchComplete: () => void;
  setShieldStatus: (status: "active" | "inactive" | "scanning") => void;

  generateId: () => string;
  getRiskLevel: (score: number) => RiskLevel;
}


const DEFAULT_SETTINGS: AppSettings = {
  sms_scanning: true,
  call_scanning: true,
  auto_block_threshold: 70,
  api_base_url: "http://localhost:8000/api/v1",
};

const DEFAULT_CONSENT: UserConsent = {
  sms_read: false,
  call_log: false,
  notifications: false,
  edge_ai: true,
};

const INITIAL_CONTEXT: DeviceContext = {
  isCallActive: false,
  lastCallSender: null,
  lastCallTimestamp: null,
  lastOtpReceiptTime: null,
};


export const useThreatStore = create<ThreatStore>((set, get) => ({
  activeAlert: null,
  threatHistory: [],
  settings: DEFAULT_SETTINGS,
  consent: DEFAULT_CONSENT,
  context: INITIAL_CONTEXT,
  isScanning: false,
  isFirstLaunch: true,
  shieldStatus: "inactive",



  setActiveAlert: (alert) => set({ activeAlert: alert }),

  addToHistory: (alert) =>
    set((state) => ({
      threatHistory: [alert, ...state.threatHistory].slice(0, 100), // cap at 100
    })),

  clearHistory: () => set({ threatHistory: [] }),

  removeFromHistory: (id) =>
    set((state) => ({
      threatHistory: state.threatHistory.filter((t) => t.id !== id),
    })),

  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  updateConsent: (partial) =>
    set((state) => ({
      consent: { ...state.consent, ...partial },
    })),

  updateContext: (partial) =>
    set((state) => ({
      context: { ...state.context, ...partial },
    })),

  setScanning: (scanning) => set({ isScanning: scanning }),

  setFirstLaunchComplete: () => set({ isFirstLaunch: false }),

  setShieldStatus: (status) => set({ shieldStatus: status }),



  generateId: () =>
    `dr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,

  getRiskLevel: (score: number): RiskLevel => {
    if (score >= 70) return "critical";
    if (score >= 40) return "high";
    if (score >= 15) return "warning";
    return "safe";
  },
}));
