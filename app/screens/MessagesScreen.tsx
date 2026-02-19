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
import { Input } from '@/lib/ui/Input';
import { Card } from '@/lib/ui/Card';
import { Avatar } from '@/lib/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';

/**
 * MessagesScreen - Chat and messaging interface
 * 
 * Features:
 * - Search conversations
 * - Active conversations list
 * - Unread badge indicators
 * - Last message preview
 * - Quick action buttons
 */
export function MessagesScreen() {
  const c = useFigmaColors();
  const [searchQuery, setSearchQuery] = useState('');

  const conversations = [
    {
      id: '1',
      name: 'Sarah Chen',
      lastMessage: 'Can you send me the mockups?',
      time: '2 min',
      unread: 2,
      avatar: 'SC',
      active: true,
    },
    {
      id: '2',
      name: 'John Davis',
      lastMessage: 'Thanks for the design file!',
      time: '1 hour',
      unread: 0,
      avatar: 'JD',
      active: false,
    },
    {
      id: '3',
      name: 'Emma Wilson',
      lastMessage: 'Let\'s schedule a call for tomorrow',
      time: '3 hours',
      unread: 0,
      avatar: 'EW',
      active: true,
    },
    {
      id: '4',
      name: 'Alex Kumar',
      lastMessage: 'Project completed successfully!',
      time: 'Yesterday',
      unread: 0,
      avatar: 'AK',
      active: false,
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
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: c.elevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    conversationList: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    conversationCard: {
      marginBottom: 8,
    },
    conversationContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    conversationLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      flex: 1,
    },
    avatarContainer: {
      position: 'relative',
    },
    activeIndicator: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: c.success,
      borderWidth: 2,
      borderColor: c.surface,
    },
    conversationInfo: {
      flex: 1,
    },
    conversationName: {
      marginBottom: 4,
    },
    lastMessage: {
      fontSize: 13,
      color: c.textSecondary,
    },
    conversationRight: {
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
    },
    time: {
      fontSize: 12,
      color: c.textMuted,
      marginBottom: 4,
    },
    unreadBadge: {
      backgroundColor: c.accent,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    unreadText: {
      fontSize: 11,
      fontWeight: '700' as const,
      color: '#0b0b0f',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      textAlign: 'center',
      color: c.textSecondary,
    },
  });

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Typography variant="title1" style={styles.title}>
            Messages
          </Typography>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="pencil" size={20} color={c.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="settings" size={20} color={c.text} />
            </TouchableOpacity>
          </View>
        </View>
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Ionicons name="search" size={20} color={c.textMuted} />}
        />
      </View>

      {filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.conversationList}
          renderItem={({ item }) => (
            <Card variant="outlined" padding={12} style={styles.conversationCard}>
              <TouchableOpacity>
                <View style={styles.conversationContent}>
                  <View style={styles.conversationLeft}>
                    <View style={styles.avatarContainer}>
                      <Avatar size="md" initials={item.avatar} />
                      {item.active && <View style={styles.activeIndicator} />}
                    </View>
                    <View style={styles.conversationInfo}>
                      <Typography
                        variant="headline"
                        style={styles.conversationName}
                      >
                        {item.name}
                      </Typography>
                      <Typography style={styles.lastMessage} numberOfLines={1}>
                        {item.lastMessage}
                      </Typography>
                    </View>
                  </View>
                  <View style={styles.conversationRight}>
                    <Typography style={styles.time}>{item.time}</Typography>
                    {item.unread > 0 && (
                      <View style={styles.unreadBadge}>
                        <Typography style={styles.unreadText}>
                          {item.unread}
                        </Typography>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="chatbubbles-outline"
            size={64}
            color={c.textMuted}
            style={styles.emptyIcon}
          />
          <Typography style={styles.emptyText}>
            No conversations found
          </Typography>
        </View>
      )}
    </View>
  );
}
