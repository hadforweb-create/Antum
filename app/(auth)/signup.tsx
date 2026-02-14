import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { useRouter, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Mail, Lock, User, Eye, EyeOff, ChevronLeft, Briefcase } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useThemeStore } from "@/lib/store";
import { useAuth } from "@/lib/auth/useAuth";
import { isValidEmail, isValidPassword } from "@/lib/utils";
import { toast } from "@/lib/ui/toast";

type UserRole = "FREELANCER" | "EMPLOYER";

export default function SignupScreen() {
  const router = useRouter();
  const { isDark } = useThemeStore();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("FREELANCER");
  const [loading, setLoading] = useState(false);

  // Colors - Baysis Design System
  const bgColor = isDark ? "#121210" : "#F5F3EE";
  const textColor = isDark ? "#FFF" : "#000";
  const mutedColor = "#8E8E8A";
  const cardBg = isDark ? "rgba(28,28,26,0.85)" : "rgba(255,255,255,0.85)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const accentColor = isDark ? "#F5F3EE" : "#111111";
  const primaryButtonBg = isDark ? "#F5F3EE" : "#111111";
  const primaryButtonText = isDark ? "#111111" : "#F5F3EE";

  const handleSignup = async () => {
    // Validation
    if (!displayName || !email || !password) {
      toast.error("Please fill in all fields");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!isValidPassword(password)) {
      toast.error("Password must be at least 8 characters");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);

    try {
      await register(email, password, displayName, role);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Account created successfully!");
      router.replace("/(tabs)");
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={textColor} strokeWidth={2} />
          </Pressable>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>Create account</Text>
              <Text style={[styles.subtitle, { color: mutedColor }]}>
                Join Baysis and connect with talent
              </Text>
            </Animated.View>

            {/* Role Selection */}
            <Animated.View entering={FadeInDown.delay(150)} style={styles.roleContainer}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRole("FREELANCER");
                }}
                style={[
                  styles.roleButton,
                  {
                    backgroundColor: role === "FREELANCER" ? accentColor : inputBg,
                    borderColor: role === "FREELANCER" ? accentColor : borderColor,
                  },
                ]}
              >
                <User
                  size={20}
                  color={role === "FREELANCER" ? "#FFF" : mutedColor}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.roleText,
                    { color: role === "FREELANCER" ? "#FFF" : textColor },
                  ]}
                >
                  Freelancer
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRole("EMPLOYER");
                }}
                style={[
                  styles.roleButton,
                  {
                    backgroundColor: role === "EMPLOYER" ? accentColor : inputBg,
                    borderColor: role === "EMPLOYER" ? accentColor : borderColor,
                  },
                ]}
              >
                <Briefcase
                  size={20}
                  color={role === "EMPLOYER" ? "#FFF" : mutedColor}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.roleText,
                    { color: role === "EMPLOYER" ? "#FFF" : textColor },
                  ]}
                >
                  Employer
                </Text>
              </Pressable>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(200)}>
              <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={styles.cardBlur}>
                <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                  {/* Display Name / Company Name */}
                  <View style={styles.inputRow}>
                    <View style={[styles.inputIcon, { backgroundColor: inputBg }]}>
                      {role === "FREELANCER" ? (
                        <User size={18} color={accentColor} strokeWidth={2.5} />
                      ) : (
                        <Briefcase size={18} color={accentColor} strokeWidth={2.5} />
                      )}
                    </View>
                    <TextInput
                      placeholder={role === "FREELANCER" ? "Full name" : "Company name"}
                      placeholderTextColor={mutedColor}
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoComplete="name"
                      style={[styles.input, { color: textColor }]}
                    />
                  </View>

                  <View style={[styles.divider, { backgroundColor: borderColor }]} />

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
                      placeholder="Password (8+ characters)"
                      placeholderTextColor={mutedColor}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
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

            {/* Terms */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.termsRow}>
              <Text style={[styles.termsText, { color: mutedColor }]}>
                By signing up, you agree to our{" "}
                <Text style={{ color: accentColor }}>Terms of Service</Text> and{" "}
                <Text style={{ color: accentColor }}>Privacy Policy</Text>
              </Text>
            </Animated.View>

            {/* Signup Button */}
            <Animated.View entering={FadeInDown.delay(400)}>
              <Pressable
                onPress={handleSignup}
                disabled={loading}
                style={[
                  styles.signupButton,
                  { backgroundColor: primaryButtonBg, opacity: loading ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.signupButtonText, { color: primaryButtonText }]}>
                  {loading ? "Creating account..." : "Create Account"}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Login Link */}
            <Animated.View entering={FadeInDown.delay(500)} style={styles.loginRow}>
              <Text style={[styles.loginText, { color: mutedColor }]}>
                Already have an account?{" "}
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={[styles.loginLink, { color: accentColor }]}>
                    Sign in
                  </Text>
                </Pressable>
              </Link>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    width: 48,
    height: 48,
    marginLeft: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 28,
    paddingTop: 8,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 38,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  roleText: {
    fontSize: 15,
    fontWeight: "600",
  },
  cardBlur: {
    borderRadius: 24,
    overflow: "hidden",
  },
  card: {
    borderRadius: 26,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  inputIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    opacity: 0.5,
  },
  eyeButton: {
    padding: 10,
  },
  termsRow: {
    marginTop: 24,
    marginBottom: 28,
  },
  termsText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  signupButton: {
    paddingVertical: 20,
    borderRadius: 22,
    alignItems: "center",
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
  },
  signupButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    fontSize: 15,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: "700",
  },
});
