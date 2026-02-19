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
    Sun,
    Moon,
    Monitor,
    Bell,
    Shield,
    LogOut,
    ChevronRight,
    Trash2,
    Check,
    Languages,
} from "lucide-react-native";
import { useThemeStore, useAuthStore, useLanguageStore } from "@/lib/store";
import { useFigmaColors } from "@/lib/figma-colors";
import { supabase } from "@/lib/supabase";
import { clearToken } from "@/lib/auth/token";
import { toast } from "@/lib/ui/toast";
import * as Haptics from "expo-haptics";
import { useTranslation } from "@/lib/i18n";

type ThemeMode = "system" | "light" | "dark";

// Theme labels are resolved dynamically via t() inside the component

export default function SettingsScreen() {
    const { mode, setMode } = useThemeStore();
    const { user, logout } = useAuthStore();
    const { languageMode, setLanguage } = useLanguageStore();
    const c = useFigmaColors();
    const { t } = useTranslation();
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
        { mode: "system", label: t("settings.system"), icon: Monitor },
        { mode: "light", label: t("settings.light"), icon: Sun },
        { mode: "dark", label: t("settings.dark"), icon: Moon },
    ];

    const handleLogout = () => {
        Alert.alert(t("settings.logOut"), t("settings.logOutConfirm"), [
            { text: t("common.cancel"), style: "cancel" },
            {
                text: t("settings.logOut"),
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
            t("settings.deleteAccount"),
            t("settings.deleteConfirm"),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: () => {
                        toast.info(t("settings.deleteNotAvailable"));
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
            <Text style={[styles.sectionTitle, { color: c.textSubtle }]}>{title}</Text>
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                {items.map((item, i) => (
                    <Pressable
                        key={i}
                        style={[
                            styles.row,
                            i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
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
                            <View style={[styles.iconBox, { backgroundColor: item.danger ? "rgba(239,68,68,0.1)" : c.inputBg }]}>
                                {item.icon}
                            </View>
                            <Text style={[styles.rowLabel, { color: c.text }, item.danger && { color: c.destructive }]}>
                                {item.label}
                            </Text>
                        </View>
                        {item.toggle ? (
                            <Switch
                                value={item.toggleValue}
                                onValueChange={item.onToggle}
                                trackColor={{ false: "#767577", true: c.accent }}
                                thumbColor={c.text}
                            />
                        ) : item.value ? (
                            <Text style={[styles.rowValue, { color: c.textMuted }]}>{item.value}</Text>
                        ) : (
                            <ChevronRight size={18} color={c.textSubtle} />
                        )}
                    </Pressable>
                ))}
            </View>
        </Animated.View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: c.border }]}>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.back();
                    }}
                    style={[styles.backButton, { backgroundColor: c.elevated, borderColor: c.border }]}
                >
                    <ArrowLeft size={22} color={c.text} strokeWidth={2} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: c.text }]}>{t("settings.title")}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {renderSection(t("settings.account"), [
                    {
                        icon: <User size={18} color={c.accent} strokeWidth={2} />,
                        label: t("settings.displayName"),
                        value: user?.name || user?.displayName || t("settings.notSet"),
                        onPress: () => router.push("/profile/edit" as any),
                    },
                ], 100)}

                {/* Appearance — 3-way picker */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ marginBottom: 24 }}>
                    <Text style={[styles.sectionTitle, { color: c.textSubtle }]}>{t("settings.appearance")}</Text>
                    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                        {THEME_OPTIONS.map((opt, i) => {
                            const Icon = opt.icon;
                            const isActive = mode === opt.mode;
                            return (
                                <Pressable
                                    key={opt.mode}
                                    style={[
                                        styles.row,
                                        i < THEME_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setMode(opt.mode);
                                    }}
                                >
                                    <View style={styles.rowLeft}>
                                        <View style={[styles.iconBox, { backgroundColor: c.inputBg }]}>
                                            <Icon size={18} color={c.accent} strokeWidth={2} />
                                        </View>
                                        <Text style={[styles.rowLabel, { color: c.text }]}>{opt.label}</Text>
                                    </View>
                                    {isActive && <Check size={18} color={c.accent} strokeWidth={2.5} />}
                                </Pressable>
                            );
                        })}
                    </View>
                </Animated.View>

                {/* Language — 3-way picker */}
                <Animated.View entering={FadeInDown.delay(250).duration(400)} style={{ marginBottom: 24 }}>
                    <Text style={[styles.sectionTitle, { color: c.textSubtle }]}>{t("settings.language")}</Text>
                    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                        {(["system", "en", "ar"] as const).map((lang, i, arr) => {
                            const labels: Record<string, string> = { system: t("settings.system"), en: t("settings.english"), ar: t("settings.arabic") };
                            const isActive = languageMode === lang;
                            return (
                                <Pressable
                                    key={lang}
                                    style={[
                                        styles.row,
                                        i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setLanguage(lang);
                                    }}
                                >
                                    <View style={styles.rowLeft}>
                                        <View style={[styles.iconBox, { backgroundColor: c.inputBg }]}>
                                            <Languages size={18} color={c.accent} strokeWidth={2} />
                                        </View>
                                        <Text style={[styles.rowLabel, { color: c.text }]}>{labels[lang]}</Text>
                                    </View>
                                    {isActive && <Check size={18} color={c.accent} strokeWidth={2.5} />}
                                </Pressable>
                            );
                        })}
                    </View>
                </Animated.View>

                {renderSection(t("settings.notifications"), [
                    {
                        icon: <Bell size={18} color={c.accent} strokeWidth={2} />,
                        label: t("settings.pushNotifications"),
                        toggle: true,
                        toggleValue: notificationsEnabled,
                        onToggle: setNotificationsEnabled,
                    },
                ], 300)}

                {renderSection(t("settings.privacy"), [
                    {
                        icon: <Shield size={18} color={c.accent} strokeWidth={2} />,
                        label: t("settings.blockedUsers"),
                        onPress: () => toast.info(t("settings.blockedComingSoon")),
                    },
                ], 400)}

                {renderSection(t("settings.dangerZone"), [
                    {
                        icon: <LogOut size={18} color={c.destructive} strokeWidth={2} />,
                        label: t("settings.logOut"),
                        onPress: handleLogout,
                        danger: true,
                    },
                    {
                        icon: <Trash2 size={18} color={c.destructive} strokeWidth={2} />,
                        label: t("settings.deleteAccount"),
                        onPress: handleDeleteAccount,
                        danger: true,
                    },
                ], 500)}

                <Text style={[styles.version, { color: c.textSubtle }]}>{t("settings.version")}</Text>
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
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "900",
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
    },
    card: {
        borderRadius: 22,
        overflow: "hidden",
        borderWidth: 1,
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

