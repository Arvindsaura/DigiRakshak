/**
 * ThreatHistoryItem — Single history list item with swipe-to-delete feel
 */
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { ThreatAlert } from "../store/useThreatStore";

interface Props {
    alert: ThreatAlert;
    index: number;
    onPress: () => void;
    onDelete: () => void;
}

const TYPE_ICONS: Record<string, string> = {
    sms: "💬",
    url: "🔗",
    qr: "📱",
    call: "📞",
};

const RISK_COLORS: Record<string, string> = {
    critical: "#FF3B30",
    high: "#FF9500",
    warning: "#FFCC00",
    safe: "#30D158",
};

export function ThreatHistoryItem({ alert, index, onPress, onDelete }: Props) {
    const color = RISK_COLORS[alert.risk_level] ?? "#FFFFFF";

    return (
        <View>
            <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
                <View style={styles.container}>
                    {/* Left risk indicator */}
                    <View style={[styles.indicator, { backgroundColor: color }]} />

                    {/* Icon */}
                    <View style={[styles.iconBox, { borderColor: `${color}40` }]}>
                        <Text style={styles.icon}>{TYPE_ICONS[alert.type]}</Text>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={[styles.riskBadge, { color }]}>
                                {alert.risk_level.toUpperCase()}
                            </Text>
                            <Text style={styles.time}>
                                {new Date(alert.timestamp).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </Text>
                        </View>
                        <Text style={styles.input} numberOfLines={1}>
                            {alert.raw_input}
                        </Text>
                        <Text style={styles.reasoning} numberOfLines={1}>
                            {alert.reasoning.replace(/^[⚠️✅]\s*/, "")}
                        </Text>
                    </View>

                    {/* Score bubble */}
                    <View style={[styles.scoreBubble, { borderColor: color }]}>
                        <Text style={[styles.scoreText, { color }]}>{alert.risk_score}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        marginVertical: 5,
        overflow: "hidden",
    },
    indicator: {
        width: 4,
        alignSelf: "stretch",
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        margin: 12,
    },
    icon: { fontSize: 20 },
    content: { flex: 1, paddingVertical: 12, paddingRight: 4 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 3,
    },
    riskBadge: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.8,
    },
    time: {
        fontSize: 10,
        color: "rgba(255,255,255,0.35)",
        marginRight: 8,
    },
    input: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 2,
    },
    reasoning: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 11,
    },
    scoreBubble: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    scoreText: {
        fontSize: 13,
        fontWeight: "800",
    },
});
