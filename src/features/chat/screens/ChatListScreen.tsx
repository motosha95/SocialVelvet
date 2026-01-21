import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../theme/useTheme';
import { useChatStore } from '../../../store/chat/chatStore';
import { useAuthStore } from '../../../store/auth/authStore';
import type { ChatStackParamList } from '../../../navigation/types';
import { Routes } from '../../../navigation/routes';

type Props = NativeStackScreenProps<ChatStackParamList, typeof Routes.Chat.List>;

export const ChatListScreen = ({ navigation }: Props): React.JSX.Element => {
  const theme = useTheme();
  const conversations = useChatStore((s) => s.conversations);
  const isLoading = useChatStore((s) => s.isLoading);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const userId = useAuthStore((s) => s.session?.userId);

  React.useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      conversationItem: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      },
      avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.border,
        marginRight: theme.spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
      },
      content: {
        flex: 1,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
      },
      lastMessage: {
        color: theme.colors.mutedText,
        fontSize: theme.typography.bodySize,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
      },
    });
  }, [theme]);

  const getOtherParticipants = (conversation: typeof conversations[0]) => {
    return conversation.participants.filter((p) => p.userId !== userId);
  };

  const handleConversationPress = (conversation: typeof conversations[0]) => {
    selectConversation(conversation);
    navigation.navigate(Routes.Chat.Detail, { conversationId: conversation.id });
  };

  if (isLoading && conversations.length === 0) {
    return (
      <Screen>
        <AppText variant="title" style={{ marginBottom: theme.spacing.md }}>
          Messages
        </AppText>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
        <AppText variant="title">Messages</AppText>
        <AppText color="muted" variant="caption">
          Tap an event attendee to start chatting
        </AppText>
      </View>

      {conversations.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <AppText color="muted">No conversations yet.</AppText>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const others = getOtherParticipants(item);
            const displayName = others.length > 0 
              ? others.map(p => p.name).join(', ')
              : 'You';

            return (
              <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => handleConversationPress(item)}
              >
                <View style={styles.avatar}>
                  <AppText variant="title">{displayName[0]?.toUpperCase()}</AppText>
                </View>
                <View style={styles.content}>
                  <View style={styles.header}>
                    <AppText variant="subtitle">{displayName}</AppText>
                    {item.lastMessage && (
                      <AppText color="muted" variant="caption">
                        {new Date(item.lastMessage.createdAt).toLocaleDateString()}
                      </AppText>
                    )}
                  </View>
                  {item.lastMessage && (
                    <AppText style={styles.lastMessage} numberOfLines={1}>
                      {item.lastMessage.senderId === userId ? 'You: ' : ''}
                      {item.lastMessage.content}
                    </AppText>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </Screen>
  );
};
