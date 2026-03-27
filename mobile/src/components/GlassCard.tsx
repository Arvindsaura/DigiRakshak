/**
 * GlassCard — Reusable frosted-glass card component
 * Uses blur + semi-transparent overlay effect
 */
import React from "react";
import {
    View,
    StyleSheet,
    ViewStyle,
    StyleProp,
} from "react-native";

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: "default" | "danger" | "warning" | "safe";
    padding?: number;
}

const VARIANT_COLORS = {
    default: "rgba(255,255,255,0.07)",
    danger: "rgba(255,59,48,0.12)",
    warning: "rgba(255,204,0,0.10)",
    safe: "rgba(48,209,88,0.10)",
};

const VARIANT_BORDER = {
    default: "rgba(255,255,255,0.12)",
    danger: "rgba(255,59,48,0.30)",
    warning: "rgba(255,204,0,0.30)",
    safe: "rgba(48,209,88,0.30)",
};

export function GlassCard({
    children,
    style,
    variant = "default",
    padding = 16,
}: GlassCardProps) {
    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: VARIANT_COLORS[variant],
                    borderColor: VARIANT_BORDER[variant],
                    padding,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: "hidden",
    },
});
