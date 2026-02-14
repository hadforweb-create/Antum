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
import { colors, shadows } from "@/lib/theme";
import { toast } from "@/lib/ui/toast";

export default function SettingsScreen() {
    const { isDark, toggleTheme } = useThemeStore();
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const bg = isDark ? "#121210" : "#F5F3EE";
    const cardBg = isDark ? "#1C1C1A" : "#FFFFFF";
    const textColor = isDark ? "#F5F3EE" : "#111111";
    const subtitleColor = isDark ? "#8E8E8A" : "#6B6B67";
    const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const accentColor = colors.primary;

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
                        router.replace("/(auth)/onboarding" as any);
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
            <Text style={[styles.sectionTitle, { color: subtitleColor }]}>{title}</Text>
            <View style={[styles.card, { backgroundColor: cardBg }, shadows.md]}>
                {items.map((item, i) => (
                    <Pressable
                        key={i}
                        style={[
                            styles.row,
                            i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
                        ]}
                        onPress={item.onPress}
                        disabled={!!item.toggle}
                    >
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconBox, { backgroundColor: item.danger ? "rgba(214,64,64,0.1)" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") }]}>
                                {item.icon}
                            </View>
                            <Text style={[styles.rowLabel, { color: item.danger ? "#D64040" : textColor }]}>
                                {item.label}
                            </Text>
                        </View>
                        {item.toggle ? (
                            <Switch
                                value={item.toggleValue}
                                onValueChange={item.onToggle}
                                trackColor={{ false: "#767577", true: accentColor }}
                                thumbColor="#FFF"
                            />
                        ) : item.value ? (
                            <Text style={[styles.rowValue, { color: subtitleColor }]}>{item.value}</Text>
                        ) : (
                            <ChevronRight size={18} color={subtitleColor} />
                        )}
                    </Pressable>
                ))}
            </View>
        </Animated.View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={22} color={textColor} strokeWidth={2} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: textColor }]}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {renderSection("Account", [
                    {
                        icon: <User size={18} color={accentColor} strokeWidth={2} />,
                        label: "Display Name",
                        value: user?.name || user?.displayName || "Not set",
                        onPress: () => router.push("/profile/edit" as any),
                    },
                ], 100)}

                {renderSection("Preferences", [
                    {
                        icon: <Moon size={18} color={accentColor} strokeWidth={2} />,
                        label: "Dark Mode",
                        toggle: true,
                        toggleValue: isDark,
                        onToggle: toggleTheme,
                    },
                    {
                        icon: <Bell size={18} color={accentColor} strokeWidth={2} />,
                        label: "Push Notifications",
                        toggle: true,
                        toggleValue: notificationsEnabled,
                        onToggle: setNotificationsEnabled,
                    },
                ], 200)}

                {renderSection("Privacy & Security", [
                    {
                        icon: <Shield size={18} color={accentColor} strokeWidth={2} />,
                        label: "Blocked Users",
                        onPress: () => toast.info("Blocked users management coming soon"),
                    },
                ], 300)}

                {renderSection("Danger Zone", [
                    {
                        icon: <LogOut size={18} color="#D64040" strokeWidth={2} />,
                        label: "Log Out",
                        onPress: handleLogout,
                        danger: true,
                    },
                    {
                        icon: <Trash2 size={18} color="#D64040" strokeWidth={2} />,
                        label: "Delete Account",
                        onPress: handleDeleteAccount,
                        danger: true,
                    },
                ], 400)}

                <Text style={[styles.version, { color: subtitleColor }]}>BAYSIS v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        letterSpacing: -0.2,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 10,
        marginLeft: 4,
    },
    card: {
        borderRadius: 22,
        overflow: "hidden",
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
    },
    rowValue: {
        fontSize: 15,
    },
    version: {
        textAlign: "center",
        fontSize: 13,
        marginTop: 32,
    },
});
