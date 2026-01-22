import React from 'react';
import { StyleSheet, View, TouchableOpacity, Linking, Platform, Alert, FlatList, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/useTheme';
import { AppText } from './AppText';
import { TextInput } from './TextInput';
import { Button } from './Button';

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
}

export const LocationPicker = ({ 
  value, 
  onChange, 
  label,
  placeholder = "123 Main St, City or custom location" 
}: LocationPickerProps): React.JSX.Element => {
  const theme = useTheme();
  const [isGettingLocation, setIsGettingLocation] = React.useState<boolean>(false);
  const [isSearching, setIsSearching] = React.useState<boolean>(false);
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [showResults, setShowResults] = React.useState<boolean>(false);

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
      buttonRow: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
      },
      locationButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        justifyContent: 'center',
        flex: 1,
      },
      searchButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        justifyContent: 'center',
        flex: 1,
      },
      hint: {
        marginTop: theme.spacing.xs / 2,
        fontSize: theme.typography.captionSize,
      },
      resultsContainer: {
        marginTop: theme.spacing.xs,
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 12,
        maxHeight: 200,
        overflow: 'hidden',
      },
      resultItem: {
        padding: theme.spacing.sm,
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
      customLocationHint: {
        marginTop: theme.spacing.xs,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
      },
    });
  }, [theme]);

  const handleGetCurrentLocation = async (): Promise<void> => {
    setIsGettingLocation(true);
    setShowResults(false);
    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to get your current location. You can still enter the location manually.'
        );
        setIsGettingLocation(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      
      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        // Format address
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
      } else {
        // Fallback to coordinates if geocoding fails
        onChange(`${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Failed to get your current location. Please enter the location manually.'
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSearchLocation = async (): Promise<void> => {
    if (!value.trim()) {
      Alert.alert('Search Required', 'Please enter a location to search for.');
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    try {
      // Forward geocode - search for addresses
      const results = await Location.geocodeAsync(value.trim());
      
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
            name: result.name || value.trim(),
            formattedAddress: addressParts.join(', ') || value.trim(),
            coordinates: result.latitude && result.longitude ? {
              latitude: result.latitude,
              longitude: result.longitude,
            } : undefined,
          };
        });
        
        setSearchResults(formattedResults);
      } else {
        setSearchResults([]);
        Alert.alert(
          'No Results',
          'No locations found. You can still use this as a custom location by typing it manually.'
        );
      }
    } catch (error) {
      console.error('Error searching location:', error);
      Alert.alert(
        'Search Error',
        'Failed to search for location. You can still enter it manually as a custom location.'
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult): void => {
    onChange(result.formattedAddress);
    setShowResults(false);
    setSearchResults([]);
  };

  const handleInputChange = (text: string): void => {
    onChange(text);
    // Hide search results when user starts typing again
    if (showResults) {
      setShowResults(false);
      setSearchResults([]);
    }
  };

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
      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          style={styles.input}
        />
      </View>
      
      <View style={styles.buttonRow}>
        <Button
          label={isGettingLocation ? "..." : "📍 Current"}
          onPress={handleGetCurrentLocation}
          variant="secondary"
          size="small"
          style={styles.locationButton}
          disabled={isGettingLocation}
        />
        <Button
          label={isSearching ? "..." : "🔍 Search"}
          onPress={handleSearchLocation}
          variant="secondary"
          size="small"
          style={styles.searchButton}
          disabled={isSearching || !value.trim()}
        />
      </View>

      {showResults && searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => `${item.formattedAddress}-${index}`}
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
            nestedScrollEnabled={true}
          />
        </View>
      )}

      {value && (
        <TouchableOpacity onPress={handleOpenMaps} style={{ marginTop: theme.spacing.xs }}>
          <AppText color="primary" variant="caption">
            📍 Open in Maps
          </AppText>
        </TouchableOpacity>
      )}
      
      <View style={styles.customLocationHint}>
        <AppText color="muted" variant="caption">
          💡 Tip: You can type any custom location (e.g., "Private venue", "John's house", "Secret location"). It doesn't need to be on maps.
        </AppText>
      </View>
    </View>
  );
};
