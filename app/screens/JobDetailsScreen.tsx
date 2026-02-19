import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useFigmaColors } from '@/lib/figma-colors';
import { Typography } from '@/lib/ui/Typography';
import { Button } from '@/lib/ui/Button';
import { Card } from '@/lib/ui/Card';
import { Avatar } from '@/lib/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';

/**
 * JobDetailsScreen - Detailed view of a single job posting
 * 
 * Features:
 * - Job title and description
 * - Freelancer profile preview
 * - Budget and timeline
 * - Skills required
 * - Call-to-action buttons
 */
export function JobDetailsScreen() {
  const c = useFigmaColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 20,
      backgroundColor: c.surface,
    },
    backButton: {
      marginBottom: 16,
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: c.elevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    jobTitle: {
      marginBottom: 8,
    },
    jobMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 12,
    },
    section: {
      paddingHorizontal: 16,
      marginBottom: 24,
      marginTop: 24,
    },
    sectionTitle: {
      marginBottom: 12,
    },
    description: {
      lineHeight: 24,
      color: c.textSecondary,
    },
    freelancerCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    freelancerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    freelancerDetails: {
      flex: 1,
    },
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillTag: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: c.elevated,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: c.accent,
    },
    skillText: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: c.accent,
    },
    budgetContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      marginBottom: 12,
    },
    budgetLabel: {
      fontSize: 14,
      color: c.textSecondary,
    },
    budgetValue: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: c.accent,
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
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Typography variant="title2" style={styles.jobTitle}>
          Mobile App Design System
        </Typography>
        <View style={styles.jobMeta}>
          <Ionicons name="calendar-outline" size={16} color={c.textSecondary} />
          <Typography color={c.textSecondary}>2 weeks ago</Typography>
          <Ionicons name="eye-outline" size={16} color={c.textSecondary} />
          <Typography color={c.textSecondary}>245 views</Typography>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Budget & Timeline */}
        <View style={styles.section}>
          <View style={styles.budgetContainer}>
            <View>
              <Typography style={styles.budgetLabel}>Budget</Typography>
              <Typography style={styles.budgetValue}>$2,500 - $4,000</Typography>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Typography style={styles.budgetLabel}>Timeline</Typography>
              <Typography style={styles.budgetValue}>4 weeks</Typography>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Typography variant="headline" style={styles.sectionTitle}>
            About this project
          </Typography>
          <Typography style={styles.description}>
            We're looking for an experienced UI/UX designer to create a comprehensive design system for our new mobile application. The system should include components, patterns, and guidelines for both iOS and Android platforms.
          </Typography>
        </View>

        {/* Skills Required */}
        <View style={styles.section}>
          <Typography variant="headline" style={styles.sectionTitle}>
            Skills Required
          </Typography>
          <View style={styles.skillsContainer}>
            {['Figma', 'UI Design', 'Prototyping', 'Design Systems'].map((skill) => (
              <View key={skill} style={styles.skillTag}>
                <Typography style={styles.skillText}>{skill}</Typography>
              </View>
            ))}
          </View>
        </View>

        {/* Freelancer */}
        <View style={styles.section}>
          <Typography variant="headline" style={styles.sectionTitle}>
            Posted by
          </Typography>
          <Card variant="elevated">
            <View style={styles.freelancerCard}>
              <View style={styles.freelancerInfo}>
                <Avatar size="md" initials="JD" />
                <View style={styles.freelancerDetails}>
                  <Typography variant="headline">John Davis</Typography>
                  <Typography color={c.textSecondary}>Tech Startup</Typography>
                  <Typography color={c.accent} weight="600">
                    ★ 4.9 (87 reviews)
                  </Typography>
                </View>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button label="Apply Now" onPress={() => {}} fullWidth />
        <Button label="Save Job" variant="secondary" onPress={() => {}} fullWidth />
      </View>
    </View>
  );
}
