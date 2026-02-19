import { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import * as SplashScreen from "expo-splash-screen";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/store";
import { getToken, clearToken } from "@/lib/auth/token";
import { getMe } from "@/lib/api/authClient";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Figma design tokens
const ACCENT = "#a3ff3f";
const INACTIVE = "rgba(255,255,255,0.35)";
const TAB_BG = "rgba(11,11,15,0.96)";

export default function TabsLayout() {
    const { setUser, setLoading } = useAuthStore();
    const router = useRouter();
    const initDone = useRef(false);

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
                SplashScreen.hideAsync().catch(() => {});
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
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    backgroundColor: TAB_BG,
                                    borderTopWidth: 1,
                                    borderTopColor: "rgba(255,255,255,0.06)",
                                },
                            ]}
                        />
                    </BlurView>
                ),
                tabBarActiveTintColor: ACCENT,
                tabBarInactiveTintColor: INACTIVE,
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
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            {/* Reels feed */}
            <Tabs.Screen
                name="services"
                options={{
                    title: "Reels",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="play-circle" size={size} color={color} />
                    ),
                }}
            />
            {/* Stats — redirects to analytics */}
            <Tabs.Screen
                name="saved"
                options={{
                    title: "Stats",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="bar-chart" size={size} color={color} />
                    ),
                }}
            />
            {/* Profile */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
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
                    title: "Create",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add-circle" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
