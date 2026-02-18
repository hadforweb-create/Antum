import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useFigmaColors } from '@/lib/figma-colors';

interface CardProps {
  children: React.ReactNode;
  variant?: 'surface' | 'elevated' | 'outlined';
  padding?: number;
  style?: ViewStyle;
}

export function Card({ children, variant = 'surface', padding = 16, style }: CardProps) {
  const c = useFigmaColors();

  const variantStyles = {
    surface: { backgroundColor: c.surface },
    elevated: { backgroundColor: c.elevated },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: c.border,
    },
  };

  const styles = StyleSheet.create({
    card: {
      borderRadius: 16,
      padding,
      ...variantStyles[variant],
    },
  });

  return <View style={[styles.card, style]}>{children}</View>;
}
