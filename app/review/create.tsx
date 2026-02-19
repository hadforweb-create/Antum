import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Star, Send } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { createReview } from "@/lib/api/reviews";
import StarRating from "@/components/StarRating";
import { toast } from "@/lib/ui/toast";

// Design tokens
const BG = "#0b0b0f";
const SURFACE = "#131316";
const ELEVATED = "#1a1a1e";
const ACCENT = "#a3ff3f";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const TEXT_SUBTLE = "rgba(255,255,255,0.3)";
const BORDER = "rgba(255,255,255,0.06)";

export default function CreateReviewScreen() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const router = useRouter();

    const [rating, setRating] = useState(0);
    const [body, setBody] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const canSubmit = rating >= 1 && rating <= 5 && !submitting;

    const handleSubmit = async () => {
        if (!canSubmit || !orderId) return;

        setSubmitting(true);
        try {
            await createReview({
                orderId,
                rating,
                body: body.trim() || undefined,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success("Review submitted!");
            router.back();
        } catch (e: any) {
            toast.error(e?.message || "Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <SafeAreaView edges={["top"]} style={styles.headerSafe}>
                <View style={styles.headerRow}>
                    <Pressable
                        style={styles.backBtn}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                    >
                        <ArrowLeft size={20} color={TEXT} strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Leave Review</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Rating */}
                    <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                        <View style={styles.card}>
                            <View style={styles.ratingHeader}>
                                <Star size={20} color={ACCENT} strokeWidth={2} />
                                <Text style={styles.cardTitle}>Rate your experience</Text>
                            </View>
                            <Text style={styles.ratingHint}>
                                Tap a star to select your rating
                            </Text>
                            <View style={styles.ratingWrap}>
                                <StarRating
                                    value={rating}
                                    onChange={setRating}
                                    size={36}
                                />
                            </View>
                            <Text style={styles.ratingLabel}>
                                {rating === 0
                                    ? "Select a rating"
                                    : rating === 1
                                        ? "Poor"
                                        : rating === 2
                                            ? "Fair"
                                            : rating === 3
                                                ? "Good"
                                                : rating === 4
                                                    ? "Great"
                                                    : "Excellent"}
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Written review */}
                    <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Write a review (optional)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Share details of your experience..."
                                placeholderTextColor={TEXT_MUTED}
                                multiline
                                value={body}
                                onChangeText={setBody}
                                maxLength={1000}
                                textAlignVertical="top"
                            />
                            <Text style={styles.charCount}>
                                {body.length}/1000
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Submit */}
                    <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                        <Pressable
                            style={[
                                styles.submitBtn,
                                !canSubmit && styles.submitBtnDisabled,
                            ]}
                            disabled={!canSubmit}
                            onPress={handleSubmit}
                        >
                            {submitting ? (
                                <ActivityIndicator color={BG} size="small" />
                            ) : (
                                <>
                                    <Send size={18} color={BG} strokeWidth={2.5} />
                                    <Text style={styles.submitBtnText}>Submit Review</Text>
                                </>
                            )}
                        </Pressable>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    headerSafe: { paddingHorizontal: 20 },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 8,
        paddingBottom: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: ELEVATED,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: BORDER,
    },
    headerTitle: { color: TEXT, fontSize: 18, fontWeight: "800" },
    scrollContent: { paddingHorizontal: 20, gap: 16, paddingBottom: 40 },

    card: {
        backgroundColor: SURFACE,
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: BORDER,
    },
    cardTitle: { color: TEXT, fontSize: 16, fontWeight: "800", marginBottom: 4 },

    ratingHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
    ratingHint: { color: TEXT_MUTED, fontSize: 13, marginBottom: 20 },
    ratingWrap: { alignItems: "center", marginBottom: 12 },
    ratingLabel: {
        color: ACCENT,
        fontSize: 14,
        fontWeight: "700",
        textAlign: "center",
    },

    textInput: {
        backgroundColor: ELEVATED,
        borderRadius: 14,
        padding: 14,
        color: TEXT,
        fontSize: 14,
        lineHeight: 20,
        minHeight: 120,
        marginTop: 12,
        borderWidth: 1,
        borderColor: BORDER,
    },
    charCount: {
        color: TEXT_SUBTLE,
        fontSize: 11,
        textAlign: "right",
        marginTop: 6,
    },

    submitBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: ACCENT,
    },
    submitBtnDisabled: {
        opacity: 0.4,
    },
    submitBtnText: { color: BG, fontSize: 16, fontWeight: "800" },
});
