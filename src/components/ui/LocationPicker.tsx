import React from 'react';
import { StyleSheet, View, TouchableOpacity, Linking, Platform, Alert, FlatList, ActivityIndicator, Modal, ScrollView, Keyboard } from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/useTheme';
import { AppText } from './AppText';
import { TextInput } from './TextInput';
import { Button } from './Button';
import { MapPicker } from './MapPicker';
import { getPlacePredictions, getPlaceDetails, getNearbyPlaces, type PlacePrediction } from '../../services/placesApi';

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
  label?: string;
  placeholder?: string;
}

interface SearchResult {
  name: string;
  formattedAddress: string;
  coordinates?: { latitude: number; longitude: number };
  placeId?: string;
}

type LocationMode = 'search' | 'custom';

export const LocationPicker = ({ 
  value, 
  onChange, 
  label,
  placeholder = "123 Main St, City or custom location" 
}: LocationPickerProps): React.JSX.Element => {
  const theme = useTheme();
  const [isModalVisible, setIsModalVisible] = React.useState<boolean>(false);
  const [isGettingLocation, setIsGettingLocation] = React.useState<boolean>(false);
  const [isSearching, setIsSearching] = React.useState<boolean>(false);
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = React.useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [mode, setMode] = React.useState<LocationMode>('search');
  const [selectedPinLocation, setSelectedPinLocation] = React.useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [customDetails, setCustomDetails] = React.useState<string>('');
  const [currentLocation, setCurrentLocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        marginBottom: theme.spacing.sm,
      },
      label: {
        marginBottom: theme.spacing.xs,
      },
      inputContainer: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
        alignItems: 'flex-start',
      },
      input: {
        flex: 1,
      },
      openButton: {
        marginTop: theme.spacing.xs,
      },
      // Modal styles
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
      },
      modalContent: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        paddingBottom: theme.spacing.lg,
      },
      modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      modalTitle: {
        fontSize: theme.typography.titleSize,
        fontWeight: '600',
      },
      closeButton: {
        padding: theme.spacing.xs,
      },
      modalBody: {
        padding: theme.spacing.md,
      },
      modeTabs: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.md,
      },
      modeTab: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
      },
      modeTabActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      modeTabInactive: {
        backgroundColor: 'transparent',
        borderColor: theme.colors.border,
      },
      searchInputContainer: {
        marginBottom: theme.spacing.md,
      },
      nearbySection: {
        marginBottom: theme.spacing.md,
      },
      sectionTitle: {
        fontSize: theme.typography.subtitleSize,
        fontWeight: '600',
        marginBottom: theme.spacing.sm,
      },
      resultsContainer: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 12,
        maxHeight: 300,
        overflow: 'hidden',
      },
      resultItem: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      resultItemLast: {
        borderBottomWidth: 0,
      },
      resultName: {
        fontWeight: '600',
        marginBottom: theme.spacing.xs / 2,
      },
      resultAddress: {
        fontSize: theme.typography.captionSize,
        color: theme.colors.mutedText,
      },
      customForm: {
        gap: theme.spacing.md,
      },
      customField: {
        marginBottom: theme.spacing.sm,
      },
      customFieldLabel: {
        marginBottom: theme.spacing.xs,
      },
      customCoordsRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
      },
      customCoordInput: {
        flex: 1,
      },
      actionButton: {
        marginTop: theme.spacing.md,
      },
      emptyState: {
        padding: theme.spacing.lg,
        alignItems: 'center',
      },
      emptyStateText: {
        color: theme.colors.mutedText,
        textAlign: 'center',
      },
    });
  }, [theme]);

  // Load nearby places when modal opens
  const loadNearbyPlaces = React.useCallback(async (): Promise<void> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setNearbyPlaces([]);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });

      // Get current location address using reverse geocoding
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      let currentAddress = '';
      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        const addressParts = [
          address.streetNumber,
          address.street,
          address.city,
          address.region,
          address.postalCode,
        ].filter(Boolean);
        
        currentAddress = addressParts.join(', ') || 
          `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      } else {
        currentAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }

      // Add current location to nearby places
      const nearbyResults: SearchResult[] = [{
        name: '📍 Current Location',
        formattedAddress: currentAddress,
        coordinates: { latitude, longitude },
      }];

      // Try to get nearby places using Google Places API
      try {
        const googlePlaces = await getNearbyPlaces({ latitude, longitude });
        const formattedGooglePlaces: SearchResult[] = googlePlaces.map(place => ({
          name: place.mainText,
          formattedAddress: place.secondaryText || place.description,
          placeId: place.placeId,
        }));
        nearbyResults.push(...formattedGooglePlaces);
      } catch (err) {
        // If Google Places API fails, continue without it
        console.log('Google Places API not available, using basic location only');
      }

      setNearbyPlaces(nearbyResults);
    } catch (error) {
      console.error('Error loading nearby places:', error);
      setNearbyPlaces([]);
    }
  }, []);

  // Debounced search using Google Places Autocomplete
  const performSearch = React.useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Try Google Places API first (better results)
      const predictions = await getPlacePredictions(
        query.trim(),
        currentLocation || undefined,
        5000 // 5km radius
      );

      if (__DEV__) {
        console.log(`🔍 Google Places search for "${query.trim()}": ${predictions.length} results`);
      }

      if (predictions.length > 0) {
        const formattedResults: SearchResult[] = predictions.map((prediction) => ({
          name: prediction.mainText,
          formattedAddress: prediction.secondaryText || prediction.description,
          placeId: prediction.placeId,
        }));
        
        setSearchResults(formattedResults);
        setIsSearching(false);
        return;
      }

      if (__DEV__) {
        console.log('⚠️ No Google Places results, falling back to expo-location');
      }

      // Fallback to expo-location if Google Places API is not available
      try {
        const results = await Location.geocodeAsync(query.trim());
        
        if (results && results.length > 0) {
          const formattedResults: SearchResult[] = results.map((result) => {
            const addressParts = [
              result.streetNumber,
              result.street,
              result.city,
              result.region,
              result.postalCode,
              result.country,
            ].filter(Boolean);
            
            return {
              name: result.name || query.trim(),
              formattedAddress: addressParts.join(', ') || query.trim(),
              coordinates: result.latitude && result.longitude ? {
                latitude: result.latitude,
                longitude: result.longitude,
              } : undefined,
            };
          });
          
          setSearchResults(formattedResults);
        } else {
          setSearchResults([]);
        }
      } catch (locationError) {
        console.error('Error with expo-location fallback:', locationError);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [currentLocation]);

  const handleSearchQueryChange = (text: string): void => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(text);
    }, 300);
  };

  const handleGetCurrentLocation = async (): Promise<void> => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to get your current location.'
        );
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        const addressParts = [
          address.streetNumber,
          address.street,
          address.city,
          address.region,
          address.postalCode,
        ].filter(Boolean);
        
        const formattedAddress = addressParts.join(', ') || 
          `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
        
        onChange(formattedAddress);
        setIsModalVisible(false);
      } else {
        onChange(`${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`);
        setIsModalVisible(false);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Failed to get your current location.'
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSelectResult = async (result: SearchResult): Promise<void> => {
    // If we have a placeId, get full details for better address
    if (result.placeId) {
      try {
        const details = await getPlaceDetails(result.placeId);
        if (details) {
          onChange(details.formattedAddress || result.formattedAddress);
          setIsModalVisible(false);
          setSearchQuery('');
          setSearchResults([]);
          return;
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
        // Fall through to use the prediction address
      }
    }
    
    // Use the prediction address or fallback
    onChange(result.formattedAddress);
    setIsModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleOpenModal = (): void => {
    setIsModalVisible(true);
    setSearchQuery('');
    setSearchResults([]);
    loadNearbyPlaces();
  };

  const handleCloseModal = (): void => {
    setIsModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    setMode('search');
    setSelectedPinLocation(null);
    setCustomDetails('');
    Keyboard.dismiss();
  };

  const handleMapLocationSelect = (location: { latitude: number; longitude: number; address?: string }): void => {
    setSelectedPinLocation(location);
  };

  const handleSaveCustomLocation = (): void => {
    if (mode === 'custom') {
      if (selectedPinLocation) {
        const locationText = customDetails.trim() 
          ? `${customDetails.trim()} (${selectedPinLocation.latitude.toFixed(6)}, ${selectedPinLocation.longitude.toFixed(6)})`
          : selectedPinLocation.address || `${selectedPinLocation.latitude.toFixed(6)}, ${selectedPinLocation.longitude.toFixed(6)}`;
        
        onChange(locationText);
        setIsModalVisible(false);
      } else if (customDetails.trim()) {
        onChange(customDetails.trim());
        setIsModalVisible(false);
      } else {
        Alert.alert('Required', 'Please select a location on the map or enter location details.');
      }
    }
  };

  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenMaps = (): void => {
    const url = Platform.select({
      ios: `maps://maps.apple.com/?q=${encodeURIComponent(value || placeholder)}`,
      android: `geo:0,0?q=${encodeURIComponent(value || placeholder)}`,
    });
    if (url) {
      Linking.openURL(url).catch((err) => {
        console.error('Failed to open maps:', err);
      });
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <AppText style={styles.label} color="muted">
          {label}
        </AppText>
      )}
      <TouchableOpacity onPress={handleOpenModal}>
        <TextInput
          value={value}
          placeholder={placeholder}
          style={styles.input}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>
      
      <Button
        label="📍 Choose Location"
        onPress={handleOpenModal}
        variant="secondary"
        size="small"
        style={styles.openButton}
      />

      {value && (
        <TouchableOpacity onPress={handleOpenMaps} style={{ marginTop: theme.spacing.xs }}>
          <AppText color="primary" variant="caption">
            📍 Open in Maps
          </AppText>
        </TouchableOpacity>
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Choose Location</AppText>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <AppText style={{ fontSize: 24 }}>✕</AppText>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Mode Tabs */}
              <View style={styles.modeTabs}>
                <TouchableOpacity
                  style={[styles.modeTab, mode === 'search' ? styles.modeTabActive : styles.modeTabInactive]}
                  onPress={() => setMode('search')}
                >
                  <AppText style={{ color: mode === 'search' ? '#fff' : theme.colors.text }}>
                    🔍 Search
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeTab, mode === 'custom' ? styles.modeTabActive : styles.modeTabInactive]}
                  onPress={() => setMode('custom')}
                >
                  <AppText style={{ color: mode === 'custom' ? '#fff' : theme.colors.text }}>
                    📍 Custom Pin
                  </AppText>
                </TouchableOpacity>
              </View>

              {mode === 'search' ? (
                <>
                  {/* Search Input */}
                  <View style={styles.searchInputContainer}>
                    <TextInput
                      value={searchQuery}
                      onChangeText={handleSearchQueryChange}
                      placeholder="Search for a location..."
                      autoFocus={true}
                    />
                  </View>

                  {/* Current Location Button */}
                  <Button
                    label={isGettingLocation ? "Getting location..." : "📍 Use Current Location"}
                    onPress={handleGetCurrentLocation}
                    variant="secondary"
                    size="small"
                    disabled={isGettingLocation}
                    style={{ marginBottom: theme.spacing.md }}
                  />

                  {/* Nearby Places Section */}
                  {!searchQuery.trim() && nearbyPlaces.length > 0 && (
                    <View style={styles.nearbySection}>
                      <AppText style={styles.sectionTitle}>📍 Nearby Places</AppText>
                      <View style={styles.resultsContainer}>
                        <FlatList
                          data={nearbyPlaces}
                          keyExtractor={(item, index) => `nearby-${index}`}
                          renderItem={({ item, index }) => (
                            <TouchableOpacity
                              style={[
                                styles.resultItem,
                                index === nearbyPlaces.length - 1 && styles.resultItemLast,
                              ]}
                              onPress={() => handleSelectResult(item)}
                            >
                              <AppText style={styles.resultName}>{item.name}</AppText>
                              <AppText style={styles.resultAddress}>{item.formattedAddress}</AppText>
                            </TouchableOpacity>
                          )}
                          scrollEnabled={false}
                        />
                      </View>
                    </View>
                  )}

                  {/* Search Results */}
                  {searchQuery.trim() && (
                    <View style={styles.nearbySection}>
                      <AppText style={styles.sectionTitle}>
                        {isSearching ? 'Searching...' : 'Search Results'}
                      </AppText>
                      {isSearching ? (
                        <View style={styles.emptyState}>
                          <ActivityIndicator size="small" color={theme.colors.primary} />
                        </View>
                      ) : searchResults.length > 0 ? (
                        <View style={styles.resultsContainer}>
                          <FlatList
                            data={searchResults}
                            keyExtractor={(item, index) => `search-${index}`}
                            renderItem={({ item, index }) => (
                              <TouchableOpacity
                                style={[
                                  styles.resultItem,
                                  index === searchResults.length - 1 && styles.resultItemLast,
                                ]}
                                onPress={() => handleSelectResult(item)}
                              >
                                <AppText style={styles.resultName}>{item.name}</AppText>
                                <AppText style={styles.resultAddress}>{item.formattedAddress}</AppText>
                              </TouchableOpacity>
                            )}
                            scrollEnabled={false}
                          />
                        </View>
                      ) : (
                        <View style={styles.emptyState}>
                          <AppText style={styles.emptyStateText}>
                            No results found. Try a different search or use custom location.
                          </AppText>
                        </View>
                      )}
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.customForm}>
                  <AppText style={styles.sectionTitle}>📍 Custom Location</AppText>
                  <AppText color="muted" variant="caption" style={{ marginBottom: theme.spacing.md }}>
                    Tap on the map to place a pin, or drag the pin to adjust the location
                  </AppText>

                  {/* Map Picker */}
                  <View style={{ marginBottom: theme.spacing.md }}>
                    <MapPicker
                      initialLocation={currentLocation || undefined}
                      onLocationSelect={handleMapLocationSelect}
                      onError={(error) => {
                        console.error('Map error:', error);
                        Alert.alert('Map Error', error);
                      }}
                    />
                  </View>

                  {/* Selected Location Info */}
                  {selectedPinLocation && (
                    <View style={[styles.customField, { 
                      backgroundColor: theme.colors.surface, 
                      padding: theme.spacing.sm, 
                      borderRadius: 8,
                      marginBottom: theme.spacing.md 
                    }]}>
                      <AppText style={{ fontWeight: '600', marginBottom: theme.spacing.xs }}>
                        Selected Location:
                      </AppText>
                      {selectedPinLocation.address && (
                        <AppText color="muted" style={{ marginBottom: theme.spacing.xs / 2 }}>
                          {selectedPinLocation.address}
                        </AppText>
                      )}
                      <AppText color="muted" variant="caption">
                        {selectedPinLocation.latitude.toFixed(6)}, {selectedPinLocation.longitude.toFixed(6)}
                      </AppText>
                    </View>
                  )}

                  {/* Custom Details Input */}
                  <View style={styles.customField}>
                    <AppText style={styles.customFieldLabel} color="muted">
                      Location Name/Details (optional)
                    </AppText>
                    <TextInput
                      value={customDetails}
                      onChangeText={setCustomDetails}
                      placeholder="e.g., Private venue, John's house, Secret location"
                    />
                    <AppText color="muted" variant="caption" style={{ marginTop: theme.spacing.xs / 2 }}>
                      Add a custom name if this location isn't on maps
                    </AppText>
                  </View>

                  <Button
                    label={selectedPinLocation ? "Save Location" : "Select Location on Map"}
                    onPress={handleSaveCustomLocation}
                    style={styles.actionButton}
                    disabled={!selectedPinLocation && !customDetails.trim()}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
