import { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    Switch,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
    ArrowLeft,
    User,
    Moon,
    Bell,
    Shield,
    LogOut,
    ChevronRight,
    Trash2,
} from "lucide-react-native";
import { useThemeStore, useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { clearToken } from "@/lib/auth/token";
import { toast } from "@/lib/ui/toast";
import * as Haptics from "expo-haptics";

// Design system constants
const BG = "#0b0b0f";
const SURFACE = "#131316";
const ELEVATED = "#1a1a1e";
const ACCENT = "#a3ff3f";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const TEXT_SUBTLE = "rgba(255,255,255,0.3)";
const BORDER = "rgba(255,255,255,0.06)";
const INPUT_BG = "rgba(255,255,255,0.06)";

export default function SettingsScreen() {
    const { isDark, toggleTheme } = useThemeStore();
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleLogout = () => {
        Alert.alert("Log Out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Log Out",
                style: "destructive",
                onPress: async () => {
                    try {
                        await supabase.auth.signOut();
                        await clearToken();
                        logout();
                        router.replace("/(auth)/SignInScreen" as any);
                    } catch {
                        toast.error("Failed to log out");
                    }
                },
            },
        ]);
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "This action cannot be undone. All your data will be permanently deleted.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        toast.info("Account deletion is not yet available. Contact support.");
                    },
                },
            ]
        );
    };

    const renderSection = (
        title: string,
        items: Array<{
            icon: React.ReactNode;
            label: string;
            value?: string;
            toggle?: boolean;
            toggleValue?: boolean;
            onToggle?: (v: boolean) => void;
            onPress?: () => void;
            danger?: boolean;
        }>,
        delay: number
    ) => (
        <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.card}>
                {items.map((item, i) => (
                    <Pressable
                        key={i}
                        style={[
                            styles.row,
                            i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: BORDER },
                        ]}
                        onPress={() => {
                            if (item.onPress) {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                item.onPress();
                            }
                        }}
                        disabled={!!item.toggle}
                    >
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconBox, { backgroundColor: item.danger ? "rgba(239,68,68,0.1)" : INPUT_BG }]}>
                                {item.icon}
                            </View>
                            <Text style={[styles.rowLabel, item.danger && { color: "#EF4444" }]}>
                                {item.label}
                            </Text>
                        </View>
                        {item.toggle ? (
                            <Switch
                                value={item.toggleValue}
                                onValueChange={item.onToggle}
                                trackColor={{ false: "#767577", true: ACCENT }}
                                thumbColor={TEXT}
                            />
                        ) : item.value ? (
                            <Text style={styles.rowValue}>{item.value}</Text>
                        ) : (
                            <ChevronRight size={18} color={TEXT_SUBTLE} />
                        )}
                    </Pressable>
                ))}
            </View>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.back();
                    }}
                    style={styles.backButton}
                >
                    <ArrowLeft size={22} color={TEXT} strokeWidth={2} />
                </Pressable>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {renderSection("Account", [
                    {
                        icon: <User size={18} color={ACCENT} strokeWidth={2} />,
                        label: "Display Name",
                        value: user?.name || user?.displayName || "Not set",
                        onPress: () => router.push("/profile/edit" as any),
                    },
                ], 100)}

                {renderSection("Preferences", [
                    {
                        icon: <Moon size={18} color={ACCENT} strokeWidth={2} />,
                        label: "Dark Mode",
                        toggle: true,
                        toggleValue: isDark,
                        onToggle: toggleTheme,
                    },
                    {
                        icon: <Bell size={18} color={ACCENT} strokeWidth={2} />,
                        label: "Push Notifications",
                        toggle: true,
                        toggleValue: notificationsEnabled,
                        onToggle: setNotificationsEnabled,
                    },
                ], 200)}

                {renderSection("Privacy & Security", [
                    {
                        icon: <Shield size={18} color={ACCENT} strokeWidth={2} />,
                        label: "Blocked Users",
                        onPress: () => toast.info("Blocked users management coming soon"),
                    },
                ], 300)}

                {renderSection("Danger Zone", [
                    {
                        icon: <LogOut size={18} color="#EF4444" strokeWidth={2} />,
                        label: "Log Out",
                        onPress: handleLogout,
                        danger: true,
                    },
                    {
                        icon: <Trash2 size={18} color="#EF4444" strokeWidth={2} />,
                        label: "Delete Account",
                        onPress: handleDeleteAccount,
                        danger: true,
                    },
                ], 400)}

                <Text style={styles.version}>BAYSIS v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: ELEVATED,
        borderWidth: 1,
        borderColor: BORDER,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "900",
        color: TEXT,
        letterSpacing: -0.3,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 10,
        marginLeft: 4,
        color: TEXT_SUBTLE,
    },
    card: {
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: "500",
        color: TEXT,
    },
    rowValue: {
        fontSize: 15,
        color: TEXT_MUTED,
    },
    version: {
        textAlign: "center",
        fontSize: 13,
        marginTop: 32,
        color: TEXT_SUBTLE,
    },
});
