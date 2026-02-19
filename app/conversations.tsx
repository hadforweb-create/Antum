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
import { Image } from "expo-image";
import { ArrowLeft, MessageCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useAuthStore } from "@/lib/store";
import { getConversations, ConversationResponse } from "@/lib/api/conversations";

// Figma design tokens
const BG = "#0b0b0f";
const SURFACE = "#131316";
const ELEVATED = "#1a1a1e";
const ACCENT = "#a3ff3f";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const TEXT_SUBTLE = "rgba(255,255,255,0.3)";
const BORDER = "rgba(255,255,255,0.06)";

export default function ConversationsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [conversations, setConversations] = useState<ConversationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchConversations = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);
            const response = await getConversations();
            setConversations(response.conversations);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load conversations";
            setError(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchConversations(true);
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleConversationPress = (conversationId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/conversation/${conversationId}`);
    };

    const getOtherParticipant = (conversation: ConversationResponse) => {
        return conversation.participants.find((p) => p.userId !== user?.id)?.user;
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const renderConversation = ({ item, index }: { item: ConversationResponse; index: number }) => {
        const otherUser = getOtherParticipant(item);
        const displayName = otherUser?.name || otherUser?.email || "Unknown User";
        const initial = displayName.charAt(0).toUpperCase();
        const lastMessageTime = item.lastMessage?.createdAt || item.createdAt;

        return (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
                <Pressable
                    onPress={() => handleConversationPress(item.id)}
                    style={({ pressed }) => [
                        styles.conversationItem,
                        pressed && { opacity: 0.7 },
                    ]}
                >
                    <View style={styles.avatar}>
                        {(otherUser as any)?.avatarUrl ? (
                            <Image
                                source={{ uri: (otherUser as any).avatarUrl }}
                                style={{ width: "100%", height: "100%", borderRadius: 26 }}
                                contentFit="cover"
                            />
                        ) : (
                            <Text style={styles.avatarText}>{initial}</Text>
                        )}
                    </View>

                    <View style={styles.conversationContent}>
                        <View style={styles.conversationHeader}>
                            <Text style={styles.userName} numberOfLines={1}>
                                {displayName}
                            </Text>
                            <Text style={styles.timeText}>{formatTime(lastMessageTime)}</Text>
                        </View>

                        {item.lastMessage ? (
                            <Text style={styles.lastMessage} numberOfLines={2}>
                                {item.lastMessage.senderId === user?.id ? "You: " : ""}
                                {item.lastMessage.text}
                            </Text>
                        ) : (
                            <Text style={[styles.lastMessage, { fontStyle: "italic" }]}>
                                No messages yet
                            </Text>
                        )}
                    </View>
                </Pressable>
            </Animated.View>
        );
    };

    const renderEmptyState = () => (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <MessageCircle size={48} color={TEXT_MUTED} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Start chatting</Text>
            <Text style={styles.emptySubtitle}>
                Message freelancers from their reels or profile to start a conversation.
            </Text>
            <Pressable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/(tabs)");
                }}
                style={styles.retryButton}
            >
                <Text style={styles.retryText}>Browse Reels</Text>
            </Pressable>
        </Animated.View>
    );

    const renderError = () => (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Something went wrong</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
            <Pressable onPress={() => fetchConversations()} style={styles.retryButton}>
                <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={22} color={TEXT} strokeWidth={2} />
                </Pressable>
                <Text style={styles.headerTitle}>Messages</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={ACCENT} />
                </View>
            ) : error ? (
                renderError()
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderConversation}
                    contentContainerStyle={[
                        styles.listContent,
                        conversations.length === 0 && styles.listContentEmpty,
                    ]}
                    ListEmptyComponent={renderEmptyState}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchConversations(true)}
                            tintColor={ACCENT}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
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
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        paddingVertical: 8,
    },
    listContentEmpty: {
        flex: 1,
    },
    conversationItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: SURFACE,
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: ACCENT,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
        overflow: "hidden",
    },
    avatarText: {
        color: "#0b0b0f",
        fontSize: 20,
        fontWeight: "700",
    },
    conversationContent: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: "700",
        color: TEXT,
        flex: 1,
        marginRight: 8,
    },
    timeText: {
        fontSize: 12,
        color: TEXT_SUBTLE,
    },
    lastMessage: {
        fontSize: 14,
        color: TEXT_MUTED,
        lineHeight: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(255,255,255,0.05)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "900",
        color: TEXT,
        textAlign: "center",
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: TEXT_MUTED,
        textAlign: "center",
        lineHeight: 22,
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: ACCENT,
    },
    retryText: {
        color: "#0b0b0f",
        fontSize: 16,
        fontWeight: "800",
    },
});
