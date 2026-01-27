import React from 'react';
import { ScrollView, StyleSheet, TextInput, View, Image, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { useThemeContext } from '../../../theme/ThemeProvider';
import { useAuthStore } from '../../../store/auth/authStore';
import { useUserStore } from '../../../store/user/userStore';
import { useEventsStore } from '../../../store/events/eventsStore';
import { uploadApi } from '../../../api/uploadApi';
import { fixAvatarUrl } from '../../../utils/avatarUtils';
import { EventCard } from '../../events/components/EventCard';
import type { AppTabsParamList, EventsStackParamList } from '../../../navigation/types';
import { Routes } from '../../../navigation/routes';
import type { Event } from '../../events/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabsParamList, typeof Routes.App.Profile>,
  NativeStackScreenProps<EventsStackParamList>
>;

export const ProfileScreen = ({ navigation }: Props): React.JSX.Element => {
  const { theme, setMode } = useThemeContext();
  const signOut = useAuthStore((s) => s.signOut);
  const profile = useUserStore((s) => s.profile);
  const isLoading = useUserStore((s) => s.isLoading);
  const fetchProfile = useUserStore((s) => s.fetchProfile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const events = useEventsStore((s) => s.events);
  const fetchEvents = useEventsStore((s) => s.fetchEvents);

  const [name, setName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    fetchProfile();
    fetchEvents();
  }, [fetchProfile, fetchEvents]);

  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio || '');
    }
  }, [profile]);

  // Filter and split events
  const myEvents = React.useMemo(() => {
    const joined = events.filter((event) => event.isJoined);
    const now = new Date();
    
    const upcoming: Event[] = [];
    const past: Event[] = [];
    
    joined.forEach((event) => {
      const eventDate = new Date(event.date);
      if (eventDate >= now) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    });
    
    // Sort upcoming by date (soonest first)
    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // Sort past by date (most recent first)
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return { upcoming, past };
  }, [events]);

  const handleEventPress = (eventId: string) => {
    // Navigate to Events tab and then to event details screen
    navigation.navigate(Routes.App.Events, {
      screen: Routes.Events.Details,
      params: { eventId },
    });
  };

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        paddingBottom: theme.spacing.xl,
      },
      header: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
      },
      avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.border,
        marginBottom: theme.spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      },
      avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
      },
      card: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
      },
      fieldLabel: {
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
      },
      input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        color: theme.colors.text,
        backgroundColor: theme.colors.background,
      },
      textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
      },
      row: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
      },
      sectionTitle: {
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.sm,
      },
      emptyState: {
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
      },
      emptyStateText: {
        marginTop: theme.spacing.sm,
      },
    });
  }, [theme]);

  const handlePickImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        alert('Permission to access camera roll is required!');
        return;
      }

      // Show instructions before opening picker
      alert('📸 Image Selection Instructions:\n\n1. Select an image from your gallery\n2. Adjust the crop area by dragging the corners\n3. To confirm: Look for the checkmark (✓) or "Done" button in the TOP-RIGHT corner of the screen\n4. If you don\'t see it, try tapping the top-right area - it may be partially hidden but still works');

      // Launch image picker with native editing
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile pictures
        quality: 0.8,
      });

      if (result.canceled) {
        return; // User canceled
      }

      if (!result.assets || result.assets.length === 0) {
        alert('No image selected');
        return;
      }

      // Upload the cropped image
      setIsUploading(true);
      try {
        const uploadResult = await uploadApi.uploadImage(result.assets[0].uri);
        await updateProfile({ avatarUrl: uploadResult.imageUrl });
        alert('Profile picture updated!');
      } catch (err) {
        console.error('Upload error:', err);
        alert('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      alert('Failed to open image picker. Please check app permissions.');
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({ name, bio });
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update profile');
    }
  };


  const toggleTheme = () => {
    setMode(theme.mode === 'dark' ? 'light' : 'dark');
  };

  if (isLoading && !profile) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText color="muted" style={{ marginTop: theme.spacing.md }}>
            Loading profile...
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handlePickImage} disabled={isUploading}>
            <View style={styles.avatar}>
              {profile?.avatarUrl ? (
                <Image source={{ uri: fixAvatarUrl(profile.avatarUrl) || profile.avatarUrl }} style={styles.avatarImage} onError={() => console.warn('Failed to load avatar:', profile.avatarUrl)} />
              ) : (
                <AppText variant="title">{profile?.name[0]?.toUpperCase()}</AppText>
              )}
            </View>
          </TouchableOpacity>
          <AppText variant="title">{profile?.name}</AppText>
          <AppText color="muted">{profile?.email}</AppText>
        </View>

        <View style={styles.card}>
          <AppText style={styles.fieldLabel} color="muted">
            Name
          </AppText>
          {isEditing ? (
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              editable={!isUploading}
            />
          ) : (
            <AppText>{profile?.name}</AppText>
          )}

          <AppText style={styles.fieldLabel} color="muted">
            Bio
          </AppText>
          {isEditing ? (
            <TextInput
              value={bio}
              onChangeText={setBio}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              placeholder="Tell us about yourself..."
              placeholderTextColor={theme.colors.mutedText}
              editable={!isUploading}
            />
          ) : (
            <AppText>{profile?.bio || 'No bio yet.'}</AppText>
          )}

          <View style={styles.row}>
            {isEditing ? (
              <>
                <Button
                  label="Save"
                  onPress={handleSave}
                  style={{ flex: 1 }}
                  disabled={isUploading}
                />
                <Button
                  label="Cancel"
                  onPress={() => {
                    setIsEditing(false);
                    setName(profile?.name || '');
                    setBio(profile?.bio || '');
                  }}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
              </>
            ) : (
              <Button
                label="Edit Profile"
                onPress={() => setIsEditing(true)}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>

        {/* My Events Section */}
        <View style={styles.card}>
          <AppText variant="title" style={styles.sectionTitle}>
            My Events
          </AppText>

          {/* Upcoming Events */}
          {myEvents.upcoming.length > 0 && (
            <>
              <AppText variant="subtitle" color="muted" style={{ marginBottom: theme.spacing.sm }}>
                Upcoming ({myEvents.upcoming.length})
              </AppText>
              {myEvents.upcoming.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => handleEventPress(event.id)}
                />
              ))}
            </>
          )}

          {/* Past Events */}
          {myEvents.past.length > 0 && (
            <>
              <AppText variant="subtitle" color="muted" style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.sm }}>
                Past ({myEvents.past.length})
              </AppText>
              {myEvents.past.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => handleEventPress(event.id)}
                />
              ))}
            </>
          )}

          {/* Empty State */}
          {myEvents.upcoming.length === 0 && myEvents.past.length === 0 && (
            <View style={styles.emptyState}>
              <AppText color="muted" style={styles.emptyStateText}>
                You haven't joined any events yet.
              </AppText>
              <AppText color="muted" variant="caption" style={{ marginTop: theme.spacing.xs }}>
                Browse events to get started!
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <AppText>Theme: {theme.mode}</AppText>
          <View style={styles.row}>
            <Button label="Toggle theme" onPress={toggleTheme} style={{ flex: 1 }} />
            <Button
              label="Sign out"
              onPress={() => void signOut()}
              variant="danger"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </ScrollView>

    </Screen>
  );
};
