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
    SafeAreaView,
    StatusBar,
} from "react-native";


import { useThreatStore, ThreatAlert } from "../store/useThreatStore";

import { GlassCard } from "../components/GlassCard";
import { RiskGauge } from "../components/RiskGauge";
import { ScanningPulse } from "../components/ScanningPulse";
import { ReasoningCard } from "../components/ReasoningCard";
import { analyzeSMS } from "../utils/api";
import { analyzeLocally } from "../utils/edgeEngine";
import { ConsentModal } from "../components/ConsentModal";



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
    {
        sender: "AD-SBIINB",
        text: "Dear SBI User, your YONO account has been suspended. Please login at http://sbi-secure.yono-update.com to reactivate.",
    },
    {
        sender: "CP-ZOMATO",
        text: "Hungry? Get 50% OFF on your next 3 orders! Use code: YUMMY50. Valid for today only.",
    },
    {
        sender: "VX-AMAZON",
        text: "Action Required: Unusual sign-in attempt on your Amazon account from Moscow. Check at http://amazon-security-alert.org",
    },
    {
        sender: "IN-POLICE",
        text: "TRAFFIC NOTICE: You have an unpaid challan for MH-12-AB-1234. Pay at https://maharashtratrafficechallan.gov.in",
    },
    {
        sender: "IM-WHATSAPP",
        text: "Your WhatsApp verification code is 456-789. Do not share this with anyone.",
    },
    {
        sender: "AD-ICICBK",
        text: "CRITICAL: A transaction of INR 45,000 was made on your ICICI Card. If not you, block at http://icici-fraud-block.win",
    },
    {
        sender: "BW-FEDEX",
        text: "FEDEX: Your package #45678-UI is stuck at customs. Pay handling fee of $2.50 at http://fedex-customs.net",
    },
    {
        sender: "IN-TRAI",
        text: "TRAI: Your mobile number will be disconnected in 2 hours as per document verification. Dial 121 for help.",
    },
    {
        sender: "+919420011223",
        text: "Hey! Just checking in. Can we meet for coffee today at 5 PM?",
    },
    {
        sender: "CM-MSEB",
        text: "Dear Consumer, your electricity will be disconnected tonight at 9:30 PM due to non-payment. Update at http://mseb-bill-update.online",
    },
    {
        sender: "HP-PAY",
        text: "Refilled your HP Gas cylinder #7890? Rate your experience and win exciting rewards! http://hpgas.in/rewards",
    }
];

