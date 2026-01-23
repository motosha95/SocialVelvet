import React from 'react';
import { StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/useTheme';
import { AppText } from './AppText';

interface MapPickerProps {
  initialLocation?: { latitude: number; longitude: number };
  onLocationSelect: (location: { latitude: number; longitude: number; address?: string }) => void;
  onError?: (error: string) => void;
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

export const MapPicker = ({ 
  initialLocation, 
  onLocationSelect,
  onError 
}: MapPickerProps): React.JSX.Element => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [currentLocation, setCurrentLocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const webViewRef = React.useRef<WebView>(null);

  // Get current location on mount
  React.useEffect(() => {
    const getCurrentLocation = async (): Promise<void> => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(coords);
        }
      } catch (error) {
        console.error('Error getting current location:', error);
      }
    };

    getCurrentLocation();
  }, []);

  // HTML content for the map
  const mapHTML = React.useMemo(() => {
    const center = initialLocation || currentLocation || { latitude: 0, longitude: 0 };
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body, html {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #map {
      width: 100%;
      height: 100%;
    }
    .pin {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      width: 40px;
      height: 40px;
      z-index: 1000;
      pointer-events: none;
    }
    .pin svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="pin">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#E63946"/>
    </svg>
  </div>
  <script>
    let map;
    let marker;
    let geocoder;
    
    function initMap() {
      const center = { lat: ${center.latitude}, lng: ${center.longitude} };
      
      map = new google.maps.Map(document.getElementById('map'), {
        center: center,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
        }
      });
      
      geocoder = new google.maps.Geocoder();
      
      // Add marker at center
      marker = new google.maps.Marker({
        position: center,
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP
      });
      
      // Handle map click
      map.addListener('click', (e) => {
        const location = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        };
        marker.setPosition(location);
        geocodeLocation(location);
      });
      
      // Handle marker drag
      marker.addListener('dragend', (e) => {
        const location = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        };
        geocodeLocation(location);
      });
      
      // Handle map center change (when user pans)
      let centerChangeTimeout;
      map.addListener('center_changed', () => {
        clearTimeout(centerChangeTimeout);
        centerChangeTimeout = setTimeout(() => {
          const mapCenter = map.getCenter();
          if (mapCenter) {
            const location = {
              lat: mapCenter.lat(),
              lng: mapCenter.lng()
            };
            marker.setPosition(location);
            geocodeLocation(location);
          }
        }, 300);
      });
      
      // Initial geocode
      geocodeLocation(center);
    }
    
    function geocodeLocation(location) {
      geocoder.geocode({ location: location }, (results, status) => {
        if (status === 'OK' && results[0]) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'location',
            latitude: location.lat,
            longitude: location.lng,
            address: results[0].formatted_address
          }));
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'location',
            latitude: location.lat,
            longitude: location.lng,
            address: null
          }));
        }
      });
    }
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&libraries=places" async defer></script>
</body>
</html>
    `;
  }, [initialLocation, currentLocation]);

  const handleMessage = (event: any): void => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'location') {
        setIsLoading(false);
        onLocationSelect({
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address || undefined,
        });
      } else if (data.type === 'error') {
        setIsLoading(false);
        const errorMsg = data.message || 'Failed to load map';
        onError?.(errorMsg);
        Alert.alert('Map Error', errorMsg);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handleLoadEnd = (): void => {
    setIsLoading(false);
  };

  const handleError = (syntheticEvent: any): void => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setIsLoading(false);
    const errorMsg = nativeEvent.description || 'Failed to load map';
    onError?.(errorMsg);
    
    if (!GOOGLE_MAPS_API_KEY) {
      Alert.alert(
        'Map Unavailable',
        'Google Maps API key is not configured. Please add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to your .env file.'
      );
    } else {
      Alert.alert('Map Error', errorMsg);
    }
  };

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        width: '100%',
        height: 400,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      webView: {
        flex: 1,
      },
      loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
      },
      loadingText: {
        marginTop: theme.spacing.sm,
        color: theme.colors.mutedText,
      },
    });
  }, [theme]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <AppText color="muted" style={{ textAlign: 'center', padding: theme.spacing.md }}>
            Map unavailable. Please configure Google Maps API key in .env file.
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.webView}
        onMessage={handleMessage}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <AppText style={styles.loadingText}>Loading map...</AppText>
          </View>
        )}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText style={styles.loadingText}>Loading map...</AppText>
        </View>
      )}
    </View>
  );
};
