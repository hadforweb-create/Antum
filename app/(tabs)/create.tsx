import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { createService } from "@/lib/api/services";
import { toast } from "@/lib/ui/toast";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { useTranslation } from "@/lib/i18n";

const CATEGORY_KEYS = ["design", "dev", "marketing", "writing", "video", "3d", "ai", "other"];

type Mode = "service" | "reel";

export default function CreateTab() {
    const router = useRouter();
    const { t } = useTranslation();
    const c = useThemeColors();

    const [mode, setMode] = useState<"service" | "reel">("service");

    // Service form
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("design"); // Default to a key
    const [image, setImage] = useState<string | null>(null); // For cover image
    const [loading, setLoading] = useState(false);

    // Placeholder for image picking logic
    const pickImage = async () => {
        toast.info("Image picking coming soon!");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Placeholder for service creation logic (adapted from old, but simplified for new form)
    const handleCreateService = async () => {
        if (!title || !description || !price || !image) {
            toast.error("Please fill in all fields and upload an image.");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            toast.error("Please enter a valid price");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            // This part needs to be updated to match the new API requirements if any
            // For now, using the old structure as a placeholder
            await createService({
                title,
                description,
                price: Math.round(priceNum * 100), // store in cents
                category: category.toUpperCase(), // Assuming API still expects uppercase
                deliveryDays: 7, // Hardcoding for now as deliveryDays input is removed
                // image: image // Need to handle image upload
            });
            toast.success("Service created!");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTitle(""); setDescription(""); setPrice(""); setImage(null);
            router.push("/(tabs)/profile" as any);
        } catch (e: any) {
            toast.error(e?.message || "Failed to create service");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: c.bg }]}
        >
            <SafeAreaView edges={["top"]} style={[styles.header, { borderBottomColor: c.border }]}>
                <Text style={[styles.headerTitle, { color: c.text }]}>{t("create.title")}</Text>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Mode Switcher */}
                <View style={[styles.modeSwitch, { backgroundColor: c.elevated, borderColor: c.border }]}>
                    <Pressable
                        style={[styles.modeBtn, mode === "service" && { backgroundColor: c.surface, borderColor: c.border }]}
                        onPress={() => setMode("service")}
                    >
                        <Text style={[
                            styles.modeText,
                            { color: c.textMuted },
                            mode === "service" && { color: c.text, fontWeight: "700" }
                        ]}>
                            {t("create.mode.service")}
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.modeBtn, mode === "reel" && { backgroundColor: c.surface, borderColor: c.border }]}
                        onPress={() => setMode("reel")}
                    >
                        <Text style={[
                            styles.modeText,
                            { color: c.textMuted },
                            mode === "reel" && { color: c.text, fontWeight: "700" }
                        ]}>
                            {t("create.mode.reel")}
                        </Text>
                    </Pressable>
                </View>


                {mode === "service" ? (
                    <View style={styles.form}>
                        {/* Cover Image */}
                        <Pressable onPress={pickImage} style={[styles.imageUpload, { backgroundColor: c.elevated, borderColor: c.border }]}>
                            {image ? (
                                <Image source={{ uri: image }} style={styles.uploadedImage} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="image-outline" size={32} color={c.textMuted} />
                                    <Text style={[styles.uploadText, { color: c.textMuted }]}>{t("create.service.uploadCover")}</Text>
                                </View>
                            )}
                        </Pressable>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: c.textSecondary }]}>{t("create.service.titleLabel")}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: c.elevated, borderColor: c.border, color: c.text }]}
                                placeholder={t("create.service.titlePlaceholder")}
                                placeholderTextColor={c.textMuted}
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: c.textSecondary }]}>{t("create.service.categoryLabel")}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                                {CATEGORY_KEYS.map((catKey) => (
                                    <Pressable
                                        key={catKey}
                                        onPress={() => setCategory(catKey)}
                                        style={[
                                            styles.catPill,
                                            { backgroundColor: c.elevated, borderColor: c.border },
                                            category === catKey && { backgroundColor: c.accent, borderColor: c.accent }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.catText,
                                            { color: c.textSecondary },
                                            category === catKey && { color: "#0b0b0f" }
                                        ]}>
                                            {t(`home.categories.${catKey}`)}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: c.textSecondary }]}>{t("create.service.priceLabel")}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: c.elevated, borderColor: c.border, color: c.text }]}
                                placeholder="0.00"
                                placeholderTextColor={c.textMuted}
                                keyboardType="numeric"
                                value={price}
                                onChangeText={setPrice}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: c.textSecondary }]}>{t("create.service.descLabel")}</Text>
                            <TextInput
                                style={[styles.textArea, { backgroundColor: c.elevated, borderColor: c.border, color: c.text }]}
                                placeholder={t("create.service.descPlaceholder")}
                                placeholderTextColor={c.textMuted}
                                multiline
                                numberOfLines={4}
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>

                        <Pressable
                            onPress={handleCreateService}
                            disabled={loading}
                            style={[styles.submitBtn, { backgroundColor: c.accent, opacity: loading ? 0.6 : 1 }]}
                        >
                            {loading
                                ? <ActivityIndicator color="#0b0b0f" size="small" />
                                : <Text style={styles.submitBtnText}>{t("create.service.submit")}</Text>
                            }
                        </Pressable>
                    </View>

                ) : (
                    <View style={styles.form}>
                        <Pressable style={[styles.videoUpload, { backgroundColor: c.elevated, borderColor: c.border }]}>
                            <Ionicons name="videocam-outline" size={48} color={c.textMuted} />
                            <Text style={[styles.uploadText, { color: c.textMuted }]}>{t("create.reel.uploadTitle")}</Text>
                        </Pressable>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: c.textSecondary }]}>{t("create.reel.captionLabel")}</Text>
                            <TextInput
                                style={[styles.textArea, { backgroundColor: c.elevated, borderColor: c.border, color: c.text }]}
                                placeholder={t("create.reel.captionPlaceholder")}
                                placeholderTextColor={c.textMuted}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <Pressable
                            style={[styles.submitBtn, { backgroundColor: c.accent }]}
                            onPress={() => toast.info("Reel upload coming soon")}
                        >
                            <Text style={styles.submitBtnText}>{t("create.reel.submit")}</Text>
                        </Pressable>
                    </View>
                )}

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 20, fontWeight: "800" },
    content: { padding: 20 },
    modeSwitch: {
        flexDirection: "row", padding: 4, borderRadius: 12,
        marginBottom: 24, borderWidth: 1,
    },
    modeBtn: {
        flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8,
        borderWidth: 1, borderColor: "transparent",
    },
    modeText: { fontSize: 14, fontWeight: "600" },
    form: { gap: 20 },
    imageUpload: {
        height: 180, borderRadius: 16,
        borderWidth: 1, borderStyle: "dashed",
        justifyContent: "center", alignItems: "center", overflow: "hidden",
    },
    uploadedImage: { width: "100%", height: "100%" },
    uploadPlaceholder: { alignItems: "center", gap: 8 },
    uploadText: { fontSize: 14, fontWeight: "600" },
    inputGroup: { gap: 8 },
    label: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
    input: {
        height: 52, borderRadius: 12,
        paddingHorizontal: 16, fontSize: 16,
        borderWidth: 1,
    },
    textArea: {
        height: 120, borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 12, fontSize: 16,
        borderWidth: 1, textAlignVertical: "top",
    },
    catScroll: { gap: 8 }, // horizontal scrollview handles gap differently
    catPill: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 99, borderWidth: 1, marginRight: 8,
    },
    catText: { fontSize: 13, fontWeight: "700" },
    submitBtn: {
        height: 56, borderRadius: 16,
        justifyContent: "center", alignItems: "center",
        marginTop: 10,
        shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    },
    submitBtnText: { color: "#0b0b0f", fontSize: 16, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
    videoUpload: {
        height: 240, borderRadius: 16,
        borderWidth: 1, borderStyle: "dashed",
        justifyContent: "center", alignItems: "center",
    },
});
