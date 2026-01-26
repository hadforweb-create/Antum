import { Stack } from "expo-router";
import { useThemeStore } from "@/lib/store";

export default function AuthLayout() {
  const { isDark } = useThemeStore();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? "#000" : "#F2F2F7",
        },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
