import React from 'react';
import { FlatList, StyleSheet, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { UserNameWithBadge } from '../../../components/ui/UserNameWithBadge';
import { useTheme } from '../../../theme/useTheme';
import { useChatStore } from '../../../store/chat/chatStore';
import { useAuthStore } from '../../../store/auth/authStore';
import type { ChatStackParamList } from '../../../navigation/types';
import { Routes } from '../../../navigation/routes';

type Props = NativeStackScreenProps<ChatStackParamList, typeof Routes.Chat.Detail>;

export const ChatDetailScreen = ({ route, navigation }: Props): React.JSX.Element => {
  const theme = useTheme();
  const { conversationId } = route.params;
  const messages = useChatStore((s) => s.messages);
  const currentConversation = useChatStore((s) => s.currentConversation);
  const isLoading = useChatStore((s) => s.isLoading);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const userId = useAuthStore((s) => s.session?.userId);

  const [messageText, setMessageText] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const fetchMessages = useChatStore((s) => s.fetchMessages);

  React.useEffect(() => {
    // Load messages when screen mounts or conversationId changes
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId, fetchMessages]);

  React.useEffect(() => {
    // Set navigation title
    if (currentConversation) {
      const otherParticipants = currentConversation.participants.filter((p) => p.userId !== userId);
      const title = otherParticipants.length > 0 
        ? otherParticipants.map(p => p.name).join(', ')
        : 'Chat';
      navigation.setOptions({ title });
    }
  }, [currentConversation, userId, navigation]);

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
      },
      messagesList: {
        flex: 1,
        padding: theme.spacing.md,
      },
      messageBubble: {
        maxWidth: '75%',
        padding: theme.spacing.sm,
        borderRadius: 16,
        marginBottom: theme.spacing.xs,
      },
      myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary,
      },
      otherMessage: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      messageText: {
        color: theme.colors.text,
      },
      myMessageText: {
        color: '#FFFFFF',
      },
      messageSender: {
        fontSize: theme.typography.captionSize,
        color: theme.colors.mutedText,
        marginBottom: theme.spacing.xs / 2,
      },
      inputContainer: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        gap: theme.spacing.sm,
      },
      textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 20,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        color: theme.colors.text,
        backgroundColor: theme.colors.surface,
        maxHeight: 100,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
      },
    });
  }, [theme]);

  const handleSend = async () => {
    if (!messageText.trim() || isSending) {
      return;
    }

    const content = messageText.trim();
    setMessageText('');
    setIsSending(true);

    try {
      await sendMessage(conversationId, content);
    } catch (err) {
      alert('Failed to send message');
      setMessageText(content); // Restore message text on error
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (isLoading && messages.length === 0) {
    return (
      <Screen>
        <View style={styles.emptyContainer}>
          <AppText color="muted">Loading messages...</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Screen>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          renderItem={({ item }) => {
            const isMyMessage = item.senderId === userId;
            return (
              <View
                style={[
                  styles.messageBubble,
                  isMyMessage ? styles.myMessage : styles.otherMessage,
                ]}
              >
                {!isMyMessage && (
                  <UserNameWithBadge
                    name={item.senderName}
                    vipTier={item.senderVipTier as 'vip' | 'vip_plus' | null}
                    style={styles.messageSender}
                  />
                )}
                <AppText style={isMyMessage ? styles.myMessageText : styles.messageText}>
                  {item.content}
                </AppText>
                <AppText
                  style={[
                    styles.messageSender,
                    { marginTop: theme.spacing.xs / 2, marginBottom: 0 },
                    isMyMessage && { color: 'rgba(255, 255, 255, 0.7)' },
                  ]}
                >
                  {formatTime(item.createdAt)}
                </AppText>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppText color="muted">No messages yet. Start the conversation!</AppText>
            </View>
          }
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.mutedText}
            multiline
            editable={!isSending}
          />
          <Button
            label="Send"
            onPress={handleSend}
            disabled={!messageText.trim() || isSending}
            style={{ minWidth: 60 }}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
};
