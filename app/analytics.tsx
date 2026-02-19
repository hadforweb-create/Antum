import { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, TrendingUp, TrendingDown, DollarSign, ArrowRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useTranslation } from "@/lib/i18n";

const { width: W } = Dimensions.get("window");

// Figma design tokens — layout.builder (10)
const BG = "#0b0b0f";
const SURFACE = "#131316";
const ELEVATED = "#1a1a1e";
const ACCENT = "#a3ff3f";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.06)";
const PURPLE = "#a855f7";

const BAR_DATA = [65, 45, 78, 52, 88, 72, 95];
const BAR_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Figma-accurate data
const TOP_SERVICES = [
    { name: "Branding", revenue: 24500, pct: 24 },
    { name: "Development", revenue: 18200, pct: 12 },
    { name: "Marketing", revenue: 15800, pct: 5 },
    { name: "Motion", revenue: 9400, pct: 18 },
];

const ACTIVITY = [
    { id: 1, desc: "New order", person: "Marcus Chen", amount: "+$4,500", time: "2h ago", positive: true },
    { id: 2, desc: "Review received", person: "Emma Davis", amount: "", time: "5h ago", positive: false },
    { id: 3, desc: "Payment received", person: "Alex Johnson", amount: "+$2,200", time: "1d ago", positive: true },
    { id: 4, desc: "Refund processed", person: "Jordan L.", amount: "$800", time: "2d ago", positive: false },
];

function MetricCard({
    label, value, trend, highlight,
}: { label: string; value: string; trend: number; highlight?: boolean }) {
    const positive = trend >= 0;
    return (
        <View style={[
            styles.metricCard,
            highlight && { borderColor: "rgba(163,255,63,0.2)", borderWidth: 1 },
        ]}>
            {highlight && (
                <LinearGradient
                    colors={["rgba(163,255,63,0.08)", "rgba(163,255,63,0.02)"]}
                    style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                />
            )}
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={[styles.metricValue, highlight && { color: ACCENT }]}>{value}</Text>
            <View style={styles.metricTrend}>
                {positive
                    ? <TrendingUp size={13} color="#22c55e" strokeWidth={2.5} />
                    : <TrendingDown size={13} color="#ef4444" strokeWidth={2.5} />
                }
                <Text style={[styles.metricTrendText, { color: positive ? "#22c55e" : "#ef4444" }]}>
                    {Math.abs(trend)}%
                </Text>
            </View>
        </View>
    );
}

