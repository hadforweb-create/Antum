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
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import {
    ArrowLeft,
    Heart,
    MessageCircle,
    UserPlus,
    Briefcase,
    CheckCheck,
    Bell,
} from "lucide-react-native";
import { useThemeStore } from "@/lib/store";
import {
    getNotifications,
    markAsRead,
    markAllRead,
    NotificationItem,
} from "@/lib/api/notifications";
import { useFigmaColors } from "@/lib/figma-colors";
import { toast } from "@/lib/ui/toast";

const ICON_MAP: Record<string, { icon: typeof Heart; color: string }> = {
    follow: { icon: UserPlus, color: "#3B82F6" },
    like: { icon: Heart, color: "#EF4444" },
    comment: { icon: MessageCircle, color: "#8B5CF6" },
    hire_request: { icon: Briefcase, color: "#F59E0B" },
    message: { icon: MessageCircle, color: "#10B981" },
};

export default function NotificationsScreen() {
    const { isDark } = useThemeStore();
    const router = useRouter();
    const c = useFigmaColors();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const bg = c.bg;
    const cardBg = c.cardBg;
    const textColor = c.text;
    const subtitleColor = c.textMuted;
    const unreadBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch {
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllRead();
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
            );
            toast.success("All marked as read");
        } catch {
            toast.error("Failed to mark as read");
        }
    };

    const handleNotificationPress = async (item: NotificationItem) => {
        // Mark as read
        if (!item.read_at) {
            markAsRead(item.id);
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n
                )
            );
        }

        // Navigate based on type
        if (item.type === "follow" && item.actor_id) {
            router.push(`/profile/${item.actor_id}` as any);
        } else if (item.type === "like" && item.target_type === "service" && item.target_id) {
            router.push(`/service/${item.target_id}` as any);
        } else if (item.type === "comment" && item.target_type === "service" && item.target_id) {
            router.push(`/service/${item.target_id}` as any);
        } else if (item.type === "hire_request" && item.target_id) {
            router.push(`/service/${item.target_id}` as any);
        } else if (item.type === "message" && item.target_id) {
            router.push(`/conversation/${item.target_id}` as any);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "now";
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const renderItem = ({ item, index }: { item: NotificationItem; index: number }) => {
        const config = ICON_MAP[item.type] || ICON_MAP.message;
        const IconComponent = config.icon;
        const isUnread = !item.read_at;

        return (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
                <Pressable
                    style={[
                        styles.notificationRow,
                        {
                            backgroundColor: isUnread ? unreadBg : cardBg,
                            borderBottomColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                        },
                    ]}
                    onPress={() => handleNotificationPress(item)}
                >
                    <View style={[styles.iconCircle, { backgroundColor: config.color + "18" }]}>
                        <IconComponent size={18} color={config.color} strokeWidth={2} />
                    </View>
                    <View style={styles.notificationContent}>
                        <Text style={[styles.notificationBody, { color: textColor }]} numberOfLines={2}>
                            {item.body || item.type}
                        </Text>
                        <Text style={[styles.notificationTime, { color: subtitleColor }]}>
                            {formatTime(item.created_at)}
                        </Text>
                    </View>
                    {isUnread && <View style={[styles.unreadDot, { backgroundColor: c.accent }]} />}
                </Pressable>
            </Animated.View>
        );
    };

    const renderEmpty = () => (
        <Animated.View entering={FadeIn.delay(200)} style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]}>
                <Bell size={40} color={subtitleColor} strokeWidth={1.5} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No notifications yet</Text>
            <Text style={[styles.emptySubtitle, { color: subtitleColor }]}>
                When someone follows you, likes your work, or sends a message, you'll see it here.
            </Text>
        </Animated.View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={22} color={textColor} strokeWidth={2} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: textColor }]}>Notifications</Text>
                <Pressable onPress={handleMarkAllRead} style={styles.markReadButton}>
                    <CheckCheck size={20} color={c.accent} strokeWidth={2} />
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={c.accent} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.accent} />
                    }
                    contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        letterSpacing: -0.2,
    },
    markReadButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    notificationRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 14,
        borderBottomWidth: 1,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    notificationContent: {
        flex: 1,
        gap: 4,
    },
    notificationBody: {
        fontSize: 15,
        fontWeight: "500",
        lineHeight: 20,
    },
    notificationTime: {
        fontSize: 13,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    emptyList: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: "center",
    },
});
