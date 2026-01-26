import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Bookmark, Sun, Moon } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Pressable } from "react-native";

import { useThemeStore } from "@/lib/store";

export default function SavedScreen() {
  const { isDark, toggleTheme } = useThemeStore();

  const bgColor = isDark ? "#000" : "#F2F2F7";
  const textColor = isDark ? "#FFF" : "#000";
  const mutedColor = isDark ? "#8E8E93" : "#3C3C43";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  const primaryColor = isDark ? "#FF453A" : "#FF3B30";

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

      {/* Empty State */}
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIcon,
            { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" },
          ]}
        >
          <Bookmark size={32} color={mutedColor} strokeWidth={1.5} />
        </View>
        <Text style={[styles.emptyTitle, { color: textColor }]}>
          No Saved Activities
        </Text>
        <Text style={[styles.emptyDescription, { color: mutedColor }]}>
          Activities you like will appear here.{"\n"}Start exploring to find events you love!
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={[styles.exploreButton, { backgroundColor: primaryColor }]}
        >
          <Text style={styles.exploreButtonText}>Explore Now</Text>
        </Pressable>
      </View>
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
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
