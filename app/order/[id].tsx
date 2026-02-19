import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
    ArrowLeft,
    Calendar,
    Clock,
    DollarSign,
    MessageCircle,
    CheckCircle2,
    XCircle,
    Send,
    RotateCcw,
    Star,
    FileText,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { useAuthStore } from "@/lib/store";
import {
    getOrder,
    updateOrderStatus,
    deliverOrder,
    completeOrder,
    cancelOrder,
    requestRevision,
    Order,
    OrderStatus,
} from "@/lib/api/orders";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { toast } from "@/lib/ui/toast";

// Design tokens
const BG = "#0b0b0f";
const SURFACE = "#131316";
const ELEVATED = "#1a1a1e";
const ACCENT = "#a3ff3f";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const TEXT_SUBTLE = "rgba(255,255,255,0.3)";
const BORDER = "rgba(255,255,255,0.06)";
const DANGER = "#ef4444";

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuthStore();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [acting, setActing] = useState(false);

    const fetchOrder = useCallback(async () => {
        if (!id) return;
        try {
            const data = await getOrder(id);
            setOrder(data);
        } catch {
            toast.error("Failed to load order");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrder();
    };

    const isClient = user?.id === order?.client?.id;
    const isFreelancer = user?.id === order?.freelancer?.id;

    const handleAction = async (
        actionFn: () => Promise<Order>,
        successMsg: string
    ) => {
        setActing(true);
        try {
            const updated = await actionFn();
            setOrder(updated);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success(successMsg);
        } catch (e: any) {
            toast.error(e?.message || "Action failed");
        } finally {
            setActing(false);
        }
    };

    const handleAccept = () =>
        handleAction(
            () => updateOrderStatus(id!, "IN_PROGRESS"),
            "Order accepted!"
        );

    const handleDeliver = () =>
        handleAction(() => deliverOrder(id!), "Order delivered!");

    const handleComplete = () =>
        handleAction(() => completeOrder(id!), "Order completed!");

    const handleCancel = () => {
        Alert.prompt(
            "Cancel Order",
            "Please provide a reason for cancellation:",
            [
                { text: "Back", style: "cancel" },
                {
                    text: "Cancel Order",
                    style: "destructive",
                    onPress: (reason) => {
                        if (reason?.trim()) {
                            handleAction(
                                () => cancelOrder(id!, reason.trim()),
                                "Order cancelled"
                            );
                        }
                    },
                },
            ],
            "plain-text"
        );
    };

    const handleRevision = () => {
        Alert.prompt(
            "Request Revision",
            "What changes do you need?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Submit",
                    onPress: (reason) => {
                        if (reason?.trim()) {
                            handleAction(
                                () => requestRevision(id!, reason.trim()),
                                "Revision requested"
                            );
                        }
                    },
                },
            ],
            "plain-text"
        );
    };

    const formatDate = (d?: string | null) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatPrice = (cents: number, currency = "USD") => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
        }).format(cents / 100);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator color={ACCENT} size="large" />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ color: TEXT_MUTED, fontSize: 16 }}>Order not found</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: ACCENT, fontWeight: "700" }}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const otherParty = isClient ? order.freelancer : order.client;

    return (
        <View style={styles.container}>
            {/* Header */}
            <SafeAreaView edges={["top"]} style={styles.headerSafe}>
                <View style={styles.headerRow}>
                    <Pressable
                        style={styles.backBtn}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                    >
                        <ArrowLeft size={20} color={TEXT} strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Order Details</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={ACCENT}
                    />
                }
            >
                {/* Status + Service card */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                    <View style={styles.card}>
                        <View style={styles.statusRow}>
                            <OrderStatusBadge status={order.status as OrderStatus} />
                            <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
                        </View>

                        {order.service && (
                            <Pressable
                                style={styles.serviceRow}
                                onPress={() =>
                                    router.push(`/service/${order.service!.id}` as any)
                                }
                            >
                                {order.service.imageUrl ? (
                                    <Image
                                        source={{ uri: order.service.imageUrl }}
                                        style={styles.serviceImg}
                                        contentFit="cover"
                                    />
                                ) : (
                                    <LinearGradient
                                        colors={["#1a2a10", "#0b0b0f"]}
                                        style={styles.serviceImg}
                                    />
                                )}
                                <View style={styles.serviceInfo}>
                                    <Text style={styles.serviceTitle} numberOfLines={2}>
                                        {order.service.title}
                                    </Text>
                                    {order.tier && (
                                        <Text style={styles.tierName}>{order.tier.name} Tier</Text>
                                    )}
                                </View>
                            </Pressable>
                        )}
                    </View>
                </Animated.View>

                {/* Other Party */}
                {otherParty && (
                    <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                        <Pressable
                            style={styles.card}
                            onPress={() =>
                                router.push(`/profile/${otherParty.id}` as any)
                            }
                        >
                            <Text style={styles.cardLabel}>
                                {isClient ? "Freelancer" : "Client"}
                            </Text>
                            <View style={styles.userRow}>
                                {otherParty.avatarUrl ? (
                                    <Image
                                        source={{ uri: otherParty.avatarUrl }}
                                        style={styles.userAvatar}
                                        contentFit="cover"
                                    />
                                ) : (
                                    <LinearGradient
                                        colors={[ACCENT, "#65a30d"]}
                                        style={[
                                            styles.userAvatar,
                                            { justifyContent: "center", alignItems: "center" },
                                        ]}
                                    >
                                        <Text style={styles.initials}>
                                            {(
                                                otherParty.displayName ||
                                                "?"
                                            )
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </Text>
                                    </LinearGradient>
                                )}
                                <Text style={styles.userName}>
                                    {otherParty.displayName || "User"}
                                </Text>
                            </View>
                        </Pressable>
                    </Animated.View>
                )}

                {/* Order Details */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Details</Text>
                        <View style={styles.detailGrid}>
                            <View style={styles.detailItem}>
                                <DollarSign size={16} color={ACCENT} strokeWidth={2} />
                                <View>
                                    <Text style={styles.detailLabel}>Price</Text>
                                    <Text style={styles.detailValue}>
                                        {order.priceFormatted ||
                                            formatPrice(order.price, order.currency)}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.detailItem}>
                                <Clock size={16} color={ACCENT} strokeWidth={2} />
                                <View>
                                    <Text style={styles.detailLabel}>Delivery</Text>
                                    <Text style={styles.detailValue}>
                                        {order.deliveryDays} days
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.detailItem}>
                                <Calendar size={16} color={ACCENT} strokeWidth={2} />
                                <View>
                                    <Text style={styles.detailLabel}>Ordered</Text>
                                    <Text style={styles.detailValue}>
                                        {formatDate(order.createdAt)}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.detailItem}>
                                <Calendar size={16} color={ACCENT} strokeWidth={2} />
                                <View>
                                    <Text style={styles.detailLabel}>Due</Text>
                                    <Text style={styles.detailValue}>
                                        {formatDate(order.dueAt)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Requirements */}
                {order.requirements && (
                    <Animated.View entering={FadeInDown.delay(250).duration(400)}>
                        <View style={styles.card}>
                            <View style={styles.reqHeader}>
                                <FileText size={16} color={ACCENT} strokeWidth={2} />
                                <Text style={styles.cardLabel}>Requirements</Text>
                            </View>
                            <Text style={styles.reqText}>{order.requirements}</Text>
                        </View>
                    </Animated.View>
                )}

                {/* Milestones */}
                {order.milestones && order.milestones.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                        <View style={styles.card}>
                            <Text style={styles.cardLabel}>Milestones</Text>
                            {order.milestones.map((m, idx) => (
                                <View
                                    key={m.id}
                                    style={[
                                        styles.milestoneItem,
                                        idx < order.milestones!.length - 1 && {
                                            borderBottomWidth: 1,
                                            borderBottomColor: BORDER,
                                        },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.milestoneCheck,
                                            m.isCompleted && styles.milestoneCheckDone,
                                        ]}
                                    >
                                        {m.isCompleted && (
                                            <CheckCircle2
                                                size={14}
                                                color={BG}
                                                strokeWidth={2.5}
                                            />
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[
                                                styles.milestoneTitle,
                                                m.isCompleted && {
                                                    textDecorationLine: "line-through",
                                                    color: TEXT_MUTED,
                                                },
                                            ]}
                                        >
                                            {m.title}
                                        </Text>
                                        {m.dueAt && (
                                            <Text style={styles.milestoneDue}>
                                                Due {formatDate(m.dueAt)}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </Animated.View>
                )}

                {/* Action Buttons */}
                <Animated.View entering={FadeInDown.delay(350).duration(400)}>
                    <View style={styles.actionsCard}>
                        {/* Message */}
                        {order.conversationId && (
                            <Pressable
                                style={styles.actionBtn}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push(
                                        `/conversation/${order.conversationId}` as any
                                    );
                                }}
                            >
                                <MessageCircle size={18} color={BG} strokeWidth={2} />
                                <Text style={styles.actionBtnText}>Message</Text>
                            </Pressable>
                        )}

                        {/* Freelancer: Accept/Deliver */}
                        {isFreelancer && order.status === "PENDING" && (
                            <Pressable
                                style={styles.actionBtn}
                                disabled={acting}
                                onPress={handleAccept}
                            >
                                <CheckCircle2 size={18} color={BG} strokeWidth={2} />
                                <Text style={styles.actionBtnText}>
                                    {acting ? "..." : "Accept Order"}
                                </Text>
                            </Pressable>
                        )}
                        {isFreelancer && order.status === "IN_PROGRESS" && (
                            <Pressable
                                style={styles.actionBtn}
                                disabled={acting}
                                onPress={handleDeliver}
                            >
                                <Send size={18} color={BG} strokeWidth={2} />
                                <Text style={styles.actionBtnText}>
                                    {acting ? "..." : "Deliver"}
                                </Text>
                            </Pressable>
                        )}

                        {/* Client: Complete / Request Revision / Review */}
                        {isClient && order.status === "DELIVERED" && (
                            <>
                                <Pressable
                                    style={styles.actionBtn}
                                    disabled={acting}
                                    onPress={handleComplete}
                                >
                                    <CheckCircle2 size={18} color={BG} strokeWidth={2} />
                                    <Text style={styles.actionBtnText}>
                                        {acting ? "..." : "Complete"}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={styles.actionBtnOutline}
                                    disabled={acting}
                                    onPress={handleRevision}
                                >
                                    <RotateCcw size={18} color={TEXT} strokeWidth={2} />
                                    <Text style={styles.actionBtnOutlineText}>
                                        Request Revision
                                    </Text>
                                </Pressable>
                            </>
                        )}

                        {isClient &&
                            order.status === "COMPLETED" &&
                            !order.review && (
                                <Pressable
                                    style={styles.actionBtn}
                                    onPress={() => {
                                        Haptics.impactAsync(
                                            Haptics.ImpactFeedbackStyle.Light
                                        );
                                        router.push(
                                            `/review/create?orderId=${order.id}` as any
                                        );
                                    }}
                                >
                                    <Star size={18} color={BG} strokeWidth={2} />
                                    <Text style={styles.actionBtnText}>Leave Review</Text>
                                </Pressable>
                            )}

                        {/* Cancel (both roles, non-terminal) */}
                        {["PENDING", "IN_PROGRESS"].includes(order.status) && (
                            <Pressable
                                style={styles.cancelBtn}
                                disabled={acting}
                                onPress={handleCancel}
                            >
                                <XCircle size={18} color={DANGER} strokeWidth={2} />
                                <Text style={styles.cancelBtnText}>
                                    {acting ? "..." : "Cancel Order"}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    headerSafe: { paddingHorizontal: 20 },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 8,
        paddingBottom: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: ELEVATED,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: BORDER,
    },
    headerTitle: { color: TEXT, fontSize: 18, fontWeight: "800" },
    scrollContent: { paddingHorizontal: 20, gap: 14 },

    card: {
        backgroundColor: SURFACE,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: BORDER,
    },
    cardLabel: {
        color: TEXT_MUTED,
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: 12,
    },

    statusRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    orderId: { color: TEXT_SUBTLE, fontSize: 12, fontWeight: "600" },

    serviceRow: { flexDirection: "row", gap: 12, alignItems: "center" },
    serviceImg: { width: 56, height: 56, borderRadius: 14, overflow: "hidden" },
    serviceInfo: { flex: 1 },
    serviceTitle: { color: TEXT, fontSize: 15, fontWeight: "700", marginBottom: 4 },
    tierName: { color: ACCENT, fontSize: 12, fontWeight: "600" },

    userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    userAvatar: { width: 44, height: 44, borderRadius: 22, overflow: "hidden" },
    userName: { color: TEXT, fontSize: 15, fontWeight: "700" },
    initials: { color: "#0b0b0f", fontSize: 16, fontWeight: "900" },

    detailGrid: { gap: 14 },
    detailItem: { flexDirection: "row", alignItems: "center", gap: 12 },
    detailLabel: { color: TEXT_MUTED, fontSize: 12, marginBottom: 1 },
    detailValue: { color: TEXT, fontSize: 14, fontWeight: "700" },

    reqHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
    reqText: { color: TEXT_SEC, fontSize: 14, lineHeight: 20 },

    milestoneItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
    milestoneCheck: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: BORDER,
        justifyContent: "center",
        alignItems: "center",
    },
    milestoneCheckDone: {
        backgroundColor: ACCENT,
        borderColor: ACCENT,
    },
    milestoneTitle: { color: TEXT, fontSize: 14, fontWeight: "600" },
    milestoneDue: { color: TEXT_MUTED, fontSize: 12, marginTop: 2 },

    actionsCard: {
        gap: 10,
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: ACCENT,
    },
    actionBtnText: { color: BG, fontSize: 15, fontWeight: "800" },
    actionBtnOutline: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: BORDER,
    },
    actionBtnOutlineText: { color: TEXT, fontSize: 15, fontWeight: "700" },
    cancelBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: "rgba(239,68,68,0.08)",
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.2)",
    },
    cancelBtnText: { color: DANGER, fontSize: 15, fontWeight: "700" },
});
