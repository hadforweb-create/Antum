import { memo, useCallback, useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { MessageCircle, Star, User, Share2, Play, MapPin, Volume2, VolumeX, RefreshCw, ImageIcon } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withSequence,
} from "react-native-reanimated";
import { ActionButton } from "./ActionButton";
import { Shimmer } from "../ui/Shimmer";
import { useAuthStore, useShortlistStore } from "@/lib/store";
import { createConversation } from "@/lib/api/conversations";
import { addToShortlist, removeFromShortlist } from "@/lib/api/shortlist";
import type { Reel } from "@/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ReelCardProps {
    reel: Reel;
    isActive: boolean;
    index: number;
}

export const ReelCard = memo(function ReelCard({ reel, isActive, index }: ReelCardProps) {
    const router = useRouter();
    const { user } = useAuthStore();
    const { isShortlisted, addToShortlist: addToStore, removeFromShortlist: removeFromStore } = useShortlistStore();

    const videoRef = useRef<Video>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showPlayIcon, setShowPlayIcon] = useState(false);
    const [shortlisted, setShortlisted] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const isEmployer = user?.role === "EMPLOYER";
    const freelancerUserId = reel.freelancer?.userId;
    const isVideo = reel.mediaType === "VIDEO";

    // Animation values
    const playIconScale = useSharedValue(0);
    const retryScale = useSharedValue(1);

    // Check shortlist status on mount
    useEffect(() => {
        if (isEmployer && freelancerUserId) {
            setShortlisted(isShortlisted(freelancerUserId));
        }
    }, [isEmployer, freelancerUserId, isShortlisted]);

    // Handle video playback based on visibility (only for videos)
    useEffect(() => {
        if (isVideo && videoRef.current) {
            if (isActive && !hasError) {
                videoRef.current.playAsync();
                setIsPlaying(true);
            } else {
                videoRef.current.pauseAsync();
                setIsPlaying(false);
            }
        }
    }, [isActive, hasError, isVideo]);

    // Reset error state when reel changes
    useEffect(() => {
        setHasError(false);
        setRetryCount(0);
        setIsLoading(true);
    }, [reel.id]);

    const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            setIsLoading(false);
            setIsPlaying(status.isPlaying);
            setHasError(false);
        }
    }, []);

    const handleVideoError = useCallback(() => {
        setHasError(true);
        setIsLoading(false);
    }, []);

    const handleImageLoad = useCallback(() => {
        setIsLoading(false);
        setHasError(false);
    }, []);

    const handleImageError = useCallback(() => {
        setHasError(true);
        setIsLoading(false);
    }, []);

    const handleRetry = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        retryScale.value = withSequence(
            withSpring(0.9),
            withSpring(1)
        );
        setHasError(false);
        setIsLoading(true);
        setRetryCount((prev) => prev + 1);

        // Force video reload
        if (isVideo && videoRef.current) {
            videoRef.current.unloadAsync().then(() => {
                if (isActive) {
                    videoRef.current?.loadAsync(
                        { uri: reel.mediaUrl },
                        { shouldPlay: true, isLooping: true }
                    );
                }
            });
        }
    }, [isActive, reel.mediaUrl, isVideo]);

    const handleMediaPress = useCallback(() => {
        if (hasError) {
            handleRetry();
            return;
        }

        // Only video can be paused/played
        if (isVideo) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            if (videoRef.current) {
                if (isPlaying) {
                    videoRef.current.pauseAsync();
                    setShowPlayIcon(true);
                    playIconScale.value = withSequence(
                        withSpring(1.2, { damping: 10, stiffness: 200 }),
                        withSpring(1, { damping: 15, stiffness: 150 })
                    );
                } else {
                    videoRef.current.playAsync();
                    setShowPlayIcon(false);
                }
            }
        }
    }, [isPlaying, hasError, handleRetry, isVideo]);

    const handleMuteToggle = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.setIsMutedAsync(!isMuted);
        }
    }, [isMuted]);

    const handleMessage = useCallback(async () => {
        if (!freelancerUserId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const conversation = await createConversation(freelancerUserId);
            router.push(`/conversation/${conversation.id}`);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to start conversation";
            Alert.alert("Error", message);
        }
    }, [freelancerUserId, router]);

    const handleShortlist = useCallback(async () => {
        if (!freelancerUserId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            if (shortlisted) {
                await removeFromShortlist(freelancerUserId);
                removeFromStore(freelancerUserId);
                setShortlisted(false);
            } else {
                await addToShortlist(freelancerUserId);
                addToStore(freelancerUserId);
                setShortlisted(true);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update shortlist";
            Alert.alert("Error", message);
        }
    }, [freelancerUserId, shortlisted, addToStore, removeFromStore]);

    const handleProfile = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/reel/${reel.id}`);
    }, [reel.id, router]);

    const handleShare = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert("Share", "Share functionality coming soon!");
    }, []);

    const playIconAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: playIconScale.value }],
    }));

    const retryAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: retryScale.value }],
    }));

    return (
        <View style={styles.container}>
            {/* Media Background - VIDEO or IMAGE */}
            <Pressable style={styles.mediaContainer} onPress={handleMediaPress}>
                {isVideo ? (
                    <>
                        <Video
                            key={`${reel.id}-${retryCount}`}
                            ref={videoRef}
                            source={{ uri: reel.mediaUrl }}
                            style={styles.media}
                            resizeMode={ResizeMode.COVER}
                            isLooping
                            isMuted={isMuted}
                            shouldPlay={isActive && !hasError}
                            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                            onError={handleVideoError}
                            posterSource={reel.thumbnailUrl ? { uri: reel.thumbnailUrl } : undefined}
                            usePoster={!!reel.thumbnailUrl}
                        />

                        {/* Pause icon overlay */}
                        {showPlayIcon && !isPlaying && !hasError && (
                            <View style={styles.playIconOverlay}>
                                <Animated.View style={[styles.playIconBg, playIconAnimatedStyle]}>
                                    <Play size={48} color="#FFF" fill="#FFF" />
                                </Animated.View>
                            </View>
                        )}
                    </>
                ) : (
                    // IMAGE rendering
                    <Image
                        key={`${reel.id}-${retryCount}`}
                        source={{ uri: reel.mediaUrl }}
                        style={styles.media}
                        contentFit="cover"
                        transition={200}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                    />
                )}

                {/* Loading shimmer */}
                {isLoading && !hasError && (
                    <Animated.View entering={FadeIn.duration(200)} style={styles.loadingOverlay}>
                        <Shimmer style={StyleSheet.absoluteFill} />
                    </Animated.View>
                )}

                {/* Error state with tap to retry */}
                {hasError && (
                    <Animated.View entering={FadeIn.duration(300)} style={styles.errorOverlay}>
                        <Animated.View style={[styles.retryContainer, retryAnimatedStyle]}>
                            <RefreshCw size={36} color="#FFF" strokeWidth={2} />
                            <Text style={styles.errorText}>
                                {isVideo ? "Video failed to load" : "Image failed to load"}
                            </Text>
                            <Text style={styles.retryText}>Tap to retry</Text>
                        </Animated.View>
                    </Animated.View>
                )}
            </Pressable>

            {/* Gradient overlays */}
            <LinearGradient
                colors={["rgba(0,0,0,0.5)", "transparent"]}
                style={styles.topGradient}
                pointerEvents="none"
            />
            <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.85)"]}
                style={styles.bottomGradient}
                pointerEvents="none"
            />

            {/* Media type badge */}
            <View style={styles.mediaTypeBadge}>
                {isVideo ? (
                    <Play size={14} color="#FFF" fill="#FFF" />
                ) : (
                    <ImageIcon size={14} color="#FFF" />
                )}
            </View>

            {/* Mute button (videos only) */}
            {isVideo && !hasError && (
                <Pressable style={styles.muteButton} onPress={handleMuteToggle}>
                    {isMuted ? (
                        <VolumeX size={20} color="#FFF" strokeWidth={2} />
                    ) : (
                        <Volume2 size={20} color="#FFF" strokeWidth={2} />
                    )}
                </Pressable>
            )}

            {/* Right side actions */}
            <View style={styles.actionsContainer}>
                {isEmployer && (
                    <>
                        <ActionButton
                            icon={<MessageCircle size={26} color="#FFF" strokeWidth={2} />}
                            label="Message"
                            onPress={handleMessage}
                        />
                        <ActionButton
                            icon={<Star size={26} color={shortlisted ? "#FFD700" : "#FFF"} fill={shortlisted ? "#FFD700" : "transparent"} strokeWidth={2} />}
                            label={shortlisted ? "Saved" : "Save"}
                            onPress={handleShortlist}
                            active={shortlisted}
                            activeColor="#FFD700"
                        />
                    </>
                )}
                <ActionButton
                    icon={<User size={26} color="#FFF" strokeWidth={2} />}
                    label="Profile"
                    onPress={handleProfile}
                />
                <ActionButton
                    icon={<Share2 size={26} color="#FFF" strokeWidth={2} />}
                    label="Share"
                    onPress={handleShare}
                />
            </View>

            {/* Bottom info overlay */}
            <View style={styles.infoContainer}>
                {/* Freelancer info */}
                <Pressable style={styles.freelancerRow} onPress={handleProfile}>
                    <View style={styles.avatar}>
                        {reel.freelancer.avatarUrl ? (
                            <Image source={{ uri: reel.freelancer.avatarUrl }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>
                                {reel.freelancer.displayName.charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <View style={styles.freelancerInfo}>
                        <Text style={styles.freelancerName} numberOfLines={1}>
                            @{reel.freelancer.displayName.toLowerCase().replace(/\s+/g, "")}
                        </Text>
                        {reel.freelancer.location && (
                            <View style={styles.locationRow}>
                                <MapPin size={12} color="rgba(255,255,255,0.7)" strokeWidth={2} />
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {reel.freelancer.location}
                                </Text>
                            </View>
                        )}
                    </View>
                </Pressable>

                {/* Caption */}
                {reel.caption && (
                    <Text style={styles.caption} numberOfLines={3}>
                        {reel.caption}
                    </Text>
                )}

                {/* Skills */}
                {reel.skills.length > 0 && (
                    <View style={styles.skillsRow}>
                        {reel.skills.slice(0, 3).map((skill) => (
                            <View key={skill.id} style={styles.skillChip}>
                                <Text style={styles.skillText}>#{skill.slug}</Text>
                            </View>
                        ))}
                        {reel.skills.length > 3 && (
                            <Text style={styles.moreSkills}>+{reel.skills.length - 3}</Text>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
});

const TAB_BAR_HEIGHT = 88;

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT - TAB_BAR_HEIGHT,
        backgroundColor: "#000",
    },
    mediaContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    media: {
        width: "100%",
        height: "100%",
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#1a1a1a",
    },
    errorOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "center",
        alignItems: "center",
    },
    retryContainer: {
        alignItems: "center",
        padding: 32,
    },
    errorText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 16,
        fontWeight: "500",
        marginTop: 16,
    },
    retryText: {
        color: "#5050F0",
        fontSize: 15,
        fontWeight: "600",
        marginTop: 8,
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
        height: 320,
    },
    mediaTypeBadge: {
        position: "absolute",
        top: 60,
        left: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
    muteButton: {
        position: "absolute",
        top: 60,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
    actionsContainer: {
        position: "absolute",
        right: 12,
        bottom: 180,
        alignItems: "center",
    },
    infoContainer: {
        position: "absolute",
        left: 16,
        right: 80,
        bottom: 32,
    },
    freelancerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#5050F0",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        borderWidth: 2,
        borderColor: "#FFF",
        overflow: "hidden",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    avatarText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "700",
    },
    freelancerInfo: {
        flex: 1,
    },
    freelancerName: {
        color: "#FFF",
        fontSize: 17,
        fontWeight: "700",
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 3,
    },
    locationText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 13,
        marginLeft: 4,
    },
    caption: {
        color: "#FFF",
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 14,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    skillsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
    },
    skillChip: {
        backgroundColor: "rgba(255,255,255,0.18)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        marginRight: 8,
        marginBottom: 4,
    },
    skillText: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "600",
    },
    moreSkills: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 13,
        fontWeight: "500",
    },
});
