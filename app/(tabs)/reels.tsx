import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Dimensions,
  Pressable,
  Image,
  StyleSheet,
  FlatList,
  ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Upload } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useThemeStore } from "@/lib/store";
import { getCategoryConfig } from "@/lib/utils";
import type { Reel, ActivityCategory } from "@/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Mock reels data
const MOCK_REELS: Reel[] = [
  {
    id: "reel1",
    activityId: "1",
    userId: "user1",
    videoUrl: "https://example.com/video1.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
    duration: 15,
    viewCount: 1234,
    activity: {
      id: "1",
      title: "Sunset Hike at Griffith Park",
      category: "Outdoors",
    },
    user: {
      id: "user1",
      displayName: "Sarah Miller",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    },
    createdAt: new Date(),
  },
  {
    id: "reel2",
    activityId: "3",
    userId: "user3",
    videoUrl: "https://example.com/video2.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
    duration: 20,
    viewCount: 5678,
    activity: {
      id: "3",
      title: "Live Music Night: Jazz Sessions",
      category: "Music",
    },
    user: {
      id: "user3",
      displayName: "Marcus Chen",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    },
    createdAt: new Date(),
  },
  {
    id: "reel3",
    activityId: "4",
    userId: "user4",
    videoUrl: "https://example.com/video3.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
    duration: 12,
    viewCount: 890,
    activity: {
      id: "4",
      title: "Morning Yoga in the Park",
      category: "Wellness",
    },
    user: {
      id: "user4",
      displayName: "Emma Watson",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    },
    createdAt: new Date(),
  },
  {
    id: "reel4",
    activityId: "6",
    userId: "user6",
    videoUrl: "https://example.com/video4.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800",
    duration: 18,
    viewCount: 2345,
    activity: {
      id: "6",
      title: "Beach Volleyball Tournament",
      category: "Sports",
    },
    user: {
      id: "user6",
      displayName: "Jake Thompson",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
    },
    createdAt: new Date(),
  },
  {
    id: "reel5",
    activityId: "5",
    userId: "user5",
    videoUrl: "https://example.com/video5.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    duration: 25,
    viewCount: 3456,
    activity: {
      id: "5",
      title: "Mediterranean Dinner Party",
      category: "Food & Drink",
    },
    user: {
      id: "user5",
      displayName: "Sofia Rodriguez",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    },
    createdAt: new Date(),
  },
];

export default function ReelsScreen() {
  const router = useRouter();
  const { isDark } = useThemeStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleActivityPress = (activityId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/activity/${activityId}`);
  };

  const handleUploadPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Open upload modal
    console.log("Upload reel");
  };

  const renderReel = ({ item, index }: { item: Reel; index: number }) => (
    <ReelItem
      reel={item}
      isActive={index === currentIndex}
      onActivityPress={() => handleActivityPress(item.activityId)}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={MOCK_REELS}
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
      />

      {/* Upload Button */}
      <Pressable
        onPress={handleUploadPress}
        style={styles.uploadButton}
      >
        <View style={styles.uploadButtonInner}>
          <Upload size={20} color="#FFF" strokeWidth={2} />
        </View>
      </Pressable>

      {/* Progress Indicators */}
      <View style={styles.progressContainer}>
        {MOCK_REELS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentIndex && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Instructions (first reel only) */}
      {currentIndex === 0 && (
        <Animated.View entering={FadeIn.delay(500)} style={styles.instructions}>
          <Text style={styles.instructionsText}>↑ Swipe up to explore</Text>
        </Animated.View>
      )}
    </View>
  );
}

// Individual Reel Component
interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  onActivityPress: () => void;
}

function ReelItem({ reel, isActive, onActivityPress }: ReelItemProps) {
  const scale = useSharedValue(1);
  const categoryConfig = getCategoryConfig(reel.activity.category as ActivityCategory);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handleJoin = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log("Joining:", reel.activity.title);
  };

  return (
    <View style={styles.reelContainer}>
      {/* Background Image */}
      <Image source={{ uri: reel.thumbnailUrl }} style={styles.reelImage} />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={["rgba(0,0,0,0.3)", "transparent", "rgba(0,0,0,0.7)"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Tap to view detail */}
      <Pressable
        onPress={onActivityPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={StyleSheet.absoluteFill}
      />

      {/* UI Overlay */}
      <View style={styles.reelOverlay}>
        {/* Bottom Content */}
        <View style={styles.reelContent}>
          {/* Category Badge */}
          <View style={styles.reelCategoryBadge}>
            <Text style={styles.reelCategoryText}>{reel.activity.category}</Text>
          </View>

          {/* Title */}
          <Text style={styles.reelTitle}>{reel.activity.title}</Text>

          {/* Join Button */}
          <Pressable onPress={handleJoin} style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join Activity</Text>
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
  },
  reelContent: {
    gap: 12,
  },
  reelCategoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  reelCategoryText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  reelTitle: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  joinButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FF3B30",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  joinButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
  uploadButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
  },
  uploadButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -50 }],
    gap: 8,
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
  instructions: {
    position: "absolute",
    top: "35%",
    alignSelf: "center",
  },
  instructionsText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    fontWeight: "500",
  },
});
