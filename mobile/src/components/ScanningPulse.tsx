/**
 * ScanningPulse — Animated radar/scanning visual feedback
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";


interface ScanningPulseProps {
    active: boolean;
    label?: string;
}

export function ScanningPulse({ active, label = "Scanning..." }: ScanningPulseProps) {
    if (!active) return null;

    return (
        <View style={styles.container}>
            {[0, 1, 2].map((i) => (
                <View
                    key={i}
                    style={styles.ring}
                />
            ))}
            <View style={styles.center}>
                <Text style={styles.icon}>🛡️</Text>
            </View>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
    },
    ring: {
        position: "absolute",
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: "#0066FF",
    },
    center: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(0,102,255,0.2)",
        borderWidth: 2,
        borderColor: "#0066FF",
        alignItems: "center",
        justifyContent: "center",
    },
    icon: { fontSize: 24 },
    label: {
        marginTop: 56,
        color: "#0066FF",
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 1,
    },
});
