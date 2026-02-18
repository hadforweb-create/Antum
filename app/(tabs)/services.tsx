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
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useAuthStore } from "@/lib/store";
import { getReels } from "@/lib/api/reels";
import { toggleLike, checkIsLiked, getLikeCount } from "@/lib/api/social";
import { toast } from "@/lib/ui/toast";

const { width: W, height: H } = Dimensions.get("window");

const BG = "#0b0b0f";
const ACCENT = "#a3ff3f";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";

function ReelCard({
    item,
    isActive,
    currentUserId,
}: {
    item: any;
    isActive: boolean;
    currentUserId?: string;
}) {
    const router = useRouter();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [likeLoading, setLikeLoading] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);

    useEffect(() => {
        if (!item?.id) return;
        checkIsLiked("reel", item.id).then(setLiked).catch(() => {});
        getLikeCount("reel", item.id).then(setLikeCount).catch(() => {});
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

    return (
        <View style={[styles.reelCard, { width: W, height: H }]}>
            {/* Background media */}
            {item.mediaUrl ? (
                <Image
                    source={{ uri: item.mediaUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={300}
                />
            ) : (
                <LinearGradient
                    colors={["#1a2a10", "#0b0b0f", "#0d0d12"]}
                    style={StyleSheet.absoluteFill}
                />
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
                <Pressable onPress={handleUserPress} style={styles.avatarBtn}>
                    <View style={styles.avatar}>
                        {item.user?.avatarUrl ? (
                            <Image
                                source={{ uri: item.user.avatarUrl }}
                                style={{ width: "100%", height: "100%" }}
                                contentFit="cover"
                            />
                        ) : (
                            <Text style={styles.avatarInitial}>
                                {(item.user?.displayName || "U")[0]}
                            </Text>
                        )}
                    </View>
                    <View style={styles.followDot}>
                        <Ionicons name="add" size={10} color="#000" />
                    </View>
                </Pressable>

                {/* Like */}
                <Pressable onPress={handleLike} style={styles.actionBtn}>
                    <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={28}
                        color={liked ? "#ff4444" : TEXT}
                    />
                    <Text style={styles.actionCount}>
                        {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
                    </Text>
                </Pressable>

                {/* Comment */}
                <Pressable
                    onPress={() => router.push(`/reel/${item.id}` as any)}
                    style={styles.actionBtn}
                >
                    <Ionicons name="chatbubble-outline" size={26} color={TEXT} />
                    <Text style={styles.actionCount}>
                        {item.commentCount || "0"}
                    </Text>
                </Pressable>

                {/* Bookmark */}
                <Pressable onPress={handleBookmark} style={styles.actionBtn}>
                    <Ionicons
                        name={bookmarked ? "bookmark" : "bookmark-outline"}
                        size={26}
                        color={bookmarked ? ACCENT : TEXT}
                    />
                </Pressable>

                {/* Share */}
                <Pressable style={styles.actionBtn}>
                    <Ionicons name="share-outline" size={26} color={TEXT} />
                </Pressable>
            </View>

            {/* Bottom info */}
            <View style={styles.bottomInfo}>
                {/* User info */}
                <Pressable onPress={handleUserPress} style={styles.userRow}>
                    <Text style={styles.username}>
                        {item.user?.displayName || "Creator"}
                    </Text>
                    {item.user?.verified && (
                        <Ionicons name="checkmark-circle" size={16} color={ACCENT} />
                    )}
                </Pressable>

                {/* Caption */}
                {item.caption && (
                    <Text style={styles.caption} numberOfLines={2}>
                        {item.caption}
                    </Text>
                )}

                {/* Tags */}
                {item.tags && (
                    <Text style={styles.tags} numberOfLines={1}>
                        {item.tags.map((t: string) => `#${t}`).join(" ")}
                    </Text>
                )}

                {/* Service card if linked */}
                {(item.serviceTitle || item.service) && (
                    <View style={styles.serviceCard}>
                        <View style={styles.serviceCardInfo}>
                            <Text style={styles.serviceCardTitle} numberOfLines={1}>
                                {item.serviceTitle || item.service?.title}
                            </Text>
                            <Text style={styles.serviceCardPrice}>
                                From ${item.servicePrice || item.service?.price || "—"}
                            </Text>
                        </View>
                        <Pressable onPress={handleHire} style={styles.hireBtn}>
                            <Text style={styles.hireBtnText}>Hire</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </View>
    );
}

export default function ReelsTab() {
    const { user } = useAuthStore();
    const [reels, setReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    const fetchReels = useCallback(async (p = 1) => {
        try {
            const res = await getReels({ page: p, limit: 10 });
            const data = res.reels || res.data || [];
            if (p === 1) {
                setReels(data);
            } else {
                setReels((prev) => [...prev, ...data]);
            }
            setHasMore(data.length === 10);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load reels");
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
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator color={ACCENT} size="large" />
            </View>
        );
    }

    if (reels.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <Ionicons name="videocam-outline" size={48} color={TEXT_MUTED} />
                <Text style={{ color: TEXT_MUTED, marginTop: 12, fontSize: 16 }}>
                    No reels yet
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={reels}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <ReelCard item={item} isActive={index === activeIndex} currentUserId={user?.id} />
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
                <Text style={styles.headerTitle}>Reels</Text>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    headerOverlay: {
        position: "absolute", top: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingTop: 8,
    },
    headerTitle: {
        color: TEXT, fontSize: 17, fontWeight: "900",
        textAlign: "center", letterSpacing: -0.3,
    },

    reelCard: { position: "relative" },

    topGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 120 },
    bottomGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 300 },

    sideActions: {
        position: "absolute", right: 16, bottom: 200,
        alignItems: "center", gap: 20,
    },
    avatarBtn: { alignItems: "center", marginBottom: 4 },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: "#1a1a1e", overflow: "hidden",
        borderWidth: 2, borderColor: TEXT,
        justifyContent: "center", alignItems: "center",
    },
    avatarInitial: { color: TEXT, fontSize: 18, fontWeight: "700" },
    followDot: {
        position: "absolute", bottom: -6,
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: ACCENT, borderWidth: 2, borderColor: BG,
        justifyContent: "center", alignItems: "center",
    },
    actionBtn: { alignItems: "center", gap: 4 },
    actionCount: { color: TEXT, fontSize: 12, fontWeight: "700" },

    bottomInfo: {
        position: "absolute", bottom: 100, left: 16, right: 80,
    },
    userRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
    username: { color: TEXT, fontSize: 15, fontWeight: "800" },
    caption: { color: TEXT_SEC, fontSize: 14, lineHeight: 20, marginBottom: 6 },
    tags: { color: ACCENT, fontSize: 13, fontWeight: "600", marginBottom: 12 },

    serviceCard: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 14,
        padding: 10, gap: 12,
        borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    },
    serviceCardInfo: { flex: 1 },
    serviceCardTitle: { color: TEXT, fontSize: 13, fontWeight: "800", marginBottom: 2 },
    serviceCardPrice: { color: TEXT_MUTED, fontSize: 12, fontWeight: "500" },
    hireBtn: {
        backgroundColor: ACCENT, paddingHorizontal: 16, paddingVertical: 9,
        borderRadius: 10,
        shadowColor: ACCENT, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
    },
    hireBtnText: { color: "#0b0b0f", fontSize: 13, fontWeight: "800" },
});
