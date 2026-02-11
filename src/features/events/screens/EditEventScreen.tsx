import React from 'react';
import { ScrollView, StyleSheet, TextInput, View, Image, TouchableOpacity, ActivityIndicator, Modal, FlatList, Pressable, Switch } from 'react-native';
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
import type { Event, PricingTier } from '../types';
import { EVENT_TOPICS, MAX_EVENT_TOPICS } from '../constants/topics';

type Props = CompositeScreenProps<NativeStackScreenProps<EventsStackParamList, typeof Routes.Events.Edit>, BottomTabScreenProps<AppTabsParamList>>;

export const EditEventScreen = ({ route, navigation }: Props): React.JSX.Element => {
  const theme = useTheme();
  const { eventId } = route.params;
  const updateEvent = useEventsStore((s) => s.updateEvent);
  const refreshEvents = useEventsStore((s) => s.refreshEvents);

  const [title, setTitle] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [location, setLocation] = React.useState<string>('');
  const [dateTime, setDateTime] = React.useState<Date>(new Date());
  const [maxAttendees, setMaxAttendees] = React.useState<string>('');
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [topics, setTopics] = React.useState<string[]>([]);
  const [topicsModalVisible, setTopicsModalVisible] = React.useState<boolean>(false);
  const [isPaid, setIsPaid] = React.useState<boolean>(false);
  const [usePricingTiers, setUsePricingTiers] = React.useState<boolean>(false);
  const [price, setPrice] = React.useState<string>('');
  const [pricingTiers, setPricingTiers] = React.useState<Array<{ name: string; price: string }>>([{ name: '', price: '' }]);
  const MAX_TIERS = 4;
  const CURRENCY = 'AED';
  const [originalEvent, setOriginalEvent] = React.useState<Event | null>(null);
  const [showSeriesUpdateModal, setShowSeriesUpdateModal] = React.useState<boolean>(false);
  const [pendingUpdateRequest, setPendingUpdateRequest] = React.useState<{
    title?: string;
    description?: string;
    location?: string;
    date?: string;
    maxAttendees?: number;
    imageUrl?: string | null;
    isPaid?: boolean;
    price?: number | null;
    pricingTiers?: PricingTier[] | null;
    currency?: string;
    topics?: string[];
  } | null>(null);

  const toggleTopic = (topic: string): void => {
    setTopics((prev) => {
      if (prev.includes(topic)) return prev.filter((t) => t !== topic);
      if (prev.length >= MAX_EVENT_TOPICS) return prev;
      return [...prev, topic];
    });
  };

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
        minHeight: 150,
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
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      modalContent: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: theme.spacing.lg,
        width: '90%',
        maxWidth: 400,
      },
      modalTitle: {
        fontSize: theme.typography.titleSize,
        fontWeight: '600',
        marginBottom: theme.spacing.sm,
      },
      modalMessage: {
        marginBottom: theme.spacing.lg,
        color: theme.colors.text,
      },
      modalButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
      },
      topicsTrigger: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        minHeight: 44,
        justifyContent: 'center',
      },
      topicsChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
      },
      topicChip: {
        backgroundColor: theme.colors.primary + '30',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs / 2,
        borderRadius: 12,
      },
      topicChipText: {
        color: theme.colors.primary,
        fontSize: theme.typography.captionSize,
        fontWeight: '600',
      },
      topicsModalContent: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        maxHeight: 400,
        width: '90%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      topicsModalTitle: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      topicsModalItem: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      topicsModalItemSelected: {
        backgroundColor: theme.colors.primary + '20',
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

        // Store original event for series check
        setOriginalEvent(event);

        // Pre-populate form fields
        setTitle(event.title);
        setDescription(event.description);
        setLocation(event.location);
        
        const eventDate = new Date(event.date);
        setDateTime(eventDate);
        
        if (event.maxAttendees) {
          setMaxAttendees(event.maxAttendees.toString());
        }
        
        if (event.imageUrl) {
          setImageUri(event.imageUrl);
        }

        setIsPaid(event.isPaid ?? false);
        setPrice(event.price != null ? event.price.toString() : '');
        setUsePricingTiers(!!(event.pricingTiers && event.pricingTiers.length > 0));
        setPricingTiers(
          event.pricingTiers && event.pricingTiers.length > 0
            ? event.pricingTiers.map((t) => ({ name: t.name, price: t.price.toString() }))
            : [{ name: '', price: '' }]
        );
        setTopics(event.topics ?? []);
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

    if (isPaid) {
      if (usePricingTiers) {
        const validTiers = pricingTiers.filter((t) => t.name.trim() && parseFloat(t.price.trim()) > 0);
        if (validTiers.length === 0) {
          setError('Add at least one pricing tier with a name and valid price');
          return false;
        }
      } else {
        const priceNum = parseFloat(price.trim());
        if (!price.trim() || isNaN(priceNum) || priceNum <= 0) {
          setError('Please enter a valid price for the paid event');
          return false;
        }
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

  const prepareUpdateRequest = () => {
    const updateRequest: {
      title?: string;
      description?: string;
      location?: string;
      date?: string;
      maxAttendees?: number;
      imageUrl?: string | null;
      isPaid?: boolean;
      price?: number | null;
      pricingTiers?: PricingTier[] | null;
      currency?: string;
      topics?: string[];
    } = {};

    // Only include fields that have changed or are being updated
    updateRequest.title = title.trim();
    updateRequest.description = description.trim();
    updateRequest.location = location.trim();
    updateRequest.date = dateTime.toISOString();

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

    updateRequest.isPaid = isPaid;
    if (isPaid) {
      updateRequest.currency = CURRENCY;
      if (usePricingTiers) {
        updateRequest.pricingTiers = pricingTiers
          .filter((t) => t.name.trim() && parseFloat(t.price.trim()) > 0)
          .map((t) => ({ name: t.name.trim(), price: parseFloat(t.price.trim()) }));
        updateRequest.price = null;
      } else {
        updateRequest.price = price.trim() ? parseFloat(price.trim()) : null;
        updateRequest.pricingTiers = null;
      }
    } else {
      updateRequest.price = null;
      updateRequest.pricingTiers = null;
    }
    updateRequest.topics = topics.length > 0 ? topics : [];

    return updateRequest;
  };

  const performUpdate = async (updateAllFutureEvents: boolean): Promise<void> => {
    if (!pendingUpdateRequest) return;

    setIsSubmitting(true);
    setShowSeriesUpdateModal(false);

    try {
      const updateRequest = {
        ...pendingUpdateRequest,
        updateAllFutureEvents,
      };

      const result = await eventsApi.update(eventId, updateRequest);

      updateEvent(result.event);
      
      // If updating all future events, refresh the events list to get all updated events
      if (updateAllFutureEvents) {
        await refreshEvents();
      }
      
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
      setPendingUpdateRequest(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (): Promise<void> => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    const updateRequest = prepareUpdateRequest();

    // Check if event is part of a series and has future events
    if (originalEvent?.seriesId && originalEvent?.seriesIndex !== undefined) {
      // Show modal to ask if user wants to update all future events
      setPendingUpdateRequest(updateRequest);
      setShowSeriesUpdateModal(true);
      return;
    }

    // Not a series event, proceed with normal update
    setIsSubmitting(true);

    try {
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
            numberOfLines={6}
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
            Topics (optional, up to {MAX_EVENT_TOPICS})
          </AppText>
          <TouchableOpacity
            style={styles.topicsTrigger}
            onPress={() => setTopicsModalVisible(true)}
            disabled={isSubmitting}
          >
            <AppText color="muted">
              {topics.length === 0
                ? 'Tap to select topics...'
                : `${topics.length} topic${topics.length === 1 ? '' : 's'} selected`}
            </AppText>
            {topics.length > 0 && (
              <View style={styles.topicsChips}>
                {topics.map((t) => (
                  <View key={t} style={styles.topicChip}>
                    <AppText style={styles.topicChipText}>{t}</AppText>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>

          <Modal
            visible={topicsModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setTopicsModalVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setTopicsModalVisible(false)}>
              <Pressable style={styles.topicsModalContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.topicsModalTitle}>
                  <AppText variant="title">Select topics (max {MAX_EVENT_TOPICS})</AppText>
                </View>
                <FlatList
                  data={[...EVENT_TOPICS]}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => {
                    const selected = topics.includes(item);
                    const disabled = !selected && topics.length >= MAX_EVENT_TOPICS;
                    return (
                      <TouchableOpacity
                        style={[styles.topicsModalItem, selected && styles.topicsModalItemSelected]}
                        onPress={() => !disabled && toggleTopic(item)}
                        disabled={disabled}
                      >
                        <AppText>{item}{selected ? ' ✓' : ''}</AppText>
                      </TouchableOpacity>
                    );
                  }}
                />
                <View style={{ padding: theme.spacing.md }}>
                  <Button label="Done" onPress={() => setTopicsModalVisible(false)} />
                </View>
              </Pressable>
            </Pressable>
          </Modal>

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

          <View style={[styles.row, { marginTop: theme.spacing.md, alignItems: 'center', justifyContent: 'space-between' }]}>
            <View style={{ flex: 1 }}>
              <AppText style={styles.fieldLabel} color="muted">
                Paid Event
              </AppText>
              <AppText color="muted" style={styles.hint}>
                {isPaid ? 'This event requires payment to attend' : 'Free event - no payment required'}
              </AppText>
            </View>
            <Switch
              value={isPaid}
              onValueChange={setIsPaid}
              disabled={isSubmitting}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.mode === 'dark' ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          {isPaid && (
            <>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: !usePricingTiers ? theme.colors.primary : theme.colors.background,
                  }}
                  onPress={() => setUsePricingTiers(false)}
                  disabled={isSubmitting}
                >
                  <AppText style={{ color: !usePricingTiers ? (theme.mode === 'dark' ? '#0B0F14' : '#FFFFFF') : theme.colors.text, fontWeight: '600' }}>Single price</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: usePricingTiers ? theme.colors.primary : theme.colors.background,
                  }}
                  onPress={() => setUsePricingTiers(true)}
                  disabled={isSubmitting}
                >
                  <AppText style={{ color: usePricingTiers ? (theme.mode === 'dark' ? '#0B0F14' : '#FFFFFF') : theme.colors.text, fontWeight: '600' }}>Pricing tiers (up to {MAX_TIERS})</AppText>
                </TouchableOpacity>
              </View>
              {!usePricingTiers ? (
                <>
                  <AppText style={styles.fieldLabel} color="muted">
                    Price ({CURRENCY}) *
                  </AppText>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="decimal-pad"
                    editable={!isSubmitting}
                  />
                </>
              ) : (
                <>
                  <AppText style={styles.fieldLabel} color="muted">
                    Tier name & price ({CURRENCY}) *
                  </AppText>
                  {pricingTiers.map((tier, index) => (
                    <View key={index} style={[styles.row, { marginBottom: theme.spacing.xs, alignItems: 'center', gap: theme.spacing.xs }]}>
                      <TextInput
                        value={tier.name}
                        onChangeText={(text) =>
                          setPricingTiers((prev) => {
                            const next = [...prev];
                            next[index] = { ...next[index], name: text };
                            return next;
                          })
                        }
                        style={[styles.input, { flex: 1 }]}
                        placeholder="e.g. Guys, Girls, VIP"
                        placeholderTextColor={theme.colors.mutedText}
                        editable={!isSubmitting}
                        maxLength={50}
                      />
                      <TextInput
                        value={tier.price}
                        onChangeText={(text) =>
                          setPricingTiers((prev) => {
                            const next = [...prev];
                            next[index] = { ...next[index], price: text };
                            return next;
                          })
                        }
                        style={[styles.input, { width: 80 }]}
                        placeholder="0"
                        placeholderTextColor={theme.colors.mutedText}
                        keyboardType="decimal-pad"
                        editable={!isSubmitting}
                      />
                      <TouchableOpacity
                        onPress={() => setPricingTiers((prev) => prev.filter((_, i) => i !== index))}
                        disabled={isSubmitting || pricingTiers.length <= 1}
                        style={{ padding: theme.spacing.xs }}
                      >
                        <AppText style={{ color: theme.colors.danger, fontSize: 18 }}>×</AppText>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {pricingTiers.length < MAX_TIERS && (
                    <TouchableOpacity
                      onPress={() => setPricingTiers((prev) => [...prev, { name: '', price: '' }])}
                      disabled={isSubmitting}
                      style={{ marginTop: theme.spacing.xs }}
                    >
                      <AppText style={{ color: theme.colors.primary, fontWeight: '600' }}>+ Add tier</AppText>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </>
          )}

          <Button 
            label={isSubmitting ? 'Saving...' : 'Save Changes'} 
            onPress={onSubmit} 
            style={styles.cta}
            disabled={isSubmitting || isUploadingImage}
          />

          {error ? <AppText style={styles.error}>{error}</AppText> : null}
        </View>
      </ScrollView>

      <Modal
        visible={showSeriesUpdateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSeriesUpdateModal(false);
          setPendingUpdateRequest(null);
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowSeriesUpdateModal(false);
            setPendingUpdateRequest(null);
          }}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <View style={styles.modalContent}>
              <AppText style={styles.modalTitle}>
                Update Series Event
              </AppText>
              <AppText style={styles.modalMessage} color="muted">
                This event is part of a series. Would you like to apply these changes to all future events in the series, or just this one?
              </AppText>
              <View style={styles.modalButtons}>
                <Button
                  label="Just This Event"
                  onPress={() => performUpdate(false)}
                  variant="secondary"
                  size="small"
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                />
                <Button
                  label="All Future Events"
                  onPress={() => performUpdate(true)}
                  size="small"
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
};
