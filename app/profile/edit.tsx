import { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    Pressable,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { X, Camera, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useThemeStore, useAuthStore } from "@/lib/store";
import { colors } from "@/lib/theme";
import { getCurrentUser, updateCurrentUser, User, UpdateProfileData } from "@/lib/api/users";
import { uploadMedia } from "@/lib/api/uploads";
import { getMySkills, getSkills, updateMySkills } from "@/lib/api/skills";
import type { Skill } from "@/types";
import { toast } from "@/lib/ui/toast";

export default function EditProfileScreen() {
    const router = useRouter();
    const { isDark } = useThemeStore();
    const { setUser } = useAuthStore();

    // Original profile data
    const [profile, setProfile] = useState<User | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");
    const [website, setWebsite] = useState("");
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);

    // Skills
    const [allSkills, setAllSkills] = useState<Skill[]>([]);
    const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
    const [originalSkillIds, setOriginalSkillIds] = useState<string[]>([]);

    // UI state
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const bgColor = isDark ? "#121210" : "#F5F3EE";
    const textColor = isDark ? "#FFF" : "#000";
    const mutedColor = "#8E8E8A";
    const inputBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
    const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

    // Load existing profile
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoadingProfile(true);
                setLoadError(null);
                const data = await getCurrentUser();
                setProfile(data);

                // Populate form fields
                setName(data.name || "");
                setBio(data.bio || "");
                setLocation(data.location || "");
                setWebsite((data as any).website || "");
                setExistingAvatarUrl(data.avatarUrl);

                // Fetch skills
                const [myRes, allRes] = await Promise.all([
                    getMySkills().catch(() => ({ skills: [] })),
                    getSkills().catch(() => []),
                ]);
                const myIds = (myRes.skills || []).map((s) => s.id);
                setSelectedSkillIds(myIds);
                setOriginalSkillIds(myIds);
                setAllSkills(Array.isArray(allRes) ? allRes : []);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to load profile";
                setLoadError(message);
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchProfile();
    }, []);

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handlePickAvatar = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setAvatarUri(result.assets[0].uri);
            }
        } catch (error) {
            toast.error("Failed to pick image");
        }
    };

    const handleSubmit = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSaving(true);

        try {
            // Upload new avatar if selected
            let avatarUrl: string | null | undefined = undefined;
            if (avatarUri) {
                setUploadingAvatar(true);
                const uploadResult = await uploadMedia(avatarUri, "image/jpeg");
                avatarUrl = uploadResult.url;
                setUploadingAvatar(false);
            }

            // Build update payload (only changed fields)
            const updateData: UpdateProfileData = {};

            const trimmedName = name.trim();
            if (trimmedName && trimmedName !== profile?.name) {
                updateData.name = trimmedName;
            }

            const trimmedBio = bio.trim();
            if (trimmedBio !== (profile?.bio || "")) {
                updateData.bio = trimmedBio || null;
            }

            const trimmedLocation = location.trim();
            if (trimmedLocation !== (profile?.location || "")) {
                updateData.location = trimmedLocation || null;
            }

            if (avatarUrl !== undefined) {
                updateData.avatarUrl = avatarUrl;
            }

            const trimmedWebsite = website.trim();
            if (trimmedWebsite !== ((profile as any)?.website || "")) {
                updateData.website = trimmedWebsite || null;
            }

            // Only call API if there are changes
            if (Object.keys(updateData).length > 0) {
                const updatedUser = await updateCurrentUser(updateData);

                // Update auth store with new user data
                setUser({
                    id: updatedUser.id,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    name: updatedUser.name,
                    avatarUrl: updatedUser.avatarUrl,
                });
            }

            // Save skills if changed
            const skillsChanged =
                selectedSkillIds.length !== originalSkillIds.length ||
                selectedSkillIds.some((id) => !originalSkillIds.includes(id));
            if (skillsChanged) {
                await updateMySkills(selectedSkillIds).catch(() => { });
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success("Profile updated successfully!");
            router.back();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update profile";
            toast.error(message);
        } finally {
            setSaving(false);
            setUploadingAvatar(false);
        }
    };

    // Loading state
    if (loadingProfile) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <SafeAreaView style={styles.header}>
                    <Pressable onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color={textColor} strokeWidth={2.5} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Edit Profile</Text>
                    <View style={{ width: 44 }} />
                </SafeAreaView>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    // Error state
    if (loadError) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <SafeAreaView style={styles.header}>
                    <Pressable onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color={textColor} strokeWidth={2.5} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Edit Profile</Text>
                    <View style={{ width: 44 }} />
                </SafeAreaView>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorTitle, { color: textColor }]}>
                        {loadError}
                    </Text>
                    <Pressable
                        onPress={handleClose}
                        style={[styles.backButton, { backgroundColor: colors.primary }]}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    const displayAvatarUri = avatarUri || existingAvatarUrl;
    const displayName = profile?.name || profile?.email?.split("@")[0] || "?";

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <SafeAreaView style={styles.header}>
                <Pressable onPress={handleClose} style={styles.closeButton}>
                    <X size={24} color={textColor} strokeWidth={2.5} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: textColor }]}>Edit Profile</Text>
                <Pressable
                    onPress={handleSubmit}
                    disabled={saving}
                    style={[styles.saveButton, saving && { opacity: 0.6 }]}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Check size={24} color={colors.primary} strokeWidth={2.5} />
                    )}
                </Pressable>
            </SafeAreaView>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Avatar Picker */}
                    <Animated.View
                        entering={FadeInDown.delay(100).duration(300)}
                        style={styles.avatarSection}
                    >
                        <Pressable onPress={handlePickAvatar} style={styles.avatarPicker}>
                            {displayAvatarUri ? (
                                <Image source={{ uri: displayAvatarUri }} style={styles.avatarImage} />
                            ) : (
                                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                                    <Text style={styles.avatarText}>
                                        {displayName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.cameraOverlay}>
                                <Camera size={20} color="#FFF" strokeWidth={2} />
                            </View>
                        </Pressable>
                        <Text style={[styles.avatarHint, { color: mutedColor }]}>
                            Tap to change photo
                        </Text>
                    </Animated.View>

                    {/* Name */}
                    <Animated.View entering={FadeInDown.delay(150).duration(300)}>
                        <Text style={[styles.label, { color: textColor }]}>Name</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: inputBg, color: textColor, borderColor },
                            ]}
                            placeholder="Your display name"
                            placeholderTextColor={mutedColor}
                            value={name}
                            onChangeText={setName}
                            maxLength={100}
                        />
                    </Animated.View>

                    {/* Bio */}
                    <Animated.View entering={FadeInDown.delay(200).duration(300)}>
                        <Text style={[styles.label, { color: textColor }]}>Bio</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                { backgroundColor: inputBg, color: textColor, borderColor },
                            ]}
                            placeholder="Tell people about yourself..."
                            placeholderTextColor={mutedColor}
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            maxLength={500}
                        />
                        <Text style={[styles.charCount, { color: mutedColor }]}>
                            {bio.length}/500
                        </Text>
                    </Animated.View>

                    {/* Location */}
                    <Animated.View entering={FadeInDown.delay(250).duration(300)}>
                        <Text style={[styles.label, { color: textColor }]}>Location</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: inputBg, color: textColor, borderColor },
                            ]}
                            placeholder="e.g., Los Angeles, CA"
                            placeholderTextColor={mutedColor}
                            value={location}
                            onChangeText={setLocation}
                            maxLength={100}
                        />
                    </Animated.View>

                    {/* Website */}
                    <Animated.View entering={FadeInDown.delay(270).duration(300)}>
                        <Text style={[styles.label, { color: textColor }]}>Website</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: inputBg, color: textColor, borderColor },
                            ]}
                            placeholder="https://yoursite.com"
                            placeholderTextColor={mutedColor}
                            value={website}
                            onChangeText={setWebsite}
                            maxLength={200}
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                    </Animated.View>

                    {/* Skills */}
                    {allSkills.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(285).duration(300)}>
                            <Text style={[styles.label, { color: textColor }]}>Skills</Text>
                            <View style={styles.skillsWrap}>
                                {allSkills.map((skill) => {
                                    const selected = selectedSkillIds.includes(skill.id);
                                    return (
                                        <Pressable
                                            key={skill.id}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setSelectedSkillIds((prev) =>
                                                    selected
                                                        ? prev.filter((id) => id !== skill.id)
                                                        : [...prev, skill.id]
                                                );
                                            }}
                                            style={[
                                                styles.skillChip,
                                                { borderColor: selected ? colors.primary : borderColor },
                                                selected && { backgroundColor: `${colors.primary}15` },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.skillChipText,
                                                    { color: selected ? colors.primary : mutedColor },
                                                ]}
                                            >
                                                {skill.name}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </Animated.View>
                    )}

                    {/* Email (read-only) */}
                    <Animated.View entering={FadeInDown.delay(300).duration(300)}>
                        <Text style={[styles.label, { color: textColor }]}>Email</Text>
                        <View
                            style={[
                                styles.input,
                                styles.readOnlyInput,
                                { backgroundColor: inputBg, borderColor },
                            ]}
                        >
                            <Text style={[styles.readOnlyText, { color: mutedColor }]}>
                                {profile?.email}
                            </Text>
                        </View>
                        <Text style={[styles.hint, { color: mutedColor }]}>
                            Email cannot be changed
                        </Text>
                    </Animated.View>

                    {/* Save Button */}
                    <Animated.View entering={FadeInDown.delay(350).duration(300)} style={styles.submitContainer}>
                        <Pressable
                            onPress={handleSubmit}
                            disabled={saving}
                            style={[
                                styles.submitButton,
                                { backgroundColor: colors.primary },
                                saving && { opacity: 0.6 },
                            ]}
                        >
                            {saving ? (
                                <View style={styles.loadingContent}>
                                    <ActivityIndicator size="small" color="#FFF" />
                                    <Text style={styles.submitButtonText}>
                                        {uploadingAvatar ? "Uploading photo..." : "Saving..."}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.submitButtonText}>Save Changes</Text>
                            )}
                        </Pressable>
                    </Animated.View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    closeButton: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    saveButton: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 20,
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    avatarSection: {
        alignItems: "center",
        marginBottom: 24,
    },
    avatarPicker: {
        position: "relative",
    },
    avatarImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: "#111111",
    },
    avatarPlaceholder: {
        backgroundColor: "#111111",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: "#FFF",
        fontSize: 48,
        fontWeight: "700",
    },
    cameraOverlay: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#111111",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "#FFF",
    },
    avatarHint: {
        marginTop: 12,
        fontSize: 14,
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
    },
    textArea: {
        minHeight: 100,
        paddingTop: 14,
    },
    readOnlyInput: {
        justifyContent: "center",
    },
    readOnlyText: {
        fontSize: 16,
    },
    charCount: {
        fontSize: 12,
        textAlign: "right",
        marginTop: 4,
    },
    hint: {
        fontSize: 13,
        marginTop: 4,
    },
    submitContainer: {
        marginTop: 32,
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
    },
    submitButtonText: {
        color: "#FFF",
        fontSize: 17,
        fontWeight: "700",
    },
    loadingContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    skillsWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    skillChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    skillChipText: {
        fontSize: 13,
        fontWeight: "600",
    },
});
