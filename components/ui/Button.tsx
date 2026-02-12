import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useThemeStore } from "@/lib/store";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "filled" | "tinted" | "glass" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  onPress,
  variant = "filled",
  size = "medium",
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  style,
  textStyle,
}: ButtonProps) {
  const { isDark } = useThemeStore();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    const primary = isDark ? "#F5F3EE" : "#111111";
    const primaryForeground = isDark ? "#111111" : "#FFFFFF";
    const cardBg = isDark ? "rgba(44, 44, 42, 0.8)" : "rgba(255, 255, 255, 0.8)";
    const textColor = isDark ? "#F5F3EE" : "#111111";
    const mutedText = "#8E8E8A";

    switch (variant) {
      case "filled":
        return {
          container: {
            backgroundColor: disabled ? (isDark ? "#3A3A3C" : "#E8E6E1") : primary,
          },
          text: {
            color: disabled ? mutedText : primaryForeground,
          },
        };
      case "tinted":
        return {
          container: {
            backgroundColor: isDark ? "rgba(245, 243, 238, 0.1)" : "rgba(17, 17, 17, 0.06)",
          },
          text: {
            color: disabled ? mutedText : primary,
          },
        };
      case "glass":
        return {
          container: {
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "#D6D2C8",
          },
          text: {
            color: disabled ? mutedText : textColor,
          },
        };
      case "outline":
        return {
          container: {
            backgroundColor: "transparent",
            borderWidth: 1.5,
            borderColor: disabled ? mutedText : primary,
          },
          text: {
            color: disabled ? mutedText : primary,
          },
        };
      case "ghost":
        return {
          container: {
            backgroundColor: "transparent",
          },
          text: {
            color: disabled ? mutedText : primary,
          },
        };
      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case "small":
        return {
          container: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
          text: { fontSize: 14, fontWeight: "600" },
        };
      case "medium":
        return {
          container: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
          text: { fontSize: 16, fontWeight: "600" },
        };
      case "large":
        return {
          container: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 18 },
          text: { fontSize: 17, fontWeight: "600" },
        };
      default:
        return { container: {}, text: {} };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <AnimatedPressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        styles.container,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color}
        />
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              variantStyles.text,
              icon && iconPosition === "left" ? { marginLeft: 8 } : null,
              icon && iconPosition === "right" ? { marginRight: 8 } : null,
              textStyle,
            ]}
          >
            {children}
          </Text>
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </AnimatedPressable>
  );
}

// Icon Button (circular)
interface IconButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  variant?: "filled" | "tinted" | "glass" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  onPress,
  variant = "glass",
  size = "medium",
  disabled = false,
  style,
}: IconButtonProps) {
  const { isDark } = useThemeStore();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const getSizeValue = () => {
    switch (size) {
      case "small": return 32;
      case "medium": return 40;
      case "large": return 48;
    }
  };

  const getBackgroundColor = () => {
    const primary = isDark ? "#F5F3EE" : "#111111";
    const glass = isDark ? "rgba(44, 44, 42, 0.8)" : "rgba(255, 255, 255, 0.8)";
    const tinted = isDark ? "rgba(245, 243, 238, 0.1)" : "rgba(17, 17, 17, 0.06)";

    switch (variant) {
      case "filled": return primary;
      case "tinted": return tinted;
      case "glass": return glass;
      case "ghost": return "transparent";
    }
  };

  const sizeValue = getSizeValue();

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          backgroundColor: getBackgroundColor(),
          alignItems: "center",
          justifyContent: "center",
          borderWidth: variant === "glass" ? 1 : 0,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
        },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {icon}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    textAlign: "center",
  },
});
