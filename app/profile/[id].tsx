import { useState, useEffect } from "react";
import { toggleFollow, checkIsFollowing, getFollowerCount, getFollowingCount } from "@/lib/api/social";
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
import {
    X,
    Star,
    MapPin,
    MessageCircle,
    Briefcase,
    Film,
    Check,
    Bookmark,
    MoreHorizontal,
    UserPlus,
    UserCheck,
} from "lucide-react-native";
import { httpClient } from "@/lib/api/http";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useThemeStore, useAuthStore } from "@/lib/store";
import { colors } from "@/lib/theme";
import { createConversation } from "@/lib/api/conversations";
import { checkShortlist, addToShortlist, removeFromShortlist } from "@/lib/api/shortlist";
import { getServices, Service } from "@/lib/api/services";
import { getUser } from "@/lib/api/users";
import { toast } from "@/lib/ui/toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    location: string | null;
    role: string;
}

export default function ProfileDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { isDark } = useThemeStore();
    const { user: currentUser } = useAuthStore();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [messagingLoading, setMessagingLoading] = useState(false);
    const [isShortlisted, setIsShortlisted] = useState(false);
    const [shortlistLoading, setShortlistLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    const bgColor = isDark ? "#121210" : "#F5F3EE";
    const textColor = isDark ? "#FFF" : "#000";
    const mutedColor = "#8E8E8A";
    const cardBg = isDark ? "rgba(28,28,26,0.88)" : "rgba(255,255,255,0.88)";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(214,210,200,0.6)";
    const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

    const isOwnProfile = currentUser?.id === id;

    // Fetch profile and shortlist status
    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch user profile and their services in parallel
                const [userResponse, servicesResponse] = await Promise.all([
                    getUser(id),
                    getServices({ userId: id, limit: 10 }),
                ]);

                setProfile(userResponse);
                setServices(servicesResponse.services);

                // Fetch follow counts
                const [followers, following] = await Promise.all([
                    getFollowerCount(id),
                    getFollowingCount(id),
                ]);
                setFollowerCount(followers);
                setFollowingCount(following);

                // Check shortlist + follow status (only if not own profile)
                if (!isOwnProfile) {
                    try {
                        const [shortlistStatus, followStatus] = await Promise.all([
                            checkShortlist(id),
                            checkIsFollowing(id),
                        ]);
                        setIsShortlisted(shortlistStatus.shortlisted);
                        setIsFollowing(followStatus);
                    } catch {
                        // Ignore check errors
                    }
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to load profile";
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, isOwnProfile]);

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleMessage = async () => {
        if (!id || messagingLoading) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setMessagingLoading(true);

        try {
            const conversation = await createConversation(id);
            router.push(`/conversation/${conversation.id}`);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to start conversation";
            toast.error(message);
        } finally {
            setMessagingLoading(false);
        }
    };

    const handleToggleShortlist = async () => {
        if (!id || shortlistLoading) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShortlistLoading(true);

        try {
            if (isShortlisted) {
                await removeFromShortlist(id);
                setIsShortlisted(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                await addToShortlist(id);
                setIsShortlisted(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update saved status";
            toast.error(message);
        } finally {
            setShortlistLoading(false);
        }
    };

    const handleServicePress = (serviceId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/service/${serviceId}`);
    };

    const handleToggleFollow = async () => {
        if (!id || followLoading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFollowLoading(true);
        try {
            const nowFollowing = await toggleFollow(id);
            setIsFollowing(nowFollowing);
            setFollowerCount((c) => nowFollowing ? c + 1 : Math.max(0, c - 1));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
            toast.error("Failed to update follow status");
        } finally {
            setFollowLoading(false);
        }
    };

    const handleBlock = async () => {
        try {
            await httpClient.post("/api/security/block", { targetId: id });
            toast.success("User blocked");
            router.back();
        } catch (e) {
            toast.error("Failed to block user");
        }
    };

    const handleReport = async (reason: string) => {
        try {
            await httpClient.post("/api/security/report", { targetId: id, reason });
            toast.success("Report submitted");
        } catch (e) {
            toast.error("Failed to report user");
        }
    };

    const handleOptions = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
            "User Options",
            `Manage interactions with ${profile?.name || "this user"}`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Report User",
                    style: "destructive",
                    onPress: () => {
                        Alert.alert("Report Reason", "Why are you reporting this user?", [
                            { text: "Cancel", style: "cancel" },
                            { text: "Spam", onPress: () => handleReport("Spam") },
                            { text: "Inappropriate Content", onPress: () => handleReport("Inappropriate Content") },
                            { text: "Harassment", onPress: () => handleReport("Harassment") },
                        ]);
                    },
                },
                {
                    text: "Block User",
                    style: "destructive",
                    onPress: () => {
                        Alert.alert("Block User", "Are you sure? You won't see their content anymore.", [
                            { text: "Cancel", style: "cancel" },
                            { text: "Block", style: "destructive", onPress: handleBlock },
                        ]);
                    },
                },
            ]
        );
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
    if (error || !profile) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <SafeAreaView style={styles.header}>
                    <Pressable onPress={handleClose} style={styles.closeButtonAlt}>
                        <X size={24} color={textColor} strokeWidth={2.5} />
                    </Pressable>
                </SafeAreaView>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorTitle, { color: textColor }]}>
                        {error || "Profile not found"}
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

    const displayName = profile.name || profile.email.split("@")[0];

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Cover Image (placeholder gradient) */}
                <View style={[styles.coverContainer, { backgroundColor: colors.primary }]}>
                    {/* Header */}
                    <SafeAreaView style={styles.headerOverlay}>
                        <Pressable onPress={handleClose} style={styles.closeButton}>
                            <X size={24} color="#FFF" strokeWidth={2.5} />
                        </Pressable>
                        <View style={styles.headerRight}>
                            {!isOwnProfile && (
                                <View style={{ flexDirection: "row", gap: 8 }}>
                                    <Pressable
                                        onPress={handleToggleShortlist}
                                        disabled={shortlistLoading}
                                        style={[styles.headerButton, shortlistLoading && { opacity: 0.6 }]}
                                    >
                                        {shortlistLoading ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <Bookmark
                                                size={20}
                                                color="#FFF"
                                                fill={isShortlisted ? "#FFF" : "transparent"}
                                                strokeWidth={2}
                                            />
                                        )}
                                    </Pressable>
                                    <Pressable
                                        onPress={handleOptions}
                                        style={styles.headerButton}
                                    >
                                        <MoreHorizontal size={20} color="#FFF" />
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    </SafeAreaView>
                </View>

                {/* Profile Content */}
                <View style={styles.profileContent}>
                    {/* Avatar & Basic Info */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            {profile.avatarUrl ? (
                                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    <Text style={styles.avatarText}>
                                        {displayName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            {profile.role === "FREELANCER" && (
                                <View style={styles.verifiedBadge}>
                                    <Check size={14} color="#FFF" strokeWidth={3} />
                                </View>
                            )}
                        </View>

                        <View style={styles.nameSection}>
                            <Text style={[styles.displayName, { color: textColor }]}>
                                {displayName}
                            </Text>
                            <Text style={[styles.username, { color: mutedColor }]}>
                                @{profile.email.split("@")[0]}
                            </Text>
                        </View>
                    </View>

                    {/* Location */}
                    {profile.location && (
                        <View style={styles.metaRow}>
                            <View style={styles.locationContainer}>
                                <MapPin size={16} color={mutedColor} strokeWidth={2} />
                                <Text style={[styles.locationText, { color: mutedColor }]}>
                                    {profile.location}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Bio */}
                    {profile.bio && (
                        <Text style={[styles.bio, { color: textColor }]}>{profile.bio}</Text>
                    )}

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={[styles.statItem, { backgroundColor: inputBg }]}>
                            <Text style={[styles.statValue, { color: textColor }]}>
                                {followerCount}
                            </Text>
                            <Text style={[styles.statLabel, { color: mutedColor }]}>Followers</Text>
                        </View>
                        <View style={[styles.statItem, { backgroundColor: inputBg }]}>
                            <Text style={[styles.statValue, { color: textColor }]}>
                                {followingCount}
                            </Text>
                            <Text style={[styles.statLabel, { color: mutedColor }]}>Following</Text>
                        </View>
                        <View style={[styles.statItem, { backgroundColor: inputBg }]}>
                            <Text style={[styles.statValue, { color: textColor }]}>
                                {services.length}
                            </Text>
                            <Text style={[styles.statLabel, { color: mutedColor }]}>Services</Text>
                        </View>
                    </View>

                    {/* Actions - only for other profiles */}
                    {!isOwnProfile && (
                        <View style={styles.actionsRow}>
                            <Pressable
                                onPress={handleToggleFollow}
                                disabled={followLoading}
                                style={[
                                    styles.followButton,
                                    isFollowing && styles.followingButton,
                                    followLoading && { opacity: 0.6 },
                                ]}
                            >
                                {followLoading ? (
                                    <ActivityIndicator size="small" color={isFollowing ? "#FFF" : colors.primary} />
                                ) : (
                                    <>
                                        {isFollowing ? (
                                            <UserCheck size={18} color="#FFF" strokeWidth={2} />
                                        ) : (
                                            <UserPlus size={18} color={colors.primary} strokeWidth={2} />
                                        )}
                                        <Text style={[styles.followButtonText, { color: isFollowing ? "#FFF" : colors.primary }]}>
                                            {isFollowing ? "Following" : "Follow"}
                                        </Text>
                                    </>
                                )}
                            </Pressable>
                            <Pressable
                                onPress={handleMessage}
                                disabled={messagingLoading}
                                style={[styles.messageButton, messagingLoading && { opacity: 0.6 }]}
                            >
                                {messagingLoading ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <>
                                        <MessageCircle size={20} color={colors.primary} strokeWidth={2} />
                                        <Text style={[styles.messageButtonText, { color: colors.primary }]}>
                                            Message
                                        </Text>
                                    </>
                                )}
                            </Pressable>
                            <Pressable
                                onPress={handleToggleShortlist}
                                disabled={shortlistLoading}
                                style={[
                                    styles.saveButton,
                                    isShortlisted && styles.savedButton,
                                    shortlistLoading && { opacity: 0.6 },
                                ]}
                            >
                                {shortlistLoading ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={isShortlisted ? "#FFF" : colors.primary}
                                    />
                                ) : (
                                    <>
                                        <Bookmark
                                            size={20}
                                            color={isShortlisted ? "#FFF" : colors.primary}
                                            fill={isShortlisted ? "#FFF" : "transparent"}
                                            strokeWidth={2}
                                        />
                                        <Text
                                            style={[
                                                styles.saveButtonText,
                                                { color: isShortlisted ? "#FFF" : colors.primary },
                                            ]}
                                        >
                                            {isShortlisted ? "Saved" : "Save"}
                                        </Text>
                                    </>
                                )}
                            </Pressable>
                        </View>
                    )}

                    {/* Services */}
                    {services.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(100).springify()}>
                            <View style={styles.sectionHeader}>
                                <Briefcase size={18} color={textColor} strokeWidth={2} />
                                <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>
                                    Services
                                </Text>
                            </View>
                            {services.map((service) => (
                                <Pressable
                                    key={service.id}
                                    onPress={() => handleServicePress(service.id)}
                                    style={[styles.serviceCard, { backgroundColor: cardBg, borderColor }]}
                                >
                                    {service.imageUrl ? (
                                        <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} />
                                    ) : (
                                        <View
                                            style={[
                                                styles.serviceImage,
                                                styles.servicePlaceholder,
                                                { backgroundColor: colors.primary },
                                            ]}
                                        >
                                            <Text style={styles.servicePlaceholderText}>
                                                {service.category.charAt(0)}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.serviceInfo}>
                                        <Text style={[styles.serviceTitle, { color: textColor }]} numberOfLines={2}>
                                            {service.title}
                                        </Text>
                                        <Text style={styles.servicePrice}>From {service.priceFormatted}</Text>
                                    </View>
                                </Pressable>
                            ))}
                        </Animated.View>
                    )}

                    {/* Empty services state for freelancers */}
                    {services.length === 0 && profile.role === "FREELANCER" && (
                        <View style={styles.emptyServices}>
                            <Briefcase size={32} color={mutedColor} strokeWidth={1.5} />
                            <Text style={[styles.emptyText, { color: mutedColor }]}>
                                No services listed yet
                            </Text>
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
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
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 20,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
    coverContainer: {
        height: 180,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    headerOverlay: {
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
        gap: 8,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.4)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
    closeButtonAlt: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.4)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
    profileContent: {
        padding: 20,
        marginTop: -50,
    },
    avatarSection: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 16,
    },
    avatarContainer: {
        position: "relative",
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: "#111111",
    },
    avatarPlaceholder: {
        backgroundColor: "#111111",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: "#FFF",
        fontSize: 40,
        fontWeight: "700",
    },
    verifiedBadge: {
        position: "absolute",
        bottom: 4,
        right: 4,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: "#111111",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#FFF",
    },
    nameSection: {
        marginLeft: 16,
        paddingBottom: 8,
    },
    displayName: {
        fontSize: 24,
        fontWeight: "800",
    },
    username: {
        fontSize: 15,
        fontWeight: "500",
        marginTop: 2,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
        marginBottom: 16,
    },
    locationContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    locationText: {
        fontSize: 14,
        fontWeight: "500",
    },
    bio: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: "500",
    },
    actionsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 28,
    },
    messageButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    messageButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    saveButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    savedButton: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    followButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    followingButton: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    followButtonText: {
        fontSize: 15,
        fontWeight: "600",
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 14,
    },
    serviceCard: {
        flexDirection: "row",
        borderRadius: 14,
        borderWidth: 1,
        overflow: "hidden",
        marginBottom: 12,
    },
    serviceImage: {
        width: 100,
        height: 80,
    },
    servicePlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    servicePlaceholderText: {
        color: "#FFF",
        fontSize: 24,
        fontWeight: "700",
    },
    serviceInfo: {
        flex: 1,
        padding: 12,
        justifyContent: "center",
    },
    serviceTitle: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 6,
    },
    servicePrice: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.primary,
    },
    emptyServices: {
        alignItems: "center",
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
    },
});
