import React from 'react';
import { StyleSheet, View, Linking, Platform } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { AppText } from './AppText';
import { Button } from './Button';

interface LocationMapProps {
  location: string;
  height?: number;
}

/**
 * Simple geocoding - tries to extract coordinates from location string
 * or uses a default location if coordinates aren't found
 */
const parseLocation = (location: string): { latitude: number; longitude: number; hasCoordinates: boolean } => {
  // Try to parse coordinates from string like "40.7128, -74.0060" or "lat: 40.7128, lng: -74.0060"
  const coordMatch = location.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng, hasCoordinates: true };
    }
  }

  // Default to a generic location (center of map)
  // In production, you'd use a geocoding service like Google Geocoding API
  return { latitude: 0, longitude: 0, hasCoordinates: false };
};

export const LocationMap = ({ location, height = 200 }: LocationMapProps): React.JSX.Element => {
  const theme = useTheme();
  const { latitude, longitude, hasCoordinates } = parseLocation(location);

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
        height,
      },
      mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.border + '20',
        borderRadius: 8,
      },
      overlay: {
        padding: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      },
      locationText: {
        marginBottom: theme.spacing.xs,
      },
      noCoordinatesContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.md,
      },
    });
  }, [theme, height]);

  const handleOpenInMaps = (): void => {
    const url = Platform.select({
      ios: `maps://maps.apple.com/?q=${encodeURIComponent(location)}`,
      android: `geo:0,0?q=${encodeURIComponent(location)}`,
    });
    if (url) {
      Linking.openURL(url).catch((err) => {
        console.error('Failed to open maps:', err);
      });
    }
  };

  // For Expo Go compatibility, we'll use a static map image or simple display
  // In production with a custom build, you can use react-native-maps
  
  // Try to create a Google Maps static image URL if we have coordinates
  const staticMapUrl = hasCoordinates
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=400x200&markers=color:red%7C${latitude},${longitude}&key=`
    : null;

  return (
    <View style={styles.container}>
      {hasCoordinates && staticMapUrl ? (
        <>
          <View style={styles.mapPlaceholder}>
            <AppText color="muted" variant="caption" style={{ textAlign: 'center', marginBottom: theme.spacing.xs }}>
              📍 {location}
            </AppText>
            <AppText color="muted" variant="caption" style={{ textAlign: 'center', fontSize: 10 }}>
              Tap "Open in Maps" to view location
            </AppText>
          </View>
          <View style={styles.overlay}>
            <Button label="Open in Maps" onPress={handleOpenInMaps} variant="secondary" size="small" />
          </View>
        </>
      ) : (
        <View style={styles.noCoordinatesContainer}>
          <AppText color="muted" style={styles.locationText}>
            📍 {location}
          </AppText>
          <Button label="Open in Maps" onPress={handleOpenInMaps} variant="secondary" size="small" />
        </View>
      )}
    </View>
  );
};
