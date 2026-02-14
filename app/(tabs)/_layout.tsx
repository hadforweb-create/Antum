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
            if (__DEV__) console.log("[Tabs] API error, redirecting to onboarding");
            await clearToken();
            setUser(null);
            router.replace("/(auth)/onboarding" as any);
          }
        } else {
          if (__DEV__) console.log("[Tabs] No token, redirecting to onboarding");
          setUser(null);
          router.replace("/(auth)/onboarding" as any);
        }
      } catch (e) {
        if (__DEV__) console.error("[Tabs] Auth error:", e);
        setUser(null);
        router.replace("/(auth)/onboarding" as any);
      } finally {
        setLoading(false);
        SplashScreen.hideAsync().catch(() => { });
      }
    })();
  }, []);

  const activeColor = isDark ? "#F5F3EE" : "#111111";
  const inactiveColor = "#8E8E8A";

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
          paddingBottom: 32,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={90}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark ? "rgba(18, 18, 16, 0.92)" : "rgba(245, 243, 238, 0.92)",
                  borderTopWidth: 0,
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
          marginTop: 4,
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

