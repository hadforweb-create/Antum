import { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
    ArrowLeft,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    CreditCard,
    Building2,
    Clock,
    TrendingUp,
    ChevronRight,
    Plus,
    DollarSign,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useAuthStore } from "@/lib/store";
import { getMyServiceRequests } from "@/lib/api/social";
import { toast } from "@/lib/ui/toast";

// Design system constants
const BG = "#0b0b0f";
const SURFACE = "#131316";
const ELEVATED = "#1a1a1e";
const ACCENT = "#a3ff3f";
const ACCENT_DIM = "rgba(163,255,63,0.1)";
const ACCENT_BORDER = "rgba(163,255,63,0.15)";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const TEXT_SUBTLE = "rgba(255,255,255,0.3)";
const BORDER = "rgba(255,255,255,0.06)";

interface Transaction {
    id: string;
    type: "incoming" | "outgoing" | "pending";
    title: string;
    description: string;
    amount: string;
    date: string;
    status: "completed" | "pending" | "processing";
}

// Mock data matching Figma design
const MOCK_BALANCE = "$12,450";
const MOCK_EARNINGS = "$127,450";
const MOCK_GROWTH = "+24%";
const MOCK_COMPLETED_PROJECTS = 127;

const MOCK_TRANSACTIONS: Transaction[] = [
    {
        id: "1",
        type: "incoming",
        title: "Brand Identity Project",
        description: "Sarah Mitchell",
        amount: "+$4,500",
        date: "Today",
        status: "completed",
    },
    {
        id: "2",
        type: "incoming",
        title: "Full Stack Development",
        description: "Marcus Chen",
        amount: "+$8,000",
        date: "Yesterday",
        status: "completed",
    },
    {
        id: "3",
        type: "outgoing",
        title: "Withdrawal to Bank",
        description: "Chase ****4821",
        amount: "-$5,200",
        date: "Dec 15",
        status: "completed",
    },
    {
        id: "4",
        type: "pending",
        title: "Social Media Campaign",
        description: "Emma Davis",
        amount: "+$2,200",
        date: "Dec 14",
        status: "pending",
    },
    {
        id: "5",
        type: "incoming",
        title: "Motion Graphics Pack",
        description: "Jordan Lee",
        amount: "+$3,200",
        date: "Dec 12",
        status: "completed",
    },
    {
        id: "6",
        type: "outgoing",
        title: "Withdrawal to PayPal",
        description: "alex@email.com",
        amount: "-$2,800",
        date: "Dec 10",
        status: "completed",
    },
];

const PAYOUT_METHODS = [
    { id: "1", type: "bank", label: "Chase Bank", detail: "****4821", icon: Building2 },
    { id: "2", type: "card", label: "Visa Debit", detail: "****3219", icon: CreditCard },
];

