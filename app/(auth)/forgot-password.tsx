import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import { useFigmaColors } from "@/lib/figma-colors";
import { toast } from "@/lib/ui/toast";
import { httpClient } from "@/lib/api/http";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "@/lib/i18n";

export default function ForgotPassword() {
    const router = useRouter();
    const c = useFigmaColors();
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async () => {
        if (!email.includes("@")) {
            toast.error(t("auth.validEmailReq"));
            return;
        }

        setLoading(true);
        try {
            await httpClient.post("/api/password/forgot", { email });
            setSent(true);
            toast.success(t("auth.resetSent"));
        } catch (error) {
            toast.error(t("auth.resetFailed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: c.bg }]}
        >
            <Pressable style={styles.backButton} onPress={() => router.back()}>
                <ArrowLeft size={24} color={c.text} />
            </Pressable>

            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View entering={FadeInDown.duration(600).springify()}>
                    <Text style={[styles.title, { color: c.text }]}>{t("auth.resetPassword")}</Text>
                    <Text style={[styles.subtitle, { color: c.textMuted }]}>
                        {t("auth.resetSubtitle")}
                    </Text>

                    {!sent ? (
                        <>
                            <View style={[styles.inputContainer, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                                <Mail size={20} color={c.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: c.text }]}
                                    placeholder={t("auth.emailPlaceholder")}
                                    placeholderTextColor={c.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <Pressable
                                style={[styles.button, { backgroundColor: c.accent }, loading && styles.buttonDisabled]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                <Text style={[styles.buttonText, { color: "#0b0b0f" }]}>
                                    {loading ? t("auth.sending") : t("auth.sendResetLink")}
                                </Text>
                            </Pressable>
                        </>
                    ) : (
                        <View style={[styles.successContainer, { backgroundColor: c.surface }]}>
                            <View style={[styles.successIcon, { backgroundColor: c.accent }]}>
                                <Mail size={32} color="#0b0b0f" />
                            </View>
                            <Text style={[styles.successTitle, { color: c.text }]}>{t("auth.checkEmail")}</Text>
                            <Text style={[styles.successText, { color: c.textMuted }]}>
                                {t("auth.resetInstructions")} {email}
                            </Text>
                            <Pressable
                                style={[styles.button, { backgroundColor: c.accent }]}
                                onPress={() => router.push("/(auth)/login")}
                            >
                                <Text style={[styles.buttonText, { color: "#0b0b0f" }]}>{t("auth.backToLogin")}</Text>
                            </Pressable>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    backButton: { position: "absolute", top: 60, left: 20, zIndex: 10, padding: 10 },
    content: { flexGrow: 1, justifyContent: "center", padding: 28 },
    title: { fontSize: 36, fontWeight: "900", marginBottom: 12, letterSpacing: -0.5 },
    subtitle: { fontSize: 17, marginBottom: 36, lineHeight: 26 },
    inputContainer: {
        flexDirection: "row", alignItems: "center", borderRadius: 16,
        marginBottom: 24, paddingHorizontal: 18, height: 60, borderWidth: 1,
    },
    inputIcon: { marginRight: 14 },
    input: { flex: 1, fontSize: 17 },
    button: {
        height: 58, borderRadius: 16, alignItems: "center", justifyContent: "center",
        marginTop: 8, shadowColor: "#a3ff3f", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { fontSize: 17, fontWeight: "900" },
    successContainer: {
        alignItems: "center", padding: 32, borderRadius: 20,
    },
    successIcon: {
        width: 72, height: 72, borderRadius: 36, alignItems: "center",
        justifyContent: "center", marginBottom: 20,
    },
    successTitle: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
    successText: { fontSize: 16, textAlign: "center", marginBottom: 28, lineHeight: 24 },
});
