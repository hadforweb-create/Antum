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
import { ArrowLeft, MessageCircle, User } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useAuthStore, useThemeStore } from "@/lib/store";
import { getConversations, ConversationResponse } from "@/lib/api/conversations";
import { colors } from "@/lib/theme";

export default function ConversationsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { isDark } = useThemeStore();

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

    // Poll for new conversations every 10 seconds
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
                        isDark && styles.conversationItemDark,
                        pressed && styles.conversationItemPressed,
                    ]}
                >
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>

                    <View style={styles.conversationContent}>
                        <View style={styles.conversationHeader}>
                            <Text
                                style={[styles.userName, isDark && styles.textDark]}
                                numberOfLines={1}
                            >
                                {displayName}
                            </Text>
                            <Text style={styles.timeText}>{formatTime(lastMessageTime)}</Text>
                        </View>

                        {item.lastMessage ? (
                            <Text
                                style={[styles.lastMessage, isDark && styles.lastMessageDark]}
                                numberOfLines={2}
                            >
                                {item.lastMessage.senderId === user?.id ? "You: " : ""}
                                {item.lastMessage.text}
                            </Text>
                        ) : (
                            <Text style={[styles.lastMessage, styles.noMessages]}>
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
            <View style={[styles.emptyIconContainer, isDark && styles.emptyIconContainerDark]}>
                <MessageCircle size={48} color={isDark ? "#8E8E93" : "#C7C7CC"} strokeWidth={1.5} />
            </View>
            <Text style={[styles.emptyTitle, isDark && styles.textDark]}>Start chatting</Text>
            <Text style={[styles.emptySubtitle, isDark && styles.subtitleDark]}>
                Message freelancers from their reels or profile to start a conversation.
            </Text>
            <Pressable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/(tabs)");
                }}
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
            >
                <Text style={styles.retryText}>Browse Reels</Text>
            </Pressable>
        </Animated.View>
    );

    const renderError = () => (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
                Something went wrong
            </Text>
            <Text style={[styles.emptySubtitle, isDark && styles.subtitleDark]}>{error}</Text>
            <Pressable
                onPress={() => fetchConversations()}
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
            >
                <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
        </Animated.View>
    );

    return (
        <SafeAreaView
            style={[styles.container, isDark && styles.containerDark]}
            edges={["top"]}
        >
            {/* Header */}
            <View style={[styles.header, isDark && styles.headerDark]}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color={isDark ? "#FFF" : "#000"} strokeWidth={2} />
                </Pressable>
                <Text style={[styles.headerTitle, isDark && styles.textDark]}>Messages</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Content */}
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
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
                            tintColor={colors.primary}
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
        backgroundColor: "#F2F2F7",
    },
    containerDark: {
        backgroundColor: "#000",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: "rgba(0,0,0,0.1)",
        backgroundColor: "#F2F2F7",
    },
    headerDark: {
        backgroundColor: "#000",
        borderBottomColor: "rgba(255,255,255,0.1)",
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#000",
    },
    headerSpacer: {
        width: 40,
    },
    textDark: {
        color: "#FFF",
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
        backgroundColor: "#FFF",
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 16,
    },
    conversationItemDark: {
        backgroundColor: "#1C1C1E",
    },
    conversationItemPressed: {
        opacity: 0.7,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    avatarText: {
        color: "#FFF",
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
        fontWeight: "600",
        color: "#000",
        flex: 1,
        marginRight: 8,
    },
    timeText: {
        fontSize: 13,
        color: "#8E8E93",
    },
    lastMessage: {
        fontSize: 14,
        color: "#3C3C43",
        lineHeight: 20,
    },
    lastMessageDark: {
        color: "#AEAEB2",
    },
    noMessages: {
        fontStyle: "italic",
        color: "#8E8E93",
    },
    subtitleDark: {
        color: "#8E8E93",
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
        backgroundColor: "rgba(0,0,0,0.05)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    emptyIconContainerDark: {
        backgroundColor: "rgba(255,255,255,0.05)",
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#000",
        textAlign: "center",
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: "#3C3C43",
        textAlign: "center",
        lineHeight: 22,
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
