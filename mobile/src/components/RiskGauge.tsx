/**
 * RiskGauge — Animated circular gauge showing 0–100 risk score
 * Uses react-native-svg + Moti for smooth animation
 */
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";


interface RiskGaugeProps {
    score: number; // 0–100
    size?: number;
    label?: string;
}

function getGaugeColor(score: number): { start: string; end: string } {
    if (score >= 70) return { start: "#FF3B30", end: "#FF6B35" };
    if (score >= 40) return { start: "#FFCC00", end: "#FF9500" };
    if (score >= 15) return { start: "#FFD60A", end: "#FF9F0A" };
    return { start: "#30D158", end: "#34C759" };
}

function getRiskLabel(score: number): string {
    if (score >= 70) return "CRITICAL";
    if (score >= 40) return "HIGH RISK";
    if (score >= 15) return "CAUTION";
    return "SAFE";
}

export function RiskGauge({ score, size = 160, label }: RiskGaugeProps) {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(1, score / 100);
    const strokeDashoffset = circumference * (1 - progress);
    const colors = getGaugeColor(score);
    const riskLabel = getRiskLabel(score);

    return (
        <View
            style={[styles.container, { width: size, height: size }]}
        >
            <Svg width={size} height={size} style={styles.svg}>
                <Defs>
                    <LinearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={colors.start} />
                        <Stop offset="100%" stopColor={colors.end} />
                    </LinearGradient>
                </Defs>
                {/* Track */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={10}
                    fill="none"
                />
                {/* Progress arc */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#gaugeGrad)"
                    strokeWidth={10}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>
            <View style={styles.centerContent}>
                <Text style={[styles.scoreText, { color: colors.start }]}>{score}</Text>
                <Text style={styles.riskLabel}>{riskLabel}</Text>
                {label && <Text style={styles.sublabel}>{label}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    svg: {
        position: "absolute",
    },
    centerContent: {
        alignItems: "center",
        justifyContent: "center",
    },
    scoreText: {
        fontSize: 36,
        fontWeight: "800",
        letterSpacing: -1,
    },
    riskLabel: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.5,
        color: "rgba(255,255,255,0.6)",
        marginTop: 2,
    },
    sublabel: {
        fontSize: 9,
        color: "rgba(255,255,255,0.4)",
        marginTop: 1,
    },
});
