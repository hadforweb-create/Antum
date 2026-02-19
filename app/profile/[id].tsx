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
    ArrowLeft,
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
    Globe,
} from "lucide-react-native";
import { httpClient } from "@/lib/api/http";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { useAuthStore } from "@/lib/store";
import { createConversation } from "@/lib/api/conversations";
import { checkShortlist, addToShortlist, removeFromShortlist } from "@/lib/api/shortlist";
import { getServices, Service } from "@/lib/api/services";
import { getUser } from "@/lib/api/users";
import { getUserReviews, type Review } from "@/lib/api/reviews";
import { getUserSkills } from "@/lib/api/skills";
import { PortfolioGrid, PortfolioItem } from "@/components/PortfolioGrid";
import ReviewCard from "@/components/ReviewCard";
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
const INPUT_BG = "rgba(255,255,255,0.06)";

interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    location: string | null;
    role: string;
    website?: string | null;
}

export default function ProfileDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
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
    const [activeTab, setActiveTab] = useState<"portfolio" | "services" | "reviews">("portfolio");
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsFetched, setReviewsFetched] = useState(false);
    const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);

    const isOwnProfile = currentUser?.id === id;

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [userResponse, servicesResponse] = await Promise.all([
                    getUser(id),
                    getServices({ userId: id, limit: 10 }),
                ]);

                setProfile(userResponse);
                setServices(servicesResponse.services);

                const [followers, following] = await Promise.all([
                    getFollowerCount(id),
                    getFollowingCount(id),
                ]);
                setFollowerCount(followers);
                setFollowingCount(following);

                // Fetch skills
                getUserSkills(id)
                    .then((res) => setSkills(res.skills || []))
                    .catch(() => { });

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

    // Lazy-load reviews on first tab switch
    useEffect(() => {
        if (activeTab !== "reviews" || reviewsFetched || !id) return;
        setReviewsLoading(true);
        getUserReviews(id)
            .then((res) => setReviews(res.reviews || []))
            .catch(() => { })
            .finally(() => {
                setReviewsLoading(false);
                setReviewsFetched(true);
            });
    }, [activeTab, reviewsFetched, id]);

    const handleBack = () => {
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
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.headerBar}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <ArrowLeft size={22} color={TEXT} strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={ACCENT} />
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error || !profile) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.headerBar}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <ArrowLeft size={22} color={TEXT} strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>
                        {error || "Profile not found"}
                    </Text>
                    <Pressable onPress={handleBack} style={styles.retryButton}>
                        <Text style={styles.retryText}>Go Back</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const displayName = profile.name || profile.email.split("@")[0];

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.headerBar}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={22} color={TEXT} strokeWidth={2} />
                </Pressable>
                <Text style={styles.headerTitle}>Profile</Text>
                {!isOwnProfile ? (
                    <Pressable onPress={handleOptions} style={styles.backButton}>
                        <MoreHorizontal size={22} color={TEXT} strokeWidth={2} />
                    </Pressable>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Profile Card */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                    <View style={styles.profileCard}>
                        {/* Avatar */}
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
                                    <Check size={12} color={BG} strokeWidth={3} />
                                </View>
                            )}
                        </View>

                        {/* Name & Role */}
                        <Text style={styles.displayName}>{displayName}</Text>
                        <Text style={styles.roleText}>
                            {profile.role === "FREELANCER" ? "Freelancer" : "Employer"}
                        </Text>

                        {/* Location & Website */}
                        <View style={styles.metaRow}>
                            {profile.location && (
                                <View style={styles.metaItem}>
                                    <MapPin size={14} color={TEXT_MUTED} strokeWidth={2} />
                                    <Text style={styles.metaText}>{profile.location}</Text>
                                </View>
                            )}
                            {profile.website && (
                                <View style={styles.metaItem}>
                                    <Globe size={14} color={ACCENT} strokeWidth={2} />
                                    <Text style={[styles.metaText, { color: ACCENT }]}>{profile.website}</Text>
                                </View>
                            )}
                        </View>

                        {/* Bio */}
                        {profile.bio && (
                            <Text style={styles.bio}>{profile.bio}</Text>
                        )}

                        {/* Action Buttons */}
                        {!isOwnProfile && (
                            <View style={styles.actionsRow}>
                                <Pressable
                                    onPress={handleMessage}
                                    disabled={messagingLoading}
                                    style={[styles.messageBtn, messagingLoading && { opacity: 0.6 }]}
                                >
                                    {messagingLoading ? (
                                        <ActivityIndicator size="small" color={BG} />
                                    ) : (
                                        <Text style={styles.messageBtnText}>Message</Text>
                                    )}
                                </Pressable>
                                <Pressable
                                    onPress={handleToggleFollow}
                                    disabled={followLoading}
                                    style={[
                                        styles.followBtn,
                                        isFollowing && styles.followingBtn,
                                        followLoading && { opacity: 0.6 },
                                    ]}
                                >
                                    {followLoading ? (
                                        <ActivityIndicator size="small" color={isFollowing ? BG : TEXT} />
                                    ) : (
                                        <Text style={[styles.followBtnText, isFollowing && { color: BG }]}>
                                            {isFollowing ? "Following" : "Follow"}
                                        </Text>
                                    )}
                                </Pressable>
                            </View>
                        )}

                        {/* Stats */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}K` : followerCount}
                                </Text>
                                <Text style={styles.statLabel}>Followers</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {followingCount >= 1000 ? `${(followingCount / 1000).toFixed(1)}K` : followingCount}
                                </Text>
                                <Text style={styles.statLabel}>Following</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{services.length}</Text>
                                <Text style={styles.statLabel}>Projects</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Tabs */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                    <View style={styles.tabsContainer}>
                        {(["portfolio", "services", "reviews"] as const).map((tab) => (
                            <Pressable
                                key={tab}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setActiveTab(tab);
                                }}
                                style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>

                {/* Tab Content */}
                {activeTab === "portfolio" && (
                    <Animated.View entering={FadeIn.duration(300)} style={styles.tabContent}>
                        {services.length > 0 ? (
                            <PortfolioGrid
                                items={services.map((service) => ({
                                    id: service.id,
                                    title: service.title,
                                    thumbnail: service.imageUrl || "https://via.placeholder.com/400",
                                    category: service.category,
                                    priceFormatted: service.priceFormatted,
                                }))}
                                numColumns={2}
                                onItemPress={(item) => handleServicePress(item.id)}
                            />
                        ) : (
                            <View style={styles.emptyState}>
                                <Briefcase size={32} color={TEXT_MUTED} strokeWidth={1.5} />
                                <Text style={styles.emptyText}>No portfolio items yet</Text>
                            </View>
                        )}
                    </Animated.View>
                )}

                {activeTab === "services" && (
                    <Animated.View entering={FadeIn.duration(300)} style={styles.tabContent}>
                        {services.length > 0 ? (
                            services.map((service, idx) => (
                                <Pressable
                                    key={service.id}
                                    onPress={() => handleServicePress(service.id)}
                                    style={styles.serviceCard}
                                >
                                    {service.imageUrl ? (
                                        <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} contentFit="cover" />
                                    ) : (
                                        <View style={[styles.serviceImage, styles.servicePlaceholder]}>
                                            <Briefcase size={20} color={TEXT_MUTED} />
                                        </View>
                                    )}
                                    <View style={styles.serviceInfo}>
                                        <Text style={styles.serviceTitle} numberOfLines={1}>{service.title}</Text>
                                        <Text style={styles.serviceCategory}>{service.category}</Text>
                                        <Text style={styles.servicePrice}>{service.priceFormatted}</Text>
                                    </View>
                                </Pressable>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Briefcase size={32} color={TEXT_MUTED} strokeWidth={1.5} />
                                <Text style={styles.emptyText}>No services listed yet</Text>
                            </View>
                        )}
                    </Animated.View>
                )}

                {activeTab === "reviews" && (
                    <Animated.View entering={FadeIn.duration(300)} style={styles.tabContent}>
                        {reviewsLoading ? (
                            <View style={{ padding: 40, alignItems: "center" }}>
                                <ActivityIndicator color={ACCENT} />
                            </View>
                        ) : reviews.length > 0 ? (
                            reviews.map((review) => (
                                <ReviewCard key={review.id} review={review} />
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Star size={32} color={TEXT_MUTED} strokeWidth={1.5} />
                                <Text style={styles.emptyText}>No reviews yet</Text>
                            </View>
                        )}
                    </Animated.View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
    },
    headerBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        backgroundColor: ELEVATED,
        borderWidth: 1,
        borderColor: BORDER,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "900",
        color: TEXT,
        letterSpacing: -0.3,
    },
    scrollView: {
        flex: 1,
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
        marginBottom: 20,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: ACCENT,
    },
    retryText: {
        color: BG,
        fontSize: 16,
        fontWeight: "800",
    },
    profileCard: {
        margin: 16,
        padding: 24,
        borderRadius: 22,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: "center",
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 16,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 3,
        borderColor: ACCENT,
    },
    avatarPlaceholder: {
        backgroundColor: ELEVATED,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: ACCENT,
        fontSize: 36,
        fontWeight: "700",
    },
    verifiedBadge: {
        position: "absolute",
        bottom: 2,
        right: 2,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: ACCENT,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: SURFACE,
    },
    displayName: {
        fontSize: 24,
        fontWeight: "900",
        color: TEXT,
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    roleText: {
        fontSize: 15,
        fontWeight: "500",
        color: TEXT_MUTED,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginBottom: 12,
        flexWrap: "wrap",
        justifyContent: "center",
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    metaText: {
        fontSize: 14,
        fontWeight: "500",
        color: TEXT_MUTED,
    },
    bio: {
        fontSize: 15,
        lineHeight: 22,
        color: TEXT_SEC,
        textAlign: "center",
        marginBottom: 16,
    },
    actionsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
        width: "100%",
    },
    messageBtn: {
        flex: 1,
        backgroundColor: ACCENT,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
    },
    messageBtnText: {
        color: BG,
        fontSize: 16,
        fontWeight: "800",
    },
    followBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "transparent",
    },
    followingBtn: {
        backgroundColor: ACCENT,
        borderColor: ACCENT,
    },
    followBtnText: {
        color: TEXT,
        fontSize: 16,
        fontWeight: "700",
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: BORDER,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: BORDER,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "800",
        color: TEXT,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: TEXT_MUTED,
    },
    tabsContainer: {
        flexDirection: "row",
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 4,
        borderRadius: 14,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
    },
    tabPill: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
    },
    tabPillActive: {
        backgroundColor: ACCENT,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: TEXT_MUTED,
    },
    tabTextActive: {
        color: BG,
        fontWeight: "800",
    },
    tabContent: {
        paddingHorizontal: 16,
    },
    serviceCard: {
        flexDirection: "row",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: SURFACE,
        overflow: "hidden",
        marginBottom: 12,
    },
    serviceImage: {
        width: 100,
        height: 80,
    },
    servicePlaceholder: {
        backgroundColor: ELEVATED,
        alignItems: "center",
        justifyContent: "center",
    },
    serviceInfo: {
        flex: 1,
        padding: 12,
        justifyContent: "center",
    },
    serviceTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: TEXT,
        marginBottom: 4,
    },
    serviceCategory: {
        fontSize: 13,
        color: TEXT_MUTED,
        marginBottom: 4,
    },
    servicePrice: {
        fontSize: 14,
        fontWeight: "800",
        color: ACCENT,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        color: TEXT_MUTED,
    },
});
