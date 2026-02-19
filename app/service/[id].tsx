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
import { X, Star, Clock, MessageCircle, Share2, Edit2, Trash2, Heart, Bookmark } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { useAuthStore } from "@/lib/store";
import { getService, deleteService, Service } from "@/lib/api/services";
import { createConversation } from "@/lib/api/conversations";
import { toggleLike, checkIsLiked, getLikeCount, getCommentCount, createServiceRequest } from "@/lib/api/social";
import { CommentsSheet } from "@/components/CommentsSheet";
import { toast } from "@/lib/ui/toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Design system constants
const BG = "#0b0b0f";
const SURFACE = "#131316";
const ELEVATED = "#1a1a1e";
const ACCENT = "#a3ff3f";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const TEXT_SUBTLE = "rgba(255,255,255,0.3)";
const BORDER = "rgba(255,255,255,0.06)";

export default function ServiceDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuthStore();

    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [messagingLoading, setMessagingLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [hireLoading, setHireLoading] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    const isOwner = service?.user?.id === user?.id;

    useEffect(() => {
        if (!id) return;

        const fetchService = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getService(id);
                setService(data);

                const [liked, likes, comments] = await Promise.all([
                    checkIsLiked("service", id),
                    getLikeCount("service", id),
                    getCommentCount("service", id),
                ]);
                setIsLiked(liked);
                setLikeCount(likes);
                setCommentCount(comments);
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

    const handleToggleLike = async () => {
        if (!id) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const nowLiked = await toggleLike("service", id);
            setIsLiked(nowLiked);
            setLikeCount((c) => nowLiked ? c + 1 : Math.max(0, c - 1));
        } catch {
            toast.error("Failed to update like");
        }
    };

    const handleToggleBookmark = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsBookmarked(!isBookmarked);
        toast.info(isBookmarked ? "Removed from saved" : "Added to saved");
    };

    const handleHire = async () => {
        if (!service?.user?.id || hireLoading) return;
        if (service.user.id === user?.id) {
            toast.info("You can't hire yourself");
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setHireLoading(true);
        try {
            await createServiceRequest(service.id, service.user.id, `I'd like to hire you for: ${service.title}`);
            const conversation = await createConversation(service.user.id);
            toast.success("Request sent!");
            router.push(`/conversation/${conversation.id}`);
        } catch {
            toast.error("Failed to send hire request");
        } finally {
            setHireLoading(false);
        }
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
            <View style={styles.container}>
                <SafeAreaView style={styles.loadingHeader}>
                    <Pressable onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color={TEXT} strokeWidth={2.5} />
                    </Pressable>
                </SafeAreaView>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={ACCENT} />
                </View>
            </View>
        );
    }

    // Error state
    if (error || !service) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.header}>
                    <Pressable onPress={handleClose} style={styles.closeButtonAlt}>
                        <X size={24} color={TEXT} strokeWidth={2.5} />
                    </Pressable>
                </SafeAreaView>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>
                        {error || "Service not found"}
                    </Text>
                    <Pressable onPress={handleClose} style={styles.retryButton}>
                        <Text style={styles.retryText}>Go Back</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Hero Image */}
            <View style={styles.heroContainer}>
                {service.imageUrl ? (
                    <Image source={{ uri: service.imageUrl }} style={styles.heroImage} contentFit="cover" />
                ) : (
                    <View style={[styles.heroImage, styles.heroPlaceholder]}>
                        <Text style={styles.heroPlaceholderText}>{service.category}</Text>
                    </View>
                )}
                <LinearGradient
                    colors={["rgba(0,0,0,0.4)", "transparent", "rgba(11,11,15,0.95)"]}
                    style={StyleSheet.absoluteFill}
                />

                {/* Header */}
                <SafeAreaView style={styles.header}>
                    <Pressable onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color={TEXT} strokeWidth={2.5} />
                    </Pressable>
                    <View style={styles.headerRight}>
                        {isOwner && (
                            <>
                                <Pressable onPress={handleEdit} style={styles.headerButton}>
                                    <Edit2 size={20} color={TEXT} strokeWidth={2} />
                                </Pressable>
                                <Pressable
                                    onPress={handleDelete}
                                    style={styles.headerButton}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? (
                                        <ActivityIndicator size="small" color={TEXT} />
                                    ) : (
                                        <Trash2 size={20} color="#EF4444" strokeWidth={2} />
                                    )}
                                </Pressable>
                            </>
                        )}
                        <Pressable style={styles.headerButton} onPress={handleShare}>
                            <Share2 size={20} color={TEXT} strokeWidth={2} />
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
                    <Text style={styles.title}>{service.title}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{service.category}</Text>
                        </View>
                        <View style={styles.deliveryBadge}>
                            <Clock size={14} color={TEXT_MUTED} strokeWidth={2} />
                            <Text style={styles.deliveryText}>
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
                            style={styles.creatorCard}
                        >
                            {service.user.avatarUrl ? (
                                <Image
                                    source={{ uri: service.user.avatarUrl }}
                                    style={styles.creatorAvatar}
                                />
                            ) : (
                                <View style={[styles.creatorAvatar, styles.creatorAvatarPlaceholder]}>
                                    <Text style={styles.creatorAvatarText}>
                                        {(service.user.name || service.user.email).charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.creatorInfo}>
                                <Text style={styles.creatorName}>
                                    {service.user.name || service.user.email}
                                </Text>
                                {service.user.location && (
                                    <Text style={styles.creatorLocation}>
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

                {/* Social Actions */}
                <Animated.View entering={FadeInDown.delay(250).duration(300)}>
                    <View style={styles.engagementRow}>
                        <Pressable onPress={handleToggleLike} style={[styles.engagementButton, isLiked && styles.engagementButtonActive]}>
                            <Heart
                                size={20}
                                color={isLiked ? "#EF4444" : TEXT}
                                fill={isLiked ? "#EF4444" : "transparent"}
                                strokeWidth={2}
                            />
                            <Text style={[styles.engagementCount, { color: isLiked ? "#EF4444" : TEXT }]}>
                                {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
                            </Text>
                        </Pressable>
                        <Pressable onPress={() => setShowComments(true)} style={styles.engagementButton}>
                            <MessageCircle size={20} color={TEXT} strokeWidth={2} />
                            <Text style={styles.engagementCount}>
                                {commentCount > 999 ? `${(commentCount / 1000).toFixed(1)}K` : commentCount}
                            </Text>
                        </Pressable>
                        <Pressable onPress={handleToggleBookmark} style={styles.engagementButton}>
                            <Bookmark
                                size={20}
                                color={isBookmarked ? ACCENT : TEXT}
                                fill={isBookmarked ? ACCENT : "transparent"}
                                strokeWidth={2}
                            />
                            <Text style={[styles.engagementCount, { color: isBookmarked ? ACCENT : TEXT }]}>
                                {isBookmarked ? "Saved" : "Save"}
                            </Text>
                        </Pressable>
                        <Pressable onPress={handleShare} style={styles.engagementButton}>
                            <Share2 size={20} color={TEXT} strokeWidth={2} />
                        </Pressable>
                    </View>
                </Animated.View>

                {/* Description */}
                <Animated.View entering={FadeInDown.delay(300).duration(300)}>
                    <Text style={styles.sectionTitle}>About this service</Text>
                    <Text style={styles.description}>{service.description}</Text>
                </Animated.View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Actions */}
            {!isOwner && (
                <SafeAreaView edges={["bottom"]} style={styles.bottomActions}>
                    <View style={styles.actionsContainer}>
                        <Pressable
                            onPress={handleMessage}
                            disabled={messagingLoading}
                            style={[styles.messageButton, messagingLoading && { opacity: 0.6 }]}
                        >
                            {messagingLoading ? (
                                <ActivityIndicator size="small" color={TEXT} />
                            ) : (
                                <MessageCircle size={22} color={TEXT} strokeWidth={2} />
                            )}
                        </Pressable>
                        <Pressable onPress={handleHire} disabled={hireLoading} style={[styles.hireButton, hireLoading && { opacity: 0.7 }]}>
                            {hireLoading ? (
                                <ActivityIndicator size="small" color={BG} />
                            ) : (
                                <Text style={styles.hireButtonText}>
                                    Hire - {service.priceFormatted}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </SafeAreaView>
            )}

            {/* Comments Sheet */}
            {id && (
                <CommentsSheet
                    visible={showComments}
                    onClose={() => setShowComments(false)}
                    targetType="service"
                    targetId={id}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
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
        fontWeight: "900",
        color: TEXT,
        textAlign: "center",
        marginBottom: 24,
    },
    retryButton: {
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 18,
        backgroundColor: ACCENT,
    },
    retryText: {
        color: BG,
        fontSize: 16,
        fontWeight: "800",
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
        backgroundColor: ELEVATED,
    },
    heroPlaceholderText: {
        color: TEXT_MUTED,
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
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: ELEVATED,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: BORDER,
    },
    closeButtonAlt: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: ELEVATED,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: BORDER,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: ELEVATED,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: BORDER,
    },
    priceBadge: {
        position: "absolute",
        bottom: 24,
        left: 24,
        backgroundColor: "rgba(11,11,15,0.85)",
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
    },
    priceLabel: {
        color: TEXT_SEC,
        fontSize: 12,
        fontWeight: "500",
        marginBottom: 2,
    },
    priceValue: {
        color: ACCENT,
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
        fontWeight: "900",
        lineHeight: 36,
        marginBottom: 14,
        letterSpacing: -0.3,
        color: TEXT,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 24,
    },
    categoryBadge: {
        backgroundColor: ACCENT,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 12,
    },
    categoryText: {
        color: BG,
        fontSize: 13,
        fontWeight: "700",
    },
    deliveryBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    deliveryText: {
        fontSize: 14,
        fontWeight: "500",
        color: TEXT_MUTED,
    },
    creatorCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        borderRadius: 22,
        marginBottom: 28,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
    },
    creatorAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    creatorAvatarPlaceholder: {
        backgroundColor: ACCENT,
        alignItems: "center",
        justifyContent: "center",
    },
    creatorAvatarText: {
        color: BG,
        fontSize: 18,
        fontWeight: "700",
    },
    creatorInfo: {
        flex: 1,
        marginLeft: 14,
    },
    creatorName: {
        fontSize: 17,
        fontWeight: "700",
        color: TEXT,
    },
    creatorLocation: {
        fontSize: 14,
        marginTop: 3,
        color: TEXT_MUTED,
    },
    viewProfileButton: {
        backgroundColor: ACCENT,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
    },
    viewProfileText: {
        color: BG,
        fontSize: 13,
        fontWeight: "700",
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "900",
        marginBottom: 14,
        color: TEXT,
        letterSpacing: -0.3,
    },
    engagementRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 28,
        paddingVertical: 12,
        paddingHorizontal: 8,
        backgroundColor: SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
    },
    engagementButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 14,
        backgroundColor: "transparent",
    },
    engagementButtonActive: {
        backgroundColor: "rgba(163,255,63,0.08)",
    },
    engagementCount: {
        fontSize: 13,
        fontWeight: "600",
        color: TEXT,
    },
    description: {
        fontSize: 16,
        lineHeight: 30,
        marginBottom: 28,
        color: TEXT_SEC,
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
        backgroundColor: "rgba(11,11,15,0.96)",
        borderTopWidth: 1,
        borderTopColor: BORDER,
    },
    messageButton: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: ELEVATED,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: BORDER,
    },
    hireButton: {
        flex: 1,
        backgroundColor: ACCENT,
        paddingVertical: 20,
        borderRadius: 22,
        alignItems: "center",
    },
    hireButtonText: {
        color: BG,
        fontSize: 17,
        fontWeight: "800",
    },
});