export default function AnalyticsScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const [period, setPeriod] = useState<"7D" | "30D" | "90D">("30D");
    const [revenueMode, setRevenueMode] = useState<"Revenue" | "Expenses">("Revenue");

    return (
        <View style={styles.container}>
            <SafeAreaView edges={["top"]} style={styles.header}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerSub}>{t("analytics.dashboard")}</Text>
                        <Text style={styles.headerTitle}>{t("analytics.title")}</Text>
                    </View>
                    <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
                        style={styles.closeBtn}
                    >
                        <X size={20} color={TEXT} strokeWidth={2.5} />
                    </Pressable>
                </View>

                {/* Period selector */}
                <View style={styles.periodRow}>
                    {(["7D", "30D", "90D"] as const).map((p) => (
                        <Pressable
                            key={p}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPeriod(p); }}
                            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                        >
                            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                                {p}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </SafeAreaView>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Revenue/Expenses toggle */}
                <Animated.View entering={FadeInDown.delay(40)} style={styles.toggleContainer}>
                    <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRevenueMode("Revenue"); }}
                        style={[styles.toggleBtn, revenueMode === "Revenue" && styles.toggleBtnActive]}
                    >
                        <Text style={[styles.toggleText, revenueMode === "Revenue" && styles.toggleTextActive]}>
                            {t("analytics.revenue")}
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRevenueMode("Expenses"); }}
                        style={[styles.toggleBtn, revenueMode === "Expenses" && styles.toggleBtnActive]}
                    >
                        <Text style={[styles.toggleText, revenueMode === "Expenses" && styles.toggleTextActive]}>
                            {t("analytics.expenses")}
                        </Text>
                    </Pressable>
                </Animated.View>

                {/* Revenue hero */}
                <Animated.View entering={FadeInDown.delay(60)}>
                    <LinearGradient
                        colors={["rgba(163,255,63,0.12)", "rgba(163,255,63,0.03)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.revenueHero}
                    >
                        <View style={styles.revenueHeroHeader}>
                            <Text style={styles.revenueLabel}>
                                {revenueMode === "Revenue" ? t("analytics.monthlyRevenue") : t("analytics.monthlyExpenses")}
                            </Text>
                            <View style={styles.revenueTrend}>
                                <TrendingUp size={14} color={ACCENT} strokeWidth={2.5} />
                                <Text style={{ color: ACCENT, fontSize: 12, fontWeight: "700" }}>+24%</Text>
                            </View>
                        </View>
                        <Text style={styles.revenueAmount}>
                            {revenueMode === "Revenue" ? "$42,850" : "$18,340"}
                        </Text>
                        <Text style={styles.revenueCompare}>
                            {t("analytics.vs")} <Text style={{ color: TEXT_MUTED }}>
                                {revenueMode === "Revenue" ? "$34,560" : "$15,200"}
                            </Text> {t("analytics.lastPeriod")}
                        </Text>

                        {/* Mini bar chart */}
                        <View style={styles.miniChart}>
                            {BAR_DATA.map((h, i) => (
                                <View key={i} style={styles.miniBarWrap}>
                                    <LinearGradient
                                        colors={[ACCENT, "#65a30d"]}
                                        style={[styles.miniBar, { height: `${h}%` }]}
                                    />
                                    <Text style={styles.miniBarLabel}>{BAR_LABELS[i]}</Text>
                                </View>
                            ))}
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Metric cards — 2x2 grid */}
                <Animated.View entering={FadeInDown.delay(120)} style={styles.metricsGrid}>
                    <MetricCard label={t("analytics.totalRevenue")} value="$42.8K" trend={24} highlight />
                    <MetricCard label={t("analytics.profileViews")} value="12.4K" trend={18} />
                    <MetricCard label={t("analytics.newClients")} value="89" trend={32} />
                    <MetricCard label={t("analytics.conversion")} value="68%" trend={-4} />
                </Animated.View>

                {/* Top Services — Figma-accurate data */}
                <Animated.View entering={FadeInDown.delay(180)} style={styles.card}>
                    <Text style={styles.cardTitle}>{t("analytics.topServices")}</Text>
                    <View style={{ gap: 16 }}>
                        {TOP_SERVICES.map((s, i) => (
                            <View key={i}>
                                <View style={styles.serviceRow}>
                                    <Text style={styles.serviceName}>{s.name}</Text>
                                    <View style={styles.serviceRight}>
                                        <Text style={[styles.serviceRevenue, { color: ACCENT }]}>
                                            ${s.revenue.toLocaleString()}
                                        </Text>
                                        <Text style={styles.servicePct}>
                                            {s.pct > 0 ? "+" : ""}{s.pct}%
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.progressBg}>
                                    <LinearGradient
                                        colors={[ACCENT, "#65a30d"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.progressFill, { width: `${Math.min((s.revenue / 24500) * 100, 100)}%` }]}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* Client Growth */}
                <Animated.View entering={FadeInDown.delay(220)} style={styles.card}>
                    <Text style={styles.cardTitle}>{t("analytics.clientGrowth")}</Text>
                    <View style={styles.growthRow}>
                        <View style={styles.growthStat}>
                            <Text style={styles.growthNum}>127</Text>
                            <Text style={styles.growthLabel}>{t("analytics.totalClients")}</Text>
                        </View>
                        <View style={styles.growthDivider} />
                        <View style={styles.growthStat}>
                            <Text style={[styles.growthNum, { color: ACCENT }]}>89</Text>
                            <Text style={styles.growthLabel}>{t("analytics.thisMonth")}</Text>
                        </View>
                        <View style={styles.growthDivider} />
                        <View style={styles.growthStat}>
                            <Text style={[styles.growthNum, { color: PURPLE }]}>8</Text>
                            <Text style={styles.growthLabel}>{t("analytics.active")}</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Recent Activity — Figma-accurate items */}
                <Animated.View entering={FadeInDown.delay(260)} style={styles.card}>
                    <Text style={styles.cardTitle}>{t("analytics.recentActivity")}</Text>
                    {ACTIVITY.map((a) => (
                        <View key={a.id} style={styles.activityItem}>
                            <View style={[styles.activityDot, { backgroundColor: a.positive ? ACCENT : ELEVATED }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.activityDesc}>{a.desc}</Text>
                                <Text style={styles.activityPerson}>{a.person}</Text>
                            </View>
                            <View style={styles.activityRight}>
                                {a.amount ? (
                                    <Text style={[
                                        styles.activityAmount,
                                        !a.positive && { color: "#ef4444" }
                                    ]}>{a.amount}</Text>
                                ) : null}
                                <Text style={styles.activityTime}>{a.time}</Text>
                            </View>
                        </View>
                    ))}
                </Animated.View>

                {/* Available Balance — with "View Wallet →" */}
                <Animated.View entering={FadeInDown.delay(300)}>
                    <LinearGradient
                        colors={["rgba(163,255,63,0.12)", "rgba(163,255,63,0.03)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.card, { borderColor: "rgba(163,255,63,0.2)" }]}
                    >
                        <View style={styles.balanceHeader}>
                            <View>
                                <Text style={styles.balanceLabel}>{t("analytics.availableBalance")}</Text>
                                <Text style={styles.balanceAmount}>$12,450</Text>
                            </View>
                            <View style={styles.balanceIcon}>
                                <DollarSign size={22} color={ACCENT} strokeWidth={2} />
                            </View>
                        </View>
                        <Pressable
                            style={styles.walletLink}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push("/wallet" as any);
                            }}
                        >
                            <Text style={styles.walletLinkText}>{t("analytics.viewWallet")}</Text>
                            <ArrowRight size={16} color={ACCENT} strokeWidth={2.5} />
                        </Pressable>
                    </LinearGradient>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: { backgroundColor: BG, paddingHorizontal: 20, paddingBottom: 16 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    headerSub: { color: TEXT_MUTED, fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
    headerTitle: { color: TEXT, fontSize: 28, fontWeight: "900", letterSpacing: -0.6 },
    closeBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: ELEVATED, justifyContent: "center", alignItems: "center",
        borderWidth: 1, borderColor: BORDER,
    },
    periodRow: { flexDirection: "row", gap: 8 },
    periodBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 12,
        backgroundColor: ELEVATED, alignItems: "center",
        borderWidth: 1, borderColor: BORDER,
    },
    periodBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
    periodText: { color: TEXT_MUTED, fontSize: 13, fontWeight: "700" },
    periodTextActive: { color: "#0b0b0f" },
    scroll: { paddingHorizontal: 20, paddingTop: 20 },

    // Revenue/Expenses toggle
    toggleContainer: {
        flexDirection: "row", backgroundColor: SURFACE,
        borderRadius: 14, padding: 4, marginBottom: 16,
    },
    toggleBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 12,
        alignItems: "center",
    },
    toggleBtnActive: { backgroundColor: ACCENT },
    toggleText: { color: TEXT_MUTED, fontSize: 14, fontWeight: "700" },
    toggleTextActive: { color: "#0b0b0f" },

    revenueHero: {
        borderRadius: 22, padding: 20, marginBottom: 16,
        borderWidth: 1, borderColor: "rgba(163,255,63,0.15)",
    },
    revenueHeroHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    revenueLabel: { color: TEXT_MUTED, fontSize: 13, fontWeight: "600" },
    revenueTrend: { flexDirection: "row", alignItems: "center", gap: 4 },
    revenueAmount: { color: TEXT, fontSize: 36, fontWeight: "900", letterSpacing: -1, marginBottom: 4 },
    revenueCompare: { color: TEXT_SEC, fontSize: 13, fontWeight: "500", marginBottom: 20 },
    miniChart: {
        flexDirection: "row", alignItems: "flex-end", height: 60, gap: 6,
    },
    miniBarWrap: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 },
    miniBar: { width: "100%", borderRadius: 4, minHeight: 4 },
    miniBarLabel: { color: TEXT_MUTED, fontSize: 9, fontWeight: "500" },

    metricsGrid: {
        flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16,
    },
    metricCard: {
        width: (W - 52) / 2, backgroundColor: SURFACE,
        padding: 16, borderRadius: 18, overflow: "hidden",
        borderWidth: 1, borderColor: BORDER,
    },
    metricLabel: { color: TEXT_MUTED, fontSize: 12, fontWeight: "500", marginBottom: 8 },
    metricValue: { color: TEXT, fontSize: 24, fontWeight: "900", letterSpacing: -0.5, marginBottom: 8 },
    metricTrend: { flexDirection: "row", alignItems: "center", gap: 4 },
    metricTrendText: { fontSize: 12, fontWeight: "700" },

    card: {
        backgroundColor: SURFACE, borderRadius: 22, padding: 18,
        marginBottom: 14, borderWidth: 1, borderColor: BORDER,
    },
    cardTitle: { color: TEXT, fontSize: 17, fontWeight: "900", marginBottom: 16 },

    serviceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    serviceName: { color: TEXT_SEC, fontSize: 14, fontWeight: "600" },
    serviceRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    serviceRevenue: { fontSize: 14, fontWeight: "700" },
    servicePct: { color: TEXT_MUTED, fontSize: 12, fontWeight: "600" },
    progressBg: { height: 6, backgroundColor: ELEVATED, borderRadius: 3, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 3 },

    growthRow: { flexDirection: "row", alignItems: "center" },
    growthStat: { flex: 1, alignItems: "center" },
    growthNum: { color: TEXT, fontSize: 22, fontWeight: "900", marginBottom: 4 },
    growthLabel: { color: TEXT_MUTED, fontSize: 12, fontWeight: "500" },
    growthDivider: { width: 1, height: 40, backgroundColor: BORDER },

    activityItem: {
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    activityDot: { width: 8, height: 8, borderRadius: 4 },
    activityDesc: { color: TEXT, fontSize: 14, fontWeight: "600", marginBottom: 1 },
    activityPerson: { color: TEXT_MUTED, fontSize: 12, fontWeight: "500" },
    activityRight: { alignItems: "flex-end" },
    activityAmount: { color: "#22c55e", fontSize: 14, fontWeight: "700" },
    activityTime: { color: TEXT_MUTED, fontSize: 11, fontWeight: "500", marginTop: 2 },

    balanceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
    balanceLabel: { color: TEXT_MUTED, fontSize: 13, fontWeight: "500", marginBottom: 6 },
    balanceAmount: { color: TEXT, fontSize: 32, fontWeight: "900", letterSpacing: -0.5 },
    balanceIcon: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: "rgba(163,255,63,0.1)", justifyContent: "center", alignItems: "center",
    },
    walletLink: {
        flexDirection: "row", alignItems: "center", gap: 6,
    },
    walletLinkText: { color: ACCENT, fontSize: 15, fontWeight: "700" },
});
