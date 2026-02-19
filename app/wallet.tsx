import { useState, useEffect, useCallback } from "react";
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
import { getMyWallet, getTransactions, type WalletInfo, type Transaction as ApiTransaction, type TransactionType } from "@/lib/api/wallet";
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

// Map API transaction types to display categories
type TxCategory = "incoming" | "outgoing" | "pending";

function txCategory(type: TransactionType, status: string): TxCategory {
    if (status === "PENDING") return "pending";
    if (type === "WITHDRAWAL" || type === "ORDER_PAYMENT" || type === "PLATFORM_FEE") return "outgoing";
    return "incoming"; // FREELANCER_EARN, REFUND
}

function formatCents(cents: number, currency = "USD"): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PAYOUT_METHODS = [
    { id: "1", type: "bank", label: "Chase Bank", detail: "****4821", icon: Building2 },
    { id: "2", type: "card", label: "Visa Debit", detail: "****3219", icon: CreditCard },
];

export default function WalletScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"all" | "incoming" | "outgoing">("all");
    const [wallet, setWallet] = useState<WalletInfo | null>(null);
    const [transactions, setTransactions] = useState<ApiTransaction[]>([]);

    const fetchData = useCallback(async () => {
        try {
            const [w, txRes] = await Promise.all([
                getMyWallet().catch(() => null),
                getTransactions({ limit: 20 }).catch(() => ({ transactions: [] })),
            ]);
            if (w) setWallet(w);
            setTransactions(txRes.transactions || []);
        } catch {
            // silent
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
    };

    const handleWithdraw = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        toast.info("Withdrawal feature coming soon");
    };

    const handleAddMethod = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toast.info("Add payout method coming soon");
    };

    const balance = wallet ? formatCents(wallet.balance, wallet.currency) : "$0.00";
    const totalEarned = wallet ? formatCents(wallet.totalEarned, wallet.currency) : "$0.00";
    const pendingBalance = wallet ? formatCents(wallet.pendingBalance, wallet.currency) : "$0.00";

    const filteredTransactions = transactions.filter((t) => {
        if (activeTab === "all") return true;
        const cat = txCategory(t.type, t.status);
        return cat === activeTab || (activeTab === "incoming" && cat === "pending");
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
                                <Text style={styles.balanceAmount}>{loading ? "..." : balance}</Text>
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
                            <Text style={styles.statValue}>{loading ? "..." : totalEarned}</Text>
                            <Text style={styles.statLabel}>Total Earnings</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={styles.statIconWrap}>
                                <TrendingUp size={16} color={ACCENT} strokeWidth={2} />
                            </View>
                            <Text style={styles.statValue}>{loading ? "..." : pendingBalance}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={styles.statIconWrap}>
                                <Clock size={16} color={ACCENT} strokeWidth={2} />
                            </View>
                            <Text style={styles.statValue}>{loading ? "..." : transactions.length}</Text>
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
                        {loading ? (
                            <View style={{ padding: 30, alignItems: "center" }}>
                                <ActivityIndicator color={ACCENT} />
                            </View>
                        ) : filteredTransactions.length === 0 ? (
                            <View style={{ padding: 30, alignItems: "center" }}>
                                <Text style={{ color: TEXT_MUTED, fontSize: 14 }}>No transactions yet</Text>
                            </View>
                        ) : filteredTransactions.map((tx, idx) => {
                            const cat = txCategory(tx.type, tx.status);
                            const sign = cat === "outgoing" ? "-" : "+";
                            const amountStr = `${sign}${formatCents(tx.amount, tx.currency)}`;
                            return (
                                <View
                                    key={tx.id}
                                    style={[
                                        styles.transactionItem,
                                        idx < filteredTransactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: BORDER },
                                    ]}
                                >
                                    <View style={[
                                        styles.txIcon,
                                        cat === "incoming" && { backgroundColor: "rgba(34,197,94,0.1)" },
                                        cat === "outgoing" && { backgroundColor: "rgba(239,68,68,0.1)" },
                                        cat === "pending" && { backgroundColor: "rgba(251,191,36,0.1)" },
                                    ]}>
                                        {cat === "incoming" && <ArrowDownLeft size={16} color="#22C55E" strokeWidth={2} />}
                                        {cat === "outgoing" && <ArrowUpRight size={16} color="#EF4444" strokeWidth={2} />}
                                        {cat === "pending" && <Clock size={16} color="#FBBF24" strokeWidth={2} />}
                                    </View>
                                    <View style={styles.txInfo}>
                                        <Text style={styles.txTitle}>{tx.description || tx.type.replace(/_/g, " ")}</Text>
                                        <Text style={styles.txDesc}>{formatDate(tx.createdAt)}</Text>
                                    </View>
                                    <View style={styles.txAmountWrap}>
                                        <Text style={[
                                            styles.txAmount,
                                            cat === "incoming" && { color: "#22C55E" },
                                            cat === "outgoing" && { color: "#EF4444" },
                                            cat === "pending" && { color: "#FBBF24" },
                                        ]}>
                                            {amountStr}
                                        </Text>
                                        {cat === "pending" && (
                                            <Text style={styles.txStatus}>Pending</Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
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
