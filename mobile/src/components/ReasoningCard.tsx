/**
 * ReasoningCard — Displays AI explainability information
 * Shows why a threat was flagged with feature badges.
 */
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

import { GlassCard } from "./GlassCard";
import { ThreatFeatures } from "../store/useThreatStore";

interface ReasoningCardProps {
    reasoning: string;
    features?: ThreatFeatures;
    label: string;
}

interface FeatureBadge {
    active: boolean;
    icon: string;
    text: string;
    color: string;
}

export function ReasoningCard({ reasoning, features, label }: ReasoningCardProps) {
    const isPhishing = label === "phishing";

    const badges: FeatureBadge[] = features
        ? [
            {
                active: features.has_urgency,
                icon: "⚡",
                text: "Urgency Tactics",
                color: "#FF9500",
            },
            {
                active: features.has_scarcity,
                icon: "⏱️",
                text: "Scarcity Pressure",
                color: "#FF9500",
            },
            {
                active: features.has_authority_impersonation,
                icon: "🎭",
                text: "Authority Impersonation",
                color: "#FF3B30",
            },
            {
                active: features.has_blacklisted_domain,
                icon: "🚫",
                text: "Blacklisted Domain",
                color: "#FF3B30",
            },
            {
                active: features.has_lookalike_domain,
                icon: "🔗",
                text: "Lookalike URL",
                color: "#FF6B35",
            },
            {
                active: features.has_money_transfer_request,
                icon: "💸",
                text: "Requests Bank Details",
                color: "#FF3B30",
            },
            {
                active: features.has_otp_request,
                icon: "🔑",
                text: "OTP Solicitation",
                color: "#FFCC00",
            },
        ]
        : [];

    const activeBadges = badges.filter((b) => b.active);

    return (
        <View>
            <GlassCard variant={isPhishing ? "danger" : "safe"} style={styles.card}>
                <Text style={styles.title}>
                    {isPhishing ? "⚠️ AI Reasoning" : "✅ Analysis Summary"}
                </Text>
                <Text style={styles.reasoning}>{reasoning}</Text>

                {activeBadges.length > 0 && (
                    <View style={styles.badgeSection}>
                        <Text style={styles.badgeTitle}>Detected Patterns:</Text>
                        <View style={styles.badgeRow}>
                            {activeBadges.map((badge, idx) => (
                                <View
                                    key={idx}
                                    style={[styles.badge, { borderColor: badge.color }]}
                                >
                                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                                    <Text style={[styles.badgeText, { color: badge.color }]}>
                                        {badge.text}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {features?.impersonated_entities && features.impersonated_entities.length > 0 && (
                    <View style={styles.entitySection}>
                        <Text style={styles.entityLabel}>Impersonating:</Text>
                        <Text style={styles.entityValue}>
                            {features.impersonated_entities.join(", ")}
                        </Text>
                    </View>
                )}
            </GlassCard>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { marginVertical: 8 },
    title: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 10,
    },
    reasoning: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 12,
    },
    badgeSection: { marginTop: 4 },
    badgeTitle: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 11,
        fontWeight: "600",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    badgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: "rgba(255,255,255,0.04)",
        gap: 5,
        marginBottom: 4,
    },
    badgeIcon: { fontSize: 12 },
    badgeText: { fontSize: 11, fontWeight: "600" },
    entitySection: {
        marginTop: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    entityLabel: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 11,
        fontWeight: "600",
    },
    entityValue: {
        color: "#FF3B30",
        fontSize: 12,
        fontWeight: "700",
    },
});
