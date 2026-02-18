import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { useFigmaColors } from '@/lib/figma-colors';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  source?: { uri: string };
  initials?: string;
  style?: ViewStyle;
}

export function Avatar({ size = 'md', source, initials, style }: AvatarProps) {
  const c = useFigmaColors();

  const sizeMap = {
    sm: 36,
    md: 48,
    lg: 88,
  };

  const avatarSize = sizeMap[size];
  const fontSize = size === 'sm' ? 12 : size === 'md' ? 14 : 24;

  const styles = StyleSheet.create({
    avatar: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      backgroundColor: c.accent,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    initials: {
      fontSize,
      fontWeight: '600' as const,
      color: '#0b0b0f',
    },
  });

  return (
    <View style={[styles.avatar, style]}>
      {source ? (
        <Image source={source} style={styles.image} />
      ) : (
        <Text style={styles.initials}>{initials}</Text>
      )}
    </View>
  );
}
