import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    Image,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useAuthStore } from "@/lib/store";
import { getServices } from "@/lib/api/services";
import { toast } from "@/lib/ui/toast";

const { width: W } = Dimensions.get("window");

// Figma Premium Freelance Marketplace design tokens
const BG = "#0b0b0f";
const SURFACE = "#131316";
const ELEVATED = "#1a1a1e";
const ACCENT = "#a3ff3f";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const TEXT_SUBTLE = "rgba(255,255,255,0.3)";
const BORDER = "rgba(255,255,255,0.06)";

const CATEGORIES = ["All", "Design", "Dev", "Marketing", "Writing", "Video", "3D", "AI"];

const TOP_CREATORS = [
    { id: "1", name: "Sarah M.", category: "Brand", initials: "SM", verified: true },
    { id: "2", name: "Alex K.", category: "Dev", initials: "AK", verified: true },
    { id: "3", name: "Maya P.", category: "Marketing", initials: "MP", verified: false },
    { id: "4", name: "Jordan L.", category: "3D", initials: "JL", verified: true },
    { id: "5", name: "Emma D.", category: "Video", initials: "ED", verified: false },
    { id: "6", name: "Alex R.", category: "AI", initials: "AR", verified: true },
];

// Popular Categories from Figma layout.builder (7)
const POPULAR_CATEGORIES = [
    { emoji: "🎨", title: "Brand Design", count: "2.4K" },
    { emoji: "💻", title: "Web Dev", count: "1.8K" },
    { emoji: "🤖", title: "AI / ML", count: "956" },
    { emoji: "🎬", title: "Video Edit", count: "1.2K" },
];

// Trending badge types from Figma
const BADGE_TYPES = ["Trending", "Hot", "New"] as const;

