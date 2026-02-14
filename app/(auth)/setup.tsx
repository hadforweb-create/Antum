import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import {
    Camera,
    User,
    Palette,
    ArrowRight,
    Check,
    ChevronLeft,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useThemeStore, useAuthStore } from "@/lib/store";
import { updateCurrentUser } from "@/lib/api/users";
import { uploadMedia } from "@/lib/api/uploads";
import { colors, shadows } from "@/lib/theme";
import { toast } from "@/lib/ui/toast";

const CATEGORIES = [
    "Photography", "Videography", "Music", "Design",
    "Marketing", "Development", "Writing", "Beauty",
    "Fitness", "Cooking", "Tutoring", "Events",
];

type Step = 0 | 1 | 2;

export default function ProfileSetupScreen() {
    const { isDark } = useThemeStore();
    const { user, setUser } = useAuthStore();
    const router = useRouter();

    const [step, setStep] = useState<Step>(0);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState(user?.name || user?.displayName || "");
    const [bio, setBio] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const bg = isDark ? "#121210" : "#F5F3EE";
    const cardBg = isDark ? "#1C1C1A" : "#FFFFFF";
    const textColor = isDark ? "#F5F3EE" : "#111111";
    const subtitleColor = isDark ? "#8E8E8A" : "#6B6B67";
    const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

    const handlePickAvatar = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
                setAvatarUrl(result.assets[0].uri);
            }
        } catch {
            toast.error("Failed to pick image");
        }
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories((prev) =>
            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
        );
    };

    const handleFinish = async () => {
        setSaving(true);
        try {
            let finalAvatarUrl = avatarUrl;

            // Upload avatar if local URI
            if (avatarUrl && avatarUrl.startsWith("file://")) {
                try {
                    const uploaded = await uploadMedia(avatarUrl, "image/jpeg");
                    finalAvatarUrl = uploaded.url;
                } catch {
                    // Continue without avatar
                }
            }

            const updated = await updateCurrentUser({
                name: displayName || undefined,
                bio: bio || undefined,
                avatarUrl: finalAvatarUrl || undefined,
            });

            setUser({
                ...user!,
                name: updated.name,
                bio: updated.bio,
                avatarUrl: updated.avatarUrl,
            });

            toast.success("Profile set up!");
            router.replace("/(tabs)" as any);
        } catch {
            toast.error("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        router.replace("/(tabs)" as any);
    };

    const handleNext = () => {
        if (step < 2) setStep((step + 1) as Step);
        else handleFinish();
    };

    const handleBack = () => {
        if (step > 0) setStep((step - 1) as Step);
    };

    const renderStep0 = () => (
        <Animated.View entering={FadeInRight.duration(400)} style={styles.stepContent}>
            <View style={[styles.avatarSection]}>
                <Pressable onPress={handlePickAvatar} style={[styles.avatarPicker, { backgroundColor: inputBg }]}>
                    {avatarUrl ? (
                        <Animated.Image
                            entering={FadeInDown.duration(300)}
                            source={{ uri: avatarUrl }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Camera size={32} color={subtitleColor} strokeWidth={1.5} />
                            <Text style={[styles.avatarHint, { color: subtitleColor }]}>Add Photo</Text>
                        </View>
                    )}
                </Pressable>
            </View>
            <Text style={[styles.stepHint, { color: subtitleColor }]}>
                Choose a profile photo that represents you
            </Text>
        </Animated.View>
    );

    const renderStep1 = () => (
        <Animated.View entering={FadeInRight.duration(400)} style={styles.stepContent}>
            <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: subtitleColor }]}>Display Name</Text>
                <TextInput
                    style={[styles.textInput, { backgroundColor: inputBg, color: textColor }]}
                    placeholder="How should we call you?"
                    placeholderTextColor={subtitleColor}
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="words"
                    maxLength={40}
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: subtitleColor }]}>Bio</Text>
                <TextInput
                    style={[styles.textArea, { backgroundColor: inputBg, color: textColor }]}
                    placeholder="Tell us about yourself..."
                    placeholderTextColor={subtitleColor}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    maxLength={200}
                    textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: subtitleColor }]}>{bio.length}/200</Text>
            </View>
        </Animated.View>
    );

    const renderStep2 = () => (
        <Animated.View entering={FadeInRight.duration(400)} style={styles.stepContent}>
            <Text style={[styles.stepHint, { color: subtitleColor, marginBottom: 20 }]}>
                Select categories you're interested in
            </Text>
            <View style={styles.categoriesGrid}>
                {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                        <Pressable
                            key={cat}
                            onPress={() => toggleCategory(cat)}
                            style={[
                                styles.categoryChip,
                                {
                                    backgroundColor: isSelected ? colors.primary : inputBg,
                                    borderColor: isSelected ? colors.primary : "transparent",
                                },
                            ]}
                        >
                            {isSelected && <Check size={14} color="#FFF" strokeWidth={3} />}
                            <Text
                                style={[
                                    styles.categoryText,
                                    { color: isSelected ? "#FFF" : textColor },
                                ]}
                            >
                                {cat}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </Animated.View>
    );

    const stepTitles = ["Profile Photo", "About You", "Interests"];
    const stepIcons = [Camera, User, Palette];
    const StepIcon = stepIcons[step];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            {/* Header */}
            <View style={styles.header}>
                {step > 0 ? (
                    <Pressable onPress={handleBack} style={styles.headerButton}>
                        <ChevronLeft size={22} color={textColor} strokeWidth={2} />
                    </Pressable>
                ) : (
                    <View style={{ width: 40 }} />
                )}
                <View style={styles.dotsRow}>
                    {[0, 1, 2].map((i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: i <= step ? colors.primary : (isDark ? "#2A2A28" : "#D0CEC9"),
                                    width: i === step ? 24 : 8,
                                },
                            ]}
                        />
                    ))}
                </View>
                <Pressable onPress={handleSkip} style={styles.headerButton}>
                    <Text style={[styles.skipText, { color: subtitleColor }]}>Skip</Text>
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {/* Step icon + title */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.titleSection}>
                    <View style={[styles.iconCircle, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]}>
                        <StepIcon size={28} color={colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={[styles.title, { color: textColor }]}>{stepTitles[step]}</Text>
                </Animated.View>

                {/* Step content */}
                {step === 0 && renderStep0()}
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
            </ScrollView>

            {/* Bottom CTA */}
            <View style={styles.bottomBar}>
                <Pressable
                    onPress={handleNext}
                    disabled={saving}
                    style={[styles.ctaButton, { backgroundColor: colors.primary }, shadows.md]}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.ctaText}>
                                {step === 2 ? "Finish" : "Continue"}
                            </Text>
                            <ArrowRight size={18} color="#FFF" strokeWidth={2.5} />
                        </>
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    skipText: {
        fontSize: 15,
        fontWeight: "500",
    },
    dotsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    dot: {
        height: 7,
        borderRadius: 4,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 28,
    },
    titleSection: {
        alignItems: "center",
        marginTop: 20,
        marginBottom: 36,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    stepContent: {
        flex: 1,
    },
    stepHint: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: "center",
    },
    // Step 0 - Avatar
    avatarSection: {
        alignItems: "center",
        marginBottom: 20,
    },
    avatarPicker: {
        width: 140,
        height: 140,
        borderRadius: 70,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarImage: {
        width: 140,
        height: 140,
        borderRadius: 70,
    },
    avatarPlaceholder: {
        alignItems: "center",
        gap: 8,
    },
    avatarHint: {
        fontSize: 14,
        fontWeight: "500",
    },
    // Step 1 - Name/Bio
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
        marginLeft: 4,
    },
    textInput: {
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 16,
        fontSize: 16,
    },
    textArea: {
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 16,
        fontSize: 16,
        minHeight: 100,
    },
    charCount: {
        fontSize: 12,
        textAlign: "right",
        marginTop: 6,
        marginRight: 4,
    },
    // Step 2 - Categories
    categoriesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    categoryChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 15,
        fontWeight: "500",
    },
    // Bottom
    bottomBar: {
        paddingHorizontal: 24,
        paddingBottom: 28,
        paddingTop: 12,
    },
    ctaButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 20,
        borderRadius: 22,
    },
    ctaText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 0.2,
    },
});
