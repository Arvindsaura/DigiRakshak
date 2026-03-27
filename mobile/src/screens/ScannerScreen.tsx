/**
 * Screen 3: Manual Link / SMS Scanner
 * Allows user to manually input SMS, URLs, QR data, or phone numbers for analysis.
 */
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from "react-native";

import { useThreatStore } from "../store/useThreatStore";
import { GlassCard } from "../components/GlassCard";
import { RiskGauge } from "../components/RiskGauge";
import { ReasoningCard } from "../components/ReasoningCard";
import { ScanningPulse } from "../components/ScanningPulse";
import { analyzeSMS, checkURL, analyzeQR, analyzeCall } from "../utils/api";

type ScanMode = "sms" | "url" | "qr" | "call";

const SCAN_MODES: { key: ScanMode; icon: string; label: string; placeholder: string }[] = [
    {
        key: "sms",
        icon: "💬",
        label: "SMS",
        placeholder: "Paste suspicious SMS message here...",
    },
    {
        key: "url",
        icon: "🔗",
        label: "URL",
        placeholder: "Paste URL to check (e.g. http://suspicious-site.tk)",
    },
    {
        key: "qr",
        icon: "📱",
        label: "QR / UPI",
        placeholder: "Paste QR data (e.g. upi://pay?pa=merchant@bank&pn=Shop&am=500)",
    },
    {
        key: "call",
        icon: "📞",
        label: "Call",
        placeholder: "Enter phone number to check (e.g. +91-9876543210)",
    },
];

interface ScanResult {
    risk_score: number;
    risk_level: string;
    label?: string;
    reasoning?: string;
    reason?: string;
    features?: any;
    upi_id?: string;
    payee_name?: string;
    amount?: string;
    is_merchant?: boolean;
    flags?: string[];
}

