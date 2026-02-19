import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useFigmaColors } from '@/lib/figma-colors';
import { Typography } from '@/lib/ui/Typography';
import { Button } from '@/lib/ui/Button';
import { Card } from '@/lib/ui/Card';
import { Avatar } from '@/lib/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';

/**
 * ProfileScreen - User profile with achievements, reviews, and portfolio
 * 
 * Features:
 * - Profile header with avatar and stats
 * - Bio and expertise areas
 * - Portfolio showcase
 * - Reviews and ratings
 * - Action buttons
 */
export function ProfileScreen() {
  const c = useFigmaColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    header: {
      backgroundColor: c.surface,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 24,
    },
    profileHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    profileInfo: {
      flex: 1,
      marginLeft: 16,
    },
    name: {
      marginBottom: 4,
    },
    title: {
      marginBottom: 8,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
    },
    badgeText: {
      fontSize: 12,
      color: c.accent,
      fontWeight: '600' as const,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    stat: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: c.accent,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: c.textSecondary,
    },
    section: {
      paddingHorizontal: 16,
      marginTop: 24,
      marginBottom: 24,
    },
    sectionTitle: {
      marginBottom: 12,
    },
    bio: {
      lineHeight: 22,
      color: c.textSecondary,
    },
    expertiseContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    expertiseTag: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: c.elevated,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.accent,
    },
    expertiseText: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: c.accent,
    },
    reviewCard: {
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    reviewerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    reviewText: {
      lineHeight: 20,
      color: c.textSecondary,
      marginTop: 8,
    },
    actions: {
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 12,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <Avatar size="lg" initials="SM" />
          <View style={styles.profileInfo}>
            <Typography variant="title2" style={styles.name}>
              Sarah Miller
            </Typography>
            <Typography style={styles.title}>UI/UX Designer & Illustrator</Typography>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={14} color={c.accent} />
              <Typography style={styles.badgeText}>Verified Pro</Typography>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={20} color={c.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Typography style={styles.statValue}>4.9</Typography>
            <Typography style={styles.statLabel}>Rating</Typography>
          </View>
          <View style={styles.stat}>
            <Typography style={styles.statValue}>127</Typography>
            <Typography style={styles.statLabel}>Projects</Typography>
          </View>
          <View style={styles.stat}>
            <Typography style={styles.statValue}>98%</Typography>
            <Typography style={styles.statLabel}>Success Rate</Typography>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Bio */}
        <View style={styles.section}>
          <Typography style={styles.bio}>
            Experienced designer with a passion for creating beautiful, intuitive user interfaces. Specialized in mobile apps, design systems, and brand identity.
          </Typography>
        </View>

        {/* Expertise */}
        <View style={styles.section}>
          <Typography variant="headline" style={styles.sectionTitle}>
            Areas of Expertise
          </Typography>
          <View style={styles.expertiseContainer}>
            {['UI Design', 'Figma', 'Prototyping', 'Design Systems', 'Illustrations'].map((skill) => (
              <View key={skill} style={styles.expertiseTag}>
                <Typography style={styles.expertiseText}>{skill}</Typography>
              </View>
            ))}
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Typography variant="headline" style={styles.sectionTitle}>
            Recent Reviews
          </Typography>
          {[
            {
              reviewer: 'Alex Johnson',
              rating: 5,
              text: 'Excellent work! Sarah delivered exactly what we needed. Very professional and responsive.',
            },
            {
              reviewer: 'Emma Davis',
              rating: 5,
              text: 'Amazing designer with great attention to detail. Highly recommended!',
            },
          ].map((review, idx) => (
            <View key={idx} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <Avatar size="sm" initials={review.reviewer.split(' ')[0][0]} />
                  <View>
                    <Typography variant="callout">{review.reviewer}</Typography>
                    <Typography style={{ fontSize: 12, color: c.accent }}>
                      {'★'.repeat(review.rating)}
                    </Typography>
                  </View>
                </View>
              </View>
              <Typography style={styles.reviewText}>{review.text}</Typography>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button label="Contact" onPress={() => {}} fullWidth />
        <Button label="Follow" variant="secondary" onPress={() => {}} fullWidth />
      </View>
    </View>
  );
}
