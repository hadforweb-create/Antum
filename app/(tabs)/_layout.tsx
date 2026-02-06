import { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import * as SplashScreen from "expo-splash-screen";
import {
  Film,
  Briefcase,
  PlusCircle,
  Bookmark,
  User,
} from "lucide-react-native";
import { useThemeStore, useAuthStore } from "@/lib/store";
import { getToken, clearToken } from "@/lib/auth/token";
import { getMe } from "@/lib/api/authClient";

// Prevent splash from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => { });

export default function TabsLayout() {
  const { isDark } = useThemeStore();
  const { setUser, setLoading, isLoading, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const initDone = useRef(false);

  // Auth init + redirect - runs AFTER layout is mounted
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    (async () => {
      try {
        if (__DEV__) console.log("[Tabs] Auth init starting");
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
            if (__DEV__) console.log("[Tabs] User loaded:", user.email);
          } catch {
            if (__DEV__) console.log("[Tabs] API error, redirecting to login");
            await clearToken();
            setUser(null);
            router.replace("/(auth)/login");
          }
        } else {
          if (__DEV__) console.log("[Tabs] No token, redirecting to login");
          setUser(null);
          router.replace("/(auth)/login");
        }
      } catch (e) {
        if (__DEV__) console.error("[Tabs] Auth error:", e);
        setUser(null);
        router.replace("/(auth)/login");
      } finally {
        setLoading(false);
        SplashScreen.hideAsync().catch(() => { });
      }
    })();
  }, []);

  const activeColor = "#5050F0";
  const inactiveColor = "#8E8E93";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: 85,
          paddingBottom: 30,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark ? "rgba(28, 28, 30, 0.9)" : "rgba(255, 255, 255, 0.9)",
                  borderTopWidth: 0.5,
                  borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                },
              ]}
            />
          </BlurView>
        ),
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Reels",
          tabBarIcon: ({ color, size }) => <Film size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => <Bookmark size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}

