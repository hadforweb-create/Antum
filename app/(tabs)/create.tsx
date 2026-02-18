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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Briefcase, Video, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { createService } from "@/lib/api/services";
import { toast } from "@/lib/ui/toast";

const BG = "#0b0b0f";
const SURFACE = "#131316";
const ELEVATED = "#1a1a1e";
const ACCENT = "#a3ff3f";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";
const INPUT_BG = "rgba(255,255,255,0.06)";

const CATEGORIES = ["Design", "Dev", "Marketing", "Writing", "Video", "3D", "AI", "Other"];

type Mode = "service" | "reel";

export default function CreateTab() {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>("service");

    // Service form
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Design");
    const [deliveryDays, setDeliveryDays] = useState("7");
    const [loading, setLoading] = useState(false);

    const handleCreateService = async () => {
        if (!title || !description || !price) {
            toast.error("Please fill in title, description, and price");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            toast.error("Please enter a valid price");
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            await createService({
                title,
                description,
                price: Math.round(priceNum * 100), // store in cents
                category: category.toUpperCase(),
                deliveryDays: parseInt(deliveryDays) || 7,
            });
            toast.success("Service created!");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTitle(""); setDescription(""); setPrice("");
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
            style={{ flex: 1, backgroundColor: BG }}
        >
            <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerSub}>Share your work</Text>
                            <Text style={styles.headerTitle}>Create</Text>
                        </View>
                    </View>

                    {/* Mode toggle */}
                    <View style={styles.modeRow}>
                        <Pressable
                            onPress={() => setMode("service")}
                            style={[styles.modeBtn, mode === "service" && styles.modeBtnActive]}
                        >
                            <Briefcase size={16} color={mode === "service" ? "#0b0b0f" : TEXT_MUTED} strokeWidth={2.5} />
                            <Text style={[styles.modeBtnText, mode === "service" && styles.modeBtnTextActive]}>
                                Service
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setMode("reel")}
                            style={[styles.modeBtn, mode === "reel" && styles.modeBtnActive]}
                        >
                            <Video size={16} color={mode === "reel" ? "#0b0b0f" : TEXT_MUTED} strokeWidth={2.5} />
                            <Text style={[styles.modeBtnText, mode === "reel" && styles.modeBtnTextActive]}>
                                Reel
                            </Text>
                        </Pressable>
                    </View>

                    {mode === "service" ? (
                        <View style={styles.form}>
                            {/* Title */}
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Service Title</Text>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        placeholder="e.g. Premium Brand Identity"
                                        placeholderTextColor={TEXT_MUTED}
                                        value={title}
                                        onChangeText={setTitle}
                                        style={styles.input}
                                        maxLength={100}
                                    />
                                </View>
                            </View>

                            {/* Description */}
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Description</Text>
                                <View style={[styles.inputWrap, { height: 100, alignItems: "flex-start", paddingTop: 14 }]}>
                                    <TextInput
                                        placeholder="Describe your service in detail..."
                                        placeholderTextColor={TEXT_MUTED}
                                        value={description}
                                        onChangeText={setDescription}
                                        style={[styles.input, { height: 80 }]}
                                        multiline
                                        textAlignVertical="top"
                                        maxLength={500}
                                    />
                                </View>
                            </View>

                            {/* Price + Delivery row */}
                            <View style={styles.rowFields}>
                                <View style={[styles.field, { flex: 1 }]}>
                                    <Text style={styles.fieldLabel}>Price (USD)</Text>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputPrefix}>$</Text>
                                        <TextInput
                                            placeholder="500"
                                            placeholderTextColor={TEXT_MUTED}
                                            value={price}
                                            onChangeText={setPrice}
                                            keyboardType="decimal-pad"
                                            style={[styles.input, { flex: 1 }]}
                                        />
                                    </View>
                                </View>
                                <View style={[styles.field, { flex: 1 }]}>
                                    <Text style={styles.fieldLabel}>Delivery (days)</Text>
                                    <View style={styles.inputWrap}>
                                        <TextInput
                                            placeholder="7"
                                            placeholderTextColor={TEXT_MUTED}
                                            value={deliveryDays}
                                            onChangeText={setDeliveryDays}
                                            keyboardType="number-pad"
                                            style={styles.input}
                                        />
                                        <Ionicons name="time-outline" size={16} color={TEXT_MUTED} />
                                    </View>
                                </View>
                            </View>

                            {/* Category */}
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Category</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                    {CATEGORIES.map((cat) => (
                                        <Pressable
                                            key={cat}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setCategory(cat);
                                            }}
                                            style={[styles.catChip, category === cat && styles.catChipActive]}
                                        >
                                            <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                                                {cat}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Submit */}
                            <Pressable
                                onPress={handleCreateService}
                                disabled={loading}
                                style={[styles.submitBtn, { opacity: loading ? 0.6 : 1 }]}
                            >
                                <LinearGradient
                                    colors={[ACCENT, "#84cc16"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.submitGrad}
                                >
                                    {loading
                                        ? <ActivityIndicator color="#0b0b0f" size="small" />
                                        : <Text style={styles.submitText}>Publish Service</Text>
                                    }
                                </LinearGradient>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.form}>
                            {/* Reel upload placeholder */}
                            <Pressable style={styles.uploadArea}>
                                <Ionicons name="cloud-upload-outline" size={40} color={TEXT_MUTED} />
                                <Text style={styles.uploadTitle}>Upload Video or Image</Text>
                                <Text style={styles.uploadSub}>MP4, MOV or JPG • Max 100MB</Text>
                            </Pressable>

                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Caption</Text>
                                <View style={[styles.inputWrap, { height: 100, alignItems: "flex-start", paddingTop: 14 }]}>
                                    <TextInput
                                        placeholder="Write a caption for your reel..."
                                        placeholderTextColor={TEXT_MUTED}
                                        style={[styles.input, { height: 80 }]}
                                        multiline
                                        textAlignVertical="top"
                                        maxLength={300}
                                    />
                                </View>
                            </View>

                            <Pressable
                                style={styles.submitBtn}
                                onPress={() => toast.info("Reel upload coming soon")}
                            >
                                <LinearGradient
                                    colors={[ACCENT, "#84cc16"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.submitGrad}
                                >
                                    <Text style={styles.submitText}>Post Reel</Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scroll: { paddingBottom: 40 },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    headerSub: { color: TEXT_MUTED, fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
    headerTitle: { color: TEXT, fontSize: 28, fontWeight: "900", letterSpacing: -0.6 },

    modeRow: { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginBottom: 28 },
    modeBtn: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, paddingVertical: 14, borderRadius: 16,
        backgroundColor: ELEVATED, borderWidth: 1, borderColor: BORDER,
    },
    modeBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
    modeBtnText: { color: TEXT_MUTED, fontSize: 14, fontWeight: "700" },
    modeBtnTextActive: { color: "#0b0b0f" },

    form: { paddingHorizontal: 20, gap: 20 },
    field: { gap: 8 },
    fieldLabel: { color: TEXT_MUTED, fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
    inputWrap: {
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER,
        borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    },
    inputPrefix: { color: TEXT_SEC, fontSize: 16, fontWeight: "700" },
    input: { flex: 1, color: TEXT, fontSize: 16 },
    rowFields: { flexDirection: "row", gap: 12 },

    catChip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
        backgroundColor: ELEVATED, borderWidth: 1, borderColor: BORDER,
    },
    catChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
    catChipText: { color: TEXT_MUTED, fontSize: 13, fontWeight: "700" },
    catChipTextActive: { color: "#0b0b0f" },

    submitBtn: { borderRadius: 18, overflow: "hidden", marginTop: 8 },
    submitGrad: { paddingVertical: 18, alignItems: "center", borderRadius: 18 },
    submitText: { color: "#0b0b0f", fontSize: 17, fontWeight: "900" },

    uploadArea: {
        height: 200, borderRadius: 20, borderWidth: 2,
        borderColor: BORDER, borderStyle: "dashed",
        justifyContent: "center", alignItems: "center", gap: 10,
        backgroundColor: INPUT_BG,
    },
    uploadTitle: { color: TEXT_SEC, fontSize: 16, fontWeight: "700" },
    uploadSub: { color: TEXT_MUTED, fontSize: 13 },
});
