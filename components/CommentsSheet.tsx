import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    Pressable,
    StyleSheet,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from "react-native";
import Animated, { FadeInDown, SlideInDown } from "react-native-reanimated";
import { X, Send, Trash2 } from "lucide-react-native";
import { useThemeStore, useAuthStore } from "@/lib/store";
import {
    getComments,
    addComment,
    deleteComment,
    getCommentCount,
    CommentItem,
    LikeTargetType,
} from "@/lib/api/social";
import { colors, shadows } from "@/lib/theme";
import { toast } from "@/lib/ui/toast";

interface CommentsSheetProps {
    visible: boolean;
    onClose: () => void;
    targetType: LikeTargetType;
    targetId: string;
}

export function CommentsSheet({ visible, onClose, targetType, targetId }: CommentsSheetProps) {
    const { isDark } = useThemeStore();
    const { user } = useAuthStore();
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [text, setText] = useState("");
    const [count, setCount] = useState(0);

    const bg = isDark ? "#1C1C1A" : "#FFFFFF";
    const textColor = isDark ? "#F5F3EE" : "#111111";
    const subtitleColor = isDark ? "#8E8E8A" : "#6B6B67";
    const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
    const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

    const fetchComments = useCallback(async () => {
        try {
            const [data, total] = await Promise.all([
                getComments(targetType, targetId),
                getCommentCount(targetType, targetId),
            ]);
            setComments(data);
            setCount(total);
        } catch {
            toast.error("Failed to load comments");
        } finally {
            setLoading(false);
        }
    }, [targetType, targetId]);

    useEffect(() => {
        if (visible) {
            setLoading(true);
            fetchComments();
        }
    }, [visible, fetchComments]);

    const handleSend = async () => {
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            const newComment = await addComment(targetType, targetId, text.trim());
            setComments((prev) => [newComment, ...prev]);
            setCount((c) => c + 1);
            setText("");
        } catch {
            toast.error("Failed to post comment");
        } finally {
            setSending(false);
        }
    };

    const handleDelete = (commentId: string) => {
        Alert.alert("Delete Comment", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteComment(commentId);
                        setComments((prev) => prev.filter((c) => c.id !== commentId));
                        setCount((c) => Math.max(0, c - 1));
                    } catch {
                        toast.error("Failed to delete comment");
                    }
                },
            },
        ]);
    };

    const formatTime = (dateString: string) => {
        const diff = Date.now() - new Date(dateString).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "now";
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    };

    const renderComment = ({ item, index }: { item: CommentItem; index: number }) => {
        const isOwn = item.user_id === user?.id;
        return (
            <Animated.View entering={FadeInDown.delay(index * 30).duration(250)}>
                <View style={[styles.commentRow, { borderBottomColor: borderColor }]}>
                    {/* Avatar placeholder */}
                    <View style={[styles.avatar, { backgroundColor: isDark ? "#2A2A28" : "#E8E6E1" }]}>
                        <Text style={[styles.avatarText, { color: subtitleColor }]}>
                            {item.user_id.slice(0, 2).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                            <Text style={[styles.commentUser, { color: textColor }]}>
                                User
                            </Text>
                            <Text style={[styles.commentTime, { color: subtitleColor }]}>
                                {formatTime(item.created_at)}
                            </Text>
                        </View>
                        <Text style={[styles.commentBody, { color: textColor }]}>
                            {item.body}
                        </Text>
                    </View>
                    {isOwn && (
                        <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                            <Trash2 size={16} color="#D64040" strokeWidth={2} />
                        </Pressable>
                    )}
                </View>
            </Animated.View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
            <Pressable style={styles.backdrop} onPress={onClose} />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.keyboardView}
            >
                <Animated.View
                    entering={SlideInDown.duration(300)}
                    style={[styles.sheet, { backgroundColor: bg }, shadows.lg]}
                >
                    {/* Sheet handle */}
                    <View style={styles.handleContainer}>
                        <View style={[styles.handle, { backgroundColor: isDark ? "#3A3A38" : "#D0CEC9" }]} />
                    </View>

                    {/* Header */}
                    <View style={[styles.sheetHeader, { borderBottomColor: borderColor }]}>
                        <Text style={[styles.sheetTitle, { color: textColor }]}>
                            Comments {count > 0 ? `(${count})` : ""}
                        </Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <X size={20} color={subtitleColor} strokeWidth={2} />
                        </Pressable>
                    </View>

                    {/* Comments list */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={comments}
                            keyExtractor={(item) => item.id}
                            renderItem={renderComment}
                            contentContainerStyle={comments.length === 0 ? styles.emptyList : styles.list}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={[styles.emptyText, { color: subtitleColor }]}>
                                        No comments yet. Be the first!
                                    </Text>
                                </View>
                            }
                        />
                    )}

                    {/* Input bar */}
                    <View style={[styles.inputBar, { borderTopColor: borderColor }]}>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                            placeholder="Add a comment..."
                            placeholderTextColor={subtitleColor}
                            value={text}
                            onChangeText={setText}
                            multiline
                            maxLength={500}
                        />
                        <Pressable
                            onPress={handleSend}
                            disabled={!text.trim() || sending}
                            style={[
                                styles.sendButton,
                                { backgroundColor: text.trim() ? colors.primary : inputBg },
                            ]}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Send size={18} color={text.trim() ? "#FFF" : subtitleColor} strokeWidth={2} />
                            )}
                        </Pressable>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    keyboardView: {
        justifyContent: "flex-end",
    },
    sheet: {
        maxHeight: "70%",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    handleContainer: {
        alignItems: "center",
        paddingTop: 10,
        paddingBottom: 4,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
    },
    sheetHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: "center",
    },
    list: {
        paddingBottom: 8,
    },
    emptyList: {
        paddingVertical: 40,
    },
    emptyContainer: {
        alignItems: "center",
    },
    emptyText: {
        fontSize: 15,
    },
    commentRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 12,
        borderBottomWidth: 1,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontSize: 12,
        fontWeight: "600",
    },
    commentContent: {
        flex: 1,
        gap: 4,
    },
    commentHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    commentUser: {
        fontSize: 14,
        fontWeight: "600",
    },
    commentTime: {
        fontSize: 12,
    },
    commentBody: {
        fontSize: 15,
        lineHeight: 20,
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    inputBar: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 80,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
});
