import React from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { useThreatStore } from "../store/useThreatStore";
import { GlassCard } from "./GlassCard";

const { width } = Dimensions.get("window");

interface ConsentModalProps {
    visible: boolean;
}

export function ConsentModal({ visible }: ConsentModalProps) {
    const { updateConsent, updateSettings, setFirstLaunchComplete } = useThreatStore();
    const [step, setStep] = React.useState(1);

    const handleSmsConsent = (allowed: boolean) => {
        updateConsent({ sms_read: allowed });
        updateSettings({ sms_scanning: allowed });
        setStep(2);
    };

    const handleCallConsent = (allowed: boolean) => {
        updateConsent({ call_log: allowed });
        updateSettings({ call_scanning: allowed });
        setFirstLaunchComplete();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.content}>
                    <GlassCard style={styles.card} padding={24}>
                        <Text style={styles.stepText}>Step {step} of 2</Text>
                        
                        {step === 1 ? (
                            <>
                                <Text style={styles.icon}>💬</Text>
                                <Text style={styles.title}>SMS Protection</Text>
                                <Text style={styles.description}>
                                    Enable AI scanning for incoming SMS messages to automatically
                                    flag phishing links and OTP fraud.
                                </Text>
                                <TouchableOpacity 
                                    style={styles.primaryBtn} 
                                    onPress={() => handleSmsConsent(true)}
                                >
                                    <Text style={styles.primaryBtnText}>Enable SMS Shield</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.secondaryBtn} 
                                    onPress={() => handleSmsConsent(false)}
                                >
                                    <Text style={styles.secondaryBtnText}>No, skip this</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.icon}>📞</Text>
                                <Text style={styles.title}>Call Security</Text>
                                <Text style={styles.description}>
                                    Protect against scam calls. We'll analyze number signals
                                    and frequency to warn you about potential Vishing.
                                </Text>
                                <TouchableOpacity 
                                    style={[styles.primaryBtn, { backgroundColor: '#FF3B30' }]} 
                                    onPress={() => handleCallConsent(true)}
                                >
                                    <Text style={styles.primaryBtnText}>Enable Call Shield</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.secondaryBtn} 
                                    onPress={() => handleCallConsent(false)}
                                >
                                    <Text style={styles.secondaryBtnText}>No, skip this</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        
                        <Text style={styles.footer}>
                            Heuristics run 100% on-device for your privacy.
                        </Text>
                    </GlassCard>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.75)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    content: {
        width: "100%",
        maxWidth: 400,
    },
    card: {
        alignItems: "center",
    },
    stepText: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 16,
    },
    icon: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 12,
    },
    description: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 32,
    },
    primaryBtn: {
        backgroundColor: "#0066FF",
        paddingVertical: 16,
        borderRadius: 16,
        width: "100%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    primaryBtnText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    secondaryBtn: {
        paddingVertical: 14,
        marginTop: 8,
    },
    secondaryBtnText: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 13,
        fontWeight: "600",
    },
    footer: {
        color: "rgba(255,255,255,0.3)",
        fontSize: 11,
        marginTop: 24,
        textAlign: "center",
    }
});

