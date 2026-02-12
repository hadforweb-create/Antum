import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  X,
  Share2,
  MapPin,
  Calendar,
  Clock,
  Users,
  Bookmark,
  BookmarkCheck,
} from "lucide-react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { useThemeStore, useActivitiesStore } from "@/lib/store";
import { formatShortDate, formatTime, getCategoryConfig } from "@/lib/utils";
import type { Activity, ActivityCategory } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Mock data (same as home screen)
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "1",
    title: "Sunset Hike at Griffith Park",
    description: "Join us for a beautiful sunset hike! We'll explore the trails and catch the golden hour views over Los Angeles. Bring water, comfortable shoes, and your camera!",
    category: "Outdoors",
    location: "Griffith Park, Los Angeles, CA",
    date: new Date("2025-01-25"),
    time: "17:00",
    maxAttendees: 20,
    attendeeCount: 12,
    images: [
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800",
    ],
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
    description: "Casual meetup for coffee lovers and great conversation. Perfect for meeting new people in a relaxed setting.",
    category: "Social",
    location: "Blue Bottle Coffee, Venice, CA",
    date: new Date("2025-01-26"),
    time: "10:00",
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
    description: "Experience an evening of soulful jazz music with local artists. Drinks and appetizers available.",
    category: "Music",
    location: "The Blue Note, Hollywood, CA",
    date: new Date("2025-01-24"),
    time: "20:00",
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
    description: "Start your day with energizing yoga practice in beautiful surroundings. All levels welcome!",
    category: "Wellness",
    location: "Echo Park, Los Angeles, CA",
    date: new Date("2025-01-25"),
    time: "07:30",
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
    description: "Homemade Mediterranean feast with friends! We'll prepare traditional dishes together.",
    category: "Food & Drink",
    location: "Private Home, Santa Monica, CA",
    date: new Date("2025-01-25"),
    time: "19:00",
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
    description: "Friendly beach volleyball games! All skill levels welcome. Teams will be formed on site.",
    category: "Sports",
    location: "Manhattan Beach, CA",
    date: new Date("2025-01-26"),
    time: "14:00",
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

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark } = useThemeStore();
  const { isJoined, markAsJoined, markAsLeft, isSaved, markAsSaved, markAsUnsaved } = useActivitiesStore();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Colors
  const bgColor = isDark ? "#121210" : "#F5F3EE";
  const textColor = isDark ? "#FFF" : "#000";
  const mutedColor = isDark ? "#8E8E8A" : "#2A2A2A";
  const cardBg = isDark ? "rgba(28,28,26,0.88)" : "rgba(255,255,255,0.85)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(214,210,200,0.6)";
  const primaryColor = isDark ? "#E05050" : "#D64040";

  useEffect(() => {
    // Find activity from mock data
    const found = MOCK_ACTIVITIES.find((a) => a.id === id);
    if (found) setActivity(found);
  }, [id]);

  if (!activity) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <Text style={{ color: textColor, textAlign: "center", marginTop: 100 }}>
          Loading...
        </Text>
      </View>
    );
  }

  const joined = isJoined(activity.id);
  const saved = isSaved(activity.id);
  const categoryConfig = getCategoryConfig(activity.category);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Share sheet
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (saved) {
      markAsUnsaved(activity.id);
    } else {
      markAsSaved(activity.id);
    }
  };

  const handleJoinLeave = () => {
    Haptics.notificationAsync(
      joined
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success
    );
    if (joined) {
      markAsLeft(activity.id);
    } else {
      markAsJoined(activity.id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
          >
            {activity.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.heroImage}
              />
            ))}
          </ScrollView>

          <LinearGradient
            colors={["rgba(0,0,0,0.5)", "transparent", "transparent"]}
            style={styles.heroGradient}
          />

          {/* Navigation */}
          <SafeAreaView edges={["top"]} style={styles.heroNav}>
            <Pressable onPress={handleClose} style={styles.navButton}>
              <BlurView intensity={80} tint="dark" style={styles.navButtonBlur}>
                <X size={20} color="#FFF" strokeWidth={2.5} />
              </BlurView>
            </Pressable>
            <View style={styles.navRight}>
              <Pressable onPress={handleSave} style={styles.navButton}>
                <BlurView intensity={80} tint="dark" style={styles.navButtonBlur}>
                  {saved ? (
                    <BookmarkCheck size={20} color={primaryColor} strokeWidth={2.5} />
                  ) : (
                    <Bookmark size={20} color="#FFF" strokeWidth={2.5} />
                  )}
                </BlurView>
              </Pressable>
              <Pressable onPress={handleShare} style={styles.navButton}>
                <BlurView intensity={80} tint="dark" style={styles.navButtonBlur}>
                  <Share2 size={18} color="#FFF" strokeWidth={2.5} />
                </BlurView>
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Image indicators */}
          {activity.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {activity.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.imageIndicator,
                    index === currentImageIndex && styles.imageIndicatorActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Main card */}
          <Animated.View entering={FadeInDown.delay(100)}>
            <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={styles.cardBlur}>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                {/* Category */}
                <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.color + "20" }]}>
                  <Text style={[styles.categoryText, { color: categoryConfig.color }]}>
                    {activity.category}
                  </Text>
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: textColor }]}>
                  {activity.title}
                </Text>

                {/* Description */}
                <Text style={[styles.description, { color: mutedColor }]}>
                  {activity.description}
                </Text>
              </View>
            </BlurView>
          </Animated.View>

          {/* Details card */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={styles.cardBlur}>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                <DetailRow
                  icon={<Calendar size={18} color={primaryColor} strokeWidth={2.5} />}
                  label="Date"
                  value={formatShortDate(activity.date)}
                  isDark={isDark}
                />
                <View style={[styles.divider, { backgroundColor: borderColor }]} />
                <DetailRow
                  icon={<Clock size={18} color={primaryColor} strokeWidth={2.5} />}
                  label="Time"
                  value={formatTime(activity.time)}
                  isDark={isDark}
                />
                <View style={[styles.divider, { backgroundColor: borderColor }]} />
                <DetailRow
                  icon={<MapPin size={18} color={primaryColor} strokeWidth={2.5} />}
                  label="Location"
                  value={activity.location}
                  isDark={isDark}
                />
                <View style={[styles.divider, { backgroundColor: borderColor }]} />
                <DetailRow
                  icon={<Users size={18} color={primaryColor} strokeWidth={2.5} />}
                  label="Attendees"
                  value={`${activity.attendeeCount} / ${activity.maxAttendees} people`}
                  isDark={isDark}
                />
              </View>
            </BlurView>
          </Animated.View>

          {/* Organizer card */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={styles.cardBlur}>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.sectionLabel, { color: mutedColor }]}>
                  ORGANIZER
                </Text>
                <View style={styles.organizerRow}>
                  <Image
                    source={{ uri: activity.organizer.avatarUrl || undefined }}
                    style={styles.organizerAvatar}
                  />
                  <View>
                    <Text style={[styles.organizerName, { color: textColor }]}>
                      {activity.organizer.displayName}
                    </Text>
                    <Text style={[styles.organizerRole, { color: mutedColor }]}>
                      Event host
                    </Text>
                  </View>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Bottom spacing */}
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Footer */}
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <BlurView intensity={80} tint={isDark ? "dark" : "light"}>
          <View
            style={[
              styles.footerContent,
              {
                backgroundColor: isDark ? "rgba(28,28,26,0.92)" : "rgba(255,255,255,0.92)",
                borderTopColor: borderColor,
              },
            ]}
          >
            <Pressable
              onPress={handleJoinLeave}
              style={[
                styles.joinButton,
                {
                  backgroundColor: joined
                    ? isDark
                      ? "rgba(224,80,80,0.2)"
                      : "rgba(214,64,64,0.15)"
                    : primaryColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.joinButtonText,
                  { color: joined ? primaryColor : "#FFF" },
                ]}
              >
                {joined ? "Leave Activity" : "Join Activity"}
              </Text>
            </Pressable>
          </View>
        </BlurView>
      </SafeAreaView>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isDark: boolean;
}) {
  const textColor = isDark ? "#FFF" : "#000";
  const mutedColor = isDark ? "#8E8E8A" : "#2A2A2A";
  const inputBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";

  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: inputBg }]}>
        {icon}
      </View>
      <View style={styles.detailText}>
        <Text style={[styles.detailLabel, { color: mutedColor }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: textColor }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    height: 320,
    position: "relative",
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 320,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  navRight: {
    flexDirection: "row",
    gap: 12,
  },
  navButton: {
    width: 40,
    height: 40,
  },
  navButtonBlur: {
    flex: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageIndicators: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  imageIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  imageIndicatorActive: {
    width: 20,
    backgroundColor: "#FFF",
  },
  content: {
    padding: 20,
    marginTop: -24,
    gap: 12,
  },
  cardBlur: {
    borderRadius: 20,
    overflow: "hidden",
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    marginBottom: 12,
  },
  description: {
    fontSize: 17,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  detailText: {
    flex: 1,
    paddingTop: 2,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 17,
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  organizerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8E6E1",
  },
  organizerName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 2,
  },
  organizerRole: {
    fontSize: 15,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerContent: {
    padding: 16,
    borderTopWidth: 0.5,
  },
  joinButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  joinButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
