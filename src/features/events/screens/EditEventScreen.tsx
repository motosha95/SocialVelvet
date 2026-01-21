import React from 'react';
import { ScrollView, StyleSheet, TextInput, View, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../theme/useTheme';
import { eventsApi } from '../../../api/eventsApi';
import { uploadApi } from '../../../api/uploadApi';
import { useEventsStore } from '../../../store/events/eventsStore';
import type { EventsStackParamList, AppTabsParamList } from '../../../navigation/types';
import { Routes } from '../../../navigation/routes';

type Props = CompositeScreenProps<NativeStackScreenProps<EventsStackParamList, typeof Routes.Events.Edit>, BottomTabScreenProps<AppTabsParamList>>;

export const EditEventScreen = ({ route, navigation }: Props): React.JSX.Element => {
  const theme = useTheme();
  const { eventId } = route.params;
  const updateEvent = useEventsStore((s) => s.updateEvent);

  const [title, setTitle] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [location, setLocation] = React.useState<string>('');
  const [date, setDate] = React.useState<string>('');
  const [time, setTime] = React.useState<string>('');
  const [maxAttendees, setMaxAttendees] = React.useState<string>('');
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        paddingBottom: theme.spacing.xl,
      },
      header: {
        marginBottom: theme.spacing.md,
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
      },
      rowItem: {
        flex: 1,
      },
      cta: {
        marginTop: theme.spacing.md,
        opacity: isSubmitting ? 0.6 : 1,
      },
      error: {
        marginTop: theme.spacing.sm,
        color: theme.colors.danger,
      },
      hint: {
        marginTop: theme.spacing.xs / 2,
        fontSize: theme.typography.captionSize,
      },
      imageContainer: {
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
      },
      imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: theme.colors.border,
        marginTop: theme.spacing.xs,
      },
      imagePlaceholder: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.xs,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
      },
    });
  }, [isSubmitting, theme]);

  // Load event data
  React.useEffect(() => {
    const loadEvent = async (): Promise<void> => {
      try {
        const event = await eventsApi.getById(eventId);
        if (!event) {
          setError('Event not found');
          setIsLoading(false);
          return;
        }

        // Pre-populate form fields
        setTitle(event.title);
        setDescription(event.description);
        setLocation(event.location);
        
        const eventDate = new Date(event.date);
        setDate(eventDate.toISOString().split('T')[0]);
        setTime(`${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`);
        
        if (event.maxAttendees) {
          setMaxAttendees(event.maxAttendees.toString());
        }
        
        if (event.imageUrl) {
          setImageUri(event.imageUrl);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };

    void loadEvent();
  }, [eventId]);

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!location.trim()) {
      setError('Location is required');
      return false;
    }
    if (!date.trim()) {
      setError('Date is required');
      return false;
    }
    if (!time.trim()) {
      setError('Time is required');
      return false;
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      setError('Date must be in YYYY-MM-DD format');
      return false;
    }

    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(time.trim())) {
      setError('Time must be in HH:MM format (24-hour)');
      return false;
    }

    // Validate date is not in the past
    const eventDateTime = new Date(`${date}T${time}`);
    if (eventDateTime < new Date()) {
      setError('Event date and time must be in the future');
      return false;
    }

    // Validate max attendees if provided
    if (maxAttendees.trim()) {
      const max = parseInt(maxAttendees.trim(), 10);
      if (isNaN(max) || max < 1) {
        setError('Max attendees must be a positive number');
        return false;
      }
    }

    return true;
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        alert('Permission to access camera roll is required!');
        return;
      }

      alert('📸 Image Selection Instructions:\n\n1. Select an image from your gallery\n2. Adjust the crop area by dragging the corners\n3. To confirm: Look for the checkmark (✓) or "Done" button in the TOP-RIGHT corner of the screen\n4. If you don\'t see it, try tapping the top-right area - it may be partially hidden but still works');

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        alert('No image selected');
        return;
      }

      setIsUploadingImage(true);
      try {
        const uploadResult = await uploadApi.uploadImage(result.assets[0].uri);
        setImageUri(uploadResult.imageUrl);
      } catch (err) {
        console.error('Upload error:', err);
        alert('Failed to upload image. Please try again.');
      } finally {
        setIsUploadingImage(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      alert('Failed to open image picker. Please check app permissions.');
    }
  };

  const onSubmit = async (): Promise<void> => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const eventDateTime = new Date(`${date.trim()}T${time.trim()}`).toISOString();
      const updateRequest: {
        title?: string;
        description?: string;
        location?: string;
        date?: string;
        maxAttendees?: number;
        imageUrl?: string | null;
      } = {};

      // Only include fields that have changed or are being updated
      updateRequest.title = title.trim();
      updateRequest.description = description.trim();
      updateRequest.location = location.trim();
      updateRequest.date = eventDateTime;

      if (maxAttendees.trim()) {
        updateRequest.maxAttendees = parseInt(maxAttendees.trim(), 10);
      } else {
        updateRequest.maxAttendees = undefined;
      }

      if (imageUri) {
        updateRequest.imageUrl = imageUri;
      } else {
        updateRequest.imageUrl = null;
      }

      const result = await eventsApi.update(eventId, updateRequest);

      updateEvent(result.event);
      navigation.goBack();
    } catch (err) {
      let errorMessage = 'Failed to update event. Please try again.';
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.message.toLowerCase().includes('permission')) {
          errorMessage = 'You do not have permission to edit this event.';
        }
        if (err.message.toLowerCase().includes('token') || err.message.toLowerCase().includes('auth')) {
          errorMessage += ' Try logging out and logging back in.';
        }
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText color="muted" style={{ marginTop: theme.spacing.md }}>
            Loading event...
          </AppText>
        </View>
      </Screen>
    );
  }

  if (error && !title) {
    return (
      <Screen>
        <View style={styles.card}>
          <AppText color="muted">{error}</AppText>
          <Button label="Go back" onPress={() => navigation.goBack()} style={{ marginTop: theme.spacing.sm }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <AppText variant="title">Edit Event</AppText>
          <AppText color="muted">Update event details.</AppText>
        </View>

        <View style={styles.card}>
          <AppText style={styles.fieldLabel} color="muted">
            Title *
          </AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholder="Tech Meetup: React Native"
            placeholderTextColor={theme.colors.mutedText}
            editable={!isSubmitting}
            maxLength={100}
          />

          <AppText style={styles.fieldLabel} color="muted">
            Description *
          </AppText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.textArea]}
            placeholder="Describe your event..."
            placeholderTextColor={theme.colors.mutedText}
            multiline
            numberOfLines={4}
            editable={!isSubmitting}
            maxLength={1000}
          />

          <AppText style={styles.fieldLabel} color="muted">
            Location *
          </AppText>
          <TextInput
            value={location}
            onChangeText={setLocation}
            style={styles.input}
            placeholder="123 Main St, City"
            placeholderTextColor={theme.colors.mutedText}
            editable={!isSubmitting}
            maxLength={200}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <AppText style={styles.fieldLabel} color="muted">
                Date * (YYYY-MM-DD)
              </AppText>
              <TextInput
                value={date}
                onChangeText={setDate}
                style={styles.input}
                placeholder="2024-12-31"
                placeholderTextColor={theme.colors.mutedText}
                editable={!isSubmitting}
              />
            </View>
            <View style={styles.rowItem}>
              <AppText style={styles.fieldLabel} color="muted">
                Time * (HH:MM)
              </AppText>
              <TextInput
                value={time}
                onChangeText={setTime}
                style={styles.input}
                placeholder="18:00"
                placeholderTextColor={theme.colors.mutedText}
                editable={!isSubmitting}
              />
            </View>
          </View>

          <AppText style={styles.fieldLabel} color="muted">
            Event Image (optional)
          </AppText>
          <TouchableOpacity onPress={handlePickImage} disabled={isUploadingImage || isSubmitting}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <AppText color="muted">Tap to add image</AppText>
              </View>
            )}
          </TouchableOpacity>
          {isUploadingImage && (
            <AppText color="muted" style={styles.hint}>
              Uploading image...
            </AppText>
          )}

          <AppText style={styles.fieldLabel} color="muted">
            Max Attendees (optional)
          </AppText>
          <TextInput
            value={maxAttendees}
            onChangeText={setMaxAttendees}
            style={styles.input}
            placeholder="50"
            placeholderTextColor={theme.colors.mutedText}
            keyboardType="numeric"
            editable={!isSubmitting}
          />
          <AppText color="muted" style={styles.hint}>
            Leave empty for unlimited attendees
          </AppText>

          <Button 
            label={isSubmitting ? 'Saving...' : 'Save Changes'} 
            onPress={onSubmit} 
            style={styles.cta}
            disabled={isSubmitting || isUploadingImage}
          />

          {error ? <AppText style={styles.error}>{error}</AppText> : null}
        </View>
      </ScrollView>
    </Screen>
  );
};
