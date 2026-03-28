import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
    return (
        <View style={[styles.tabItem, focused && styles.tabItemActive]}>
            <Text style={styles.tabIcon}>{icon}</Text>
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
        </View>
    );
}

export default function RootLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: "#0E0E16",
                    borderTopColor: "rgba(255,255,255,0.07)",
                    borderTopWidth: 1,
                    height: 70,
                    paddingTop: 8,
                    paddingBottom: 8,
                },
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="🛡️" label="Shield" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="📋" label="History" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="scanner"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="🔍" label="Scan" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="⚙️" label="Settings" focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabItem: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 2,
    },
    tabItemActive: {
        backgroundColor: "rgba(0,102,255,0.15)",
    },
    tabIcon: { fontSize: 24 },
    tabLabel: {
        fontSize: 10,
        color: "rgba(255,255,255,0.3)",
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    tabLabelActive: {
        color: "#0066FF",
    },
});
