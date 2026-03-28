/**
 * DigiRakshak Global Threat State — Zustand Store
 * Manages real-time alerts, threat history, and settings.
 */
import { create } from "zustand";
import { Platform } from "react-native";

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
  notifications_enabled: boolean;
  haptic_feedback: boolean;
  api_base_url: string;
}

interface ThreatStore {
  // State
  activeAlert: ThreatAlert | null;
  threatHistory: ThreatAlert[];
  settings: AppSettings;
  isScanning: boolean;
  shieldStatus: "active" | "inactive" | "scanning";

  // Actions
  setActiveAlert: (alert: ThreatAlert | null) => void;
  addToHistory: (alert: ThreatAlert) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setScanning: (scanning: boolean) => void;
  setShieldStatus: (status: "active" | "inactive" | "scanning") => void;
  generateId: () => string;
  getRiskLevel: (score: number) => RiskLevel;
}

const DEFAULT_SETTINGS: AppSettings = {
  sms_scanning: true,
  call_scanning: true,
  auto_block_threshold: 70,
  notifications_enabled: true,
  haptic_feedback: true,
  api_base_url: Platform.OS === "android" ? "http://10.0.2.2:8000/api/v1" : "http://localhost:8000/api/v1",
};

export const useThreatStore = create<ThreatStore>((set, get) => ({
  activeAlert: null,
  threatHistory: [],
  settings: DEFAULT_SETTINGS,
  isScanning: false,
  shieldStatus: "active",

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

  setScanning: (scanning) => set({ isScanning: scanning }),

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
