import { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    Dimensions,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { X, Star, Clock, MessageCircle, Share2, Edit2, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { useThemeStore, useAuthStore } from "@/lib/store";
import { colors } from "@/lib/theme";
import { getService, deleteService, Service } from "@/lib/api/services";
import { createConversation } from "@/lib/api/conversations";
import { toast } from "@/lib/ui/toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ServiceDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { isDark } = useThemeStore();
    const { user } = useAuthStore();

    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [messagingLoading, setMessagingLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const bgColor = isDark ? "#121210" : "#F5F3EE";
    const textColor = isDark ? "#FFF" : "#000";
    const mutedColor = "#8E8E8A";
    const cardBg = isDark ? "rgba(28,28,26,0.88)" : "rgba(255,255,255,0.88)";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(214,210,200,0.6)";

    const isOwner = service?.user?.id === user?.id;

    useEffect(() => {
        if (!id) return;

        const fetchService = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getService(id);
                setService(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to load service";
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [id]);

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleMessage = async () => {
        if (!service?.user?.id || messagingLoading) return;

        // Don't message yourself
        if (service.user.id === user?.id) {
            toast.info("You can't message yourself");
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setMessagingLoading(true);

        try {
            const conversation = await createConversation(service.user.id);
            router.push(`/conversation/${conversation.id}`);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to start conversation";
            toast.error(message);
        } finally {
            setMessagingLoading(false);
        }
    };

    const handleHire = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // For now, start a conversation - full checkout flow can be Phase 2D
        handleMessage();
    };

    const handleEdit = () => {
        if (!id) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/service/edit/${id}`);
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Service",
            "Are you sure you want to delete this service? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        if (!id) return;
                        setDeleteLoading(true);
                        try {
                            await deleteService(id);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            toast.success("Service deleted");
                            router.back();
                        } catch (err) {
                            const message = err instanceof Error ? err.message : "Failed to delete service";
                            toast.error(message);
                        } finally {
                            setDeleteLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleShare = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toast.info("Share coming soon");
    };

    const handleCreatorPress = () => {
        if (!service?.user?.id) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/profile/${service.user.id}`);
    };

    // Loading state
    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <SafeAreaView style={styles.loadingHeader}>
                    <Pressable onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color="#FFF" strokeWidth={2.5} />
                    </Pressable>
                </SafeAreaView>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    // Error state
    if (error || !service) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <SafeAreaView style={styles.header}>
                    <Pressable onPress={handleClose} style={styles.closeButtonAlt}>
                        <X size={24} color={textColor} strokeWidth={2.5} />
                    </Pressable>
                </SafeAreaView>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorTitle, { color: textColor }]}>
                        {error || "Service not found"}
                    </Text>
                    <Pressable
                        onPress={handleClose}
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                    >
                        <Text style={styles.retryText}>Go Back</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Hero Image */}
            <View style={styles.heroContainer}>
                {service.imageUrl ? (
                    <Image source={{ uri: service.imageUrl }} style={styles.heroImage} contentFit="cover" />
                ) : (
                    <View style={[styles.heroImage, styles.heroPlaceholder, { backgroundColor: colors.primary }]}>
                        <Text style={styles.heroPlaceholderText}>{service.category}</Text>
                    </View>
                )}
                <LinearGradient
                    colors={["rgba(0,0,0,0.4)", "transparent", "rgba(0,0,0,0.6)"]}
                    style={StyleSheet.absoluteFill}
                />

                {/* Header */}
                <SafeAreaView style={styles.header}>
                    <Pressable onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color="#FFF" strokeWidth={2.5} />
                    </Pressable>
                    <View style={styles.headerRight}>
                        {isOwner && (
                            <>
                                <Pressable onPress={handleEdit} style={styles.headerButton}>
                                    <Edit2 size={20} color="#FFF" strokeWidth={2} />
                                </Pressable>
                                <Pressable
                                    onPress={handleDelete}
                                    style={styles.headerButton}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Trash2 size={20} color="#D64040" strokeWidth={2} />
                                    )}
                                </Pressable>
                            </>
                        )}
                        <Pressable style={styles.headerButton} onPress={handleShare}>
                            <Share2 size={20} color="#FFF" strokeWidth={2} />
                        </Pressable>
                    </View>
                </SafeAreaView>

                {/* Price Badge */}
                <View style={styles.priceBadge}>
                    <Text style={styles.priceLabel}>Starting at</Text>
                    <Text style={styles.priceValue}>{service.priceFormatted}</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Title & Meta */}
                <Animated.View entering={FadeInDown.delay(100).duration(300)}>
                    <Text style={[styles.title, { color: textColor }]}>{service.title}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{service.category}</Text>
                        </View>
                        <View style={styles.deliveryBadge}>
                            <Clock size={14} color={mutedColor} strokeWidth={2} />
                            <Text style={[styles.deliveryText, { color: mutedColor }]}>
                                {service.deliveryDays} day{service.deliveryDays !== 1 ? "s" : ""} delivery
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Creator Card */}
                {service.user && (
                    <Animated.View entering={FadeInDown.delay(200).duration(300)}>
                        <Pressable
                            onPress={handleCreatorPress}
                            style={[styles.creatorCard, { backgroundColor: cardBg, borderColor }]}
                        >
                            {service.user.avatarUrl ? (
                                <Image
                                    source={{ uri: service.user.avatarUrl }}
                                    style={styles.creatorAvatar}
                                />
                            ) : (
                                <View
                                    style={[
                                        styles.creatorAvatar,
                                        { backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
                                    ]}
                                >
                                    <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "700" }}>
                                        {(service.user.name || service.user.email).charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.creatorInfo}>
                                <Text style={[styles.creatorName, { color: textColor }]}>
                                    {service.user.name || service.user.email}
                                </Text>
                                {service.user.location && (
                                    <Text style={[styles.creatorLocation, { color: mutedColor }]}>
                                        {service.user.location}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.viewProfileButton}>
                                <Text style={styles.viewProfileText}>View Profile</Text>
                            </View>
                        </Pressable>
                    </Animated.View>
                )}

                {/* Description */}
                <Animated.View entering={FadeInDown.delay(300).duration(300)}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>About this service</Text>
                    <Text style={[styles.description, { color: textColor }]}>{service.description}</Text>
                </Animated.View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Actions */}
            {!isOwner && (
                <SafeAreaView edges={["bottom"]} style={styles.bottomActions}>
                    <View style={[styles.actionsContainer, { backgroundColor: cardBg, borderColor }]}>
                        <Pressable
                            onPress={handleMessage}
                            disabled={messagingLoading}
                            style={[styles.messageButton, messagingLoading && { opacity: 0.6 }]}
                        >
                            {messagingLoading ? (
                                <ActivityIndicator size="small" color={textColor} />
                            ) : (
                                <MessageCircle size={22} color={textColor} strokeWidth={2} />
                            )}
                        </Pressable>
                        <Pressable onPress={handleHire} style={styles.hireButton}>
                            <Text style={styles.hireButtonText}>
                                Contact to Hire - {service.priceFormatted}
                            </Text>
                        </Pressable>
                    </View>
                </SafeAreaView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingHorizontal: 16,
        paddingTop: 8,
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
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 24,
    },
    retryButton: {
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 18,
    },
    retryText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
    heroContainer: {
        height: 360,
    },
    heroImage: {
        width: "100%",
        height: "100%",
    },
    heroPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    heroPlaceholderText: {
        color: "#FFF",
        fontSize: 32,
        fontWeight: "800",
    },
    header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    headerRight: {
        flexDirection: "row",
        gap: 10,
    },
    closeButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "rgba(0,0,0,0.35)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 0,
    },
    closeButtonAlt: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: "center",
        justifyContent: "center",
    },
    headerButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "rgba(0,0,0,0.35)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 0,
    },
    priceBadge: {
        position: "absolute",
        bottom: 24,
        left: 24,
        backgroundColor: "rgba(0,0,0,0.65)",
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 18,
    },
    priceLabel: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
        fontWeight: "500",
        marginBottom: 2,
    },
    priceValue: {
        color: "#FFF",
        fontSize: 30,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        lineHeight: 36,
        marginBottom: 14,
        letterSpacing: -0.3,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 24,
    },
    categoryBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 12,
    },
    categoryText: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "600",
    },
    deliveryBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    deliveryText: {
        fontSize: 14,
        fontWeight: "500",
    },
    creatorCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        borderRadius: 24,
        borderWidth: 0,
        marginBottom: 28,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 3,
    },
    creatorAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    creatorInfo: {
        flex: 1,
        marginLeft: 14,
    },
    creatorName: {
        fontSize: 17,
        fontWeight: "700",
    },
    creatorLocation: {
        fontSize: 14,
        marginTop: 3,
    },
    viewProfileButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
    },
    viewProfileText: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "600",
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 14,
    },
    description: {
        fontSize: 16,
        lineHeight: 30,
        marginBottom: 28,
    },
    bottomActions: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
    actionsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        padding: 20,
        borderTopWidth: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 8,
    },
    messageButton: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: "rgba(17, 17, 17, 0.05)",
        alignItems: "center",
        justifyContent: "center",
    },
    hireButton: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingVertical: 20,
        borderRadius: 22,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 5,
    },
    hireButtonText: {
        color: "#FFF",
        fontSize: 17,
        fontWeight: "700",
    },
});
