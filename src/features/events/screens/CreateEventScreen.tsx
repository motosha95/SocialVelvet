import React from 'react';
import { ScrollView, StyleSheet, TextInput, View, Image, TouchableOpacity, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { DatePicker } from '../../../components/ui/DatePicker';
import { LocationPicker } from '../../../components/ui/LocationPicker';
import { useTheme } from '../../../theme/useTheme';
import { eventsApi } from '../../../api/eventsApi';
import { uploadApi } from '../../../api/uploadApi';
import { useEventsStore } from '../../../store/events/eventsStore';
import type { EventsStackParamList, AppTabsParamList } from '../../../navigation/types';
import { Routes } from '../../../navigation/routes';

type Props = CompositeScreenProps<NativeStackScreenProps<EventsStackParamList, typeof Routes.Events.Create>, BottomTabScreenProps<AppTabsParamList>>;

export const CreateEventScreen = ({ navigation }: Props): React.JSX.Element => {
  const theme = useTheme();
  const addEvent = useEventsStore((s) => s.addEvent);

  const [title, setTitle] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [location, setLocation] = React.useState<string>('');
  const [dateTime, setDateTime] = React.useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    return tomorrow;
  });
  const [maxAttendees, setMaxAttendees] = React.useState<string>('');
  const [imageUri, setImageUri] = React.useState<string | null>(null);
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
    });
  }, [isSubmitting, theme.colors.background, theme.colors.border, theme.colors.danger, theme.colors.surface, theme.colors.text, theme.spacing.md, theme.spacing.sm, theme.spacing.xl, theme.spacing.xs, theme.typography.captionSize]);

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

    // Validate date is not in the past
    if (dateTime < new Date()) {
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
        aspect: [16, 9], // 16:9 aspect ratio for event images
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
      const createRequest: { 
        title: string; 
        description: string; 
        location: string; 
        date: string; 
        maxAttendees?: number;
        imageUrl?: string;
      } = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        date: dateTime.toISOString(),
      };

      if (maxAttendees.trim()) {
        createRequest.maxAttendees = parseInt(maxAttendees.trim(), 10);
      }

      if (imageUri) {
        createRequest.imageUrl = imageUri;
      }

      const result = await eventsApi.create(createRequest);

      addEvent(result.event);
      navigation.goBack();
    } catch (err) {
      let errorMessage = 'Failed to create event. Please try again.';
      if (err instanceof Error) {
        errorMessage = err.message;
        // If it's an auth error, suggest logging out and back in
        if (err.message.toLowerCase().includes('token') || err.message.toLowerCase().includes('auth')) {
          errorMessage += ' Try logging out and logging back in.';
        }
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <AppText variant="title">Create Event</AppText>
          <AppText color="muted">Share an event with the community.</AppText>
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

          <LocationPicker
            value={location}
            onChange={setLocation}
            label="Location *"
            placeholder="123 Main St, City"
          />

          <DatePicker
            value={dateTime}
            onChange={setDateTime}
            mode="datetime"
            minimumDate={new Date()}
            label="Date & Time *"
          />

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
            label={isSubmitting ? 'Creating...' : 'Create Event'} 
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

