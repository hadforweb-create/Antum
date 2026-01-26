import { View, Text, ScrollView, Image, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Settings, Sun, Moon, LogOut } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useThemeStore, useAuthStore } from "@/lib/store";
import { firebaseAuth } from "@/lib/firebase";

// Mock user data
const MOCK_USER = {
  displayName: "Sarah Miller",
  username: "@sarahmiller",
  avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
  bio: "Adventure seeker 🏔️ Coffee enthusiast ☕ Making LA more social, one event at a time",
  stats: {
    hosted: 12,
    joined: 28,
    followers: 234,
  },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { isDark, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();

  // ANTUM Design System
  const bgColor = isDark ? "#121214" : "#FAFAFC";
  const textColor = isDark ? "#FFF" : "#000";
  const mutedColor = "#8E8E93";
  const cardBg = isDark ? "rgba(28,28,30,0.85)" : "rgba(255,255,255,0.85)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const accentColor = "#5050F0";

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await firebaseAuth.signOut();
      logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const displayUser = user || MOCK_USER;

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
            <Text style={[styles.headerTitle, { color: textColor }]}>Profile</Text>
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.springify()}>
          <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={styles.profileCardBlur}>
            <View
              style={[
                styles.profileCard,
                { backgroundColor: cardBg, borderColor },
              ]}
            >
              {/* Header Row */}
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: displayUser.avatarUrl || MOCK_USER.avatarUrl }}
                    style={styles.avatar}
                  />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.displayName, { color: textColor }]}>
                    {displayUser.displayName || MOCK_USER.displayName}
                  </Text>
                  <Text style={[styles.username, { color: mutedColor }]}>
                    {displayUser.username || MOCK_USER.username}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[styles.settingsButton, { backgroundColor: inputBg }]}
                >
                  <Settings size={18} color={textColor} strokeWidth={2} />
                </Pressable>
              </View>

              {/* Bio */}
              <Text style={[styles.bio, { color: textColor }]}>
                {MOCK_USER.bio}
              </Text>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={[styles.statItem, { backgroundColor: inputBg }]}>
                  <Text style={[styles.statValue, { color: textColor }]}>
                    {MOCK_USER.stats.hosted}
                  </Text>
                  <Text style={[styles.statLabel, { color: mutedColor }]}>
                    Hosted
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: inputBg }]}>
                  <Text style={[styles.statValue, { color: textColor }]}>
                    {MOCK_USER.stats.joined}
                  </Text>
                  <Text style={[styles.statLabel, { color: mutedColor }]}>
                    Joined
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: inputBg }]}>
                  <Text style={[styles.statValue, { color: textColor }]}>
                    {MOCK_USER.stats.followers}
                  </Text>
                  <Text style={[styles.statLabel, { color: mutedColor }]}>
                    Followers
                  </Text>
                </View>
              </View>

              {/* Edit Button */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.editButton,
                  {
                    backgroundColor: inputBg,
                    borderColor,
                  },
                ]}
              >
                <Text style={[styles.editButtonText, { color: textColor }]}>
                  Edit Profile
                </Text>
              </Pressable>
            </View>
          </BlurView>
        </Animated.View>

        {/* My Activities Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: mutedColor }]}>
              MY ACTIVITIES
            </Text>
            <Text style={[styles.sectionCount, { color: accentColor }]}>2</Text>
          </View>

          <View style={[styles.emptyActivities, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.emptyText, { color: mutedColor }]}>
              Activities you host will appear here
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: "rgba(255,59,48,0.1)" }]}
        >
          <LogOut size={18} color="#FF3B30" strokeWidth={2} />
          <Text style={[styles.logoutText, { color: "#FF3B30" }]}>
            Sign Out
          </Text>
        </Pressable>

        <View style={{ height: 120 }} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  profileCardBlur: {
    borderRadius: 20,
    overflow: "hidden",
  },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#5050F0",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
    paddingTop: 8,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    fontWeight: "500",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bio: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  editButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyActivities: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
