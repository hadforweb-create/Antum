import { useState, useEffect, useCallback, useRef } from "react";
import {
    View,
    Text,
    FlatList,
    TextInput,
    Pressable,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Keyboard,
    AppState,
    AppStateStatus,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Send, AlertCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInUp, SlideInRight } from "react-native-reanimated";
import { useAuthStore, useThemeStore } from "@/lib/store";
import {
    getConversation,
    getMessages,
    sendMessage,
    ConversationResponse,
    MessageResponse,
} from "@/lib/api/conversations";
import { colors } from "@/lib/theme";

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuthStore();
    const { isDark } = useThemeStore();

    const flatListRef = useRef<FlatList>(null);
    const [conversation, setConversation] = useState<ConversationResponse | null>(null);
    const [messages, setMessages] = useState<MessageResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputText, setInputText] = useState("");
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);

    // Track last message ID to detect new messages
    const lastMessageIdRef = useRef<string | null>(null);
    // Track app state to pause polling when backgrounded
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    const fetchConversation = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);

            const [convData, msgData] = await Promise.all([
                getConversation(id),
                getMessages(id, 1, 50),
            ]);

            setConversation(convData);
            // Messages come newest first from API, reverse for display (oldest at top)
            setMessages(msgData.messages.reverse());
            setHasMore(msgData.pagination.page < msgData.pagination.totalPages);
            setPage(1);

            if (msgData.messages.length > 0) {
                lastMessageIdRef.current = msgData.messages[0].id;
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load conversation";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchConversation();
    }, [fetchConversation]);

    // Poll for new messages every 3 seconds (only when app is active)
    useEffect(() => {
        if (!id || loading || error) return;

        const pollMessages = async () => {
            // Skip polling if app is backgrounded
            if (appStateRef.current !== "active") {
                return;
            }
            try {
                const msgData = await getMessages(id, 1, 50);
                if (msgData.messages.length > 0) {
                    const newestId = msgData.messages[0].id;
                    if (newestId !== lastMessageIdRef.current) {
                        // New messages arrived
                        lastMessageIdRef.current = newestId;
                        setMessages(msgData.messages.reverse());
                    }
                }
            } catch {
                // Silently fail on poll errors
            }
        };

        // Listen for app state changes
        const appStateSubscription = AppState.addEventListener("change", (nextState) => {
            appStateRef.current = nextState;
        });

        const interval = setInterval(pollMessages, 3000);
        return () => {
            clearInterval(interval);
            appStateSubscription.remove();
        };
    }, [id, loading, error]);

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleSend = async () => {
        if (!inputText.trim() || !id || sending) return;

        const messageText = inputText.trim();
        setInputText("");
        Keyboard.dismiss();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: MessageResponse = {
            id: tempId,
            conversationId: id,
            senderId: user?.id || "",
            text: messageText,
            createdAt: new Date().toISOString(),
            sender: {
                id: user?.id || "",
                email: user?.email || "",
                name: user?.name || null,
                role: user?.role || "FREELANCER",
            },
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        try {
            setSending(true);
            const sentMessage = await sendMessage(id, messageText);

            // Replace optimistic message with real one
            setMessages((prev) =>
                prev.map((msg) => (msg.id === tempId ? sentMessage : msg))
            );
            lastMessageIdRef.current = sentMessage.id;
        } catch (err) {
            // Remove optimistic message on error
            setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
            const errorMsg = err instanceof Error ? err.message : "Failed to send message";
            // Show error inline
            setError(errorMsg);
            setTimeout(() => setError(null), 3000);
        } finally {
            setSending(false);
        }
    };

    const loadMoreMessages = async () => {
        if (!id || loadingMore || !hasMore) return;

        try {
            setLoadingMore(true);
            const nextPage = page + 1;
            const msgData = await getMessages(id, nextPage, 50);

            // Prepend older messages (they come newest first, so reverse)
            const olderMessages = msgData.messages.reverse();
            setMessages((prev) => [...olderMessages, ...prev]);
            setPage(nextPage);
            setHasMore(nextPage < msgData.pagination.totalPages);
        } catch {
            // Silently fail
        } finally {
            setLoadingMore(false);
        }
    };

    const getOtherParticipant = () => {
        return conversation?.participants.find((p) => p.userId !== user?.id)?.user;
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatDateSeparator = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
        return date.toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
        });
    };

    const shouldShowDateSeparator = (index: number) => {
        if (index === 0) return true;
        const currentDate = new Date(messages[index].createdAt).toDateString();
        const prevDate = new Date(messages[index - 1].createdAt).toDateString();
        return currentDate !== prevDate;
    };

    const renderMessage = ({ item, index }: { item: MessageResponse; index: number }) => {
        const isOwnMessage = item.senderId === user?.id;
        const showDate = shouldShowDateSeparator(index);

        return (
            <View>
                {showDate && (
                    <View style={styles.dateSeparator}>
                        <Text style={styles.dateSeparatorText}>
                            {formatDateSeparator(item.createdAt)}
                        </Text>
                    </View>
                )}
                <Animated.View
                    entering={FadeInUp.duration(200)}
                    style={[
                        styles.messageContainer,
                        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
                    ]}
                >
                    <View
                        style={[
                            styles.messageBubble,
                            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
                            isDark && !isOwnMessage && styles.otherMessageBubbleDark,
                        ]}
                    >
                        <Text
                            style={[
                                styles.messageText,
                                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                                isDark && !isOwnMessage && styles.otherMessageTextDark,
                            ]}
                        >
                            {item.text}
                        </Text>
                        <Text
                            style={[
                                styles.messageTime,
                                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
                            ]}
                        >
                            {formatTime(item.createdAt)}
                        </Text>
                    </View>
                </Animated.View>
            </View>
        );
    };

    const otherUser = getOtherParticipant();
    const displayName = otherUser?.name || otherUser?.email || "Chat";

    // Loading state
    if (loading) {
        return (
            <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
                <View style={[styles.header, isDark && styles.headerDark]}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <ArrowLeft size={24} color={isDark ? "#FFF" : "#000"} strokeWidth={2} />
                    </Pressable>
                    <View style={styles.headerCenter}>
                        <View style={styles.loadingTitle} />
                    </View>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error && !conversation) {
        return (
            <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
                <View style={[styles.header, isDark && styles.headerDark]}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <ArrowLeft size={24} color={isDark ? "#FFF" : "#000"} strokeWidth={2} />
                    </Pressable>
                    <Text style={[styles.headerTitle, isDark && styles.textDark]}>Error</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.errorContainer}>
                    <AlertCircle size={48} color="#D64040" strokeWidth={1.5} />
                    <Text style={[styles.errorTitle, isDark && styles.textDark]}>
                        Failed to load chat
                    </Text>
                    <Text style={[styles.errorText, isDark && styles.subtitleDark]}>{error}</Text>
                    <Pressable
                        onPress={fetchConversation}
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                    >
                        <Text style={styles.retryText}>Try Again</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={["top"]}>
            {/* Header */}
            <View style={[styles.header, isDark && styles.headerDark]}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color={isDark ? "#FFF" : "#000"} strokeWidth={2} />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, isDark && styles.textDark]} numberOfLines={1}>
                        {displayName}
                    </Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {/* Inline error toast */}
            {error && conversation && (
                <Animated.View entering={SlideInRight.duration(200)} style={styles.errorToast}>
                    <AlertCircle size={16} color="#FFF" />
                    <Text style={styles.errorToastText}>{error}</Text>
                </Animated.View>
            )}

            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={0}
            >
                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                    inverted={false}
                    onContentSizeChange={() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }}
                    onLayout={() => {
                        flatListRef.current?.scrollToEnd({ animated: false });
                    }}
                    ListHeaderComponent={
                        loadingMore ? (
                            <View style={styles.loadingMore}>
                                <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                        ) : hasMore ? (
                            <Pressable onPress={loadMoreMessages} style={styles.loadMoreButton}>
                                <Text style={styles.loadMoreText}>Load earlier messages</Text>
                            </Pressable>
                        ) : null
                    }
                    ListEmptyComponent={
                        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyMessages}>
                            <Text style={[styles.emptyText, isDark && styles.subtitleDark]}>
                                No messages yet. Say hi!
                            </Text>
                        </Animated.View>
                    }
                />

                {/* Input */}
                <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
                    <TextInput
                        style={[styles.input, isDark && styles.inputDark]}
                        placeholder="Type a message..."
                        placeholderTextColor={isDark ? "#8E8E8A" : "#C7C7CC"}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={2000}
                        returnKeyType="default"
                    />
                    <Pressable
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                        style={[
                            styles.sendButton,
                            { backgroundColor: colors.primary },
                            (!inputText.trim() || sending) && styles.sendButtonDisabled,
                        ]}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Send size={20} color="#FFF" strokeWidth={2.5} />
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F3EE",
    },
    containerDark: {
        backgroundColor: "#121210",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: "rgba(0,0,0,0.1)",
        backgroundColor: "#F5F3EE",
    },
    headerDark: {
        backgroundColor: "#121210",
        borderBottomColor: "rgba(255,255,255,0.1)",
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
    },
    headerCenter: {
        flex: 1,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#000",
    },
    headerSpacer: {
        width: 40,
    },
    textDark: {
        color: "#FFF",
    },
    subtitleDark: {
        color: "#8E8E8A",
    },
    loadingTitle: {
        width: 120,
        height: 20,
        backgroundColor: "rgba(0,0,0,0.1)",
        borderRadius: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#000",
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 15,
        color: "#2A2A2A",
        textAlign: "center",
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
    errorToast: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#D64040",
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 8,
        gap: 8,
    },
    errorToastText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "500",
        flex: 1,
    },
    keyboardAvoid: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 8,
        flexGrow: 1,
    },
    loadingMore: {
        paddingVertical: 16,
        alignItems: "center",
    },
    loadMoreButton: {
        paddingVertical: 12,
        alignItems: "center",
    },
    loadMoreText: {
        fontSize: 14,
        color: "#111111",
        fontWeight: "500",
    },
    emptyMessages: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 15,
        color: "#8E8E8A",
    },
    dateSeparator: {
        alignItems: "center",
        marginVertical: 16,
    },
    dateSeparatorText: {
        fontSize: 12,
        color: "#8E8E8A",
        backgroundColor: "rgba(142,142,147,0.12)",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: "hidden",
    },
    messageContainer: {
        marginVertical: 2,
    },
    ownMessageContainer: {
        alignItems: "flex-end",
    },
    otherMessageContainer: {
        alignItems: "flex-start",
    },
    messageBubble: {
        maxWidth: "80%",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    ownMessageBubble: {
        backgroundColor: "#111111",
        borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
        backgroundColor: "#E9E9EB",
        borderBottomLeftRadius: 4,
    },
    otherMessageBubbleDark: {
        backgroundColor: "#2C2C2A",
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    ownMessageText: {
        color: "#FFF",
    },
    otherMessageText: {
        color: "#000",
    },
    otherMessageTextDark: {
        color: "#FFF",
    },
    messageTime: {
        fontSize: 11,
        marginTop: 4,
    },
    ownMessageTime: {
        color: "rgba(255,255,255,0.7)",
        textAlign: "right",
    },
    otherMessageTime: {
        color: "#8E8E8A",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === "ios" ? 34 : 12,
        backgroundColor: "#F5F3EE",
        borderTopWidth: 0.5,
        borderTopColor: "rgba(0,0,0,0.1)",
        gap: 12,
    },
    inputContainerDark: {
        backgroundColor: "#121210",
        borderTopColor: "rgba(255,255,255,0.1)",
    },
    input: {
        flex: 1,
        backgroundColor: "#FFF",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingTop: 10,
        fontSize: 16,
        maxHeight: 120,
        color: "#000",
    },
    inputDark: {
        backgroundColor: "#1C1C1A",
        color: "#FFF",
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
