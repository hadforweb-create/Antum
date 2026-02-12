import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useThemeStore } from "@/lib/store";
import { useAuth } from "@/lib/auth/useAuth";
import { toast } from "@/lib/ui/toast";

export default function LoginScreen() {
  const router = useRouter();
  const { isDark } = useThemeStore();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Colors - Baysis Design System
  const bgColor = isDark ? "#121210" : "#F5F3EE";
  const textColor = isDark ? "#FFF" : "#000";
  const mutedColor = "#8E8E8A";
  const cardBg = isDark ? "rgba(28,28,26,0.85)" : "rgba(255,255,255,0.85)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const accentColor = isDark ? "#F5F3EE" : "#111111";
  const primaryButtonBg = isDark ? "#FFFFFF" : "#000000";
  const primaryButtonText = isDark ? "#000000" : "#FFFFFF";

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubmitting(true);

    try {
      await login(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Welcome back!");
      router.replace("/(tabs)");
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(error.message || "Failed to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(auth)/forgot-password");
  };

  const isButtonDisabled = submitting || isLoading;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.content}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: mutedColor }]}>
              Sign in to continue to Baysis
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={styles.cardBlur}>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                {/* Email */}
                <View style={styles.inputRow}>
                  <View style={[styles.inputIcon, { backgroundColor: inputBg }]}>
                    <Mail size={18} color={accentColor} strokeWidth={2.5} />
                  </View>
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor={mutedColor}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!isButtonDisabled}
                    style={[styles.input, { color: textColor }]}
                  />
                </View>

                <View style={[styles.divider, { backgroundColor: borderColor }]} />

                {/* Password */}
                <View style={styles.inputRow}>
                  <View style={[styles.inputIcon, { backgroundColor: inputBg }]}>
                    <Lock size={18} color={accentColor} strokeWidth={2.5} />
                  </View>
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={mutedColor}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    editable={!isButtonDisabled}
                    style={[styles.input, { color: textColor, flex: 1 }]}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={mutedColor} strokeWidth={2} />
                    ) : (
                      <Eye size={20} color={mutedColor} strokeWidth={2} />
                    )}
                  </Pressable>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Forgot Password */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <Pressable style={styles.forgotButton} onPress={handleForgotPassword}>
              <Text style={[styles.forgotText, { color: accentColor }]}>
                Forgot password?
              </Text>
            </Pressable>
          </Animated.View>

          {/* Login Button */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <Pressable
              onPress={handleLogin}
              disabled={isButtonDisabled}
              style={[
                styles.loginButton,
                { backgroundColor: primaryButtonBg, opacity: isButtonDisabled ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.loginButtonText, { color: primaryButtonText }]}>
                {submitting ? "Signing in..." : "Sign In"}
              </Text>
            </Pressable>
          </Animated.View>

          {/* Sign Up Link */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.signupRow}>
            <Text style={[styles.signupText, { color: mutedColor }]}>
              Don't have an account?{" "}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text style={[styles.signupLink, { color: accentColor }]}>
                  Sign up
                </Text>
              </Pressable>
            </Link>
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
  },
  cardBlur: {
    borderRadius: 20,
    overflow: "hidden",
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 17,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  eyeButton: {
    padding: 8,
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 16,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 15,
    fontWeight: "600",
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  signupText: {
    fontSize: 15,
  },
  signupLink: {
    fontSize: 15,
    fontWeight: "600",
  },
});
