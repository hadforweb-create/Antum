import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Package, Clock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { getMyOrders, Order, OrderStatus } from "@/lib/api/orders";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { toast } from "@/lib/ui/toast";

const BG = "#0b0b0f";
const SURFACE = "#131316";
const ELEVATED = "#1a1a1e";
const ACCENT = "#a3ff3f";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const TEXT_SUBTLE = "rgba(255,255,255,0.3)";
const BORDER = "rgba(255,255,255,0.06)";

const TABS: { label: string; role: "all" | "client" | "freelancer" }[] = [
    { label: "All", role: "all" },
    { label: "As Client", role: "client" },
    { label: "As Seller", role: "freelancer" },
];

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function OrderRow({ order, onPress }: { order: Order; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} style={styles.orderCard}>
            <View style={styles.orderTop}>
                <View style={styles.iconBox}>
                    <Package size={18} color={ACCENT} strokeWidth={2} />
                </View>
                <View style={styles.orderMeta}>
                    <Text style={styles.serviceTitle} numberOfLines={1}>
                        {order.service?.title ?? "Service"}
                    </Text>
                    <Text style={styles.orderDate}>{timeAgo(order.createdAt)}</Text>
                </View>
                <OrderStatusBadge status={order.status} size="sm" />
            </View>

            <View style={styles.orderBottom}>
                <Text style={styles.price}>{order.priceFormatted}</Text>
                {order.dueAt && order.status !== "COMPLETED" && order.status !== "CANCELLED" ? (
                    <View style={styles.dueRow}>
                        <Clock size={12} color={TEXT_MUTED} />
                        <Text style={styles.dueText}>
                            Due {new Date(order.dueAt).toLocaleDateString()}
                        </Text>
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}

export default function OrdersScreen() {
    const router = useRouter();
    const [tab, setTab] = useState<"all" | "client" | "freelancer">("all");
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            const res = await getMyOrders({ role: tab, limit: 30 });
            setOrders(res.orders);
        } catch {
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tab]);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = () => {
        setRefreshing(true);
        load(true);
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.back();
                    }}
                    style={styles.backBtn}
                >
                    <ArrowLeft size={22} color={TEXT} strokeWidth={2} />
                </Pressable>
                <Text style={styles.title}>My Orders</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
                {TABS.map((t) => (
                    <Pressable
                        key={t.role}
                        onPress={() => {
                            Haptics.selectionAsync();
                            setTab(t.role);
                        }}
                        style={[styles.tab, tab === t.role && styles.tabActive]}
                    >
                        <Text style={[styles.tabText, tab === t.role && styles.tabTextActive]}>
                            {t.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={ACCENT} />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(o) => o.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={ACCENT}
                        />
                    }
                    renderItem={({ item }) => (
                        <OrderRow
                            order={item}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(`/order/${item.id}` as any);
                            }}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Package size={48} color={TEXT_SUBTLE} strokeWidth={1.5} />
                            <Text style={styles.emptyTitle}>No orders yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Orders will appear here once you start hiring or get hired.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: ELEVATED,
        borderWidth: 1,
        borderColor: BORDER,
    },
    title: {
        fontSize: 20,
        fontWeight: "900",
        color: TEXT,
        letterSpacing: -0.3,
    },
    tabRow: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 99,
        alignItems: "center",
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
    },
    tabActive: {
        backgroundColor: ACCENT,
        borderColor: ACCENT,
    },
    tabText: {
        color: TEXT_MUTED,
        fontSize: 13,
        fontWeight: "600",
    },
    tabTextActive: {
        color: "#0b0b0f",
    },
    list: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 32,
    },
    orderCard: {
        backgroundColor: SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 16,
        marginBottom: 12,
    },
    orderTop: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "rgba(163,255,63,0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    orderMeta: {
        flex: 1,
        marginRight: 8,
    },
    serviceTitle: {
        color: TEXT,
        fontSize: 15,
        fontWeight: "600",
    },
    orderDate: {
        color: TEXT_MUTED,
        fontSize: 12,
        marginTop: 2,
    },
    orderBottom: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    price: {
        color: ACCENT,
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
    dueRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    dueText: {
        color: TEXT_MUTED,
        fontSize: 12,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    empty: {
        alignItems: "center",
        paddingTop: 80,
        gap: 12,
    },
    emptyTitle: {
        color: TEXT,
        fontSize: 18,
        fontWeight: "700",
    },
    emptySubtitle: {
        color: TEXT_MUTED,
        fontSize: 14,
        textAlign: "center",
        paddingHorizontal: 32,
        lineHeight: 21,
    },
});
