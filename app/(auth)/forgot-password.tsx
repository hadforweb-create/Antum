import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { useThemeStore } from "@/lib/store";
import { toast } from "@/lib/ui/toast";
import { httpClient } from "@/lib/api/http";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function ForgotPassword() {
    const router = useRouter();
    const { isDark } = useThemeStore();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const bgColor = isDark ? "#121210" : "#F5F3EE";
    const textColor = isDark ? "#F5F3EE" : "#111111";
    const mutedColor = "#8E8E8A";
    const cardBg = isDark ? "#1C1C1A" : "#FFFFFF";
    const inputBorderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(214,210,200,0.6)";
    const iconColor = isDark ? "#8E8E8A" : "#8E8E8A";
    const primaryBg = isDark ? "#F5F3EE" : "#111111";
    const primaryText = isDark ? "#111111" : "#F5F3EE";

    const handleSubmit = async () => {
        if (!email.includes("@")) {
            toast.error("Please enter a valid email");
            return;
        }

        setLoading(true);
        try {
            await httpClient.post("/api/password/forgot", { email });
            setSent(true);
            toast.success("Reset link sent if account exists");
        } catch (error) {
            toast.error("Failed to send reset link");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: bgColor }]}
        >
            <Pressable style={styles.backButton} onPress={() => router.back()}>
                <ArrowLeft size={24} color={textColor} />
            </Pressable>

            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View entering={FadeInDown.duration(600).springify()}>
                    <Text style={[styles.title, { color: textColor }]}>Reset Password</Text>
                    <Text style={[styles.subtitle, { color: mutedColor }]}>
                        Enter your email address and we'll send you a link to reset your password.
                    </Text>

                    {!sent ? (
                        <>
                            <View style={[styles.inputContainer, { backgroundColor: cardBg, borderColor: inputBorderColor }]}>
                                <Mail size={20} color={iconColor} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="Email"
                                    placeholderTextColor={mutedColor}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <Pressable
                                style={[styles.button, { backgroundColor: primaryBg }, loading && styles.buttonDisabled]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                <Text style={[styles.buttonText, { color: primaryText }]}>
                                    {loading ? "Sending..." : "Send Reset Link"}
                                </Text>
                            </Pressable>
                        </>
                    ) : (
                        <View style={[styles.successContainer, { backgroundColor: cardBg }]}>
                            <View style={[styles.successIcon, { backgroundColor: primaryBg }]}>
                                <Mail size={32} color={primaryText} />
                            </View>
                            <Text style={[styles.successTitle, { color: textColor }]}>Check your email</Text>
                            <Text style={[styles.successText, { color: mutedColor }]}>
                                We've sent password reset instructions to {email}
                            </Text>
                            <Pressable
                                style={[styles.button, { backgroundColor: primaryBg }]}
                                onPress={() => router.push("/(auth)/login")}
                            >
                                <Text style={[styles.buttonText, { color: primaryText }]}>Back to Login</Text>
                            </Pressable>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        position: "absolute",
        top: 60,
        left: 20,
        zIndex: 10,
        padding: 10,
    },
    content: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 28,
    },
    title: {
        fontSize: 36,
        fontWeight: "700",
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 17,
        marginBottom: 36,
        lineHeight: 26,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 20,
        marginBottom: 24,
        paddingHorizontal: 18,
        height: 60,
        borderWidth: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
    },
    inputIcon: {
        marginRight: 14,
    },
    input: {
        flex: 1,
        fontSize: 17,
    },
    button: {
        height: 58,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontSize: 17,
        fontWeight: "700",
    },
    successContainer: {
        alignItems: "center",
        padding: 32,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 4,
    },
    successIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 10,
    },
    successText: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 28,
        lineHeight: 24,
    },
});
