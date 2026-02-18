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
import { MapPin, Globe, MessageCircle, Settings, LogOut, TrendingUp } from "lucide-react-native";
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
const PURPLE = "#a855f7";

const ITEM_W = (W - 56) / 2;

export default function ProfileTab() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState<"services" | "reels">("services");
    const [services, setServices] = useState<any[]>([]);
    const [reels, setReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [svcRes, reelRes] = await Promise.all([
                    getMyServices().catch(() => ({ services: [] })),
                    getReels({ page: 1, limit: 6 }).catch(() => ({ reels: [] })),
                ]);
                setServices(svcRes.services || svcRes.data || []);
                setReels(reelRes.reels || reelRes.data || []);
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

    const displayName = user?.name || user?.email?.split("@")[0] || "Your Name";
    const initials = displayName.slice(0, 2).toUpperCase();
    const role = user?.role === "EMPLOYER" ? "Employer" : "Freelancer";

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile header background */}
                <View style={styles.heroBg}>
                    <LinearGradient
                        colors={["rgba(163,255,63,0.08)", "transparent"]}
                        style={StyleSheet.absoluteFill}
                    />

                    <SafeAreaView edges={["top"]} style={styles.heroSafe}>
                        {/* Top row */}
                        <View style={styles.heroTopRow}>
                            <Text style={styles.heroHeading}>Profile</Text>
                            <View style={styles.heroActions}>
                                <Pressable
                                    style={styles.iconBtn}
                                    onPress={() => router.push("/analytics" as any)}
                                >
                                    <Ionicons name="bar-chart-outline" size={20} color={TEXT_SEC} />
                                </Pressable>
                                <Pressable
                                    style={styles.iconBtn}
                                    onPress={() => router.push("/settings" as any)}
                                >
                                    <Ionicons name="settings-outline" size={20} color={TEXT_SEC} />
                                </Pressable>
                            </View>
                        </View>

                        {/* Avatar + info */}
                        <View style={styles.profileCenter}>
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

                            <Animated.View entering={FadeInDown.delay(60)} style={{ alignItems: "center" }}>
                                <Text style={styles.profileName}>{displayName}</Text>
                                <Text style={styles.profileRole}>{role}</Text>

                                {user?.location && (
                                    <View style={styles.locationRow}>
                                        <MapPin size={12} color={TEXT_MUTED} strokeWidth={2} />
                                        <Text style={styles.locationText}>{user.location}</Text>
                                    </View>
                                )}

                                {user?.bio && (
                                    <Text style={styles.bio} numberOfLines={3}>{user.bio}</Text>
                                )}
                            </Animated.View>

                            {/* Action buttons */}
                            <Animated.View entering={FadeInDown.delay(100)} style={styles.actionBtns}>
                                <Pressable onPress={() => router.push("/conversations" as any)} style={styles.msgBtn}>
                                    <MessageCircle size={16} color="#0b0b0f" strokeWidth={2.5} />
                                    <Text style={styles.msgBtnText}>Message</Text>
                                </Pressable>
                                <Pressable style={styles.followBtn}>
                                    <Text style={styles.followBtnText}>Edit Profile</Text>
                                </Pressable>
                            </Animated.View>
                        </View>
                    </SafeAreaView>
                </View>

                {/* Stats bar */}
                <Animated.View entering={FadeInDown.delay(140)} style={styles.statsBar}>
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
                        <Text style={styles.statValue}>{services.length || "—"}</Text>
                        <Text style={styles.statLabel}>Services</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: PURPLE }]}>$127K</Text>
                        <Text style={styles.statLabel}>Earned</Text>
                    </View>
                </Animated.View>

                {/* Total earnings card */}
                <Animated.View entering={FadeInDown.delay(180)} style={styles.earningsCard}>
                    <LinearGradient
                        colors={["rgba(163,255,63,0.1)", "rgba(163,255,63,0.03)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                        borderRadius={18}
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

                {/* Tabs: Services / Highlight Reels */}
                <View style={styles.tabsRow}>
                    <Pressable
                        style={[styles.tab, activeTab === "services" && styles.tabActive]}
                        onPress={() => setActiveTab("services")}
                    >
                        <Text style={[styles.tabText, activeTab === "services" && styles.tabTextActive]}>
                            Services
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.tab, activeTab === "reels" && styles.tabActive]}
                        onPress={() => setActiveTab("reels")}
                    >
                        <Text style={[styles.tabText, activeTab === "reels" && styles.tabTextActive]}>
                            Highlight Reels
                        </Text>
                    </Pressable>
                </View>

                {loading ? (
                    <View style={{ padding: 40, alignItems: "center" }}>
                        <ActivityIndicator color={ACCENT} />
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
                                <Pressable
                                    style={styles.createBtn}
                                    onPress={() => router.push("/(tabs)/create" as any)}
                                >
                                    <Text style={styles.createBtnText}>Create Service</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {reels.length > 0 ? reels.map((reel) => (
                            <Pressable
                                key={reel.id}
                                style={styles.gridItem}
                                onPress={() => router.push(`/reel/${reel.id}` as any)}
                            >
                                {reel.mediaUrl ? (
                                    <Image source={{ uri: reel.mediaUrl }} style={styles.gridImg} contentFit="cover" />
                                ) : (
                                    <LinearGradient colors={["#1a1a2e", "#0b0b0f"]} style={styles.gridImg} />
                                )}
                                <LinearGradient
                                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                                    style={styles.gridOverlay}
                                />
                                <View style={styles.gridInfo}>
                                    <View style={styles.reelViews}>
                                        <Ionicons name="eye-outline" size={12} color={TEXT_SEC} />
                                        <Text style={styles.reelViewsText}>
                                            {reel.viewCount ? `${(reel.viewCount / 1000).toFixed(1)}K` : "—"} views
                                        </Text>
                                    </View>
                                    {reel.caption && (
                                        <Text style={styles.gridTitle} numberOfLines={1}>{reel.caption}</Text>
                                    )}
                                </View>
                            </Pressable>
                        )) : (
                            <View style={styles.emptyGrid}>
                                <Ionicons name="videocam-outline" size={32} color={TEXT_MUTED} />
                                <Text style={styles.emptyText}>No reels yet</Text>
                            </View>
                        )}
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

    heroBg: { backgroundColor: SURFACE, paddingBottom: 28 },
    heroSafe: { paddingHorizontal: 20 },
    heroTopRow: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", paddingTop: 8, paddingBottom: 20,
    },
    heroHeading: { color: TEXT, fontSize: 22, fontWeight: "900" },
    heroActions: { flexDirection: "row", gap: 10 },
    iconBtn: {
        width: 40, height: 40, borderRadius: 14, backgroundColor: ELEVATED,
        justifyContent: "center", alignItems: "center",
        borderWidth: 1, borderColor: BORDER,
    },

    profileCenter: { alignItems: "center", gap: 14 },
    avatarWrap: { position: "relative" },
    avatar: { width: 88, height: 88, borderRadius: 44, overflow: "hidden" },
    avatarInitials: { color: "#0b0b0f", fontSize: 28, fontWeight: "900" },
    onlineDot: {
        position: "absolute", bottom: 4, right: 4,
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: "#22c55e", borderWidth: 2, borderColor: SURFACE,
    },

    profileName: { color: TEXT, fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
    profileRole: { color: TEXT_MUTED, fontSize: 14, fontWeight: "600", marginTop: 2 },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
    locationText: { color: TEXT_MUTED, fontSize: 13 },
    bio: { color: TEXT_SEC, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8, paddingHorizontal: 20 },

    actionBtns: { flexDirection: "row", gap: 12 },
    msgBtn: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, paddingVertical: 13, borderRadius: 14,
        backgroundColor: ACCENT,
        shadowColor: ACCENT, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    msgBtnText: { color: "#0b0b0f", fontSize: 14, fontWeight: "800" },
    followBtn: {
        flex: 1, paddingVertical: 13, borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1, borderColor: BORDER, alignItems: "center",
    },
    followBtnText: { color: TEXT, fontSize: 14, fontWeight: "700" },

    statsBar: {
        flexDirection: "row", backgroundColor: SURFACE,
        paddingVertical: 18, paddingHorizontal: 20,
        borderTopWidth: 1, borderTopColor: BORDER,
    },
    stat: { flex: 1, alignItems: "center" },
    statValue: { color: TEXT, fontSize: 18, fontWeight: "900", marginBottom: 2 },
    statLabel: { color: TEXT_MUTED, fontSize: 12, fontWeight: "500" },
    statDivider: { width: 1, backgroundColor: BORDER },

    earningsCard: {
        marginHorizontal: 20, marginTop: 16, borderRadius: 18, padding: 18,
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

    tabsRow: {
        flexDirection: "row", paddingHorizontal: 20, paddingTop: 24,
        paddingBottom: 0, gap: 0,
        borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    tab: {
        flex: 1, paddingBottom: 14, alignItems: "center",
        borderBottomWidth: 2, borderBottomColor: "transparent",
    },
    tabActive: { borderBottomColor: ACCENT },
    tabText: { color: TEXT_MUTED, fontSize: 14, fontWeight: "700" },
    tabTextActive: { color: TEXT },

    grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, paddingTop: 16, gap: 12 },
    gridItem: { width: ITEM_W, height: ITEM_W * 1.2, borderRadius: 16, overflow: "hidden", position: "relative" },
    gridImg: { width: "100%", height: "100%" },
    gridOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: "60%" },
    gridInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 10 },
    gridTitle: { color: TEXT, fontSize: 12, fontWeight: "700", marginBottom: 2 },
    gridPrice: { color: ACCENT, fontSize: 12, fontWeight: "800" },
    reelViews: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
    reelViewsText: { color: TEXT_SEC, fontSize: 11, fontWeight: "600" },

    emptyGrid: {
        width: "100%", paddingVertical: 40, alignItems: "center", gap: 12,
    },
    emptyText: { color: TEXT_MUTED, fontSize: 15 },
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
