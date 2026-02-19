import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useFigmaColors } from '@/lib/figma-colors';
import { figmaTypography } from '@/lib/figma-tokens';

type TypographyVariant = keyof typeof figmaTypography;

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  weight?: '400' | '500' | '600' | '700' | '800' | '900';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  children: React.ReactNode;
}

export function Typography({
  variant = 'body',
  color,
  weight,
  align,
  children,
  style,
  ...props
}: TypographyProps) {
  const c = useFigmaColors();
  const baseStyle = figmaTypography[variant] || figmaTypography.body;

  const styles = StyleSheet.create({
    text: {
      ...baseStyle,
      color: color || c.text,
      fontWeight: weight as any,
      textAlign: align,
    },
  });

  return (
    <Text style={[styles.text, style]} {...props}>
      {children}
    </Text>
  );
}
