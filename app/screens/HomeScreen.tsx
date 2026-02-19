import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useFigmaColors } from '@/lib/figma-colors';
import { Typography } from '@/lib/ui/Typography';
import { Button } from '@/lib/ui/Button';
import { Card } from '@/lib/ui/Card';
import { Input } from '@/lib/ui/Input';
import { Avatar } from '@/lib/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';

/**
 * HomeScreen - Premium Freelance Marketplace
 * 
 * Features:
 * - Search bar for finding jobs/freelancers
 * - Featured jobs carousel
 * - Category filters
 * - Recent activity feed
 */
export function HomeScreen() {
  const c = useFigmaColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock data
  const categories = [
    { id: '1', name: 'All', icon: 'grid' },
    { id: '2', name: 'Design', icon: 'brush' },
    { id: '3', name: 'Development', icon: 'code-slash' },
    { id: '4', name: 'Marketing', icon: 'megaphone' },
  ];

  const featuredJobs = [
    {
      id: '1',
      title: 'Mobile App Design',
      freelancer: 'Sarah Chen',
      price: '$2,500',
      rating: 4.9,
      avatar: 'SC',
    },
    {
      id: '2',
      title: 'React Native App',
      freelancer: 'Alex Kumar',
      price: '$5,000',
      rating: 5.0,
      avatar: 'AK',
    },
    {
      id: '3',
      title: 'Brand Identity',
      freelancer: 'Emma Wilson',
      price: '$3,200',
      rating: 4.8,
      avatar: 'EW',
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
    title: {
      marginBottom: 16,
    },
    categoriesContainer: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 8,
    },
    categoryButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: selectedCategory === 'all' ? c.accent : c.border,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: selectedCategory === 'all' ? c.accent : c.text,
    },
    section: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    sectionTitle: {
      marginBottom: 12,
    },
    jobCard: {
      marginBottom: 12,
      overflow: 'hidden',
    },
    jobCardContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    jobInfo: {
      flex: 1,
      marginRight: 12,
    },
    jobMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 4,
    },
    ratingText: {
      fontSize: 12,
      color: c.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="title1" style={styles.title}>
          Find Work
        </Typography>
        <Input
          placeholder="Search jobs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Ionicons name="search" size={20} color={c.textMuted} />}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <View style={styles.section}>
          <FlatList
            data={categories}
            horizontal
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryButton}
                onPress={() => setSelectedCategory(item.id)}
              >
                <Typography style={styles.categoryText}>{item.name}</Typography>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Featured Jobs */}
        <View style={styles.section}>
          <Typography variant="headline" style={styles.sectionTitle}>
            Featured Opportunities
          </Typography>
          {featuredJobs.map((job) => (
            <Card key={job.id} variant="elevated" style={styles.jobCard}>
              <View style={styles.jobCardContent}>
                <View style={styles.jobInfo}>
                  <Typography variant="headline">{job.title}</Typography>
                  <View style={styles.jobMeta}>
                    <Avatar size="sm" initials={job.avatar} />
                    <Typography style={styles.ratingText}>
                      {job.freelancer} • {job.rating} ★
                    </Typography>
                  </View>
                </View>
                <Typography variant="headline" color={c.accent}>
                  {job.price}
                </Typography>
              </View>
            </Card>
          ))}
        </View>

        {/* Call to action */}
        <View style={styles.section}>
          <Button
            label="View All Opportunities"
            onPress={() => {}}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}
