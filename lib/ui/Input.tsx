import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useFigmaColors } from '@/lib/figma-colors';
import { typography } from '@/lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  icon,
  containerStyle,
  ...props
}: InputProps) {
  const c = useFigmaColors();

  const styles = StyleSheet.create({
    container: {
      marginBottom: error ? 8 : 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: c.text,
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.inputBorder,
      paddingHorizontal: 12,
      height: 52,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: c.text,
      paddingVertical: 8,
      marginLeft: icon ? 8 : 0,
    },
    error: {
      fontSize: 12,
      color: c.destructive,
      marginTop: 4,
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {icon}
        <TextInput
          style={styles.input}
          placeholderTextColor={c.textMuted}
          {...props}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