export default function DiscoverTab() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [selectedCat, setSelectedCat] = useState("All");
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchServices = useCallback(async (category?: string) => {
        try {
            const params: any = { page: 1, limit: 10 };
            if (category && category !== "All") params.category = category.toUpperCase();
            const res = await getServices(params);
            setServices(res.services || []);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load services");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchServices(selectedCat);
    }, [selectedCat]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchServices(selectedCat);
    }, [selectedCat]);

    const handleCategoryPress = (cat: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedCat(cat);
    };

    const featured = services[0];
    const trending = services.slice(1, 4);
    const recentlyViewed = services.slice(0, 5);

    return (
        <View style={styles.container}>
            <SafeAreaView edges={["top"]} style={styles.headerWrap}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeLabel}>Welcome back</Text>
                        <Text style={styles.screenTitle}>Discover</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <Pressable style={styles.iconBtn} onPress={() => router.push("/search" as any)}>
                            <Ionicons name="search-outline" size={20} color={TEXT_SEC} />
                        </Pressable>
                        <Pressable style={styles.iconBtn} onPress={() => router.push("/notifications" as any)}>
                            <Ionicons name="notifications-outline" size={20} color={TEXT_SEC} />
                            <View style={styles.notifDot} />
                        </Pressable>
                    </View>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.catScroll}
                >
                    {CATEGORIES.map((cat) => (
                        <Pressable
                            key={cat}
                            onPress={() => handleCategoryPress(cat)}
                            style={[styles.catPill, selectedCat === cat && styles.catPillActive]}
                        >
                            <Text style={[styles.catText, selectedCat === cat && styles.catTextActive]}>
                                {cat}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </SafeAreaView>

            {loading ? (
                <View style={styles.loadingCenter}>
                    <ActivityIndicator color={ACCENT} size="large" />
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
                    }
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Featured */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <Ionicons name="sparkles" size={14} color={ACCENT} />
                                <Text style={styles.sectionTitle}>Featured</Text>
                            </View>
                        </View>

                        {featured ? (
                            <Pressable
                                onPress={() => router.push(`/service/${featured.id}` as any)}
                                style={styles.featuredCard}
                            >
                                {featured.imageUrl ? (
                                    <Image source={{ uri: featured.imageUrl }} style={styles.featuredImage} resizeMode="cover" />
                                ) : (
                                    <LinearGradient colors={["#1a2a10", "#0b150a"]} style={styles.featuredImage} />
                                )}
                                <LinearGradient
                                    colors={["transparent", "rgba(0,0,0,0.7)"]}
                                    style={styles.featuredOverlay}
                                />
                                <View style={styles.featuredBadge}>
                                    <Ionicons name="flash" size={8} color="#000" />
                                    <Text style={styles.featuredBadgeText}>FEATURED</Text>
                                </View>
                                <View style={styles.featuredPrice}>
                                    <Text style={styles.featuredPriceText}>
                                        {featured.priceFormatted || `$${featured.price}`}
                                    </Text>
                                </View>
                                <View style={styles.featuredContent}>
                                    <Text style={styles.featuredTitle} numberOfLines={1}>{featured.title}</Text>
                                    <View style={styles.featuredMeta}>
                                        <View style={styles.avatarXS}>
                                            <Text style={styles.avatarXSText}>
                                                {(featured.user?.displayName || "U")[0]}
                                            </Text>
                                        </View>
                                        <Text style={styles.featuredCreator}>
                                            {featured.user?.displayName || "Creator"}
                                        </Text>
                                        <Ionicons name="checkmark-circle" size={14} color={ACCENT} />
                                        <View style={styles.ratingRow}>
                                            <Ionicons name="star" size={12} color={ACCENT} />
                                            <Text style={styles.ratingText}>4.9</Text>
                                        </View>
                                    </View>
                                </View>
                            </Pressable>
                        ) : (
                            <View style={styles.emptyCard}>
                                <Ionicons name="briefcase-outline" size={28} color={TEXT_MUTED} />
                                <Text style={{ color: TEXT_MUTED, marginTop: 8, fontSize: 14 }}>
                                    No services yet
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Top Creators */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Top Creators</Text>
                            <Pressable>
                                <Text style={styles.seeAll}>See all</Text>
                            </Pressable>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 20, paddingRight: 20 }}
                        >
                            {TOP_CREATORS.map((creator) => (
                                <Pressable key={creator.id} style={styles.creatorCard}>
                                    <View style={styles.creatorAvatarWrap}>
                                        <View style={styles.creatorAvatar}>
                                            <Text style={styles.creatorInitials}>{creator.initials}</Text>
                                        </View>
                                        {creator.verified && (
                                            <View style={styles.verifiedBadge}>
                                                <Ionicons name="checkmark-sharp" size={8} color="#000" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.creatorName}>{creator.name}</Text>
                                    <Text style={styles.creatorCat}>{creator.category}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Trending Now — with badges */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <Ionicons name="flame" size={14} color="#f97316" />
                                <Text style={styles.sectionTitle}>Trending Now</Text>
                            </View>
                            <Pressable onPress={() => router.push("/(tabs)/services" as any)}>
                                <Text style={styles.seeAll}>View all</Text>
                            </Pressable>
                        </View>

                        {trending.length > 0 ? trending.map((svc, idx) => (
                            <Pressable
                                key={svc.id}
                                style={styles.trendingCard}
                                onPress={() => router.push(`/service/${svc.id}` as any)}
                            >
                                <View style={styles.trendingImgWrap}>
                                    {svc.imageUrl ? (
                                        <Image source={{ uri: svc.imageUrl }} style={styles.trendingImg} resizeMode="cover" />
                                    ) : (
                                        <LinearGradient colors={["#1a2a10", "#0b150a"]} style={styles.trendingImg} />
                                    )}
                                    {/* Trending badge */}
                                    <View style={[
                                        styles.trendingBadge,
                                        idx === 1 && { backgroundColor: "#ef4444" },
                                        idx === 2 && { backgroundColor: "#3b82f6" },
                                    ]}>
                                        <Text style={styles.trendingBadgeText}>
                                            {BADGE_TYPES[idx % BADGE_TYPES.length]}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.trendingInfo}>
                                    <Text style={styles.trendingTitle} numberOfLines={2}>{svc.title}</Text>
                                    <Text style={styles.trendingCat}>{svc.category}</Text>
                                    <View style={styles.trendingMeta}>
                                        <View style={styles.ratingRow}>
                                            <Ionicons name="star" size={11} color={ACCENT} />
                                            <Text style={styles.ratingText}>4.8</Text>
                                        </View>
                                        <Text style={styles.trendingPrice}>
                                            {svc.priceFormatted || `$${Math.round(svc.price / 100)}`}
                                        </Text>
                                    </View>
                                </View>
                                {/* Bookmark button */}
                                <Pressable style={styles.trendingBookmark}>
                                    <Ionicons name="bookmark-outline" size={16} color={TEXT_MUTED} />
                                </Pressable>
                            </Pressable>
                        )) : (
                            <Text style={{ color: TEXT_MUTED }}>No services in this category</Text>
                        )}
                    </View>

                    {/* Recently Viewed */}
                    {recentlyViewed.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <Ionicons name="time-outline" size={14} color={TEXT_SEC} />
                                    <Text style={styles.sectionTitle}>Recently Viewed</Text>
                                </View>
                                <Pressable>
                                    <Text style={styles.seeAll}>See all</Text>
                                </Pressable>
                            </View>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                            >
                                {recentlyViewed.map((svc) => (
                                    <Pressable
                                        key={svc.id}
                                        style={styles.recentCard}
                                        onPress={() => router.push(`/service/${svc.id}` as any)}
                                    >
                                        {svc.imageUrl ? (
                                            <Image source={{ uri: svc.imageUrl }} style={styles.recentImg} resizeMode="cover" />
                                        ) : (
                                            <LinearGradient colors={["#1a2a10", "#0b150a"]} style={styles.recentImg} />
                                        )}
                                        <LinearGradient
                                            colors={["transparent", "rgba(0,0,0,0.75)"]}
                                            style={styles.recentOverlay}
                                        />
                                        {/* Bookmark */}
                                        <Pressable style={styles.recentBookmark}>
                                            <Ionicons name="bookmark-outline" size={14} color={TEXT} />
                                        </Pressable>
                                        <View style={styles.recentInfo}>
                                            <Text style={styles.recentTitle} numberOfLines={2}>{svc.title}</Text>
                                            <View style={styles.recentMeta}>
                                                <Text style={styles.recentCreator} numberOfLines={1}>
                                                    {svc.user?.displayName || "Creator"}
                                                </Text>
                                                <Text style={styles.recentPrice}>
                                                    {svc.priceFormatted || `$${Math.round((svc.price || 0) / 100)}`}
                                                </Text>
                                            </View>
                                        </View>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Popular Categories — 2×2 grid from Figma */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Popular Categories</Text>
                        </View>
                        <View style={styles.catGrid}>
                            {POPULAR_CATEGORIES.map((cat) => (
                                <Pressable key={cat.title} style={styles.catGridItem}>
                                    <Text style={styles.catGridEmoji}>{cat.emoji}</Text>
                                    <Text style={styles.catGridTitle}>{cat.title}</Text>
                                    <Text style={styles.catGridCount}>{cat.count}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* FAB for Create */}
                    <View style={{ height: 100 }} />
                </ScrollView>
            )}

            {/* Floating Action Button — Create */}
            <Pressable
                style={styles.fab}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push("/(tabs)/create" as any);
                }}
            >
                <LinearGradient
                    colors={[ACCENT, "#84cc16"]}
                    style={styles.fabGrad}
                >
                    <Ionicons name="add" size={28} color="#0b0b0f" />
                </LinearGradient>
            </Pressable>
        </View>
    );
}

const RECENT_W = 160;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    headerWrap: { backgroundColor: BG, borderBottomWidth: 1, borderBottomColor: BORDER },
    header: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    },
    welcomeLabel: {
        color: TEXT_MUTED, fontSize: 12, fontWeight: "600",
        textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2,
    },
    screenTitle: { color: TEXT, fontSize: 28, fontWeight: "900", letterSpacing: -0.6 },
    headerActions: { flexDirection: "row", gap: 10 },
    iconBtn: {
        width: 40, height: 40, borderRadius: 14, backgroundColor: ELEVATED,
        justifyContent: "center", alignItems: "center",
        borderWidth: 1, borderColor: BORDER, position: "relative",
    },
    notifDot: {
        position: "absolute", top: 9, right: 9, width: 7, height: 7,
        borderRadius: 4, backgroundColor: ACCENT,
        shadowColor: ACCENT, shadowOpacity: 0.9, shadowRadius: 6, elevation: 3,
    },
    catScroll: { paddingHorizontal: 20, paddingBottom: 14, gap: 8 },
    catPill: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99,
        backgroundColor: ELEVATED, borderWidth: 1, borderColor: BORDER,
    },
    catPillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
    catText: { color: TEXT_SEC, fontSize: 13, fontWeight: "700" },
    catTextActive: { color: "#0b0b0f" },
    loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingTop: 20 },
    section: { paddingHorizontal: 20, marginBottom: 32 },
    sectionHeader: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", marginBottom: 14,
    },
    sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    sectionTitle: { color: TEXT, fontSize: 18, fontWeight: "900", letterSpacing: -0.3 },
    seeAll: { color: ACCENT, fontSize: 13, fontWeight: "700" },

    // Featured card
    featuredCard: {
        borderRadius: 24, overflow: "hidden",
        shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5, shadowRadius: 24, elevation: 8,
    },
    featuredImage: { width: "100%", height: 200 },
    featuredOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
    featuredBadge: {
        position: "absolute", top: 14, left: 14,
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: ACCENT, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4,
    },
    featuredBadgeText: { color: "#000", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
    featuredPrice: {
        position: "absolute", top: 14, right: 14,
        backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 99,
        paddingHorizontal: 12, paddingVertical: 6,
        borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    },
    featuredPriceText: { color: TEXT, fontSize: 13, fontWeight: "900" },
    featuredContent: { backgroundColor: SURFACE, paddingHorizontal: 16, paddingVertical: 14 },
    featuredTitle: { color: TEXT, fontSize: 17, fontWeight: "900", marginBottom: 8 },
    featuredMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
    avatarXS: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: ACCENT, justifyContent: "center", alignItems: "center",
    },
    avatarXSText: { color: "#000", fontSize: 9, fontWeight: "800" },
    featuredCreator: { color: TEXT_SEC, fontSize: 13, fontWeight: "600", flex: 1 },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
    ratingText: { color: TEXT_MUTED, fontSize: 12, fontWeight: "600" },

    // Creator cards
    creatorCard: { alignItems: "center", width: 72 },
    creatorAvatarWrap: { position: "relative", marginBottom: 8 },
    creatorAvatar: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: ELEVATED,
        justifyContent: "center", alignItems: "center",
        borderWidth: 1, borderColor: BORDER,
    },
    creatorInitials: { color: TEXT, fontSize: 16, fontWeight: "700" },
    verifiedBadge: {
        position: "absolute", bottom: -2, right: -2,
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: ACCENT, borderWidth: 2, borderColor: BG,
        justifyContent: "center", alignItems: "center",
    },
    creatorName: { color: TEXT_SEC, fontSize: 11, fontWeight: "700", textAlign: "center" },
    creatorCat: { color: TEXT_SUBTLE, fontSize: 10, fontWeight: "500", textAlign: "center" },

    // Trending cards
    trendingCard: {
        flexDirection: "row", backgroundColor: SURFACE, borderRadius: 18,
        borderWidth: 1, borderColor: BORDER, overflow: "hidden", marginBottom: 10,
    },
    trendingImgWrap: { width: 90, height: 90, position: "relative" },
    trendingImg: { width: 90, height: 90 },
    trendingBadge: {
        position: "absolute", top: 6, left: 6,
        backgroundColor: ACCENT, borderRadius: 6,
        paddingHorizontal: 6, paddingVertical: 2,
    },
    trendingBadgeText: { color: "#000", fontSize: 8, fontWeight: "900", letterSpacing: 0.3 },
    trendingInfo: { flex: 1, padding: 12, justifyContent: "space-between" },
    trendingTitle: { color: TEXT, fontSize: 14, fontWeight: "900", lineHeight: 18 },
    trendingCat: { color: TEXT_SUBTLE, fontSize: 11, fontWeight: "600" },
    trendingMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    trendingPrice: { color: ACCENT, fontSize: 14, fontWeight: "900" },
    trendingBookmark: {
        padding: 12, justifyContent: "center", alignItems: "center",
    },

    // Recently Viewed — horizontal scroll cards
    recentCard: {
        width: RECENT_W, height: RECENT_W * 1.25, borderRadius: 18,
        overflow: "hidden", position: "relative",
    },
    recentImg: { width: "100%", height: "100%" },
    recentOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: "60%" },
    recentBookmark: {
        position: "absolute", top: 8, right: 8,
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center",
    },
    recentInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 10 },
    recentTitle: { color: TEXT, fontSize: 12, fontWeight: "800", marginBottom: 4 },
    recentMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    recentCreator: { color: TEXT_SEC, fontSize: 10, fontWeight: "600", flex: 1, marginRight: 6 },
    recentPrice: { color: ACCENT, fontSize: 11, fontWeight: "900" },

    // Popular Categories — 2×2 grid
    catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    catGridItem: {
        width: (W - 52) / 2, backgroundColor: SURFACE, borderRadius: 18,
        padding: 16, borderWidth: 1, borderColor: BORDER,
    },
    catGridEmoji: { fontSize: 28, marginBottom: 10 },
    catGridTitle: { color: TEXT, fontSize: 15, fontWeight: "800", marginBottom: 4 },
    catGridCount: { color: TEXT_MUTED, fontSize: 13, fontWeight: "600" },

    // Empty state
    emptyCard: {
        height: 180, borderRadius: 24, backgroundColor: SURFACE,
        justifyContent: "center", alignItems: "center",
        borderWidth: 1, borderColor: BORDER,
    },

    // FAB
    fab: {
        position: "absolute", bottom: 100, right: 20,
        shadowColor: ACCENT, shadowOpacity: 0.4, shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 }, elevation: 8,
    },
    fabGrad: {
        width: 56, height: 56, borderRadius: 28,
        justifyContent: "center", alignItems: "center",
    },
});
