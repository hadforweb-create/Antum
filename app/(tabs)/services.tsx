import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withDelay,
    runOnJS,
} from "react-native-reanimated";

import { useAuthStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { getReels } from "@/lib/api/reels";
import { toggleLike, checkIsLiked, getLikeCount, toggleFollow, checkIsFollowing } from "@/lib/api/social";
import { toast } from "@/lib/ui/toast";
import { useThemeColors } from "@/lib/hooks/useThemeColors";


const { width: W, height: H } = Dimensions.get("window");

function ReelCard({
    item,
    isActive,
    currentUserId,
    isMuted,
    onToggleMute,
}: {
    item: any;
    isActive: boolean;
    currentUserId?: string;
    isMuted: boolean;
    onToggleMute: () => void;
}) {
    const router = useRouter();
    const { t } = useTranslation();
    const c = useThemeColors();
    const videoRef = useRef<Video>(null);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [likeLoading, setLikeLoading] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [following, setFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [paused, setPaused] = useState(false);
    const lastTap = useRef(0);
    const heartScale = useSharedValue(0);

    useEffect(() => {
        if (!item?.id) return;
        checkIsLiked("reel", item.id).then(setLiked).catch(() => { });
        getLikeCount("reel", item.id).then(setLikeCount).catch(() => { });
        if (item.userId && item.userId !== currentUserId) {
            checkIsFollowing(item.userId).then(setFollowing).catch(() => { });
        }
    }, [item?.id]);

    const handleLike = async () => {
        if (likeLoading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setLikeLoading(true);
        const prev = liked;
        setLiked(!prev);
        setLikeCount((c) => c + (prev ? -1 : 1));
        try {
            await toggleLike("reel", item.id);
        } catch {
            setLiked(prev);
            setLikeCount((c) => c + (prev ? 1 : -1));
        } finally {
            setLikeLoading(false);
        }
    };

    const handleFollow = async () => {
        if (followLoading || !item.userId || item.userId === currentUserId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFollowLoading(true);
        const prev = following;
        setFollowing(!prev);
        try {
            await toggleFollow(item.userId);
        } catch {
            setFollowing(prev);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleBookmark = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setBookmarked((b) => !b);
    };

    const handleHire = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (item.serviceId) {
            router.push(`/service/${item.serviceId}` as any);
        } else if (item.userId) {
            router.push(`/profile/${item.userId}` as any);
        }
    };

    const handleUserPress = () => {
        if (item.userId) router.push(`/profile/${item.userId}` as any);
    };

    const viewCount = item.viewCount || Math.floor(Math.random() * 20000) + 1000;
    const formatCount = (n: number) => n > 999 ? `${(n / 1000).toFixed(1)}K` : `${n}`;

    // Video autoplay / pause
    const isVideo = item.mediaUrl && (item.mediaUrl.endsWith(".mp4") || item.mediaUrl.endsWith(".mov") || item.mediaType === "video");

    useEffect(() => {
        if (!videoRef.current || !isVideo) return;
        if (isActive && !paused) {
            videoRef.current.playAsync().catch(() => { });
        } else {
            videoRef.current.pauseAsync().catch(() => { });
        }
    }, [isActive, paused, isVideo]);

    // Double-tap to like
    const handleTap = () => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            // Double tap — like
            if (!liked) handleLike();
            heartScale.value = withSequence(
                withSpring(1.2, { damping: 4 }),
                withDelay(400, withSpring(0))
            );
        } else {
            // Single tap — toggle pause
            setPaused(p => !p);
        }
        lastTap.current = now;
    };

    const heartAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }],
        opacity: heartScale.value > 0 ? 1 : 0,
    }));

    return (
        <Pressable onPress={handleTap} style={[styles.reelCard, { width: W, height: H }]}>
            {/* Background media */}
            {isVideo ? (
                <Video
                    ref={videoRef}
                    source={{ uri: item.mediaUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode={ResizeMode.COVER}
                    isLooping
                    isMuted={isMuted}
                    shouldPlay={isActive && !paused}
                />
            ) : item.mediaUrl ? (
                <Image
                    source={{ uri: item.mediaUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={300}
                />
            ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: c.surface }]} />
            )}


            {/* Double-tap heart */}
            <Animated.View style={[styles.doubleTapHeart, heartAnimatedStyle]} pointerEvents="none">
                <Ionicons name="heart" size={80} color="#fff" />
            </Animated.View>

            {/* Paused indicator */}
            {paused && isActive && (
                <View style={styles.pausedOverlay} pointerEvents="none">
                    <Ionicons name="play" size={64} color="rgba(255,255,255,0.7)" />
                </View>
            )}

            {/* Top gradient */}
            <LinearGradient
                colors={["rgba(0,0,0,0.5)", "transparent"]}
                style={styles.topGradient}
            />
            {/* Bottom gradient */}
            <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.85)"]}
                style={styles.bottomGradient}
            />

            {/* Right side actions */}
            <View style={styles.sideActions}>
                {/* Avatar */}
                {/* Avatar */}
                <Pressable onPress={handleUserPress} style={styles.avatarBtn}>
                    <View style={[styles.avatar, { borderColor: c.text, backgroundColor: c.elevated }]}>
                        {item.user?.avatarUrl ? (
                            <Image
                                source={{ uri: item.user.avatarUrl }}
                                style={{ width: "100%", height: "100%" }}
                                contentFit="cover"
                            />
                        ) : (
                            <Text style={[styles.avatarInitial, { color: c.text }]}>
                                {(item.user?.displayName || "U")[0]}
                            </Text>
                        )}
                    </View>
                    {/* Follow dot below avatar */}
                    {!following && item.userId !== currentUserId && (
                        <Pressable onPress={handleFollow} style={[styles.followDot, { backgroundColor: c.accent, borderColor: c.bg }]}>
                            <Ionicons name="add" size={10} color="#000" />
                        </Pressable>
                    )}
                </Pressable>

                {/* View count at top */}
                <View style={styles.actionBtn}>
                    <Ionicons name="eye-outline" size={24} color={c.text} />
                    <Text style={[styles.actionCount, { color: c.text }]}>{formatCount(viewCount)}</Text>
                </View>

                {/* Like */}
                <Pressable onPress={handleLike} style={styles.actionBtn}>
                    <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={28}
                        color={liked ? "#ff4444" : c.text}
                    />
                    <Text style={[styles.actionCount, { color: c.text }]}>
                        {formatCount(likeCount)}
                    </Text>
                </Pressable>

                {/* Comment */}
                <Pressable
                    onPress={() => router.push(`/reel/${item.id}` as any)}
                    style={styles.actionBtn}
                >
                    <Ionicons name="chatbubble-outline" size={26} color={c.text} />
                    <Text style={[styles.actionCount, { color: c.text }]}>
                        {item.commentCount || "0"}
                    </Text>
                </Pressable>

                {/* Bookmark */}
                <Pressable onPress={handleBookmark} style={styles.actionBtn}>
                    <Ionicons
                        name={bookmarked ? "bookmark" : "bookmark-outline"}
                        size={26}
                        color={bookmarked ? c.accent : c.text}
                    />
                </Pressable>

                {/* Share */}
                <Pressable style={styles.actionBtn}>
                    <Ionicons name="share-outline" size={26} color={c.text} />
                </Pressable>

                {/* Mute toggle */}
                <Pressable onPress={onToggleMute} style={styles.actionBtn}>
                    <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={24} color={c.text} />
                </Pressable>
            </View>

            {/* Bottom info */}
            <View style={styles.bottomInfo}>
                {/* User info row */}
                <Pressable onPress={handleUserPress} style={styles.userRow}>
                    <Text style={[styles.username, { color: c.text }]}>
                        {item.user?.displayName || "Creator"}
                    </Text>
                    {item.user?.verified && (
                        <Ionicons name="checkmark-circle" size={16} color={c.accent} />
                    )}
                </Pressable>

                {/* User role/profession */}
                <Text style={[styles.userRole, { color: c.textMuted }]}>
                    {item.user?.role === "EMPLOYER" ? "Employer" : "Brand Designer"}
                </Text>

                {/* Follow pill button */}
                {!following && item.userId !== currentUserId && (
                    <Pressable onPress={handleFollow} style={[styles.followPill, { backgroundColor: c.accent }]}>
                        <Text style={styles.followPillText}>{t("reels.follow")}</Text>
                    </Pressable>
                )}
                {following && (
                    <Pressable onPress={handleFollow} style={[styles.followPill, styles.followingPill, { borderColor: "rgba(255,255,255,0.3)" }]}>
                        <Text style={[styles.followPillText, { color: c.text }]}>{t("reels.following")}</Text>
                    </Pressable>
                )}

                {/* Caption */}
                {item.caption && (
                    <Text style={[styles.caption, { color: c.textSecondary }]} numberOfLines={2}>
                        {item.caption}
                    </Text>
                )}

                {/* Tags */}
                {item.tags && (
                    <Text style={[styles.tags, { color: c.accent }]} numberOfLines={1}>
                        {item.tags.map((t: string) => `#${t}`).join(" ")}
                    </Text>
                )}

                {/* Service card if linked */}
                {(item.serviceTitle || item.service) && (
                    <View style={[styles.serviceCard, { backgroundColor: c.isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.8)", borderColor: c.border }]}>
                        <View style={styles.serviceCardInfo}>
                            {/* Studio name */}
                            <Text style={[styles.serviceStudioName, { color: c.textMuted }]}>
                                {item.user?.displayName || "Aesthetic Vibes"} - Studio
                            </Text>
                            <Text style={[styles.serviceCardTitle, { color: c.text }]} numberOfLines={1}>
                                {item.serviceTitle || item.service?.title}
                            </Text>
                            <Text style={[styles.serviceCardPrice, { color: c.textMuted }]}>
                                From ${item.servicePrice || item.service?.price || "—"}
                            </Text>
                        </View>
                        <Pressable onPress={handleHire} style={[styles.hireBtn, { backgroundColor: c.accent, shadowColor: c.accent }]}>
                            <Text style={styles.hireBtnText}>{t("reels.hire")}</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </Pressable>
    );
}

export default function ReelsTab() {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const c = useThemeColors();
    const [reels, setReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);

    const toggleMute = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsMuted(m => !m);
    }, []);

    const fetchReels = useCallback(async (p = 1) => {
        try {
            const res = await getReels({ limit: 10 });
            const data = res.items || [];
            if (p === 1) {
                setReels(data);
            } else {
                setReels((prev) => [...prev, ...data]);
            }
            setHasMore(res.hasMore ?? data.length === 10);
        } catch (e: any) {
            toast.error(e?.message || t("common.error"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReels(1);
    }, []);

    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index !== null) {
                setActiveIndex(viewableItems[0].index);
            }
        },
        []
    );

    const loadMore = () => {
        if (!hasMore || loading) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchReels(nextPage);
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: c.bg, justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator color={c.accent} size="large" />
            </View>
        );
    }

    if (reels.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: c.bg, justifyContent: "center", alignItems: "center" }]}>
                <Ionicons name="videocam-outline" size={48} color={c.textMuted} />
                <Text style={{ color: c.textMuted, marginTop: 12, fontSize: 16 }}>
                    {t("reels.noReels")}
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: c.bg }]}>
            <FlatList
                data={reels}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <ReelCard
                        item={item}
                        isActive={index === activeIndex}
                        currentUserId={user?.id}
                        isMuted={isMuted}
                        onToggleMute={toggleMute}
                    />
                )}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={H}
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
            />

            {/* Header overlay */}
            <SafeAreaView edges={["top"]} style={styles.headerOverlay} pointerEvents="none">
                <Text style={[styles.headerTitle, { color: c.text }]}>{t("reels.title")}</Text>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerOverlay: {
        position: "absolute", top: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingTop: 8,
    },
    headerTitle: {
        fontSize: 17, fontWeight: "900",
        textAlign: "center", letterSpacing: -0.3,
    },

    reelCard: { position: "relative" },

    topGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 120 },
    bottomGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 300 },

    sideActions: {
        position: "absolute", right: 16, bottom: 220,
        alignItems: "center", gap: 18,
    },
    avatarBtn: { alignItems: "center", marginBottom: 4 },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        overflow: "hidden",
        borderWidth: 2,
        justifyContent: "center", alignItems: "center",
    },
    avatarInitial: { fontSize: 18, fontWeight: "700" },
    followDot: {
        position: "absolute", bottom: -6,
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 2,
        justifyContent: "center", alignItems: "center",
    },
    actionBtn: { alignItems: "center", gap: 4 },
    actionCount: { fontSize: 12, fontWeight: "700" },

    bottomInfo: {
        position: "absolute", bottom: 100, left: 16, right: 80,
    },
    userRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
    username: { fontSize: 15, fontWeight: "800" },
    userRole: { fontSize: 12, fontWeight: "500", marginBottom: 8 },

    // Follow pill
    followPill: {
        alignSelf: "flex-start",
        borderRadius: 99,
        paddingHorizontal: 16, paddingVertical: 6,
        marginBottom: 10,
    },
    followPillText: { color: "#000", fontSize: 10, fontWeight: "900", letterSpacing: 0.3 },
    followingPill: {
        backgroundColor: "transparent",
        borderWidth: 1,
    },

    caption: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
    tags: { fontSize: 13, fontWeight: "600", marginBottom: 12 },

    serviceCard: {
        flexDirection: "row", alignItems: "center",
        borderRadius: 14,
        padding: 10, gap: 12,
        borderWidth: 1,
    },
    serviceCardInfo: { flex: 1 },
    serviceStudioName: { fontSize: 10, fontWeight: "600", marginBottom: 2 },
    serviceCardTitle: { fontSize: 13, fontWeight: "800", marginBottom: 2 },
    serviceCardPrice: { fontSize: 12, fontWeight: "500" },
    hireBtn: {
        paddingHorizontal: 16, paddingVertical: 9,
        borderRadius: 10,
        shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
    },
    hireBtnText: { color: "#0b0b0f", fontSize: 13, fontWeight: "800" },

    // Video overlays
    doubleTapHeart: {
        position: "absolute", top: "40%", alignSelf: "center",
        shadowColor: "#ff4444", shadowOpacity: 0.6, shadowRadius: 20, elevation: 10,
    },
    pausedOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center", alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.2)",
    },
});
