import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { MapPin, Globe, MessageCircle, LogOut, TrendingUp } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useAuthStore } from "@/lib/store";
import { useAuth } from "@/lib/auth/useAuth";
import { getMyServices } from "@/lib/api/services";
import { getReels } from "@/lib/api/reels";
import { toast } from "@/lib/ui/toast";

const { width: W } = Dimensions.get("window");

// Figma design tokens — layout.builder (11)
const BG = "#0b0b0f";
const SURFACE = "#131316";
const ELEVATED = "#1a1a1e";
const ACCENT = "#a3ff3f";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const TEXT_SUBTLE = "rgba(255,255,255,0.3)";
const BORDER = "rgba(255,255,255,0.06)";

const ITEM_W = (W - 56) / 2;
const HIGHLIGHT_W = 140;

export default function ProfileTab() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState<"portfolio" | "services" | "reviews">("portfolio");
    const [services, setServices] = useState<any[]>([]);
    const [reels, setReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [svcRes, reelRes] = await Promise.all([
                    getMyServices().catch(() => ({ services: [] })),
                    getReels({ limit: 6 }).catch(() => ({ items: [] })),
                ]);
                setServices(svcRes.services || []);
                setReels(reelRes.items || []);
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleLogout = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await logout();
            router.replace("/(auth)/login");
        } catch {
            toast.error("Failed to sign out");
        }
    };

    const displayName = user?.name || user?.email?.split("@")[0] || "Sarah Mitchell";
    const initials = displayName.slice(0, 2).toUpperCase();
    const role = user?.role === "EMPLOYER" ? "Employer" : "Senior Brand Designer";

    // Highlight reels data from API or fallback
    const highlightReels = reels.length > 0 ? reels.slice(0, 3).map((r, i) => ({
        id: r.id,
        title: r.caption || ["Brand Process", "Behind the Scenes", "Client Review"][i],
        views: r.viewCount || [12400, 8900, 6200][i],
        mediaUrl: r.mediaUrl,
    })) : [
        { id: "1", title: "Brand Process", views: 12400, mediaUrl: null },
        { id: "2", title: "Behind the Scenes", views: 8900, mediaUrl: null },
        { id: "3", title: "Client Review", views: 6200, mediaUrl: null },
    ];

    // Portfolio items (services + reels combined for grid)
    const portfolioItems = [...services, ...reels].slice(0, 6);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header row */}
                <SafeAreaView edges={["top"]} style={styles.headerSafe}>
                    <View style={styles.headerRow}>
                        <Text style={styles.headerTitle}>Profile</Text>
                        <View style={styles.headerActions}>
                            <Pressable
                                style={styles.iconBtn}
                                onPress={() => router.push("/notifications" as any)}
                            >
                                <Ionicons name="notifications-outline" size={20} color={TEXT_SEC} />
                            </Pressable>
                            <Pressable
                                style={styles.iconBtn}
                                onPress={() => router.push("/settings" as any)}
                            >
                                <Ionicons name="settings-outline" size={20} color={TEXT_SEC} />
                            </Pressable>
                        </View>
                    </View>
                </SafeAreaView>

                {/* Profile Card — single card containing everything per Figma */}
                <Animated.View entering={FadeInDown.delay(60)} style={styles.profileCard}>
                    {/* Avatar */}
                    <View style={styles.avatarWrap}>
                        {user?.avatarUrl ? (
                            <Image
                                source={{ uri: user.avatarUrl }}
                                style={styles.avatar}
                                contentFit="cover"
                            />
                        ) : (
                            <LinearGradient
                                colors={[ACCENT, "#65a30d"]}
                                style={[styles.avatar, { justifyContent: "center", alignItems: "center" }]}
                            >
                                <Text style={styles.avatarInitials}>{initials}</Text>
                            </LinearGradient>
                        )}
                        <View style={styles.onlineDot} />
                    </View>

                    {/* Name + role */}
                    <Text style={styles.profileName}>{displayName}</Text>
                    <Text style={styles.profileRole}>{role}</Text>

                    {/* Location */}
                    <View style={styles.locationRow}>
                        <MapPin size={12} color={TEXT_MUTED} strokeWidth={2} />
                        <Text style={styles.locationText}>{user?.location || "San Francisco"}</Text>
                    </View>

                    {/* Website */}
                    <View style={styles.websiteRow}>
                        <Globe size={12} color={ACCENT} strokeWidth={2} />
                        <Text style={styles.websiteText}>sarahm.design</Text>
                    </View>

                    {/* Bio */}
                    <Text style={styles.bio} numberOfLines={3}>
                        {user?.bio || "Creating premium brand identities for luxury businesses. 8+ years of experience in visual design, motion graphics, and branding."}
                    </Text>

                    {/* Action buttons — Message + Follow */}
                    <View style={styles.actionBtns}>
                        <Pressable onPress={() => router.push("/conversations" as any)} style={styles.msgBtn}>
                            <MessageCircle size={16} color="#0b0b0f" strokeWidth={2.5} />
                            <Text style={styles.msgBtnText}>Message</Text>
                        </Pressable>
                        <Pressable
                            style={styles.followBtn}
                            onPress={() => router.push("/profile/edit" as any)}
                        >
                            <Text style={styles.followBtnText}>Edit Profile</Text>
                        </Pressable>
                    </View>

                    {/* Stats inside card — Figma: 2.4K Followers | 4.9 Rating | 127 Projects | $340K Earned */}
                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>2.4K</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={[styles.statValue, { color: ACCENT }]}>4.9</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{services.length || 127}</Text>
                            <Text style={styles.statLabel}>Projects</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={[styles.statValue, { color: ACCENT }]}>$340K</Text>
                            <Text style={styles.statLabel}>Earned</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Total earnings card */}
                <Animated.View entering={FadeInDown.delay(120)} style={styles.earningsCard}>
                    <LinearGradient
                        colors={["rgba(163,255,63,0.1)", "rgba(163,255,63,0.03)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
                    />
                    <View style={styles.earningsRow}>
                        <View>
                            <Text style={styles.earningsLabel}>Total Earnings</Text>
                            <Text style={styles.earningsAmount}>$127,450</Text>
                        </View>
                        <View style={styles.earningsTrend}>
                            <TrendingUp size={14} color={ACCENT} strokeWidth={2.5} />
                            <Text style={{ color: ACCENT, fontSize: 13, fontWeight: "700" }}>+24%</Text>
                        </View>
                    </View>
                    <View style={styles.earningsStats}>
                        <View style={styles.earningsStat}>
                            <Text style={styles.earningsStatNum}>8</Text>
                            <Text style={styles.earningsStatLabel}>Active</Text>
                        </View>
                        <View style={styles.earningsStat}>
                            <Text style={styles.earningsStatNum}>127</Text>
                            <Text style={styles.earningsStatLabel}>Completed</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Highlight Reels — horizontal scroll */}
                <Animated.View entering={FadeInDown.delay(160)} style={styles.highlightSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Highlight Reels</Text>
                        <Pressable>
                            <Text style={styles.seeAll}>See all</Text>
                        </Pressable>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                    >
                        {highlightReels.map((reel) => (
                            <Pressable
                                key={reel.id}
                                style={styles.highlightCard}
                                onPress={() => router.push(`/reel/${reel.id}` as any)}
                            >
                                {reel.mediaUrl ? (
                                    <Image source={{ uri: reel.mediaUrl }} style={styles.highlightImg} contentFit="cover" />
                                ) : (
                                    <LinearGradient colors={["#1a2a10", "#0b0b0f"]} style={styles.highlightImg} />
                                )}
                                <LinearGradient
                                    colors={["transparent", "rgba(0,0,0,0.85)"]}
                                    style={styles.highlightOverlay}
                                />
                                <View style={styles.highlightInfo}>
                                    <Text style={styles.highlightTitle} numberOfLines={1}>{reel.title}</Text>
                                    <View style={styles.highlightViews}>
                                        <Ionicons name="eye-outline" size={11} color={TEXT_SEC} />
                                        <Text style={styles.highlightViewsText}>
                                            {reel.views >= 1000 ? `${(reel.views / 1000).toFixed(1)}K` : reel.views} views
                                        </Text>
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </ScrollView>
                </Animated.View>

                {/* Tabs: Portfolio | Services | Reviews — pill style */}
                <Animated.View entering={FadeInDown.delay(200)}>
                    <View style={styles.tabsContainer}>
                        {(["portfolio", "services", "reviews"] as const).map((tab) => (
                            <Pressable
                                key={tab}
                                style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setActiveTab(tab);
                                }}
                            >
                                <Text style={[styles.tabPillText, activeTab === tab && styles.tabPillTextActive]}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>

                {/* Grid content based on active tab */}
                {loading ? (
                    <View style={{ padding: 40, alignItems: "center" }}>
                        <ActivityIndicator color={ACCENT} />
                    </View>
                ) : activeTab === "portfolio" ? (
                    <View style={styles.grid}>
                        {portfolioItems.length > 0 ? portfolioItems.map((item, idx) => (
                            <Pressable
                                key={item.id || idx}
                                style={styles.gridItem}
                                onPress={() => {
                                    if (item.title) router.push(`/service/${item.id}` as any);
                                    else router.push(`/reel/${item.id}` as any);
                                }}
                            >
                                {(item.imageUrl || item.mediaUrl) ? (
                                    <Image source={{ uri: item.imageUrl || item.mediaUrl }} style={styles.gridImg} contentFit="cover" />
                                ) : (
                                    <LinearGradient colors={["#1a2a10", "#0b0b0f"]} style={styles.gridImg} />
                                )}
                                <LinearGradient
                                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                                    style={styles.gridOverlay}
                                />
                                {/* Like/comment overlay counts — Figma style */}
                                <View style={styles.gridStats}>
                                    <View style={styles.gridStatRow}>
                                        <Ionicons name="heart" size={10} color={TEXT} />
                                        <Text style={styles.gridStatText}>
                                            {["2.4K", "1.8K", "3.1K", "950", "2.1K", "1.4K"][idx] || "0"}
                                        </Text>
                                    </View>
                                    <View style={styles.gridStatRow}>
                                        <Ionicons name="chatbubble" size={10} color={TEXT} />
                                        <Text style={styles.gridStatText}>
                                            {["189", "134", "256", "78", "167", "112"][idx] || "0"}
                                        </Text>
                                    </View>
                                </View>
                            </Pressable>
                        )) : (
                            <View style={styles.emptyGrid}>
                                <Ionicons name="images-outline" size={32} color={TEXT_MUTED} />
                                <Text style={styles.emptyText}>No portfolio items yet</Text>
                                <Pressable
                                    style={styles.createBtn}
                                    onPress={() => router.push("/(tabs)/create" as any)}
                                >
                                    <Text style={styles.createBtnText}>Create Service</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                ) : activeTab === "services" ? (
                    <View style={styles.grid}>
                        {services.length > 0 ? services.map((svc) => (
                            <Pressable
                                key={svc.id}
                                style={styles.gridItem}
                                onPress={() => router.push(`/service/${svc.id}` as any)}
                            >
                                {svc.imageUrl ? (
                                    <Image source={{ uri: svc.imageUrl }} style={styles.gridImg} contentFit="cover" />
                                ) : (
                                    <LinearGradient colors={["#1a2a10", "#0b0b0f"]} style={styles.gridImg} />
                                )}
                                <LinearGradient
                                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                                    style={styles.gridOverlay}
                                />
                                <View style={styles.gridInfo}>
                                    <Text style={styles.gridTitle} numberOfLines={2}>{svc.title}</Text>
                                    <Text style={styles.gridPrice}>
                                        {svc.priceFormatted || `$${Math.round((svc.price || 0) / 100)}`}
                                    </Text>
                                </View>
                            </Pressable>
                        )) : (
                            <View style={styles.emptyGrid}>
                                <Ionicons name="briefcase-outline" size={32} color={TEXT_MUTED} />
                                <Text style={styles.emptyText}>No services yet</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.emptyGrid}>
                        <Ionicons name="star-outline" size={32} color={TEXT_MUTED} />
                        <Text style={styles.emptyText}>No reviews yet</Text>
                        <Text style={styles.emptySubtext}>Reviews from clients will appear here</Text>
                    </View>
                )}

                {/* Sign out */}
                <View style={styles.signOutSection}>
                    <Pressable onPress={handleLogout} style={styles.signOutBtn}>
                        <LogOut size={18} color="#ef4444" strokeWidth={2} />
                        <Text style={styles.signOutText}>Sign out</Text>
                    </Pressable>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },

    headerSafe: { paddingHorizontal: 20 },
    headerRow: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", paddingTop: 8, paddingBottom: 16,
    },
    headerTitle: { color: TEXT, fontSize: 22, fontWeight: "900" },
    headerActions: { flexDirection: "row", gap: 10 },
    iconBtn: {
        width: 40, height: 40, borderRadius: 14, backgroundColor: ELEVATED,
        justifyContent: "center", alignItems: "center",
        borderWidth: 1, borderColor: BORDER,
    },

    // Profile card — single card per Figma layout.builder(11)
    profileCard: {
        marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 22,
        padding: 20, alignItems: "center", marginBottom: 16,
        borderWidth: 1, borderColor: BORDER,
    },
    avatarWrap: { position: "relative", marginBottom: 14 },
    avatar: { width: 80, height: 80, borderRadius: 40, overflow: "hidden" },
    avatarInitials: { color: "#0b0b0f", fontSize: 26, fontWeight: "900" },
    onlineDot: {
        position: "absolute", bottom: 2, right: 2,
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: "#22c55e", borderWidth: 2, borderColor: SURFACE,
    },

    profileName: { color: TEXT, fontSize: 20, fontWeight: "900", letterSpacing: -0.3, marginBottom: 2 },
    profileRole: { color: TEXT_MUTED, fontSize: 14, fontWeight: "600", marginBottom: 8 },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
    locationText: { color: TEXT_MUTED, fontSize: 13 },
    websiteRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 },
    websiteText: { color: ACCENT, fontSize: 13, fontWeight: "600" },
    bio: { color: TEXT_SEC, fontSize: 13, lineHeight: 19, textAlign: "center", marginBottom: 16, paddingHorizontal: 10 },

    actionBtns: { flexDirection: "row", gap: 10, width: "100%", marginBottom: 16 },
    msgBtn: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, paddingVertical: 12, borderRadius: 14,
        backgroundColor: ACCENT,
    },
    msgBtnText: { color: "#0b0b0f", fontSize: 14, fontWeight: "800" },
    followBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1, borderColor: BORDER, alignItems: "center",
    },
    followBtnText: { color: TEXT, fontSize: 14, fontWeight: "700" },

    // Stats inside card
    statsRow: {
        flexDirection: "row", width: "100%",
        paddingTop: 16, borderTopWidth: 1, borderTopColor: BORDER,
    },
    stat: { flex: 1, alignItems: "center" },
    statValue: { color: TEXT, fontSize: 16, fontWeight: "900", marginBottom: 2 },
    statLabel: { color: TEXT_MUTED, fontSize: 11, fontWeight: "500" },
    statDivider: { width: 1, backgroundColor: BORDER },

    // Earnings card
    earningsCard: {
        marginHorizontal: 20, marginBottom: 20, borderRadius: 22, padding: 18,
        borderWidth: 1, borderColor: "rgba(163,255,63,0.15)", overflow: "hidden",
    },
    earningsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
    earningsLabel: { color: TEXT_MUTED, fontSize: 13, fontWeight: "500", marginBottom: 4 },
    earningsAmount: { color: TEXT, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
    earningsTrend: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: "rgba(163,255,63,0.1)", paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 99,
    },
    earningsStats: { flexDirection: "row", gap: 24 },
    earningsStat: {},
    earningsStatNum: { color: TEXT, fontSize: 18, fontWeight: "900" },
    earningsStatLabel: { color: TEXT_MUTED, fontSize: 12 },

    // Highlight Reels section
    highlightSection: { paddingLeft: 20, marginBottom: 24 },
    sectionHeader: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", marginBottom: 14, paddingRight: 20,
    },
    sectionTitle: { color: TEXT, fontSize: 18, fontWeight: "900", letterSpacing: -0.3 },
    seeAll: { color: ACCENT, fontSize: 13, fontWeight: "700" },

    highlightCard: {
        width: HIGHLIGHT_W, height: HIGHLIGHT_W * 1.35, borderRadius: 16,
        overflow: "hidden", position: "relative",
    },
    highlightImg: { width: "100%", height: "100%" },
    highlightOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: "60%" },
    highlightInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 10 },
    highlightTitle: { color: TEXT, fontSize: 12, fontWeight: "800", marginBottom: 4 },
    highlightViews: { flexDirection: "row", alignItems: "center", gap: 4 },
    highlightViewsText: { color: TEXT_SEC, fontSize: 10, fontWeight: "600" },

    // Tabs — pill style per Figma
    tabsContainer: {
        flexDirection: "row", marginHorizontal: 20, marginBottom: 16,
        backgroundColor: SURFACE, borderRadius: 14, padding: 4,
    },
    tabPill: {
        flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
    },
    tabPillActive: { backgroundColor: ACCENT },
    tabPillText: { color: TEXT_MUTED, fontSize: 13, fontWeight: "700" },
    tabPillTextActive: { color: "#0b0b0f" },

    // Grid
    grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 12 },
    gridItem: { width: ITEM_W, height: ITEM_W * 1.2, borderRadius: 16, overflow: "hidden", position: "relative" },
    gridImg: { width: "100%", height: "100%" },
    gridOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: "60%" },
    gridInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 10 },
    gridTitle: { color: TEXT, fontSize: 12, fontWeight: "700", marginBottom: 2 },
    gridPrice: { color: ACCENT, fontSize: 12, fontWeight: "800" },

    // Grid stats overlay (like/comment counts)
    gridStats: {
        position: "absolute", bottom: 8, left: 8, right: 8,
        flexDirection: "row", gap: 10,
    },
    gridStatRow: { flexDirection: "row", alignItems: "center", gap: 3 },
    gridStatText: { color: TEXT, fontSize: 10, fontWeight: "700" },

    // Empty states
    emptyGrid: {
        width: "100%", paddingVertical: 40, alignItems: "center", gap: 12,
        paddingHorizontal: 20,
    },
    emptyText: { color: TEXT_MUTED, fontSize: 15 },
    emptySubtext: { color: TEXT_SUBTLE, fontSize: 13 },
    createBtn: {
        backgroundColor: ACCENT, paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 12,
    },
    createBtnText: { color: "#0b0b0f", fontSize: 14, fontWeight: "800" },

    signOutSection: { paddingHorizontal: 20, paddingTop: 28 },
    signOutBtn: {
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: "rgba(239,68,68,0.08)", paddingVertical: 16, paddingHorizontal: 20,
        borderRadius: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
    },
    signOutText: { color: "#ef4444", fontSize: 15, fontWeight: "700" },
});
