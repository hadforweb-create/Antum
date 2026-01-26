import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Sun, Moon, Calendar, MapPin, Users } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useThemeStore, useActivitiesStore, useAuthStore } from "@/lib/store";
import { activitiesDb } from "@/lib/firebase";
import { formatShortDate, getCategoryConfig, CATEGORIES } from "@/lib/utils";
import type { Activity, ActivityCategory } from "@/types";

// Mock data for demo (when Firebase isn't connected)
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "1",
    title: "Sunset Hike at Griffith Park",
    description: "Join us for a beautiful sunset hike! We'll explore the trails and catch the golden hour views.",
    category: "Outdoors",
    location: "Griffith Park, Los Angeles",
    date: new Date("2025-01-25"),
    time: "5:00 PM",
    maxAttendees: 20,
    attendeeCount: 12,
    images: ["https://images.unsplash.com/photo-1551632811-561732d1e306?w=800"],
    organizerId: "user1",
    organizer: {
      id: "user1",
      displayName: "Sarah Miller",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    title: "Coffee & Conversations",
    description: "Casual meetup for coffee lovers and great conversation.",
    category: "Social",
    location: "Blue Bottle Coffee, Venice",
    date: new Date("2025-01-26"),
    time: "10:00 AM",
    maxAttendees: 15,
    attendeeCount: 8,
    images: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800"],
    organizerId: "user2",
    organizer: {
      id: "user2",
      displayName: "Alex Johnson",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    title: "Live Music Night: Jazz Sessions",
    description: "Experience an evening of soulful jazz music with local artists.",
    category: "Music",
    location: "The Blue Note, Hollywood",
    date: new Date("2025-01-24"),
    time: "8:00 PM",
    maxAttendees: 30,
    attendeeCount: 24,
    images: ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800"],
    organizerId: "user3",
    organizer: {
      id: "user3",
      displayName: "Marcus Chen",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    title: "Morning Yoga in the Park",
    description: "Start your day with energizing yoga practice in beautiful surroundings.",
    category: "Wellness",
    location: "Echo Park, LA",
    date: new Date("2025-01-25"),
    time: "7:30 AM",
    maxAttendees: 25,
    attendeeCount: 15,
    images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800"],
    organizerId: "user4",
    organizer: {
      id: "user4",
      displayName: "Emma Watson",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    title: "Dinner Party: Mediterranean Night",
    description: "Homemade Mediterranean feast with friends!",
    category: "Food & Drink",
    location: "Private Home, Santa Monica",
    date: new Date("2025-01-25"),
    time: "7:00 PM",
    maxAttendees: 10,
    attendeeCount: 6,
    images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"],
    organizerId: "user5",
    organizer: {
      id: "user5",
      displayName: "Sofia Rodriguez",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "6",
    title: "Beach Volleyball Tournament",
    description: "Friendly beach volleyball games! All skill levels welcome.",
    category: "Sports",
    location: "Manhattan Beach",
    date: new Date("2025-01-26"),
    time: "2:00 PM",
    maxAttendees: 24,
    attendeeCount: 18,
    images: ["https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800"],
    organizerId: "user6",
    organizer: {
      id: "user6",
      displayName: "Jake Thompson",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { isDark, toggleTheme } = useThemeStore();
  const { activities, setActivities, setLoadingState, isJoined } = useActivitiesStore();
  const [refreshing, setRefreshing] = useState(false);

  // Colors
  const bgColor = isDark ? "#000" : "#F2F2F7";
  const textColor = isDark ? "#FFF" : "#000";
  const mutedColor = isDark ? "#8E8E93" : "#3C3C43";
  const cardBg = isDark ? "rgba(28,28,30,0.85)" : "rgba(255,255,255,0.85)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";

  // Load activities
  const loadActivities = useCallback(async () => {
    setLoadingState("loading");
    try {
      // Try Firebase first, fallback to mock data
      // const data = await activitiesDb.getAll();
      // setActivities(data);
      
      // Using mock data for demo
      setActivities(MOCK_ACTIVITIES);
    } catch (error) {
      console.error("Error loading activities:", error);
      setActivities(MOCK_ACTIVITIES);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadActivities();
    setRefreshing(false);
  };

  const handleActivityPress = (activity: Activity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/activity/${activity.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Glass Header */}
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
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Nightout
            </Text>
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

      {/* Activity Feed */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#FFF" : "#000"}
          />
        }
      >
        {(activities.length > 0 ? activities : MOCK_ACTIVITIES).map((activity, index) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onPress={() => handleActivityPress(activity)}
            index={index}
            isDark={isDark}
            isJoined={isJoined(activity.id)}
          />
        ))}
        
        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// Activity Card Component
interface ActivityCardProps {
  activity: Activity;
  onPress: () => void;
  index: number;
  isDark: boolean;
  isJoined: boolean;
}

function ActivityCard({ activity, onPress, index, isDark, isJoined }: ActivityCardProps) {
  const scale = useSharedValue(1);
  const categoryConfig = getCategoryConfig(activity.category);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const textColor = isDark ? "#FFF" : "#000";
  const mutedColor = isDark ? "#8E8E93" : "#3C3C43";
  const cardBg = isDark ? "rgba(28,28,30,0.85)" : "rgba(255,255,255,0.85)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  const glassBg = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)";

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={[animatedStyle, styles.cardWrapper]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={styles.cardBlur}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor: borderColor,
              },
            ]}
          >
            <View style={styles.cardInner}>
              {/* Thumbnail */}
              <View style={styles.thumbnailContainer}>
                <Image
                  source={{ uri: activity.images[0] }}
                  style={styles.thumbnail}
                />
                
                {/* Joined badge */}
                {isJoined && (
                  <View style={[styles.joinedBadge, { backgroundColor: "rgba(255,255,255,0.95)" }]}>
                    <Text style={{ color: "#FF3B30", fontSize: 12, fontWeight: "700" }}>✓</Text>
                  </View>
                )}

                {/* Category badge */}
                <View style={[styles.categoryBadge, { backgroundColor: "rgba(255,255,255,0.9)" }]}>
                  <Text style={[styles.categoryText, { color: categoryConfig.color }]}>
                    {activity.category}
                  </Text>
                </View>
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                <Text
                  style={[styles.cardTitle, { color: textColor }]}
                  numberOfLines={2}
                >
                  {activity.title}
                </Text>

                {/* Meta */}
                <View style={styles.metaRow}>
                  <View style={[styles.metaBadge, { backgroundColor: glassBg }]}>
                    <Calendar size={12} color={mutedColor} strokeWidth={2.5} />
                    <Text style={[styles.metaText, { color: textColor }]}>
                      {formatShortDate(activity.date)}
                    </Text>
                  </View>
                  <View style={[styles.metaBadge, { backgroundColor: glassBg }]}>
                    <Users size={12} color={mutedColor} strokeWidth={2.5} />
                    <Text style={[styles.metaText, { color: textColor }]}>
                      {activity.attendeeCount}/{activity.maxAttendees}
                    </Text>
                  </View>
                </View>

                {/* Location */}
                <View style={styles.locationRow}>
                  <MapPin size={14} color={mutedColor} strokeWidth={2.5} />
                  <Text
                    style={[styles.locationText, { color: mutedColor }]}
                    numberOfLines={1}
                  >
                    {activity.location.split(",")[0]}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  cardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  cardBlur: {
    borderRadius: 20,
    overflow: "hidden",
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  cardInner: {
    flexDirection: "row",
    gap: 16,
  },
  thumbnailContainer: {
    width: 96,
    height: 96,
    borderRadius: 16,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  joinedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardContent: {
    flex: 1,
    paddingVertical: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});