const SIMULATED_CALLS = [
    {
        number: "+911409210982",
        label: "Telemarketing (Insurance)",
        frequency: 45,
    },
    {
        number: "+1 800-444-4444",
        label: "Unknown (International)",
        frequency: 2,
    },
    {
        number: "140",
        label: "Spam Burst (Debt Recovery)",
        frequency: 128,
    },
    {
        number: "+91 91234 56789",
        label: "Zomato Delivery Partner",
        frequency: 1,
    },
    {
        number: "+91 120 444555",
        label: "Verification Desk",
        frequency: 12,
    },
    {
        number: "Unknown",
        label: "Private Number",
        frequency: 5,
    },
    {
        number: "1909",
        label: "DND Service Alert",
        frequency: 1,
    },
    {
        number: "+914421908722",
        label: "Credit Card Sales",
        frequency: 89,
    },
    {
        number: "+91 11-2345678",
        label: "Bank Customer Care",
        frequency: 1,
    },
    {
        number: "+91 80-1234567",
        label: "Potential Scam",
        frequency: 24,
    }
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
        context,
        updateContext,
        consent,
        settings,
        isFirstLaunch,
    } = useThreatStore();



    const [shimmerActive, setShimmerActive] = useState(false);
    const [serverStatus, setServerStatus] = useState<"connected" | "offline" | "checking">("checking");
    const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
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

    const simulateIncomingEvent = useCallback(async () => {
        const isCall = Math.random() > 0.5;

        if (isCall) {
            if (!settings.call_scanning) return; // Skip if disabled
            
            const call = SIMULATED_CALLS[Math.floor(Math.random() * SIMULATED_CALLS.length)];
            setScanning(true);
            setShieldStatus("scanning");
            setShimmerActive(true);

            // Simulate call analysis
            setTimeout(() => {
                const threatScore = call.frequency > 30 ? 75 : 15;
                const alert: ThreatAlert = {
                    id: generateId(),
                    type: "call",
                    label: threatScore > 50 ? "phishing" : "safe",
                    risk_score: threatScore,
                    risk_level: getRiskLevel(threatScore),
                    reasoning: threatScore > 50 ? `High frequency (${call.frequency} calls) from suspicious number.` : "Standard call patterns detected.",
                    sender: call.number,
                    timestamp: new Date().toISOString(),
                    raw_input: `Frequency: ${call.frequency}`,
                };
                setActiveAlert(alert);
                addToHistory(alert);
                setScanning(false);
                setShimmerActive(false);
                setShieldStatus("active");
            }, 1500);

        } else {
            if (!settings.sms_scanning) return; // Skip if disabled
            
            const sms = SIMULATED_SMS[smsIndex.current % SIMULATED_SMS.length];
            smsIndex.current++;

            setScanning(true);
            setShieldStatus("scanning");
            setShimmerActive(true);

            // 1. Edge Analysis
            const edgeResult = analyzeLocally(sms.text);
            let finalScore = edgeResult.score;
            let finalReasoning = edgeResult.reasoning;

            if (context.isCallActive) {
                finalScore += 25;
                finalReasoning += " | 📞 Scanned during an active call";
            }
            
            const riskLevel = getRiskLevel(finalScore);
            const immediateAlert: ThreatAlert = {
                id: generateId(),
                type: "sms",
                label: finalScore >= 40 ? "phishing" : "safe",
                risk_score: finalScore,
                risk_level: riskLevel,
                reasoning: finalReasoning,
                features: edgeResult.features,
                raw_input: sms.text,
                sender: sms.sender,
                timestamp: new Date().toISOString(),
            };

            setActiveAlert(immediateAlert);

            if (finalScore >= 30 && serverStatus === "connected") {
                try {
                    abortControllerRef.current = new AbortController();
                    const cloudResult = await analyzeSMS(sms.text, sms.sender, abortControllerRef.current.signal);
                    const verifiedAlert = {
                        ...immediateAlert,
                        label: cloudResult.label,
                        risk_score: Math.max(cloudResult.risk_score, finalScore),
                        risk_level: getRiskLevel(Math.max(cloudResult.risk_score, finalScore)),
                        reasoning: cloudResult.reasoning + (context.isCallActive ? " (Context: Active Call)" : ""),
                    };
                    setActiveAlert(verifiedAlert);
                    addToHistory(verifiedAlert);
                } catch (err: any) {
                    if (err.name !== 'AbortError') addToHistory(immediateAlert);
                } finally {
                    abortControllerRef.current = null;
                }
            } else {
                addToHistory(immediateAlert);
            }

            setScanning(false);
            setShimmerActive(false);
            setShieldStatus("active");
        }
    }, [serverStatus, context, consent, settings]);


    const stopAnalysis = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setScanning(false);
        setShimmerActive(false);
        setShieldStatus("active");
    };


    const toggleCallContext = () => {
        updateContext({ isCallActive: !context.isCallActive });
    };


    const toggleSimulation = () => {
        if (simulationRef.current) {
            clearInterval(simulationRef.current);
            simulationRef.current = null;
            setShieldStatus("inactive");
        } else {
            simulationRef.current = setInterval(simulateIncomingEvent, 7000);
            simulateIncomingEvent();
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
        <SafeAreaView style={styles.container}>
            <ConsentModal visible={isFirstLaunch} />
            <StatusBar barStyle="light-content" />
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
                        <View style={styles.scanningWrap}>
                            <ScanningPulse active={true} label="Analyzing incoming message..." />
                            <TouchableOpacity style={styles.abortButton} onPress={stopAnalysis}>
                                <Text style={styles.abortText}>Stop Analysis</Text>
                            </TouchableOpacity>
                        </View>
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

                {/* ── Context & Simulate Controls ── */}
                <View style={styles.controlsRow}>
                    <TouchableOpacity
                        onPress={toggleCallContext}
                        activeOpacity={0.8}
                        style={[
                            styles.controlButton,
                            { borderColor: context.isCallActive ? "#FF3B30" : "rgba(255,255,255,0.2)" }
                        ]}
                    >
                        <Text style={[styles.controlText, { color: context.isCallActive ? "#FF3B30" : "#FFFFFF" }]}>
                            {context.isCallActive ? "📞 Call Active" : "📵 Call Inactive"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={toggleSimulation}
                        activeOpacity={0.8}
                        style={[
                            styles.simulateButton,
                            {
                                flex: 1,
                                backgroundColor:
                                    simulationRef.current ? "rgba(255,59,48,0.2)" : "rgba(0,102,255,0.2)",
                                borderColor:
                                    simulationRef.current ? "#FF3B30" : "#0066FF",
                            },
                        ]}
                    >
                        <Text style={[styles.simulateText, { color: simulationRef.current ? "#FF3B30" : "#0066FF" }]}>
                            {simulationRef.current ? "⏹ Stop Listener" : "▶ Start Hybrid Listener"}
                        </Text>
                    </TouchableOpacity>
                </View>

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
        </SafeAreaView>
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
    scanningWrap: { alignItems: "center", gap: 20, flex: 1, justifyContent: "center" },
    abortButton: {
        backgroundColor: "rgba(255,59,48,0.15)",
        borderColor: "#FF3B30",
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    abortText: { color: "#FF3B30", fontSize: 13, fontWeight: "700" },
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
    controlsRow: {
        flexDirection: "row",
        gap: 10,
        marginVertical: 12,
    },
    controlButton: {
        borderWidth: 1.5,
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
        flex: 0.4,
    },
    controlText: { fontSize: 12, fontWeight: "700" },
    simulateButton: {
        borderWidth: 1.5,
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
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
