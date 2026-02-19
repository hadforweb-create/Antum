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
import * as Haptics from "expo-haptics";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "@/lib/auth/useAuth";
import { toast } from "@/lib/ui/toast";

const BG = "#0b0b0f";
const SURFACE = "#131316";
const INPUT_BG = "rgba(255,255,255,0.06)";
const INPUT_BORDER = "rgba(255,255,255,0.1)";
const ACCENT = "#a3ff3f";
const TEXT = "#FFFFFF";
const TEXT_MUTED = "rgba(255,255,255,0.5)";

export default function LoginScreen() {
    const router = useRouter();
    const { login, isLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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
            router.replace("/(tabs)");
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.error(error.message || "Failed to sign in");
        } finally {
            setSubmitting(false);
        }
    };

    const isDisabled = submitting || isLoading;

    return (
        <View style={styles.container}>
            {/* Subtle green radial glow — matches Figma */}
            <LinearGradient
                colors={["rgba(132,204,22,0.06)", "transparent"]}
                style={styles.glow}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={styles.inner}>
                    {/* Brand */}
                    <Animated.View entering={FadeInDown.delay(80)} style={styles.brandRow}>
                        <View style={styles.logoMark}>
                            <LinearGradient
                                colors={["#84cc16", "#4d7c0f"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.logoGrad}
                            />
                        </View>
                        <Text style={styles.brandName}>Baysis</Text>
                    </Animated.View>

                    {/* Headline */}
                    <Animated.View entering={FadeInDown.delay(140)} style={styles.headingBlock}>
                        <Text style={styles.heading}>Welcome back</Text>
                    </Animated.View>

                    {/* Social buttons — Apple / Google */}
                    <Animated.View entering={FadeInDown.delay(200)} style={styles.socialRow}>
                        <Pressable style={styles.socialBtn}>
                            <Text style={styles.socialIcon}></Text>
                            <Text style={styles.socialLabel}>Continue with Apple</Text>
                        </Pressable>
                        <Pressable style={styles.socialBtn}>
                            <Text style={styles.socialIcon}>G</Text>
                            <Text style={styles.socialLabel}>Continue with Google</Text>
                        </Pressable>
                    </Animated.View>

                    {/* Divider */}
                    <Animated.View entering={FadeInDown.delay(240)} style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </Animated.View>

                    {/* Email */}
                    <Animated.View entering={FadeInDown.delay(280)}>
                        <View style={styles.inputWrap}>
                            <Mail size={18} color={TEXT_MUTED} strokeWidth={2} />
                            <TextInput
                                placeholder="Email address"
                                placeholderTextColor={TEXT_MUTED}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                editable={!isDisabled}
                                style={styles.input}
                            />
                        </View>
                    </Animated.View>

                    {/* Password */}
                    <Animated.View entering={FadeInDown.delay(310)}>
                        <View style={styles.inputWrap}>
                            <Lock size={18} color={TEXT_MUTED} strokeWidth={2} />
                            <TextInput
                                placeholder="Password"
                                placeholderTextColor={TEXT_MUTED}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoComplete="password"
                                editable={!isDisabled}
                                style={[styles.input, { flex: 1 }]}
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                {showPassword
                                    ? <EyeOff size={18} color={TEXT_MUTED} strokeWidth={2} />
                                    : <Eye size={18} color={TEXT_MUTED} strokeWidth={2} />
                                }
                            </Pressable>
                        </View>
                    </Animated.View>

                    {/* Forgot */}
                    <Animated.View entering={FadeInDown.delay(330)}>
                        <Pressable
                            onPress={() => router.push("/(auth)/forgot-password")}
                            style={styles.forgotBtn}
                        >
                            <Text style={styles.forgotText}>Forgot password?</Text>
                        </Pressable>
                    </Animated.View>

                    {/* Sign In */}
                    <Animated.View entering={FadeInDown.delay(360)}>
                        <Pressable
                            onPress={handleLogin}
                            disabled={isDisabled}
                            style={[styles.signInBtn, { opacity: isDisabled ? 0.6 : 1 }]}
                        >
                            <LinearGradient
                                colors={["#a3ff3f", "#84cc16"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.signInGrad}
                            >
                                <Text style={styles.signInText}>
                                    {submitting ? "Signing in…" : "Sign In"}
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>

                    {/* Create account */}
                    <Animated.View entering={FadeInDown.delay(400)} style={styles.createRow}>
                        <Text style={styles.createPrompt}>New to Baysis? </Text>
                        <Link href="/(auth)/signup" asChild>
                            <Pressable>
                                <Text style={styles.createLink}>Create account</Text>
                            </Pressable>
                        </Link>
                    </Animated.View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    glow: { position: "absolute", top: 0, left: 0, right: 0, height: 400 },
    inner: { flex: 1, paddingHorizontal: 28, justifyContent: "center" },

    brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 36 },
    logoMark: { width: 36, height: 36, borderRadius: 10, overflow: "hidden" },
    logoGrad: { flex: 1 },
    brandName: { color: TEXT, fontSize: 22, fontWeight: "900", letterSpacing: -0.4 },

    headingBlock: { marginBottom: 28 },
    heading: { color: TEXT, fontSize: 32, fontWeight: "900", letterSpacing: -0.6 },

    socialRow: { gap: 12, marginBottom: 24 },
    socialBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 12, paddingVertical: 15, borderRadius: 16,
        backgroundColor: INPUT_BG, borderWidth: 1, borderColor: INPUT_BORDER,
    },
    socialIcon: { color: TEXT, fontSize: 16, fontWeight: "700", width: 22, textAlign: "center" },
    socialLabel: { color: TEXT, fontSize: 15, fontWeight: "600" },

    dividerRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
    dividerText: { color: TEXT_MUTED, fontSize: 13, fontWeight: "600" },

    inputWrap: {
        flexDirection: "row", alignItems: "center", gap: 14,
        backgroundColor: INPUT_BG, borderWidth: 1, borderColor: INPUT_BORDER,
        borderRadius: 16, paddingHorizontal: 18, paddingVertical: 15, marginBottom: 12,
    },
    input: { flex: 1, color: TEXT, fontSize: 16 },
    eyeBtn: { padding: 4 },

    forgotBtn: { alignSelf: "flex-end", marginBottom: 24, paddingVertical: 4 },
    forgotText: { color: ACCENT, fontSize: 14, fontWeight: "600" },

    signInBtn: { borderRadius: 18, overflow: "hidden", marginBottom: 28 },
    signInGrad: { paddingVertical: 18, alignItems: "center", borderRadius: 18 },
    signInText: { color: "#0b0b0f", fontSize: 17, fontWeight: "800" },

    createRow: { flexDirection: "row", justifyContent: "center" },
    createPrompt: { color: TEXT_MUTED, fontSize: 15, fontWeight: "500" },
    createLink: { color: ACCENT, fontSize: 15, fontWeight: "700" },
});
