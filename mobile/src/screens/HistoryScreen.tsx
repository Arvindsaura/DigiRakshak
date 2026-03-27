/**
 * Screen 2: Threat History Log
 * Scrollable history with filter tabs and delete capability
 */
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from "react-native";

import { useThreatStore, ThreatAlert } from "../store/useThreatStore";
import { ThreatHistoryItem } from "../components/ThreatHistoryItem";
import { RiskGauge } from "../components/RiskGauge";
import { ReasoningCard } from "../components/ReasoningCard";
import { GlassCard } from "../components/GlassCard";

type FilterType = "all" | "sms" | "url" | "qr" | "call" | "phishing";

const FILTER_TABS: { key: FilterType; label: string; icon: string }[] = [
    { key: "all", label: "All", icon: "📋" },
    { key: "phishing", label: "Threats", icon: "🚨" },
    { key: "sms", label: "SMS", icon: "💬" },
    { key: "url", label: "URLs", icon: "🔗" },
    { key: "qr", label: "QR", icon: "📱" },
    { key: "call", label: "Calls", icon: "📞" },
];

export default function HistoryScreen() {
    const { threatHistory, clearHistory, removeFromHistory } = useThreatStore();
    const [activeFilter, setActiveFilter] = useState<FilterType>("all");
    const [selectedAlert, setSelectedAlert] = useState<ThreatAlert | null>(null);

    const filtered = threatHistory.filter((t) => {
        if (activeFilter === "all") return true;
        if (activeFilter === "phishing") return t.label === "phishing";
        return t.type === activeFilter;
    });

    const handleClearAll = () => {
        Alert.alert("Clear History", "Delete all threat records?", [
            { text: "Cancel", style: "cancel" },
            { text: "Clear All", style: "destructive", onPress: clearHistory },
        ]);
    };

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <Text style={styles.title}>Threat History</Text>
                {threatHistory.length > 0 && (
                    <TouchableOpacity onPress={handleClearAll}>
                        <Text style={styles.clearBtn}>Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Filter Tabs ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContent}
            >
                {FILTER_TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => setActiveFilter(tab.key)}
                        style={[
                            styles.filterTab,
                            activeFilter === tab.key && styles.filterTabActive,
                        ]}
                    >
                        <Text style={styles.filterIcon}>{tab.icon}</Text>
                        <Text
                            style={[
                                styles.filterLabel,
                                activeFilter === tab.key && styles.filterLabelActive,
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* ── Detail Modal ── */}
            {selectedAlert && (
                <View style={styles.detailOverlay}>
                    <GlassCard
                        variant={selectedAlert.label === "phishing" ? "danger" : "safe"}
                        style={styles.detailCard}
                    >
                        <TouchableOpacity
                            onPress={() => setSelectedAlert(null)}
                            style={styles.closeBtn}
                        >
                            <Text style={styles.closeBtnText}>✕ Close</Text>
                        </TouchableOpacity>
                        <View style={styles.detailHeader}>
                            <RiskGauge score={selectedAlert.risk_score} size={120} />
                            <View style={styles.detailMeta}>
                                <Text style={styles.detailType}>
                                    {selectedAlert.type.toUpperCase()}
                                </Text>
                                {selectedAlert.sender && (
                                    <Text style={styles.detailSender}>{selectedAlert.sender}</Text>
                                )}
                                <Text style={styles.detailTime}>
                                    {new Date(selectedAlert.timestamp).toLocaleString("en-IN")}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.detailInput}>{selectedAlert.raw_input}</Text>
                        <ReasoningCard
                            reasoning={selectedAlert.reasoning}
                            features={selectedAlert.features}
                            label={selectedAlert.label}
                        />
                    </GlassCard>
                </View>
            )}

            {/* ── List ── */}
            <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {filtered.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>No records found</Text>
                        <Text style={styles.emptySubtext}>
                            Start the shield on the Dashboard to begin scanning.
                        </Text>
                    </View>
                ) : (
                    filtered.map((alert, idx) => (
                        <ThreatHistoryItem
                            key={alert.id}
                            alert={alert}
                            index={idx}
                            onPress={() => setSelectedAlert(alert)}
                            onDelete={() => removeFromHistory(alert.id)}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0A0A0F" },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
    },
    title: { fontSize: 26, fontWeight: "800", color: "#FFFFFF" },
    clearBtn: { color: "#FF3B30", fontSize: 14, fontWeight: "600" },
    filterScroll: { maxHeight: 60 },
    filterContent: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
    filterTab: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    filterTabActive: {
        borderColor: "#0066FF",
        backgroundColor: "rgba(0,102,255,0.15)",
    },
    filterIcon: { fontSize: 13 },
    filterLabel: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: "600" },
    filterLabelActive: { color: "#0066FF" },
    list: { flex: 1 },
    listContent: { padding: 16, paddingBottom: 100 },
    emptyState: { alignItems: "center", paddingTop: 80, gap: 8 },
    emptyIcon: { fontSize: 48 },
    emptyText: { fontSize: 18, fontWeight: "700", color: "rgba(255,255,255,0.6)" },
    emptySubtext: {
        fontSize: 13,
        color: "rgba(255,255,255,0.3)",
        textAlign: "center",
        paddingHorizontal: 40,
    },
    detailOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.85)",
        padding: 16,
        paddingTop: 60,
    },
    detailCard: { flex: 0 },
    closeBtn: {
        alignSelf: "flex-end",
        marginBottom: 12,
    },
    closeBtnText: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
    detailHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginBottom: 12,
    },
    detailMeta: { flex: 1 },
    detailType: {
        color: "#0066FF",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.5,
    },
    detailSender: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
        marginTop: 4,
    },
    detailTime: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 11,
        marginTop: 4,
    },
    detailInput: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 13,
        lineHeight: 20,
        backgroundColor: "rgba(255,255,255,0.05)",
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
});
