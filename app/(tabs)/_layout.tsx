import { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import * as SplashScreen from "expo-splash-screen";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/store";
import { getToken, clearToken } from "@/lib/auth/token";
import { getMe } from "@/lib/api/authClient";
import { useFigmaColors } from "@/lib/figma-colors";
import { useTranslation } from "@/lib/i18n";

SplashScreen.preventAutoHideAsync().catch(() => { });

// Fallback tokens (used before hook available in static config)
const ACCENT = "#a3ff3f";
const INACTIVE = "rgba(255,255,255,0.35)";

export default function TabsLayout() {
    const { setUser, setLoading } = useAuthStore();
    const router = useRouter();
    const initDone = useRef(false);
    const c = useFigmaColors();
    const { t } = useTranslation();

    useEffect(() => {
        if (initDone.current) return;
        initDone.current = true;

        (async () => {
            try {
                const token = await getToken();
                if (token) {
                    try {
                        const user = await getMe();
                        setUser({
                            id: user.id,
                            email: user.email,
                            role: user.role,
                            name: user.name,
                            avatarUrl: user.avatarUrl,
                            bio: user.bio,
                            location: user.location,
                        });
                    } catch {
                        await clearToken();
                        setUser(null);
                        router.replace("/(auth)/login");
                    }
                } else {
                    setUser(null);
                    router.replace("/(auth)/login");
                }
            } catch {
                setUser(null);
                router.replace("/(auth)/login");
            } finally {
                setLoading(false);
                SplashScreen.hideAsync().catch(() => { });
            }
        })();
    }, []);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: "absolute",
                    backgroundColor: "transparent",
                    borderTopWidth: 0,
                    elevation: 0,
                    height: 88,
                    paddingBottom: 28,
                },
                tabBarBackground: () => (
                    <BlurView intensity={80} tint={c.isDark ? "dark" : "light"} style={StyleSheet.absoluteFill}>
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    backgroundColor: c.tabBarBg,
                                    borderTopWidth: 1,
                                    borderTopColor: c.border,
                                },
                            ]}
                        />
                    </BlurView>
                ),
                tabBarActiveTintColor: c.tabActive,
                tabBarInactiveTintColor: c.tabInactive,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "700",
                    marginTop: 2,
                },
            }}
        >
            {/* Home — Discover/marketplace feed */}
            <Tabs.Screen
                name="index"
                options={{
                    title: t("tabs.home"),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            {/* Reels feed */}
            <Tabs.Screen
                name="services"
                options={{
                    title: t("tabs.reels"),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="play-circle" size={size} color={color} />
                    ),
                }}
            />
            {/* Stats — redirects to analytics */}
            <Tabs.Screen
                name="saved"
                options={{
                    title: t("tabs.stats"),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="bar-chart" size={size} color={color} />
                    ),
                }}
            />
            {/* Profile */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: t("tabs.profile"),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
            {/* Create — hidden from tab bar, accessible via FAB */}
            <Tabs.Screen
                name="create"
                options={{
                    href: null,
                    title: t("tabs.create"),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add-circle" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
