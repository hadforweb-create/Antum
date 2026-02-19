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
import * as Haptics from "expo-haptics";
import { Mail, Lock, User, Eye, EyeOff, ChevronLeft, Briefcase } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useFigmaColors } from "@/lib/figma-colors";
import { useAuth } from "@/lib/auth/useAuth";
import { isValidEmail, isValidPassword } from "@/lib/utils";
import { toast } from "@/lib/ui/toast";
import { useTranslation } from "@/lib/i18n";

type UserRole = "FREELANCER" | "EMPLOYER";

export default function SignupScreen() {
  const router = useRouter();
  const c = useFigmaColors();
  const { t } = useTranslation();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("FREELANCER");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!displayName || !email || !password) {
      toast.error(t("auth.fillAllFields"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!isValidEmail(email)) {
      toast.error(t("auth.invalidEmail"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!isValidPassword(password)) {
      toast.error(t("auth.passwordLength"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);

    try {
      await register(email, password, displayName, role);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success(t("auth.accountCreated"));
      router.replace("/(tabs)");
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(error.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <LinearGradient
        colors={["rgba(163,255,63,0.06)", "transparent"]}
        style={styles.topGlow}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Back Button */}
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={c.text} strokeWidth={2} />
          </Pressable>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
              <Text style={[styles.title, { color: c.text }]}>{t("auth.createAccount")}</Text>
              <Text style={[styles.subtitle, { color: c.textMuted }]}>
                {t("auth.joinBaysis")}
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
                    backgroundColor: role === "FREELANCER" ? c.accent : c.inputBg,
                    borderColor: role === "FREELANCER" ? c.accent : c.inputBorder,
                  },
                ]}
              >
                <User size={20} color={role === "FREELANCER" ? "#0b0b0f" : c.textMuted} strokeWidth={2} />
                <Text style={[styles.roleText, { color: role === "FREELANCER" ? "#0b0b0f" : c.text }]}>
                  {t("auth.freelancer")}
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
                    backgroundColor: role === "EMPLOYER" ? c.accent : c.inputBg,
                    borderColor: role === "EMPLOYER" ? c.accent : c.inputBorder,
                  },
                ]}
              >
                <Briefcase size={20} color={role === "EMPLOYER" ? "#0b0b0f" : c.textMuted} strokeWidth={2} />
                <Text style={[styles.roleText, { color: role === "EMPLOYER" ? "#0b0b0f" : c.text }]}>
                  {t("auth.employer")}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(200)}>
              {/* Display Name */}
              <View style={[styles.inputContainer, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                {role === "FREELANCER" ? (
                  <User size={20} color={c.textMuted} strokeWidth={2} />
                ) : (
                  <Briefcase size={20} color={c.textMuted} strokeWidth={2} />
                )}
                <TextInput
                  placeholder={role === "FREELANCER" ? t("auth.fullName") : t("auth.companyName")}
                  placeholderTextColor={c.textMuted}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoComplete="name"
                  style={[styles.input, { color: c.text }]}
                />
              </View>

              {/* Email */}
              <View style={[styles.inputContainer, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                <Mail size={20} color={c.textMuted} strokeWidth={2} />
                <TextInput
                  placeholder={t("auth.emailPlaceholder")}
                  placeholderTextColor={c.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={[styles.input, { color: c.text }]}
                />
              </View>

              {/* Password */}
              <View style={[styles.inputContainer, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                <Lock size={20} color={c.textMuted} strokeWidth={2} />
                <TextInput
                  placeholder={t("auth.passwordRequirements")}
                  placeholderTextColor={c.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  style={[styles.input, { color: c.text, flex: 1 }]}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  {showPassword ? (
                    <EyeOff size={20} color={c.textMuted} strokeWidth={2} />
                  ) : (
                    <Eye size={20} color={c.textMuted} strokeWidth={2} />
                  )}
                </Pressable>
              </View>
            </Animated.View>

            {/* Terms */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.termsRow}>
              <Text style={[styles.termsText, { color: c.textMuted }]}>
                {t("auth.termsAgree")}{" "}
                <Text style={{ color: c.accentDark }}>{t("auth.terms")}</Text> {t("auth.and")}{" "}
                <Text style={{ color: c.accentDark }}>{t("auth.privacy")}</Text>
              </Text>
            </Animated.View>

            {/* Signup Button */}
            <Animated.View entering={FadeInDown.delay(350)}>
              <Pressable
                onPress={handleSignup}
                disabled={loading}
                style={[
                  styles.signupButton,
                  { backgroundColor: c.accent, opacity: loading ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.signupButtonText, { color: "#0b0b0f" }]}>
                  {loading ? t("auth.creatingAccount") : t("auth.createAccountAction")}
                </Text>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400)} style={styles.loginRow}>
              <Text style={[styles.loginText, { color: c.textMuted }]}>
                {t("auth.alreadyHaveAccount")}{" "}
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={[styles.loginLink, { color: c.accentDark }]}>{t("auth.signInAction")}</Text>
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
  container: { flex: 1 },
  topGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 250 },
  backButton: { width: 48, height: 48, marginLeft: 14, alignItems: "center", justifyContent: "center" },
  content: { padding: 28, paddingTop: 8 },
  header: { marginBottom: 32 },
  title: { fontSize: 36, fontWeight: "900", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, fontWeight: "600" },
  roleContainer: { flexDirection: "row", gap: 12, marginBottom: 24 },
  roleButton: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1,
  },
  roleText: { fontSize: 15, fontWeight: "700" },
  inputContainer: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 16,
    borderRadius: 16, borderWidth: 1, gap: 14, marginBottom: 12,
  },
  input: { flex: 1, fontSize: 17, lineHeight: 22 },
  eyeButton: { padding: 6 },
  termsRow: { marginTop: 16, marginBottom: 24 },
  termsText: { fontSize: 13, lineHeight: 20, textAlign: "center" },
  signupButton: {
    paddingVertical: 18, borderRadius: 16, alignItems: "center", marginBottom: 24,
    shadowColor: "#a3ff3f", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  signupButtonText: { fontSize: 18, fontWeight: "900" },
  loginRow: { flexDirection: "row", justifyContent: "center" },
  loginText: { fontSize: 16, fontWeight: "500" },
  loginLink: { fontSize: 16, fontWeight: "700" },
});
