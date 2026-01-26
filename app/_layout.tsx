import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useThemeStore, useAuthStore } from "@/lib/store";
import { firebaseAuth } from "@/lib/firebase";
import "../global.css";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isDark } = useThemeStore();
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Listen to auth state
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in - fetch full profile
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "User",
          username: firebaseUser.email?.split("@")[0] || "user",
          avatarUrl: firebaseUser.photoURL,
          bio: "",
          interests: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
      SplashScreen.hideAsync();
    });

    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: isDark ? "#000" : "#F2F2F7" }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: isDark ? "#000" : "#F2F2F7",
              },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen
              name="activity/[id]"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
          </Stack>
          <StatusBar style={isDark ? "light" : "dark"} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
