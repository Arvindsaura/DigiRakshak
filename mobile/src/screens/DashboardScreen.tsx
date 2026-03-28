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
    Dimensions,
    DeviceEventEmitter,
} from "react-native";

import { useThreatStore } from "../store/useThreatStore";
import { GlassCard } from "../components/GlassCard";
import { RiskGauge } from "../components/RiskGauge";
import { ScanningPulse } from "../components/ScanningPulse";
import { ReasoningCard } from "../components/ReasoningCard";
import { analyzeSMS } from "../utils/api";

const { width } = Dimensions.get("window");



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

    const [serverStatus, setServerStatus] = useState<"connected" | "offline" | "checking">("checking");

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

    const handleIncomingSMS = useCallback(async (sms: { sender: string; text: string }) => {
        if (!sms.text) return;

        setScanning(true);
        setShieldStatus("scanning");

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
        } catch (err) {
            console.error("SMS Analysis failed", err);
        } finally {
            setScanning(false);
            setShieldStatus("active");
        }
    }, []);

    useEffect(() => {
        checkServer();
        
        // Listen to Real Android SMS Events
        const subscription = DeviceEventEmitter.addListener('onSMSReceived', handleIncomingSMS);
        return () => {
            subscription.remove();
        };
    }, [handleIncomingSMS]);

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
