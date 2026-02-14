import { useEffect, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useThemeStore, useAuthStore } from "@/lib/store";
import { getToken } from "@/lib/auth/token";
import { getMe } from "@/lib/api/authClient";

// Prevent splash from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => { });

export default function AuthLayout() {
  const { isDark } = useThemeStore();
  const { setUser, setLoading } = useAuthStore();
  const router = useRouter();
  const initDone = useRef(false);

  // Check if already authenticated - redirect to tabs
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    (async () => {
      try {
        if (__DEV__) console.log("[Auth] Checking if already logged in");
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
            if (__DEV__) console.log("[Auth] Already logged in, redirecting to tabs");
            router.replace("/(tabs)");
          } catch {
            // Token invalid, stay on auth screens
            setUser(null);
            if (__DEV__) console.log("[Auth] Token invalid, staying on auth");
          }
        } else {
          setUser(null);
          if (__DEV__) console.log("[Auth] No token, staying on auth");
        }
      } catch (e) {
        if (__DEV__) console.error("[Auth] Check error:", e);
        setUser(null);
      } finally {
        setLoading(false);
        SplashScreen.hideAsync().catch(() => { });
      }
    })();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? "#121210" : "#F5F3EE",
        },
        animation: "fade",
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
