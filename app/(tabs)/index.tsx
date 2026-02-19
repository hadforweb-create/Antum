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
import { useTranslation } from "@/lib/i18n";

import { useThemeColors } from "@/lib/hooks/useThemeColors";

const { width: W } = Dimensions.get("window");

const CATEGORY_KEYS = ["all", "design", "dev", "marketing", "writing", "video", "3d", "ai"];


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
    { emoji: "🎨", key: "design", count: "2.4K" },
    { emoji: "💻", key: "dev", count: "1.8K" },
    { emoji: "🤖", key: "ai", count: "956" },
    { emoji: "🎬", key: "video", count: "1.2K" },
];

// Trending badge types from Figma
const BADGE_KEYS = ["trending", "hot", "new"] as const;


export default function DiscoverTab() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const c = useThemeColors();
    const [selectedCat, setSelectedCat] = useState("all");

    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchServices = useCallback(async (category?: string) => {
        try {
            const params: any = { page: 1, limit: 10 };
            if (category && category !== "all") params.category = category.toUpperCase();

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
        <View style={[styles.container, { backgroundColor: c.bg }]}>
            <SafeAreaView edges={["top"]} style={[styles.headerWrap, { backgroundColor: c.bg, borderBottomColor: c.border }]}>
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.welcomeLabel, { color: c.textMuted }]}>{t("home.welcomeBack")}</Text>
                        <Text style={[styles.screenTitle, { color: c.text }]}>{t("home.discover")}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <Pressable style={[styles.iconBtn, { backgroundColor: c.elevated, borderColor: c.border }]} onPress={() => router.push("/search" as any)}>
                            <Ionicons name="search-outline" size={20} color={c.textSecondary} />
                        </Pressable>
                        <Pressable style={[styles.iconBtn, { backgroundColor: c.elevated, borderColor: c.border }]} onPress={() => router.push("/notifications" as any)}>
                            <Ionicons name="notifications-outline" size={20} color={c.textSecondary} />
                            <View style={[styles.notifDot, { backgroundColor: c.accent, shadowColor: c.accent }]} />
                        </Pressable>
                    </View>
                </View>


                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.catScroll}
                >
                    {CATEGORY_KEYS.map((catKey) => {
                        const isActive = selectedCat === catKey;
                        return (
                            <Pressable
                                key={catKey}
                                onPress={() => handleCategoryPress(catKey)}
                                style={[
                                    styles.catPill,
                                    { backgroundColor: c.elevated, borderColor: c.border },
                                    isActive && { backgroundColor: c.accent, borderColor: c.accent }
                                ]}
                            >
                                <Text style={[
                                    styles.catText,
                                    { color: c.textSecondary },
                                    isActive && { color: "#0b0b0f" }
                                ]}>
                                    {t(`home.categories.${catKey}`)}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

            </SafeAreaView>

            {loading ? (
                <View style={styles.loadingCenter}>
                    <ActivityIndicator color={c.accent} size="large" />
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
                    }

                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Featured */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <Ionicons name="sparkles" size={14} color={c.accent} />
                                <Text style={[styles.sectionTitle, { color: c.text }]}>{t("home.featured")}</Text>
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
                                    <View style={[styles.featuredImage, { backgroundColor: c.elevated }]} />
                                )}
                                <LinearGradient
                                    colors={["transparent", "rgba(0,0,0,0.7)"]}
                                    style={styles.featuredOverlay}
                                />
                                <View style={[styles.featuredBadge, { backgroundColor: c.accent }]}>
                                    <Ionicons name="flash" size={8} color="#000" />
                                    <Text style={styles.featuredBadgeText}>{t("home.featured").toUpperCase()}</Text>
                                </View>
                                <View style={[styles.featuredPrice, { borderColor: "rgba(255,255,255,0.15)" }]}>
                                    <Text style={[styles.featuredPriceText, { color: "#FFFFFF" }]}>
                                        {featured.priceFormatted || `$${featured.price}`}
                                    </Text>
                                </View>
                                <View style={[styles.featuredContent, { backgroundColor: c.surface }]}>
                                    <Text style={[styles.featuredTitle, { color: c.text }]} numberOfLines={1}>{featured.title}</Text>
                                    <View style={styles.featuredMeta}>
                                        <View style={[styles.avatarXS, { backgroundColor: c.accent }]}>
                                            <Text style={styles.avatarXSText}>
                                                {(featured.user?.displayName || "U")[0]}
                                            </Text>
                                        </View>
                                        <Text style={[styles.featuredCreator, { color: c.textSecondary }]}>
                                            {featured.user?.displayName || "Creator"}
                                        </Text>
                                        <Ionicons name="checkmark-circle" size={14} color={c.accent} />
                                        <View style={styles.ratingRow}>
                                            <Ionicons name="star" size={12} color={c.accent} />
                                            <Text style={[styles.ratingText, { color: c.textMuted }]}>4.9</Text>
                                        </View>
                                    </View>
                                </View>
                            </Pressable>
                        ) : (
                            <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                                <Ionicons name="briefcase-outline" size={28} color={c.textMuted} />
                                <Text style={{ color: c.textMuted, marginTop: 8, fontSize: 14 }}>
                                    {t("home.noServices")}
                                </Text>

                            </View>
                        )}
                    </View>

                    {/* Top Creators */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: c.text }]}>{t("home.topCreators")}</Text>
                            <Pressable>
                                <Text style={[styles.seeAll, { color: c.accent }]}>{t("common.seeAll")}</Text>
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
                                        <View style={[styles.creatorAvatar, { backgroundColor: c.elevated, borderColor: c.border }]}>
                                            <Text style={[styles.creatorInitials, { color: c.text }]}>{creator.initials}</Text>
                                        </View>
                                        {creator.verified && (
                                            <View style={[styles.verifiedBadge, { backgroundColor: c.accent, borderColor: c.bg }]}>
                                                <Ionicons name="checkmark-sharp" size={8} color="#000" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.creatorName, { color: c.textSecondary }]}>{creator.name}</Text>
                                    <Text style={[styles.creatorCat, { color: c.textSubtle }]}>{creator.category}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                    </View>

                    {/* Trending Now — with badges */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <Ionicons name="flame" size={14} color="#f97316" />
                                <Text style={[styles.sectionTitle, { color: c.text }]}>{t("home.trendingNow")}</Text>
                            </View>
                            <Pressable onPress={() => router.push("/(tabs)/services" as any)}>
                                <Text style={[styles.seeAll, { color: c.accent }]}>{t("common.viewAll")}</Text>
                            </Pressable>
                        </View>


                        {trending.length > 0 ? trending.map((svc, idx) => (
                            <Pressable
                                key={svc.id}
                                style={[styles.trendingCard, { backgroundColor: c.surface, borderColor: c.border }]}
                                onPress={() => router.push(`/service/${svc.id}` as any)}
                            >
                                <View style={styles.trendingImgWrap}>
                                    {svc.imageUrl ? (
                                        <Image source={{ uri: svc.imageUrl }} style={styles.trendingImg} resizeMode="cover" />
                                    ) : (
                                        <View style={[styles.trendingImg, { backgroundColor: c.elevated }]} />
                                    )}
                                    {/* Trending badge */}
                                    <View style={[
                                        styles.trendingBadge,
                                        { backgroundColor: c.accent },
                                        idx === 1 && { backgroundColor: "#ef4444" },
                                        idx === 2 && { backgroundColor: "#3b82f6" },
                                    ]}>
                                        <Text style={styles.trendingBadgeText}>
                                            {t(`home.badges.${BADGE_KEYS[idx % BADGE_KEYS.length]}`)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.trendingInfo}>
                                    <Text style={[styles.trendingTitle, { color: c.text }]} numberOfLines={2}>{svc.title}</Text>
                                    <Text style={[styles.trendingCat, { color: c.textSubtle }]}>{svc.category}</Text>
                                    <View style={styles.trendingMeta}>
                                        <View style={styles.ratingRow}>
                                            <Ionicons name="star" size={11} color={c.accent} />
                                            <Text style={[styles.ratingText, { color: c.textMuted }]}>4.8</Text>
                                        </View>
                                        <Text style={[styles.trendingPrice, { color: c.accent }]}>
                                            {svc.priceFormatted || `$${Math.round(svc.price / 100)}`}
                                        </Text>
                                    </View>
                                </View>
                                {/* Bookmark button */}
                                <Pressable style={styles.trendingBookmark}>
                                    <Ionicons name="bookmark-outline" size={16} color={c.textMuted} />
                                </Pressable>
                            </Pressable>
                        )) : (
                            <Text style={{ color: c.textMuted }}>{t("home.noServicesCategory")}</Text>
                        )}

                    </View>

                    {/* Recently Viewed */}
                    {recentlyViewed.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <Ionicons name="time-outline" size={14} color={c.textSecondary} />
                                    <Text style={[styles.sectionTitle, { color: c.text }]}>{t("home.recentlyViewed")}</Text>
                                </View>
                                <Pressable>
                                    <Text style={[styles.seeAll, { color: c.accent }]}>{t("common.seeAll")}</Text>
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
                                            <View style={[styles.recentImg, { backgroundColor: c.elevated }]} />
                                        )}
                                        <LinearGradient
                                            colors={["transparent", "rgba(0,0,0,0.75)"]}
                                            style={styles.recentOverlay}
                                        />
                                        {/* Bookmark */}
                                        <Pressable style={styles.recentBookmark}>
                                            <Ionicons name="bookmark-outline" size={14} color="#FFFFFF" />
                                        </Pressable>
                                        <View style={styles.recentInfo}>
                                            <Text style={[styles.recentTitle, { color: "#FFFFFF" }]} numberOfLines={2}>{svc.title}</Text>
                                            <View style={styles.recentMeta}>
                                                <Text style={[styles.recentCreator, { color: "rgba(255,255,255,0.7)" }]} numberOfLines={1}>
                                                    {svc.user?.displayName || "Creator"}
                                                </Text>
                                                <Text style={[styles.recentPrice, { color: c.accent }]}>
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
                            <Text style={[styles.sectionTitle, { color: c.text }]}>{t("home.popularCategories")}</Text>
                        </View>
                        <View style={styles.catGrid}>
                            {POPULAR_CATEGORIES.map((cat) => (
                                <Pressable key={cat.key} style={[styles.catGridItem, { backgroundColor: c.surface, borderColor: c.border }]}>
                                    <Text style={styles.catGridEmoji}>{cat.emoji}</Text>
                                    <Text style={[styles.catGridTitle, { color: c.text }]}>{t(`home.categories.${cat.key}`)}</Text>
                                    <Text style={[styles.catGridCount, { color: c.textMuted }]}>{cat.count}</Text>
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
                    colors={[c.accent, c.accentDark]}
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
    container: { flex: 1 },
    headerWrap: { borderBottomWidth: 1 },
    header: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    },
    welcomeLabel: {
        fontSize: 12, fontWeight: "600",
        textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2,
    },
    screenTitle: { fontSize: 28, fontWeight: "900", letterSpacing: -0.6 },
    headerActions: { flexDirection: "row", gap: 10 },
    iconBtn: {
        width: 40, height: 40, borderRadius: 14,
        justifyContent: "center", alignItems: "center",
        borderWidth: 1, position: "relative",
    },
    notifDot: {
        position: "absolute", top: 9, right: 9, width: 7, height: 7,
        borderRadius: 4,
        shadowOpacity: 0.9, shadowRadius: 6, elevation: 3,
    },
    catScroll: { paddingHorizontal: 20, paddingBottom: 14, gap: 8 },
    catPill: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99,
        borderWidth: 1,
    },
    //@ts-ignore - unused but kept for potential revert or ref
    catPillActive: {},
    catText: { fontSize: 13, fontWeight: "700" },
    //@ts-ignore
    catTextActive: {},
    loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingTop: 20 },
    section: { paddingHorizontal: 20, marginBottom: 32 },
    sectionHeader: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", marginBottom: 14,
    },
    sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    sectionTitle: { fontSize: 18, fontWeight: "900", letterSpacing: -0.3 },
    seeAll: { fontSize: 13, fontWeight: "700" },

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
        borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4,
    },
    featuredBadgeText: { color: "#000", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
    featuredPrice: {
        position: "absolute", top: 14, right: 14,
        backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 99,
        paddingHorizontal: 12, paddingVertical: 6,
        borderWidth: 1,
    },
    featuredPriceText: { fontSize: 13, fontWeight: "900" },
    featuredContent: { paddingHorizontal: 16, paddingVertical: 14 },
    featuredTitle: { fontSize: 17, fontWeight: "900", marginBottom: 8 },
    featuredMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
    avatarXS: {
        width: 22, height: 22, borderRadius: 11,
        justifyContent: "center", alignItems: "center",
    },
    avatarXSText: { color: "#000", fontSize: 9, fontWeight: "800" },
    featuredCreator: { fontSize: 13, fontWeight: "600", flex: 1 },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
    ratingText: { fontSize: 12, fontWeight: "600" },

    // Creator cards
    creatorCard: { alignItems: "center", width: 72 },
    creatorAvatarWrap: { position: "relative", marginBottom: 8 },
    creatorAvatar: {
        width: 56, height: 56, borderRadius: 28,
        justifyContent: "center", alignItems: "center",
        borderWidth: 1,
    },
    creatorInitials: { fontSize: 16, fontWeight: "700" },
    verifiedBadge: {
        position: "absolute", bottom: -2, right: -2,
        width: 18, height: 18, borderRadius: 9,
        borderWidth: 2,
        justifyContent: "center", alignItems: "center",
    },
    creatorName: { fontSize: 11, fontWeight: "700", textAlign: "center" },
    creatorCat: { fontSize: 10, fontWeight: "500", textAlign: "center" },

    // Trending cards
    trendingCard: {
        flexDirection: "row", borderRadius: 18,
        borderWidth: 1, overflow: "hidden", marginBottom: 10,
    },
    trendingImgWrap: { width: 90, height: 90, position: "relative" },
    trendingImg: { width: 90, height: 90 },
    trendingBadge: {
        position: "absolute", top: 6, left: 6,
        borderRadius: 6,
        paddingHorizontal: 6, paddingVertical: 2,
    },
    trendingBadgeText: { color: "#000", fontSize: 8, fontWeight: "900", letterSpacing: 0.3 },
    trendingInfo: { flex: 1, padding: 12, justifyContent: "space-between" },
    trendingTitle: { fontSize: 14, fontWeight: "900", lineHeight: 18 },
    trendingCat: { fontSize: 11, fontWeight: "600" },
    trendingMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    trendingPrice: { fontSize: 14, fontWeight: "900" },
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
    recentTitle: { fontSize: 12, fontWeight: "800", marginBottom: 4 },
    recentMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    recentCreator: { fontSize: 10, fontWeight: "600", flex: 1, marginRight: 6 },
    recentPrice: { fontSize: 11, fontWeight: "900" },

    // Popular Categories — 2×2 grid
    catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    catGridItem: {
        width: (W - 52) / 2, borderRadius: 18,
        padding: 16, borderWidth: 1,
    },
    catGridEmoji: { fontSize: 28, marginBottom: 10 },
    catGridTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
    catGridCount: { fontSize: 13, fontWeight: "600" },

    // Empty state
    emptyCard: {
        height: 180, borderRadius: 24,
        justifyContent: "center", alignItems: "center",
        borderWidth: 1,
    },

    // FAB
    fab: {
        position: "absolute", bottom: 100, right: 20,
        shadowOpacity: 0.4, shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 }, elevation: 8,
    },
    fabGrad: {
        width: 56, height: 56, borderRadius: 28,
        justifyContent: "center", alignItems: "center",
    },
});
