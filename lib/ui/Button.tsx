import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useFigmaColors } from '@/lib/figma-colors';


interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const c = useFigmaColors();

  const sizeStyles = {
    sm: { height: 42, paddingHorizontal: 16 },
    md: { height: 52, paddingHorizontal: 24 },
    lg: { height: 58, paddingHorizontal: 24 },
  };

  const variantStyles = {
    primary: {
      backgroundColor: c.primaryBtnBg,
      borderColor: 'transparent',
    },
    secondary: {
      backgroundColor: c.secondaryBtnBg,
      borderColor: c.border,
      borderWidth: 1,
    },
    destructive: {
      backgroundColor: c.destructive,
      borderColor: 'transparent',
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: c.border,
      borderWidth: 1,
    },
  };

  const variantTextStyles = {
    primary: { color: c.primaryBtnText },
    secondary: { color: c.text },
    destructive: { color: '#FFFFFF' },
    ghost: { color: c.text },
  };

  const styles = StyleSheet.create({
    button: {
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      opacity: disabled ? 0.5 : 1,
      ...sizeStyles[size],
      ...variantStyles[variant],
    },
    text: {
      fontWeight: '600' as const,
      fontSize: size === 'sm' ? 14 : 16,
      ...variantTextStyles[variant],
    },
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, fullWidth && { width: '100%' }, style]}
    >
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}
