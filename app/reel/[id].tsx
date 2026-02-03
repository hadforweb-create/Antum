import { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { X, MapPin, MessageCircle, Play, Volume2, VolumeX, ImageIcon, Briefcase, User } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useAuthStore } from "@/lib/store";
import { colors } from "@/lib/theme";
import { getReel } from "@/lib/api/reels";
import { createConversation } from "@/lib/api/conversations";
import { Shimmer } from "@/components/ui/Shimmer";
import { toast } from "@/lib/ui/toast";
import type { Reel } from "@/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ReelDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuthStore();

    const videoRef = useRef<Video>(null);
    const [reel, setReel] = useState<Reel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [mediaLoading, setMediaLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchReel = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getReel(id);
                setReel(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to load reel";
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchReel();
    }, [id]);

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            setMediaLoading(false);
            setIsPlaying(status.isPlaying);
        }
    };

    const handleVideoPress = () => {
        if (!reel || reel.mediaType !== "VIDEO") return;

        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pauseAsync();
            } else {
                videoRef.current.playAsync();
            }
        }
    };

    const handleMuteToggle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.setIsMutedAsync(!isMuted);
        }
    };

    const handleMessage = async () => {
        if (!reel?.userId) return;

        // Check if trying to message self
        if (reel.userId === user?.id) {
            toast.info("You can't message yourself");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActionLoading(true);

        try {
            const conversation = await createConversation(reel.userId);
            router.push(`/conversation/${conversation.id}`);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to start conversation";
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewProfile = () => {
        if (!reel?.userId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/profile/${reel.userId}`);
    };

    // Loading state
    if (loading) {
        return (
            <View style={styles.container}>
                <Shimmer style={StyleSheet.absoluteFill} />
                <SafeAreaView style={styles.headerOverlay}>
                    <Pressable onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color="#FFF" strokeWidth={2.5} />
                    </Pressable>
                </SafeAreaView>
            </View>
        );
    }

    // Error state
    if (error || !reel) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Animated.View entering={FadeIn.duration(300)}>
                        <View style={styles.errorIcon}>
                            <Play size={48} color="rgba(255,255,255,0.3)" strokeWidth={1.5} />
                        </View>
                        <Text style={styles.errorTitle}>Failed to load</Text>
                        <Text style={styles.errorText}>{error || "Reel not found"}</Text>
                        <Pressable onPress={handleClose} style={styles.errorButton}>
                            <Text style={styles.errorButtonText}>Go Back</Text>
                        </Pressable>
                    </Animated.View>
                </View>
            </View>
        );
    }

    const isVideo = reel.mediaType === "VIDEO";
    const displayName = reel.user?.name || "User";

    return (
        <View style={styles.container}>
            {/* Full-screen media */}
            <Pressable style={styles.mediaContainer} onPress={handleVideoPress}>
                {isVideo ? (
                    <>
                        <Video
                            ref={videoRef}
                            source={{ uri: reel.mediaUrl }}
                            style={styles.media}
                            resizeMode={ResizeMode.COVER}
                            isLooping
                            isMuted={isMuted}
                            shouldPlay
                            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                        />
                        {mediaLoading && (
                            <View style={styles.mediaLoadingOverlay}>
                                <Shimmer style={StyleSheet.absoluteFill} />
                            </View>
                        )}
                        {!isPlaying && (
                            <View style={styles.playIconOverlay}>
                                <View style={styles.playIconBg}>
                                    <Play size={48} color="#FFF" fill="#FFF" />
                                </View>
                            </View>
                        )}
                    </>
                ) : (
                    <Image
                        source={{ uri: reel.mediaUrl }}
                        style={styles.media}
                        contentFit="cover"
                        onLoad={() => setMediaLoading(false)}
                    />
                )}
            </Pressable>

            {/* Gradient overlays */}
            <LinearGradient
                colors={["rgba(0,0,0,0.6)", "transparent"]}
                style={styles.topGradient}
                pointerEvents="none"
            />
            <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.9)"]}
                style={styles.bottomGradient}
                pointerEvents="none"
            />

            {/* Header */}
            <SafeAreaView style={styles.headerOverlay}>
                <Pressable onPress={handleClose} style={styles.closeButton}>
                    <X size={24} color="#FFF" strokeWidth={2.5} />
                </Pressable>
                <View style={styles.headerRight}>
                    {/* Media type badge */}
                    <View style={styles.mediaTypeBadge}>
                        {isVideo ? (
                            <Play size={14} color="#FFF" fill="#FFF" />
                        ) : (
                            <ImageIcon size={14} color="#FFF" />
                        )}
                    </View>
                    {isVideo && (
                        <Pressable onPress={handleMuteToggle} style={styles.muteButton}>
                            {isMuted ? (
                                <VolumeX size={20} color="#FFF" strokeWidth={2} />
                            ) : (
                                <Volume2 size={20} color="#FFF" strokeWidth={2} />
                            )}
                        </Pressable>
                    )}
                </View>
            </SafeAreaView>

            {/* Bottom content */}
            <SafeAreaView edges={["bottom"]} style={styles.bottomContent}>
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* User info */}
                    <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.userCard}>
                        <Pressable onPress={handleViewProfile} style={styles.userHeader}>
                            <View style={styles.avatar}>
                                {reel.user?.avatarUrl ? (
                                    <Image source={{ uri: reel.user.avatarUrl }} style={styles.avatarImage} />
                                ) : (
                                    <User size={24} color="#FFF" />
                                )}
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{displayName}</Text>
                                {reel.user?.location && (
                                    <View style={styles.locationRow}>
                                        <MapPin size={14} color="rgba(255,255,255,0.6)" strokeWidth={2} />
                                        <Text style={styles.locationText}>{reel.user.location}</Text>
                                    </View>
                                )}
                            </View>
                        </Pressable>

                        {reel.user?.bio && (
                            <Text style={styles.bio}>{reel.user.bio}</Text>
                        )}
                    </Animated.View>

                    {/* Caption */}
                    {reel.caption && (
                        <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.captionCard}>
                            <Text style={styles.caption}>{reel.caption}</Text>
                        </Animated.View>
                    )}

                    {/* Action buttons */}
                    <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.actionsContainer}>
                        <ActionButton
                            onPress={handleMessage}
                            loading={actionLoading}
                            icon={<MessageCircle size={20} color="#FFF" strokeWidth={2.5} />}
                            label="Message"
                            primary
                        />
                        <ActionButton
                            onPress={handleViewProfile}
                            loading={false}
                            icon={<Briefcase size={20} color="#FFF" strokeWidth={2.5} />}
                            label="View Profile"
                        />
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

function ActionButton({
    onPress,
    loading,
    icon,
    label,
    primary,
}: {
    onPress: () => void;
    loading: boolean;
    icon: React.ReactNode;
    label: string;
    primary?: boolean;
}) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={loading}
            style={styles.actionButtonWrapper}
        >
            <Animated.View
                style={[
                    animatedStyle,
                    styles.actionButton,
                    primary && styles.actionButtonPrimary,
                    loading && { opacity: 0.6 },
                ]}
            >
                {icon}
                <Text style={styles.actionButtonText}>{label}</Text>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    mediaContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    media: {
        width: "100%",
        height: "100%",
    },
    mediaLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#1a1a1a",
    },
    playIconOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
    },
    playIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 6,
    },
    topGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    bottomGradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.6,
    },
    headerOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.4)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
    mediaTypeBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(0,0,0,0.4)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
    muteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.4)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
    bottomContent: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: SCREEN_HEIGHT * 0.5,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    userCard: {
        marginBottom: 16,
    },
    userHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
        borderWidth: 2,
        borderColor: "#FFF",
        overflow: "hidden",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: "#FFF",
        fontSize: 20,
        fontWeight: "700",
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    locationText: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
        marginLeft: 4,
    },
    bio: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 15,
        lineHeight: 22,
        marginTop: 14,
    },
    captionCard: {
        marginBottom: 16,
    },
    caption: {
        color: "#FFF",
        fontSize: 16,
        lineHeight: 24,
    },
    actionsContainer: {
        flexDirection: "row",
        gap: 12,
    },
    actionButtonWrapper: {
        flex: 1,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    actionButtonPrimary: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    actionButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    errorIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(255,255,255,0.05)",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginBottom: 24,
    },
    errorTitle: {
        color: "#FFF",
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 8,
    },
    errorText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 15,
        textAlign: "center",
        marginBottom: 28,
    },
    errorButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 25,
        alignSelf: "center",
    },
    errorButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
