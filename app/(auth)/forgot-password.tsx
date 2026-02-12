import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { toast } from "@/lib/ui/toast";
import { httpClient } from "@/lib/api/http";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

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
            style={styles.container}
        >
            <Pressable style={styles.backButton} onPress={() => router.back()}>
                <ArrowLeft size={24} color="#FFF" />
            </Pressable>

            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View entering={FadeInDown.duration(600).springify()}>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>
                        Enter your email address and we'll send you a link to reset your password.
                    </Text>

                    {!sent ? (
                        <>
                            <View style={styles.inputContainer}>
                                <Mail size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#666"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <Pressable
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? "Sending..." : "Send Reset Link"}
                                </Text>
                            </Pressable>
                        </>
                    ) : (
                        <View style={styles.successContainer}>
                            <View style={styles.successIcon}>
                                <Mail size={32} color="#FFF" />
                            </View>
                            <Text style={styles.successTitle}>Check your email</Text>
                            <Text style={styles.successText}>
                                We've sent password reset instructions to {email}
                            </Text>
                            <Pressable
                                style={styles.button}
                                onPress={() => router.push("/(auth)/login")}
                            >
                                <Text style={styles.buttonText}>Back to Login</Text>
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
        backgroundColor: "#121210",
    },
    backButton: {
        position: "absolute",
        top: 60,
        left: 20,
        zIndex: 10,
        padding: 8,
    },
    content: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#FFF",
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: "#8E8E8A",
        marginBottom: 32,
        lineHeight: 24,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1C1C1A",
        borderRadius: 16,
        marginBottom: 20,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: "#FFF",
        fontSize: 16,
    },
    button: {
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    successContainer: {
        alignItems: "center",
        backgroundColor: "#1C1C1A",
        padding: 24,
        borderRadius: 22,
    },
    successIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFF",
        marginBottom: 8,
    },
    successText: {
        fontSize: 15,
        color: "#8E8E8A",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
    },
});