export default function ScannerScreen() {
    const { generateId, getRiskLevel, addToHistory } = useThreatStore();
    const [mode, setMode] = useState<ScanMode>("sms");
    const [input, setInput] = useState("");
    const [frequency, setFrequency] = useState("0");
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleScan = async () => {
        if (!input.trim()) return;
        setScanning(true);
        setResult(null);
        setError(null);

        try {
            let res: ScanResult;

            if (mode === "sms") {
                const r = await analyzeSMS(input.trim());
                res = {
                    risk_score: r.risk_score,
                    risk_level: getRiskLevel(r.risk_score),
                    label: r.label,
                    reasoning: r.reasoning,
                    features: r.features,
                };
            } else if (mode === "url") {
                const r = await checkURL(input.trim());
                res = {
                    risk_score: r.risk_score,
                    risk_level: r.risk_level,
                    label: r.risk_level === "safe" ? "safe" : "phishing",
                    reasoning: r.reason,
                    reason: r.reason,
                };
            } else if (mode === "qr") {
                const r = await analyzeQR(input.trim());
                res = {
                    risk_score: r.risk_score,
                    risk_level: r.risk_level,
                    label: r.risk_level === "safe" ? "safe" : "phishing",
                    reasoning: r.reason,
                    upi_id: r.upi_id ?? undefined,
                    payee_name: r.payee_name ?? undefined,
                    amount: r.amount ?? undefined,
                    is_merchant: r.is_merchant,
                };
            } else {
                const r = await analyzeCall(input.trim(), parseInt(frequency) || 0);
                res = {
                    risk_score: r.risk_score,
                    risk_level: r.risk_level,
                    label: r.risk_level === "safe" ? "safe" : "phishing",
                    reasoning: r.reason,
                    flags: r.flags,
                };
            }

            setResult(res);

            // Log to history
            addToHistory({
                id: generateId(),
                type: mode,
                label: res.label ?? "safe",
                risk_score: res.risk_score,
                risk_level: getRiskLevel(res.risk_score),
                reasoning: res.reasoning ?? res.reason ?? "",
                features: res.features,
                raw_input: input.trim(),
                timestamp: new Date().toISOString(),
            });
        } catch (e: any) {
            setError(e.message ?? "Server unreachable. Check backend.");
        } finally {
            setScanning(false);
        }
    };

    const currentMode = SCAN_MODES.find((m) => m.key === mode)!;
    const variant =
        !result
            ? "default"
            : result.risk_score >= 70
                ? "danger"
                : result.risk_score >= 40
                    ? "warning"
                    : "safe";

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Manual Scanner</Text>
                <Text style={styles.subtitle}>Paste any suspicious content to analyze</Text>

                {/* ── Mode Selector ── */}
                <View style={styles.modeRow}>
                    {SCAN_MODES.map((m) => (
                        <TouchableOpacity
                            key={m.key}
                            onPress={() => {
                                setMode(m.key);
                                setResult(null);
                                setInput("");
                                setError(null);
                            }}
                            style={[styles.modeTab, mode === m.key && styles.modeTabActive]}
                        >
                            <Text style={styles.modeIcon}>{m.icon}</Text>
                            <Text style={[styles.modeLabel, mode === m.key && styles.modeLabelActive]}>
                                {m.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Input Area ── */}
                <GlassCard style={styles.inputCard} padding={14}>
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder={currentMode.placeholder}
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        style={styles.textInput}
                        multiline={mode === "sms" || mode === "qr"}
                        numberOfLines={mode === "sms" ? 4 : 2}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    {mode === "call" && (
                        <View style={styles.frequencyRow}>
                            <Text style={styles.frequencyLabel}>Calls in last hour:</Text>
                            <TextInput
                                value={frequency}
                                onChangeText={setFrequency}
                                keyboardType="numeric"
                                style={styles.frequencyInput}
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                maxLength={2}
                            />
                        </View>
                    )}
                </GlassCard>

                {/* ── Scan Button ── */}
                <TouchableOpacity
                    onPress={handleScan}
                    disabled={scanning || !input.trim()}
                    style={[
                        styles.scanButton,
                        { opacity: scanning || !input.trim() ? 0.5 : 1 },
                    ]}
                    activeOpacity={0.8}
                >
                    <Text style={styles.scanButtonText}>
                        {scanning ? "Analyzing..." : `🔍 Scan ${currentMode.label}`}
                    </Text>
                </TouchableOpacity>

                {/* ── Scanning Animation ── */}
                {scanning && <ScanningPulse active={true} label={`Analyzing ${currentMode.label}...`} />}

                {/* ── Error ── */}
                {error && (
                    <GlassCard variant="danger" style={styles.errorCard} padding={14}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                    </GlassCard>
                )}

                {/* ── Results ── */}
                {result && !scanning && (
                    <View>
                        <GlassCard variant={variant} style={styles.resultCard}>
                            <View style={styles.resultHeader}>
                                <RiskGauge score={result.risk_score} size={140} />
                                <View style={styles.resultMeta}>
                                    <Text style={styles.resultMode}>{currentMode.icon} {currentMode.label}</Text>

                                    {result.upi_id && (
                                        <>
                                            <Text style={styles.metaKey}>UPI ID</Text>
                                            <Text style={styles.metaVal}>{result.upi_id}</Text>
                                        </>
                                    )}
                                    {result.payee_name && (
                                        <>
                                            <Text style={styles.metaKey}>Payee</Text>
                                            <Text style={styles.metaVal}>{result.payee_name}</Text>
                                        </>
                                    )}
                                    {result.amount && (
                                        <>
                                            <Text style={styles.metaKey}>Amount</Text>
                                            <Text style={styles.metaVal}>₹{result.amount}</Text>
                                        </>
                                    )}
                                    {result.is_merchant !== undefined && (
                                        <>
                                            <Text style={styles.metaKey}>Type</Text>
                                            <Text style={[styles.metaVal, { color: result.is_merchant ? "#30D158" : "#FFCC00" }]}>
                                                {result.is_merchant ? "✅ Merchant" : "👤 Personal"}
                                            </Text>
                                        </>
                                    )}
                                    {result.flags && result.flags.length > 0 && (
                                        <>
                                            <Text style={styles.metaKey}>Flags</Text>
                                            {result.flags.map((f, i) => (
                                                <Text key={i} style={styles.flagText}>• {f}</Text>
                                            ))}
                                        </>
                                    )}
                                </View>
                            </View>
                        </GlassCard>

                        <ReasoningCard
                            reasoning={result.reasoning ?? result.reason ?? ""}
                            features={result.features}
                            label={result.label ?? "safe"}
                        />
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0A0A0F" },
    content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
    title: { fontSize: 26, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 },
    subtitle: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 },
    modeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
    modeTab: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    modeTabActive: {
        borderColor: "#0066FF",
        backgroundColor: "rgba(0,102,255,0.15)",
    },
    modeIcon: { fontSize: 18, marginBottom: 2 },
    modeLabel: { fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: "700" },
    modeLabelActive: { color: "#0066FF" },
    inputCard: { marginBottom: 14 },
    textInput: {
        color: "#FFFFFF",
        fontSize: 14,
        lineHeight: 21,
        minHeight: 70,
        textAlignVertical: "top",
    },
    frequencyRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.08)",
        paddingTop: 10,
    },
    frequencyLabel: { color: "rgba(255,255,255,0.5)", fontSize: 13, flex: 1 },
    frequencyInput: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        width: 60,
        textAlign: "center",
    },
    scanButton: {
        backgroundColor: "#0066FF",
        borderRadius: 14,
        padding: 16,
        alignItems: "center",
        marginBottom: 20,
    },
    scanButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
    errorCard: { marginBottom: 12 },
    errorText: { color: "#FF3B30", fontSize: 13 },
    resultCard: { marginBottom: 12 },
    resultHeader: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
    resultMode: {
        color: "#0066FF",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 8,
        textTransform: "uppercase",
    },
    resultMeta: { flex: 1, paddingTop: 10 },
    metaKey: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 10,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginTop: 6,
    },
    metaVal: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "600",
    },
    flagText: { color: "#FF9500", fontSize: 11, marginTop: 2 },
});