export default function WalletScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "incoming" | "outgoing">("all");

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        // Simulate refresh
        await new Promise((r) => setTimeout(r, 1000));
        setRefreshing(false);
    };

    const handleWithdraw = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        toast.info("Withdrawal feature coming soon");
    };

    const handleAddMethod = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toast.info("Add payout method coming soon");
    };

    const filteredTransactions = MOCK_TRANSACTIONS.filter((t) => {
        if (activeTab === "all") return true;
        return t.type === activeTab || (activeTab === "incoming" && t.type === "pending");
    });

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={22} color={TEXT} strokeWidth={2} />
                </Pressable>
                <Text style={styles.headerTitle}>Wallet</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={ACCENT}
                    />
                }
            >
                {/* Balance Card */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                    <View style={styles.balanceCard}>
                        <LinearGradient
                            colors={["rgba(163,255,63,0.12)", "rgba(163,255,63,0.03)"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.balanceHeader}>
                            <View style={styles.balanceIconWrap}>
                                <Wallet size={20} color={ACCENT} strokeWidth={2} />
                            </View>
                            <View style={styles.balanceInfo}>
                                <Text style={styles.balanceLabel}>Available Balance</Text>
                                <Text style={styles.balanceAmount}>{MOCK_BALANCE}</Text>
                            </View>
                        </View>
                        <Pressable onPress={handleWithdraw} style={styles.withdrawButton}>
                            <Text style={styles.withdrawText}>Withdraw Funds</Text>
                            <ArrowUpRight size={16} color={BG} strokeWidth={2.5} />
                        </Pressable>
                    </View>
                </Animated.View>

                {/* Stats Row */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <View style={styles.statIconWrap}>
                                <DollarSign size={16} color={ACCENT} strokeWidth={2} />
                            </View>
                            <Text style={styles.statValue}>{MOCK_EARNINGS}</Text>
                            <Text style={styles.statLabel}>Total Earnings</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={styles.statIconWrap}>
                                <TrendingUp size={16} color={ACCENT} strokeWidth={2} />
                            </View>
                            <Text style={styles.statValue}>{MOCK_GROWTH}</Text>
                            <Text style={styles.statLabel}>This Month</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={styles.statIconWrap}>
                                <Clock size={16} color={ACCENT} strokeWidth={2} />
                            </View>
                            <Text style={styles.statValue}>{MOCK_COMPLETED_PROJECTS}</Text>
                            <Text style={styles.statLabel}>Completed</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Payout Methods */}
                <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Payout Methods</Text>
                        <Pressable onPress={handleAddMethod}>
                            <Plus size={20} color={ACCENT} strokeWidth={2} />
                        </Pressable>
                    </View>
                    <View style={styles.payoutList}>
                        {PAYOUT_METHODS.map((method, idx) => {
                            const Icon = method.icon;
                            return (
                                <Pressable
                                    key={method.id}
                                    style={[
                                        styles.payoutItem,
                                        idx < PAYOUT_METHODS.length - 1 && { borderBottomWidth: 1, borderBottomColor: BORDER },
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        toast.info("Payout method settings coming soon");
                                    }}
                                >
                                    <View style={styles.payoutIcon}>
                                        <Icon size={18} color={ACCENT} strokeWidth={2} />
                                    </View>
                                    <View style={styles.payoutInfo}>
                                        <Text style={styles.payoutLabel}>{method.label}</Text>
                                        <Text style={styles.payoutDetail}>{method.detail}</Text>
                                    </View>
                                    <ChevronRight size={18} color={TEXT_SUBTLE} />
                                </Pressable>
                            );
                        })}
                    </View>
                </Animated.View>

                {/* Transactions */}
                <Animated.View entering={FadeInDown.delay(400).duration(400)}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>

                    {/* Filter tabs */}
                    <View style={styles.filterTabs}>
                        {(["all", "incoming", "outgoing"] as const).map((tab) => (
                            <Pressable
                                key={tab}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setActiveTab(tab);
                                }}
                                style={[styles.filterTab, activeTab === tab && styles.filterTabActive]}
                            >
                                <Text style={[styles.filterTabText, activeTab === tab && styles.filterTabTextActive]}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Transaction List */}
                    <View style={styles.transactionList}>
                        {filteredTransactions.map((tx, idx) => (
                            <View
                                key={tx.id}
                                style={[
                                    styles.transactionItem,
                                    idx < filteredTransactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: BORDER },
                                ]}
                            >
                                <View style={[
                                    styles.txIcon,
                                    tx.type === "incoming" && { backgroundColor: "rgba(34,197,94,0.1)" },
                                    tx.type === "outgoing" && { backgroundColor: "rgba(239,68,68,0.1)" },
                                    tx.type === "pending" && { backgroundColor: "rgba(251,191,36,0.1)" },
                                ]}>
                                    {tx.type === "incoming" && <ArrowDownLeft size={16} color="#22C55E" strokeWidth={2} />}
                                    {tx.type === "outgoing" && <ArrowUpRight size={16} color="#EF4444" strokeWidth={2} />}
                                    {tx.type === "pending" && <Clock size={16} color="#FBBF24" strokeWidth={2} />}
                                </View>
                                <View style={styles.txInfo}>
                                    <Text style={styles.txTitle}>{tx.title}</Text>
                                    <Text style={styles.txDesc}>{tx.description} · {tx.date}</Text>
                                </View>
                                <View style={styles.txAmountWrap}>
                                    <Text style={[
                                        styles.txAmount,
                                        tx.type === "incoming" && { color: "#22C55E" },
                                        tx.type === "outgoing" && { color: "#EF4444" },
                                        tx.type === "pending" && { color: "#FBBF24" },
                                    ]}>
                                        {tx.amount}
                                    </Text>
                                    {tx.status === "pending" && (
                                        <Text style={styles.txStatus}>Pending</Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
    },
    header: {
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
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
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
    scrollContent: {
        padding: 20,
    },
    // Balance Card
    balanceCard: {
        borderRadius: 22,
        padding: 24,
        marginBottom: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: ACCENT_BORDER,
        backgroundColor: SURFACE,
    },
    balanceHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    balanceIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(163,255,63,0.15)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    balanceInfo: {
        flex: 1,
    },
    balanceLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: TEXT_MUTED,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: "900",
        color: TEXT,
        letterSpacing: -0.5,
    },
    withdrawButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: ACCENT,
        paddingVertical: 14,
        borderRadius: 14,
    },
    withdrawText: {
        fontSize: 16,
        fontWeight: "800",
        color: BG,
    },
    // Stats Row
    statsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 28,
    },
    statCard: {
        flex: 1,
        backgroundColor: SURFACE,
        borderRadius: 18,
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: BORDER,
    },
    statIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: ACCENT_DIM,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    statValue: {
        fontSize: 16,
        fontWeight: "800",
        color: TEXT,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: "500",
        color: TEXT_MUTED,
    },
    // Payout Methods
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: TEXT,
        letterSpacing: -0.3,
        marginBottom: 12,
    },
    payoutList: {
        backgroundColor: SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        marginBottom: 28,
        overflow: "hidden",
    },
    payoutItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    payoutIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: ACCENT_DIM,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    payoutInfo: {
        flex: 1,
    },
    payoutLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: TEXT,
    },
    payoutDetail: {
        fontSize: 13,
        color: TEXT_MUTED,
        marginTop: 2,
    },
    // Filter Tabs
    filterTabs: {
        flexDirection: "row",
        padding: 4,
        borderRadius: 14,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        marginBottom: 16,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
    },
    filterTabActive: {
        backgroundColor: ACCENT,
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: "600",
        color: TEXT_MUTED,
    },
    filterTabTextActive: {
        color: BG,
        fontWeight: "800",
    },
    // Transactions
    transactionList: {
        backgroundColor: SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: "hidden",
    },
    transactionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    txInfo: {
        flex: 1,
    },
    txTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: TEXT,
        marginBottom: 3,
    },
    txDesc: {
        fontSize: 13,
        color: TEXT_MUTED,
    },
    txAmountWrap: {
        alignItems: "flex-end",
    },
    txAmount: {
        fontSize: 15,
        fontWeight: "700",
    },
    txStatus: {
        fontSize: 11,
        fontWeight: "600",
        color: "#FBBF24",
        marginTop: 2,
    },
});
