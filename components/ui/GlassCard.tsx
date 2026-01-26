import React from "react";
import { View, StyleSheet, ViewStyle, Pressable, PressableProps } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useThemeStore } from "@/lib/store";

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: "ultraThin" | "thin" | "regular" | "thick" | "ultraThick";
  style?: ViewStyle;
  onPress?: () => void;
  activeScale?: number;
  haptic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const INTENSITY_MAP = {
  ultraThin: 10,
  thin: 20,
  regular: 40,
  thick: 60,
  ultraThick: 80,
};

const OPACITY_MAP_LIGHT = {
  ultraThin: 0.3,
  thin: 0.5,
  regular: 0.7,
  thick: 0.85,
  ultraThick: 0.92,
};

const OPACITY_MAP_DARK = {
  ultraThin: 0.4,
  thin: 0.6,
  regular: 0.75,
  thick: 0.88,
  ultraThick: 0.94,
};

export function GlassCard({
  children,
  intensity = "thick",
  style,
  onPress,
  activeScale = 0.98,
  haptic = true,
}: GlassCardProps) {
  const { isDark } = useThemeStore();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(activeScale, {
      damping: 15,
      stiffness: 400,
    });
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  const opacityMap = isDark ? OPACITY_MAP_DARK : OPACITY_MAP_LIGHT;
  const bgColor = isDark
    ? `rgba(28, 28, 30, ${opacityMap[intensity]})`
    : `rgba(255, 255, 255, ${opacityMap[intensity]})`;

  const borderColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(0, 0, 0, 0.05)";

  const content = (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }, style]}>
      <BlurView
        intensity={INTENSITY_MAP[intensity]}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}

// Non-pressable glass view
export function GlassView({
  children,
  intensity = "regular",
  style,
}: Omit<GlassCardProps, "onPress" | "activeScale" | "haptic">) {
  const { isDark } = useThemeStore();
  
  const opacityMap = isDark ? OPACITY_MAP_DARK : OPACITY_MAP_LIGHT;
  const bgColor = isDark
    ? `rgba(28, 28, 30, ${opacityMap[intensity]})`
    : `rgba(255, 255, 255, ${opacityMap[intensity]})`;

  const borderColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(0, 0, 0, 0.05)";

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }, style]}>
      <BlurView
        intensity={INTENSITY_MAP[intensity]}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});
