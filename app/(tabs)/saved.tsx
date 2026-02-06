import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Bookmark, Sun, Moon, Briefcase, Trash2, MapPin } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { useThemeStore } from "@/lib/store";
import { colors } from "@/lib/theme";
import {
    getShortlist,
    removeFromShortlist,
    ShortlistItem,
} from "@/lib/api/shortlist";
import { toast } from "@/lib/ui/toast";

export default function SavedScreen() {
    const router = useRouter();
    const { isDark, toggleTheme } = useThemeStore();

    const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

    // ANTUM Design System
    const bgColor = isDark ? "#121214" : "#FAFAFC";
    const textColor = isDark ? "#FFF" : "#000";
    const mutedColor = "#8E8E93";
    const cardBg = isDark ? "rgba(28,28,30,0.85)" : "rgba(255,255,255,0.85)";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
    const accentColor = colors.primary;
    const primaryButtonBg = isDark ? "#FFFFFF" : "#000000";
    const primaryButtonText = isDark ? "#000000" : "#FFFFFF";

    const fetchShortlist = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await getShortlist();
            setShortlist(response.shortlist);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load saved freelancers";
            toast.error(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchShortlist();
    }, [fetchShortlist]);

    const handleFreelancerPress = (freelancerId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/profile/${freelancerId}`);
    };

    const handleRemove = async (item: ShortlistItem) => {
        // Confirm removal using toast with undo? For now just directremove or custom dialog?
        // Using toast for consistency
        setRemovingIds((prev) => new Set(prev).add(item.user.id));
        try {
            await removeFromShortlist(item.user.id);
            setShortlist((prev) => prev.filter((s) => s.id !== item.id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success("Removed from Saved");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to remove";
            toast.error(message);
        } finally {
            setRemovingIds((prev) => {
                const next = new Set(prev);
                next.delete(item.user.id);
                return next;
            });
        }
    };

    const hasSavedItems = shortlist.length > 0;

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <SafeAreaView edges={["top"]} style={{ zIndex: 10 }}>
                <BlurView intensity={80} tint={isDark ? "dark" : "light"}>
                    <View
                        style={[
                            styles.header,
                            {
                                backgroundColor: isDark
                                    ? "rgba(28,28,30,0.92)"
                                    : "rgba(255,255,255,0.92)",
                                borderBottomColor: borderColor,
                            },
                        ]}
                    >
                        <Text style={[styles.headerTitle, { color: textColor }]}>Saved</Text>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                toggleTheme();
                            }}
                            style={styles.themeButton}
                        >
                            {isDark ? (
                                <Sun size={22} color={textColor} strokeWidth={2} />
                            ) : (
                                <Moon size={22} color={textColor} strokeWidth={2} />
                            )}
                        </Pressable>
                    </View>
                </BlurView>
            </SafeAreaView>

            {/* Loading State */}
            {loading && !refreshing && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={accentColor} />
                </View>
            )}

            {/* Error State */}
            {error && !loading && (
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorTitle, { color: textColor }]}>
                        Something went wrong
                    </Text>
                    <Text style={[styles.errorText, { color: mutedColor }]}>{error}</Text>
                    <Pressable
                        onPress={() => fetchShortlist()}
                        style={[styles.retryButton, { backgroundColor: accentColor }]}
                    >
                        <Text style={styles.retryText}>Try Again</Text>
                    </Pressable>
                </View>
            )}

            {/* Content */}
            {!loading && !error && (
                hasSavedItems ? (
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => fetchShortlist(true)}
                                tintColor={accentColor}
                            />
                        }
                    >
                        {/* Saved Freelancers Section */}
                        <Animated.View entering={FadeInDown.springify()}>
                            <View style={styles.sectionHeader}>
                                <Briefcase size={18} color={textColor} strokeWidth={2} />
                                <Text style={[styles.sectionTitle, { color: textColor }]}>
                                    Saved Freelancers
                                </Text>
                                <Text style={[styles.sectionCount, { color: accentColor }]}>
                                    {shortlist.length}
                                </Text>
                            </View>

                            {shortlist.map((item, index) => (
                                <Animated.View
                                    key={item.id}
                                    entering={FadeInDown.delay(index * 50).duration(300)}
                                >
                                    <Pressable
                                        onPress={() => handleFreelancerPress(item.user.id)}
                                        style={[
                                            styles.freelancerCard,
                                            { backgroundColor: cardBg, borderColor },
                                        ]}
                                    >
                                        {item.user.avatarUrl ? (
                                            <Image
                                                source={{ uri: item.user.avatarUrl }}
                                                style={styles.freelancerAvatar}
                                            />
                                        ) : (
                                            <View
                                                style={[
                                                    styles.freelancerAvatar,
                                                    styles.avatarPlaceholder,
                                                    { backgroundColor: accentColor },
                                                ]}
                                            >
                                                <Text style={styles.avatarText}>
                                                    {(item.user.name || item.user.email).charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                        )}

                                        <View style={styles.freelancerInfo}>
                                            <Text style={[styles.freelancerName, { color: textColor }]}>
                                                {item.user.name || item.user.email}
                                            </Text>
                                            {item.user.bio && (
                                                <Text
                                                    style={[styles.freelancerBio, { color: mutedColor }]}
                                                    numberOfLines={1}
                                                >
                                                    {item.user.bio}
                                                </Text>
                                            )}
                                            <View style={styles.metaRow}>
                                                {item.user.location && (
                                                    <View style={styles.locationBadge}>
                                                        <MapPin size={12} color={mutedColor} strokeWidth={2} />
                                                        <Text style={[styles.locationText, { color: mutedColor }]}>
                                                            {item.user.location}
                                                        </Text>
                                                    </View>
                                                )}
                                                {(item.user.servicesCount ?? 0) > 0 && (
                                                    <Text style={[styles.statsText, { color: mutedColor }]}>
                                                        {item.user.servicesCount} service{item.user.servicesCount !== 1 ? "s" : ""}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>

                                        <View style={styles.actions}>
                                            <Pressable
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleRemove(item);
                                                }}
                                                disabled={removingIds.has(item.user.id)}
                                                style={[
                                                    styles.removeButton,
                                                    removingIds.has(item.user.id) && { opacity: 0.5 },
                                                ]}
                                            >
                                                {removingIds.has(item.user.id) ? (
                                                    <ActivityIndicator size="small" color="#FF3B30" />
                                                ) : (
                                                    <Trash2 size={18} color="#FF3B30" strokeWidth={2} />
                                                )}
                                            </Pressable>
                                            <View style={styles.viewButton}>
                                                <Text style={styles.viewButtonText}>View</Text>
                                            </View>
                                        </View>
                                    </Pressable>
                                </Animated.View>
                            ))}
                        </Animated.View>

                        <View style={{ height: 120 }} />
                    </ScrollView>
                ) : (
                    /* Empty State */
                    <Animated.View entering={FadeIn.duration(300)} style={styles.emptyContainer}>
                        <View
                            style={[
                                styles.emptyIcon,
                                { backgroundColor: isDark ? "rgba(80,80,240,0.1)" : "rgba(80,80,240,0.08)" },
                            ]}
                        >
                            <Bookmark size={32} color={accentColor} strokeWidth={1.5} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: textColor }]}>
                            No Saved Freelancers
                        </Text>
                        <Text style={[styles.emptyDescription, { color: mutedColor }]}>
                            Save freelancers you like by tapping the{"\n"}bookmark icon on their profile.
                        </Text>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push("/(tabs)");
                            }}
                            style={[styles.exploreButton, { backgroundColor: primaryButtonBg }]}
                        >
                            <Text style={[styles.exploreButtonText, { color: primaryButtonText }]}>
                                Discover Talent
                            </Text>
                        </Pressable>
                    </Animated.View>
                )
            )}
        </View>
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
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 0.5,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: "700",
        letterSpacing: -0.5,
    },
    themeButton: {
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
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
    },
    errorText: {
        fontSize: 15,
        textAlign: "center",
        marginBottom: 20,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "700",
    },
    sectionCount: {
        fontSize: 14,
        fontWeight: "600",
    },
    freelancerCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 10,
    },
    freelancerAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    avatarPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: "#FFF",
        fontSize: 20,
        fontWeight: "700",
    },
    freelancerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    freelancerName: {
        fontSize: 16,
        fontWeight: "600",
    },
    freelancerBio: {
        fontSize: 14,
        marginTop: 2,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 4,
    },
    locationBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    locationText: {
        fontSize: 12,
    },
    statsText: {
        fontSize: 12,
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    removeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,59,48,0.1)",
    },
    viewButton: {
        backgroundColor: "#5050F0",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    viewButtonText: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "600",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 12,
    },
    emptyDescription: {
        fontSize: 16,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 32,
    },
    exploreButton: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 14,
    },
    exploreButtonText: {
        fontSize: 17,
        fontWeight: "600",
    },
});
