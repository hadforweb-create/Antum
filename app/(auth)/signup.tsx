import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Mail, Lock, User, AtSign, Eye, EyeOff, ChevronLeft } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useThemeStore } from "@/lib/store";
import { firebaseAuth, usersDb } from "@/lib/firebase";
import { getFirebaseErrorMessage, isValidEmail, isValidPassword, isValidUsername } from "@/lib/utils";

export default function SignupScreen() {
  const router = useRouter();
  const { isDark } = useThemeStore();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Colors
  const bgColor = isDark ? "#000" : "#F2F2F7";
  const textColor = isDark ? "#FFF" : "#000";
  const mutedColor = isDark ? "#8E8E93" : "#3C3C43";
  const cardBg = isDark ? "rgba(28,28,30,0.85)" : "rgba(255,255,255,0.85)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const primaryColor = isDark ? "#FF453A" : "#FF3B30";

  const handleSignup = async () => {
    // Validation
    if (!displayName || !username || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (!isValidUsername(username)) {
      Alert.alert("Error", "Username must be 3-20 characters, letters, numbers, and underscores only");
      return;
    }

    if (!isValidPassword(password)) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);

    try {
      // Create auth user
      const { user } = await firebaseAuth.signUp(email, password);

      // Update display name
      await firebaseAuth.updateProfile(displayName);

      // Create user profile in Firestore
      await usersDb.create(user.uid, {
        email,
        displayName,
        username: username.toLowerCase(),
        avatarUrl: null,
        bio: "",
        interests: [],
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", getFirebaseErrorMessage(error.code));
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
                Join Nightout and start exploring activities
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(200)}>
              <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={styles.cardBlur}>
                <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                  {/* Display Name */}
                  <View style={styles.inputRow}>
                    <View style={[styles.inputIcon, { backgroundColor: inputBg }]}>
                      <User size={18} color={primaryColor} strokeWidth={2.5} />
                    </View>
                    <TextInput
                      placeholder="Full name"
                      placeholderTextColor={mutedColor}
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoComplete="name"
                      style={[styles.input, { color: textColor }]}
                    />
                  </View>

                  <View style={[styles.divider, { backgroundColor: borderColor }]} />

                  {/* Username */}
                  <View style={styles.inputRow}>
                    <View style={[styles.inputIcon, { backgroundColor: inputBg }]}>
                      <AtSign size={18} color={primaryColor} strokeWidth={2.5} />
                    </View>
                    <TextInput
                      placeholder="Username"
                      placeholderTextColor={mutedColor}
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoComplete="username"
                      style={[styles.input, { color: textColor }]}
                    />
                  </View>

                  <View style={[styles.divider, { backgroundColor: borderColor }]} />

                  {/* Email */}
                  <View style={styles.inputRow}>
                    <View style={[styles.inputIcon, { backgroundColor: inputBg }]}>
                      <Mail size={18} color={primaryColor} strokeWidth={2.5} />
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
                      <Lock size={18} color={primaryColor} strokeWidth={2.5} />
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
                <Text style={{ color: primaryColor }}>Terms of Service</Text> and{" "}
                <Text style={{ color: primaryColor }}>Privacy Policy</Text>
              </Text>
            </Animated.View>

            {/* Signup Button */}
            <Animated.View entering={FadeInDown.delay(400)}>
              <Pressable
                onPress={handleSignup}
                disabled={loading}
                style={[
                  styles.signupButton,
                  { backgroundColor: primaryColor, opacity: loading ? 0.6 : 1 },
                ]}
              >
                <Text style={styles.signupButtonText}>
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
                  <Text style={[styles.loginLink, { color: primaryColor }]}>
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
    width: 44,
    height: 44,
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 24,
    paddingTop: 0,
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
  termsRow: {
    marginTop: 20,
    marginBottom: 24,
  },
  termsText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  signupButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  signupButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
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
    fontWeight: "600",
  },
});
