import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Dimensions,
  Pressable,
  Image,
  StyleSheet,
  FlatList,
  ViewToken,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, MessageCircle, Bookmark, Share2, User, AlertCircle, Film, RefreshCw } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useThemeStore, useAuthStore } from "@/lib/store";
import { createConversation } from "@/lib/api/conversations";
import { getReels } from "@/lib/api/reels";
import { Shimmer } from "@/components/ui/Shimmer";
import { toast } from "@/lib/ui/toast";
import type { Reel } from "@/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ReelsFeedScreen() {
  const router = useRouter();
  const { isDark } = useThemeStore();
  const { user } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  // Data loading state
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  // Fetch reels
  const fetchReels = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setCursor(null);
      } else if (!loading) {
        setLoading(true);
      }
      setError(null);

      const response = await getReels({ limit: 10 });
      setReels(response.items);
      setHasMore(response.hasMore);
      setCursor(response.nextCursor);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load reels";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading]);

  // Load more reels
  const loadMoreReels = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;

    try {
      setLoadingMore(true);
      const response = await getReels({ cursor, limit: 10 });
      setReels(prev => [...prev, ...response.items]);
      setHasMore(response.hasMore);
      setCursor(response.nextCursor);
    } catch (err) {
      console.error("Failed to load more reels:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, cursor]);

  useEffect(() => {
    fetchReels();
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Load more when near the end
        if (viewableItems[0].index >= reels.length - 3) {
          loadMoreReels();
        }
      }
    },
    [reels.length, loadMoreReels]
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleReelPress = (reelId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/reel/${reelId}`);
  };

  const handleProfilePress = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/profile/${userId}`);
  };

  const handleLike = (reelId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.info("Coming soon");
  };

  const handleSave = (reelId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toast.info("Coming soon");
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toast.info("Coming soon");
  };

  const handleMessage = async (userId: string) => {
    // Don't message yourself
    if (userId === user?.id) {
      toast.info("You can't message yourself");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const conversation = await createConversation(userId);
      router.push(`/conversation/${conversation.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start conversation";
      toast.error(message);
    }
  };

  const renderReel = ({ item, index }: { item: Reel; index: number }) => (
    <ReelItem
      reel={item}
      isActive={index === currentIndex}
      isLiked={likedReels.has(item.id)}
      isSaved={savedReels.has(item.id)}
      onPress={() => handleReelPress(item.id)}
      onProfilePress={() => handleProfilePress(item.userId)}
      onLike={() => handleLike(item.id)}
      onSave={() => handleSave(item.id)}
      onShare={handleShare}
      onMessage={() => handleMessage(item.userId)}
    />
  );

  // Loading state
  if (loading && reels.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Shimmer style={styles.loadingShimmer} />
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#5050F0" />
            <Text style={styles.loadingText}>Loading reels...</Text>
          </View>
        </View>
      </View>
    );
  }

  // Error state
  if (error && reels.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Animated.View entering={FadeIn.duration(300)} style={styles.errorContent}>
            <View style={styles.errorIconContainer}>
              <AlertCircle size={48} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
            </View>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => fetchReels()} style={styles.retryButton}>
              <RefreshCw size={18} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Empty state
  if (!loading && reels.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyContent}>
            <View style={styles.emptyIconContainer}>
              <Film size={64} color="rgba(255,255,255,0.3)" strokeWidth={1} />
            </View>
            <Text style={styles.emptyTitle}>No reels yet</Text>
            <Text style={styles.emptyText}>
              Be the first to share your work!{"\n"}Create a reel to showcase your skills.
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/create")} style={styles.createButton}>
              <Text style={styles.createButtonText}>Create Reel</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchReels(true)}
            tintColor="#FFF"
            progressViewOffset={60}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#5050F0" />
            </View>
          ) : null
        }
      />

      {/* Progress Indicators */}
      <View style={styles.progressContainer}>
        {reels.slice(0, 6).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentIndex && styles.progressDotActive,
            ]}
          />
        ))}
        {reels.length > 6 && (
          <Text style={styles.moreIndicator}>+{reels.length - 6}</Text>
        )}
      </View>

      {/* ANTUM branding */}
      <View style={styles.brandingContainer}>
        <Text style={styles.brandingText}>ANTUM</Text>
      </View>

      {/* Instructions (first reel only) */}
      {currentIndex === 0 && (
        <Animated.View entering={FadeIn.delay(500)} style={styles.instructions}>
          <Text style={styles.instructionsText}>Swipe up to discover freelancers</Text>
        </Animated.View>
      )}
    </View>
  );
}

// Individual Reel Component
interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  isLiked: boolean;
  isSaved: boolean;
  onPress: () => void;
  onProfilePress: () => void;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onMessage: () => void;
}

function ReelItem({
  reel,
  isActive,
  isLiked,
  isSaved,
  onPress,
  onProfilePress,
  onLike,
  onSave,
  onShare,
  onMessage,
}: ReelItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  // Get display name - fallback to "User" if no name
  const displayName = reel.user?.name || "User";
  const username = displayName.replace(/\s+/g, "").toLowerCase();

  return (
    <View style={styles.reelContainer}>
      {/* Background Image */}
      <Image source={{ uri: reel.mediaUrl }} style={styles.reelImage} />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={["rgba(0,0,0,0.3)", "transparent", "rgba(0,0,0,0.8)"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Tap to view detail */}
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={StyleSheet.absoluteFill}
      />

      {/* Right side actions */}
      <View style={styles.actionsContainer}>
        {/* Profile */}
        <Pressable onPress={onProfilePress} style={styles.actionButton}>
          <View style={styles.avatarContainer}>
            {reel.user?.avatarUrl ? (
              <Image source={{ uri: reel.user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={24} color="#FFF" />
              </View>
            )}
          </View>
        </Pressable>

        {/* Like */}
        <Pressable onPress={onLike} style={styles.actionButton}>
          <Heart
            size={28}
            color={isLiked ? "#FF3B5C" : "#FFF"}
            fill={isLiked ? "#FF3B5C" : "transparent"}
            strokeWidth={2}
          />
        </Pressable>

        {/* Comment/Message */}
        <Pressable onPress={onMessage} style={styles.actionButton}>
          <MessageCircle size={28} color="#FFF" strokeWidth={2} />
        </Pressable>

        {/* Save */}
        <Pressable onPress={onSave} style={styles.actionButton}>
          <Bookmark
            size={28}
            color={isSaved ? "#5050F0" : "#FFF"}
            fill={isSaved ? "#5050F0" : "transparent"}
            strokeWidth={2}
          />
        </Pressable>

        {/* Share */}
        <Pressable onPress={onShare} style={styles.actionButton}>
          <Share2 size={26} color="#FFF" strokeWidth={2} />
        </Pressable>
      </View>

      {/* Bottom Content */}
      <View style={styles.reelOverlay}>
        <View style={styles.reelContent}>
          {/* Creator info */}
          <Pressable onPress={onProfilePress} style={styles.creatorRow}>
            <Text style={styles.creatorName}>@{username}</Text>
            <View style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </View>
          </Pressable>

          {/* Caption */}
          {reel.caption && (
            <Text style={styles.reelCaption} numberOfLines={3}>
              {reel.caption}
            </Text>
          )}

          {/* Hire button */}
          <Pressable onPress={onMessage} style={styles.hireButton}>
            <User size={18} color="#FFF" strokeWidth={2.5} />
            <Text style={styles.hireButtonText}>Hire Me</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  reelImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  reelOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 20,
    paddingBottom: 120,
    paddingRight: 70,
  },
  reelContent: {
    gap: 12,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  creatorName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  followButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  followButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  reelCaption: {
    color: "#FFF",
    fontSize: 15,
    lineHeight: 22,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hireButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: "#5050F0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  hireButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  actionsContainer: {
    position: "absolute",
    right: 12,
    bottom: 200,
    alignItems: "center",
    gap: 20,
  },
  actionButton: {
    alignItems: "center",
    gap: 4,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FFF",
    overflow: "hidden",
    marginBottom: 8,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#5050F0",
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -50 }],
    gap: 8,
    alignItems: "center",
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  progressDotActive: {
    height: 32,
    backgroundColor: "#FFF",
  },
  moreIndicator: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "600",
  },
  brandingContainer: {
    position: "absolute",
    top: 60,
    left: 20,
  },
  brandingText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  instructions: {
    position: "absolute",
    top: "35%",
    alignSelf: "center",
  },
  instructionsText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    position: "relative",
  },
  loadingShimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "500",
  },
  loadingMoreContainer: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorContent: {
    alignItems: "center",
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 28,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#5050F0",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyContent: {
    alignItems: "center",
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  emptyText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
  },
  createButton: {
    backgroundColor: "#5050F0",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
  },
  createButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
