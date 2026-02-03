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
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { X, Camera, ChevronDown, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useThemeStore, useAuthStore } from "@/lib/store";
import { colors } from "@/lib/theme";
import { getService, updateService, Service, UpdateServiceInput } from "@/lib/api/services";
import { uploadMedia } from "@/lib/api/uploads";

// Common service categories
const CATEGORIES = [
    "Video Editing",
    "Photography",
    "Music Production",
    "Graphic Design",
    "Animation",
    "Voice Over",
    "Social Media",
    "Writing",
    "Marketing",
    "Web Development",
    "Mobile Development",
    "Consulting",
    "Other",
];

export default function EditServiceScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { isDark } = useThemeStore();
    const { user } = useAuthStore();

    // Original service data
    const [service, setService] = useState<Service | null>(null);
    const [loadingService, setLoadingService] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
    const [deliveryDays, setDeliveryDays] = useState("7");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

    // UI state
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const bgColor = isDark ? "#121214" : "#FAFAFC";
    const textColor = isDark ? "#FFF" : "#000";
    const mutedColor = "#8E8E93";
    const cardBg = isDark ? "rgba(28,28,30,0.85)" : "rgba(255,255,255,0.85)";
    const inputBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
    const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

    // Load existing service
    useEffect(() => {
        if (!id) return;

        const fetchService = async () => {
            try {
                setLoadingService(true);
                setLoadError(null);
                const data = await getService(id);
                setService(data);

                // Populate form fields
                setTitle(data.title);
                setDescription(data.description);
                setPrice((data.price / 100).toFixed(2)); // Convert cents to dollars
                setCategory(data.category);
                setDeliveryDays(data.deliveryDays.toString());
                setExistingImageUrl(data.imageUrl);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to load service";
                setLoadError(message);
            } finally {
                setLoadingService(false);
            }
        };

        fetchService();
    }, [id]);

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!title.trim() || title.trim().length < 3) {
            newErrors.title = "Title must be at least 3 characters";
        }

        if (!description.trim() || description.trim().length < 10) {
            newErrors.description = "Description must be at least 10 characters";
        }

        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum < 1) {
            newErrors.price = "Price must be at least $1.00";
        }

        if (!category) {
            newErrors.category = "Please select a category";
        }

        const days = parseInt(deliveryDays);
        if (isNaN(days) || days < 1 || days > 365) {
            newErrors.deliveryDays = "Delivery days must be between 1 and 365";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setImageUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const handleSubmit = async () => {
        if (!id || !validateForm()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSaving(true);

        try {
            // Upload new image if selected
            let imageUrl: string | null | undefined = undefined;
            if (imageUri) {
                setUploadingImage(true);
                const uploadResult = await uploadMedia(imageUri, "image/jpeg");
                imageUrl = uploadResult.url;
                setUploadingImage(false);
            }

            // Build update payload (only changed fields)
            const updateData: UpdateServiceInput = {};

            if (title.trim() !== service?.title) {
                updateData.title = title.trim();
            }
            if (description.trim() !== service?.description) {
                updateData.description = description.trim();
            }

            const priceInCents = Math.round(parseFloat(price) * 100);
            if (priceInCents !== service?.price) {
                updateData.price = priceInCents;
            }

            if (category !== service?.category) {
                updateData.category = category;
            }

            const days = parseInt(deliveryDays);
            if (days !== service?.deliveryDays) {
                updateData.deliveryDays = days;
            }

            if (imageUrl !== undefined) {
                updateData.imageUrl = imageUrl;
            }

            // Only call API if there are changes
            if (Object.keys(updateData).length > 0) {
                await updateService(id, updateData);
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "Your service has been updated!", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update service";
            Alert.alert("Error", message);
        } finally {
            setSaving(false);
            setUploadingImage(false);
        }
    };

    // Loading state
    if (loadingService) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <SafeAreaView style={styles.header}>
                    <Pressable onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color={textColor} strokeWidth={2.5} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Edit Service</Text>
                    <View style={{ width: 44 }} />
                </SafeAreaView>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    // Error state
    if (loadError || !service) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <SafeAreaView style={styles.header}>
                    <Pressable onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color={textColor} strokeWidth={2.5} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Edit Service</Text>
                    <View style={{ width: 44 }} />
                </SafeAreaView>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorTitle, { color: textColor }]}>
                        {loadError || "Service not found"}
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

    // Check ownership
    if (service.user?.id !== user?.id) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <SafeAreaView style={styles.header}>
                    <Pressable onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color={textColor} strokeWidth={2.5} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Edit Service</Text>
                    <View style={{ width: 44 }} />
                </SafeAreaView>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorTitle, { color: textColor }]}>
                        You can only edit your own services
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

    const displayImageUri = imageUri || existingImageUrl;

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <SafeAreaView style={styles.header}>
                <Pressable onPress={handleClose} style={styles.closeButton}>
                    <X size={24} color={textColor} strokeWidth={2.5} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: textColor }]}>Edit Service</Text>
                <View style={{ width: 44 }} />
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
                    {/* Image Picker */}
                    <Animated.View entering={FadeInDown.delay(100).duration(300)}>
                        <Text style={[styles.label, { color: textColor }]}>Cover Image</Text>
                        <Pressable
                            onPress={handlePickImage}
                            style={[
                                styles.imagePicker,
                                { backgroundColor: inputBg, borderColor },
                                displayImageUri ? styles.imagePickerWithImage : null,
                            ]}
                        >
                            {displayImageUri ? (
                                <Image source={{ uri: displayImageUri }} style={styles.previewImage} contentFit="cover" />
                            ) : (
                                <View style={styles.imagePickerContent}>
                                    <Camera size={32} color={mutedColor} strokeWidth={1.5} />
                                    <Text style={[styles.imagePickerText, { color: mutedColor }]}>
                                        Tap to add a cover image
                                    </Text>
                                </View>
                            )}
                        </Pressable>
                        {displayImageUri && (
                            <Text style={[styles.hint, { color: mutedColor }]}>
                                Tap to change the image
                            </Text>
                        )}
                    </Animated.View>

                    {/* Title */}
                    <Animated.View entering={FadeInDown.delay(150).duration(300)}>
                        <Text style={[styles.label, { color: textColor }]}>Title *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: inputBg, color: textColor, borderColor },
                                errors.title ? styles.inputError : null,
                            ]}
                            placeholder="e.g., Professional Video Editing"
                            placeholderTextColor={mutedColor}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />
                        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
                    </Animated.View>

                    {/* Description */}
                    <Animated.View entering={FadeInDown.delay(200).duration(300)}>
                        <Text style={[styles.label, { color: textColor }]}>Description *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                { backgroundColor: inputBg, color: textColor, borderColor },
                                errors.description ? styles.inputError : null,
                            ]}
                            placeholder="Describe your service in detail..."
                            placeholderTextColor={mutedColor}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            maxLength={2000}
                        />
                        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
                    </Animated.View>

                    {/* Category */}
                    <Animated.View entering={FadeInDown.delay(250).duration(300)}>
                        <Text style={[styles.label, { color: textColor }]}>Category *</Text>
                        <Pressable
                            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                            style={[
                                styles.selectInput,
                                { backgroundColor: inputBg, borderColor },
                                errors.category ? styles.inputError : null,
                            ]}
                        >
                            <Text style={[styles.selectText, { color: category ? textColor : mutedColor }]}>
                                {category || "Select a category"}
                            </Text>
                            <ChevronDown size={20} color={mutedColor} />
                        </Pressable>
                        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

                        {showCategoryPicker && (
                            <View style={[styles.categoryList, { backgroundColor: cardBg, borderColor }]}>
                                {CATEGORIES.map((cat) => (
                                    <Pressable
                                        key={cat}
                                        onPress={() => {
                                            setCategory(cat);
                                            setShowCategoryPicker(false);
                                            setErrors((prev) => ({ ...prev, category: "" }));
                                        }}
                                        style={[
                                            styles.categoryItem,
                                            category === cat && { backgroundColor: colors.primary + "20" },
                                        ]}
                                    >
                                        <Text style={[styles.categoryItemText, { color: textColor }]}>{cat}</Text>
                                        {category === cat && <Check size={18} color={colors.primary} />}
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </Animated.View>

                    {/* Price & Delivery Days Row */}
                    <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.row}>
                        <View style={styles.halfField}>
                            <Text style={[styles.label, { color: textColor }]}>Price (USD) *</Text>
                            <View style={[styles.priceInputContainer, { backgroundColor: inputBg, borderColor }, errors.price ? styles.inputError : null]}>
                                <Text style={[styles.currencySymbol, { color: mutedColor }]}>$</Text>
                                <TextInput
                                    style={[styles.priceInput, { color: textColor }]}
                                    placeholder="0.00"
                                    placeholderTextColor={mutedColor}
                                    value={price}
                                    onChangeText={setPrice}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                        </View>

                        <View style={styles.halfField}>
                            <Text style={[styles.label, { color: textColor }]}>Delivery Days</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: inputBg, color: textColor, borderColor },
                                    errors.deliveryDays ? styles.inputError : null,
                                ]}
                                placeholder="7"
                                placeholderTextColor={mutedColor}
                                value={deliveryDays}
                                onChangeText={setDeliveryDays}
                                keyboardType="number-pad"
                            />
                            {errors.deliveryDays && <Text style={styles.errorText}>{errors.deliveryDays}</Text>}
                        </View>
                    </Animated.View>

                    {/* Submit Button */}
                    <Animated.View entering={FadeInDown.delay(350).duration(300)} style={styles.submitContainer}>
                        <Pressable
                            onPress={handleSubmit}
                            disabled={saving}
                            style={[styles.submitButton, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}
                        >
                            {saving ? (
                                <View style={styles.loadingContent}>
                                    <ActivityIndicator size="small" color="#FFF" />
                                    <Text style={styles.submitButtonText}>
                                        {uploadingImage ? "Uploading image..." : "Saving..."}
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
        fontSize: 20,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 24,
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
    label: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 8,
        marginTop: 16,
    },
    hint: {
        fontSize: 13,
        marginTop: 4,
    },
    input: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
    },
    textArea: {
        minHeight: 120,
        paddingTop: 14,
    },
    inputError: {
        borderColor: "#FF3B30",
    },
    errorText: {
        color: "#FF3B30",
        fontSize: 13,
        marginTop: 4,
    },
    selectInput: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    selectText: {
        fontSize: 16,
    },
    categoryList: {
        marginTop: 8,
        borderRadius: 12,
        borderWidth: 1,
        overflow: "hidden",
    },
    categoryItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    categoryItemText: {
        fontSize: 16,
    },
    row: {
        flexDirection: "row",
        gap: 16,
    },
    halfField: {
        flex: 1,
    },
    priceInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: "600",
        marginRight: 4,
    },
    priceInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
    },
    imagePicker: {
        height: 180,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: "dashed",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    imagePickerWithImage: {
        borderStyle: "solid",
    },
    imagePickerContent: {
        alignItems: "center",
        gap: 8,
    },
    imagePickerText: {
        fontSize: 15,
    },
    previewImage: {
        width: "100%",
        height: "100%",
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
});
