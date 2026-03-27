/**
 * Screen 4: Security Settings
 */
import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TextInput,
    TouchableOpacity,
    Alert,
} from "react-native";

import { useThreatStore } from "../store/useThreatStore";
import { GlassCard } from "../components/GlassCard";

interface SettingRowProps {
    icon: string;
    label: string;
    description?: string;
    value: boolean;
    onToggle: (val: boolean) => void;
}

function SettingRow({ icon, label, description, value, onToggle }: SettingRowProps) {
    return (
        <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>{icon}</Text>
                <View>
                    <Text style={styles.settingLabel}>{label}</Text>
                    {description && (
                        <Text style={styles.settingDesc}>{description}</Text>
                    )}
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#0066FF" }}
                thumbColor={value ? "#FFFFFF" : "rgba(255,255,255,0.4)"}
            />
        </View>
    );
}

export default function SettingsScreen() {
    const { settings, updateSettings, clearHistory, threatHistory } = useThreatStore();

    const handleClearHistory = () => {
        Alert.alert(
            "Clear Threat History",
            `This will remove all ${threatHistory.length} records permanently.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: () => {
                        clearHistory();
                        Alert.alert("Done", "History cleared successfully.");
                    },
                },
            ]
        );
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.title}>Settings</Text>

            {/* ── Shield Protection ── */}
            <View style={{ marginTop: 2 }}>
                <Text style={styles.sectionTitle}>🛡️ Shield Protection</Text>
                <GlassCard style={styles.card}>
                    <SettingRow
                        icon="💬"
                        label="SMS Scanning"
                        description="Analyze incoming SMS messages in background"
                        value={settings.sms_scanning}
                        onToggle={(v) => updateSettings({ sms_scanning: v })}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="📞"
                        label="Call Scanning"
                        description="Flag suspicious inbound calls"
                        value={settings.call_scanning}
                        onToggle={(v) => updateSettings({ call_scanning: v })}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="🔔"
                        label="Notifications"
                        description="Show alerts for high-risk detections"
                        value={settings.notifications_enabled}
                        onToggle={(v) => updateSettings({ notifications_enabled: v })}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="📳"
                        label="Haptic Feedback"
                        description="Vibrate on threat detection"
                        value={settings.haptic_feedback}
                        onToggle={(v) => updateSettings({ haptic_feedback: v })}
                    />
                </GlassCard>
            </View>

            {/* ── Thresholds ── */}
            <View style={{ marginTop: 2 }}>
                <Text style={styles.sectionTitle}>⚙️ Risk Thresholds</Text>
                <GlassCard style={styles.card}>
                    <Text style={styles.thresholdLabel}>Auto-Block Threshold</Text>
                    <Text style={styles.thresholdDesc}>
                        Messages with risk score ≥ {settings.auto_block_threshold} are auto-blocked
                    </Text>
                    <View style={styles.thresholdRow}>
                        {[50, 60, 70, 80, 90].map((val) => (
                            <TouchableOpacity
                                key={val}
                                onPress={() => updateSettings({ auto_block_threshold: val })}
                                style={[
                                    styles.thresholdBtn,
                                    settings.auto_block_threshold === val && styles.thresholdBtnActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.thresholdBtnText,
                                        settings.auto_block_threshold === val && styles.thresholdBtnTextActive,
                                    ]}
                                >
                                    {val}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </GlassCard>
            </View>

            {/* ── API Configuration ── */}
            <View style={{ marginTop: 2 }}>
                <Text style={styles.sectionTitle}>🌐 API Configuration</Text>
                <GlassCard style={styles.card}>
                    <Text style={styles.inputLabel}>Backend Server URL</Text>
                    <TextInput
                        value={settings.api_base_url}
                        onChangeText={(v) => updateSettings({ api_base_url: v })}
                        style={styles.urlInput}
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <Text style={styles.urlHint}>
                        Default: http://localhost:8000/api/v1 {"\n"}
                        For Android emulator: http://10.0.2.2:8000/api/v1
                    </Text>
                </GlassCard>
            </View>

            {/* ── Data Management ── */}
            <View style={{ marginTop: 2 }}>
                <Text style={styles.sectionTitle}>🗂️ Data Management</Text>
                <GlassCard style={styles.card}>
                    <View style={styles.dataRow}>
                        <View>
                            <Text style={styles.dataLabel}>Threat Records</Text>
                            <Text style={styles.dataValue}>{threatHistory.length} entries stored</Text>
                        </View>
                        <TouchableOpacity onPress={handleClearHistory} style={styles.clearBtn}>
                            <Text style={styles.clearBtnText}>Clear History</Text>
                        </TouchableOpacity>
                    </View>
                </GlassCard>
            </View>

            {/* ── About ── */}
            <View style={{ marginTop: 2 }}>
                <Text style={styles.sectionTitle}>ℹ️ About</Text>
                <GlassCard style={styles.card} padding={20}>
                    <Text style={styles.aboutTitle}>DigiRakshak v1.0.0</Text>
                    <Text style={styles.aboutSub}>AI Digital Fraud Shield</Text>
                    <View style={styles.aboutDivider} />
                    <Text style={styles.aboutStack}>
                        React Native + FastAPI + Scikit-Learn{"\n"}
                        TF-IDF + MultinomialNB Classifier{"\n"}
                        Explainable AI · Offline-capable
                    </Text>
                </GlassCard>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0A0A0F" },
    content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
    title: { fontSize: 26, fontWeight: "800", color: "#FFFFFF", marginBottom: 24 },
    sectionTitle: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 8,
        marginTop: 20,
        marginLeft: 4,
    },
    card: { marginBottom: 4 },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 6,
    },
    settingLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
    settingIcon: { fontSize: 22 },
    settingLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
    settingDesc: {
        color: "rgba(255,255,255,0.35)",
        fontSize: 11,
        marginTop: 2,
        maxWidth: 220,
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.07)",
        marginVertical: 8,
    },
    thresholdLabel: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 4,
    },
    thresholdDesc: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 12,
        marginBottom: 14,
    },
    thresholdRow: { flexDirection: "row", gap: 8 },
    thresholdBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    thresholdBtnActive: {
        borderColor: "#0066FF",
        backgroundColor: "rgba(0,102,255,0.2)",
    },
    thresholdBtnText: { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "700" },
    thresholdBtnTextActive: { color: "#0066FF" },
    inputLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 6, fontWeight: "600" },
    urlInput: {
        color: "#FFFFFF",
        fontSize: 13,
        backgroundColor: "rgba(255,255,255,0.07)",
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        fontFamily: "monospace",
    },
    urlHint: {
        color: "rgba(255,255,255,0.3)",
        fontSize: 11,
        marginTop: 8,
        lineHeight: 16,
    },
    dataRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    dataLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
    dataValue: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 },
    clearBtn: {
        borderWidth: 1,
        borderColor: "#FF3B30",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    clearBtnText: { color: "#FF3B30", fontSize: 13, fontWeight: "700" },
    aboutTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
    aboutSub: { color: "#0066FF", fontSize: 12, fontWeight: "600", marginTop: 2 },
    aboutDivider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.08)",
        marginVertical: 12,
    },
    aboutStack: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 12,
        lineHeight: 20,
        fontFamily: "monospace",
    },
});
