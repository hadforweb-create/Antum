import React from "react";
import { View, StyleSheet } from "react-native";

type Props = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
};

export function Shimmer({
  width = "100%",
  height = 12,
  borderRadius = 8,
  style,
}: Props) {
  // Simple placeholder block (no animation) — enough to unblock Metro.
  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});

export default Shimmer;
