import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useFigmaColors } from '@/lib/figma-colors';
import { Typography } from '@/lib/ui/Typography';
import { Button } from '@/lib/ui/Button';
import { Card } from '@/lib/ui/Card';
import { Input } from '@/lib/ui/Input';
import { Ionicons } from '@expo/vector-icons';

/**
 * BrowseScreen - Browse and filter available jobs
 * 
 * Features:
 * - Advanced filtering
 * - Sort options
 * - Job listings with details
 * - Bookmark functionality
 */
export function BrowseScreen() {
  const c = useFigmaColors();
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [bookmarked, setBookmarked] = useState(new Set());

  const jobs = [
    {
      id: '1',
      title: 'Create an E-commerce Platform UI',
      client: 'TechStart Inc',
      budget: '$3,000 - $5,000',
      duration: '4 weeks',
      level: 'Intermediate',
      category: 'Web Design',
      skills: ['Figma', 'UI Design', 'Prototyping'],
      description: 'Design a complete e-commerce platform with 20+ pages...',
      proposals: 12,
      rating: 4.8,
    },
    {
      id: '2',
      title: 'Mobile App Redesign',
      client: 'Innovation Labs',
      budget: '$2,500 - $4,000',
      duration: '3 weeks',
      level: 'Intermediate',
      category: 'Mobile Design',
      skills: ['Figma', 'User Research', 'Design Systems'],
      description: 'Redesign existing mobile app for better UX...',
      proposals: 8,
      rating: 4.9,
    },
    {
      id: '3',
      title: 'Brand Identity & Logo Design',
      client: 'Creative Studio',
      budget: '$1,500 - $2,500',
      duration: '2 weeks',
      level: 'Beginner',
      category: 'Branding',
      skills: ['Logo Design', 'Branding', 'Illustration'],
      description: 'Complete brand identity package for startup...',
      proposals: 24,
      rating: 4.7,
    },
    {
      id: '4',
      title: 'Landing Page Design',
      client: 'SaaS Startup',
      budget: '$1,000 - $2,000',
      duration: '1 week',
      level: 'Beginner',
      category: 'Web Design',
      skills: ['Web Design', 'Figma', 'Responsive Design'],
      description: 'Design modern landing page for new product launch...',
      proposals: 31,
      rating: 4.6,
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: c.surface,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {},
    filterButton: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: c.elevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sortContainer: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    sortButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: sortBy === 'newest' ? c.accent : c.elevated,
      borderWidth: 1,
      borderColor: c.border,
    },
    sortText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: sortBy === 'newest' ? '#0b0b0f' : c.text,
    },
    jobsList: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    jobCard: {
      marginBottom: 12,
    },
    jobHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    jobTitle: {
      flex: 1,
      marginRight: 12,
    },
    bookmarkButton: {
      width: 32,
      height: 32,
      borderRadius: 6,
      backgroundColor: c.elevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    jobMeta: {
      marginBottom: 8,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    metaIcon: {
      fontSize: 12,
      color: c.textSecondary,
    },
    jobDescription: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 18,
      marginBottom: 8,
    },
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    skillTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: c.accent,
      borderRadius: 4,
    },
    skillText: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: '#0b0b0f',
    },
    jobFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    proposalsText: {
      fontSize: 12,
      color: c.textSecondary,
    },
    viewButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: c.accent,
      borderRadius: 6,
    },
    viewButtonText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: '#0b0b0f',
    },
  });

  const toggleBookmark = (jobId: string) => {
    const newBookmarked = new Set(bookmarked);
    if (newBookmarked.has(jobId)) {
      newBookmarked.delete(jobId);
    } else {
      newBookmarked.add(jobId);
    }
    setBookmarked(newBookmarked);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Typography variant="title1" style={styles.title}>
            Browse Jobs
          </Typography>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="funnel" size={20} color={c.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.sortContainer}>
          {['newest', 'highest', 'trending'].map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.sortButton}
              onPress={() => setSortBy(option)}
            >
              <Typography style={styles.sortText}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={jobs}
        scrollEnabled={true}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.jobsList}
        renderItem={({ item }) => (
          <Card variant="elevated" padding={12} style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <Typography variant="headline" style={styles.jobTitle}>
                {item.title}
              </Typography>
              <TouchableOpacity
                style={styles.bookmarkButton}
                onPress={() => toggleBookmark(item.id)}
              >
                <Ionicons
                  name={bookmarked.has(item.id) ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={c.accent}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.jobMeta}>
              <View style={styles.metaRow}>
                <Ionicons name="briefcase-outline" size={14} color={c.textSecondary} />
                <Typography style={styles.metaIcon}>{item.client}</Typography>
                <Ionicons name="cash-outline" size={14} color={c.textSecondary} />
                <Typography style={styles.metaIcon}>{item.budget}</Typography>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="hourglass-outline" size={14} color={c.textSecondary} />
                <Typography style={styles.metaIcon}>{item.duration}</Typography>
                <Ionicons name="stats-chart-outline" size={14} color={c.textSecondary} />
                <Typography style={styles.metaIcon}>{item.level}</Typography>
              </View>
            </View>

            <Typography style={styles.jobDescription}>{item.description}</Typography>

            <View style={styles.skillsContainer}>
              {item.skills.map((skill) => (
                <View key={skill} style={styles.skillTag}>
                  <Typography style={styles.skillText}>{skill}</Typography>
                </View>
              ))}
            </View>

            <View style={styles.jobFooter}>
              <Typography style={styles.proposalsText}>
                {item.proposals} proposals
              </Typography>
              <TouchableOpacity style={styles.viewButton}>
                <Typography style={styles.viewButtonText}>View Details</Typography>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />
    </View>
  );
}
