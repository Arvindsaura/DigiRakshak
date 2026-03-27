/**
 * Screen 1: Real-time Shield Dashboard
 * Shows live threat status, active shield, background SMS monitor simulation
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
} from "react-native";

import { useThreatStore } from "../store/useThreatStore";
import { GlassCard } from "../components/GlassCard";
import { RiskGauge } from "../components/RiskGauge";
import { ScanningPulse } from "../components/ScanningPulse";
import { ReasoningCard } from "../components/ReasoningCard";
import { analyzeSMS } from "../utils/api";

const { width } = Dimensions.get("window");

// Simulated incoming SMS messages for the background listener demo
const SIMULATED_SMS = [
    {
        sender: "VM-HDFCBK",
        text: "URGENT: Your HDFC account has been FROZEN! Verify at http://hdfc-secure-login.tk NOW to avoid permanent closure!",
    },
    {
        sender: "+919876543210",
        text: "Your Swiggy order #SY234 is out for delivery. Estimated arrival: 20 minutes.",
    },
    {
        sender: "JD-PAYTM",
        text: "ALERT: Your KYC is expiring TODAY! Update at http://paytm-kyc-update.net or account will be BLOCKED permanently!",
    },
    {
        sender: "BW-IRCTC",
        text: "IRCTC: Your ticket PNR 456789123 for Train 12301 is confirmed. Departs 16:45 from NDLS.",
    },
];

export default function DashboardScreen() {
    const {
        activeAlert,
        shieldStatus,
        isScanning,
        threatHistory,
        setScanning,
        setShieldStatus,
        setActiveAlert,
        addToHistory,
        generateId,
        getRiskLevel,
    } = useThreatStore();

    const [shimmerActive, setShimmerActive] = useState(false);
    const [serverStatus, setServerStatus] = useState<"connected" | "offline" | "checking">("checking");
    const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const smsIndex = useRef(0);

    const checkServer = useCallback(async () => {
        try {
            const res = await fetch(
                `${useThreatStore.getState().settings.api_base_url}/health`
            );
            setServerStatus(res.ok ? "connected" : "offline");
        } catch {
            setServerStatus("offline");
        }
    }, []);

    useEffect(() => {
        checkServer();
    }, []);

    const simulateIncomingSMS = useCallback(async () => {
        const sms = SIMULATED_SMS[smsIndex.current % SIMULATED_SMS.length];
        smsIndex.current++;

        setScanning(true);
        setShieldStatus("scanning");
        setShimmerActive(true);

        try {
            const result = await analyzeSMS(sms.text, sms.sender);
            const riskLevel = getRiskLevel(result.risk_score);

            const alert = {
                id: generateId(),
                type: "sms" as const,
                label: result.label,
                risk_score: result.risk_score,
                risk_level: riskLevel,
                reasoning: result.reasoning,
                features: result.features,
                raw_input: sms.text,
                sender: sms.sender,
                timestamp: new Date().toISOString(),
                confidence: result.confidence,
            };

            setActiveAlert(alert);
            addToHistory(alert);
            setShieldStatus(result.label === "phishing" ? "active" : "active");
        } catch (err) {
            // Fallback: demo mode with static data when server is offline
            const mockScore = Math.random() > 0.5 ? 85 : 10;
            const mockLabel = mockScore > 50 ? "phishing" : "safe";
            const alert = {
                id: generateId(),
                type: "sms" as const,
                label: mockLabel,
                risk_score: mockScore,
                risk_level: getRiskLevel(mockScore),
                reasoning:
                    mockLabel === "phishing"
                        ? "⚠️ Demo mode: Phishing indicators detected (server offline)"
                        : "✅ Demo mode: Message appears safe (server offline)",
                raw_input: sms.text,
                sender: sms.sender,
                timestamp: new Date().toISOString(),
            };
            setActiveAlert(alert);
            addToHistory(alert);
        } finally {
            setScanning(false);
            setShimmerActive(false);
            setShieldStatus("active");
        }
    }, []);

    const toggleSimulation = () => {
        if (simulationRef.current) {
            clearInterval(simulationRef.current);
            simulationRef.current = null;
            setShieldStatus("inactive");
        } else {
            simulationRef.current = setInterval(simulateIncomingSMS, 6000);
            simulateIncomingSMS();
            setShieldStatus("active");
        }
    };

    useEffect(() => {
        return () => {
            if (simulationRef.current) clearInterval(simulationRef.current);
        };
    }, []);

    const statusColors = {
        active: "#30D158",
        inactive: "rgba(255,255,255,0.3)",
        scanning: "#0066FF",
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Header ── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>DigiRakshak</Text>
                    <Text style={styles.headerSub}>AI Fraud Shield</Text>
                </View>
                <View style={styles.statusPill}>
                    <View
                        style={[
                            styles.statusDot,
                            { backgroundColor: statusColors[shieldStatus] },
                        ]}
                    />
                    <Text style={[styles.statusText, { color: statusColors[shieldStatus] }]}>
                        {shieldStatus === "active"
                            ? "SHIELD ACTIVE"
                            : shieldStatus === "scanning"
                                ? "SCANNING..."
                                : "SHIELD OFF"}
                    </Text>
                </View>
            </View>

            {/* ── Server Status ── */}
            <GlassCard
                variant={serverStatus === "connected" ? "safe" : "warning"}
                style={styles.serverCard}
                padding={10}
            >
                <Text style={styles.serverText}>
                    {serverStatus === "connected"
                        ? "🟢 Backend connected · ML Engine ready"
                        : serverStatus === "checking"
                            ? "🔵 Checking server..."
                            : "🟡 Server offline · Running in Demo Mode"}
                </Text>
            </GlassCard>

            {/* ── Central Risk Display ── */}
            <GlassCard style={styles.mainCard}>
                {isScanning ? (
                    <ScanningPulse active={true} label="Analyzing incoming message..." />
                ) : activeAlert ? (
                    <View style={styles.alertContent}>
                        <RiskGauge score={activeAlert.risk_score} size={160} />
                        <View style={styles.alertMeta}>
                            <Text style={styles.alertSender}>
                                From: {activeAlert.sender ?? "Unknown"}
                            </Text>
                            <Text style={styles.alertType}>
                                {activeAlert.type.toUpperCase()} ANALYSIS
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.idleState}>
                        <View>
                            <Text style={styles.shieldIcon}>🛡️</Text>
                        </View>
                        <Text style={styles.idleText}>All Clear</Text>
                        <Text style={styles.idleSub}>No threats detected</Text>
                    </View>
                )}
            </GlassCard>

            {/* ── Reasoning Card ── */}
            {activeAlert && (
                <ReasoningCard
                    reasoning={activeAlert.reasoning}
                    features={activeAlert.features}
                    label={activeAlert.label}
                />
            )}

            {/* ── Simulate Button ── */}
            <TouchableOpacity
                onPress={toggleSimulation}
                activeOpacity={0.8}
                style={[
                    styles.simulateButton,
                    {
                        backgroundColor:
                            simulationRef.current ? "rgba(255,59,48,0.2)" : "rgba(0,102,255,0.2)",
                        borderColor:
                            simulationRef.current ? "#FF3B30" : "#0066FF",
                    },
                ]}
            >
                <Text style={[styles.simulateText, { color: simulationRef.current ? "#FF3B30" : "#0066FF" }]}>
                    {simulationRef.current ? "⏹ Stop Background Listener" : "▶ Start SMS Listener Simulation"}
                </Text>
            </TouchableOpacity>

            {/* ── Quick Stats ── */}
            <View style={styles.statsRow}>
                {[
                    { label: "Scanned Today", value: threatHistory.length, icon: "🔍" },
                    {
                        label: "Threats Found",
                        value: threatHistory.filter((t) => t.label === "phishing").length,
                        icon: "🚨",
                    },
                    {
                        label: "Blocked",
                        value: threatHistory.filter((t) => t.risk_score >= 70).length,
                        icon: "🛡️",
                    },
                ].map((stat, i) => (
                    <GlassCard key={i} style={styles.statCard} padding={12}>
                        <Text style={styles.statIcon}>{stat.icon}</Text>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </GlassCard>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0A0A0F" },
    content: { padding: 20, paddingBottom: 100 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: -0.5,
    },
    headerSub: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
    statusPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.07)",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
    serverCard: { marginBottom: 12 },
    serverText: { color: "rgba(255,255,255,0.7)", fontSize: 12, textAlign: "center" },
    mainCard: {
        alignItems: "center",
        paddingVertical: 32,
        marginBottom: 12,
        minHeight: 220,
    },
    alertContent: { alignItems: "center", gap: 12 },
    alertMeta: { alignItems: "center" },
    alertSender: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 12,
        fontWeight: "600",
    },
    alertType: {
        color: "#0066FF",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.5,
        marginTop: 4,
    },
    idleState: { alignItems: "center", gap: 8 },
    shieldIcon: { fontSize: 64 },
    idleText: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
    idleSub: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
    simulateButton: {
        borderWidth: 1.5,
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
        marginVertical: 12,
    },
    simulateText: { fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },
    statsRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 4,
    },
    statCard: { flex: 1, alignItems: "center" },
    statIcon: { fontSize: 20, marginBottom: 4 },
    statValue: {
        fontSize: 22,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    statLabel: {
        fontSize: 9,
        color: "rgba(255,255,255,0.4)",
        textAlign: "center",
        marginTop: 2,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
});
