/**
 * Google Places Autocomplete API Service
 * 
 * To use this service, you need a Google Cloud API key with Places API enabled.
 * 
 * Setup:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a project or select existing one
 * 3. Enable "Places API" (not Places SDK)
 * 4. Create an API key
 * 5. Add it to your .env or app.json as GOOGLE_PLACES_API_KEY
 * 
 * Free tier: $200 credit/month (usually covers ~40,000 requests)
 */

// Load environment variable - Expo automatically loads .env files
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

// Debug: Log if API key is configured (only in development)
if (__DEV__) {
  if (GOOGLE_PLACES_API_KEY) {
    console.log('✅ Google Places API key loaded');
  } else {
    console.warn('⚠️ Google Places API key not found. Make sure .env file exists with EXPO_PUBLIC_GOOGLE_PLACES_API_KEY');
  }
}

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  name: string;
  coordinates?: { latitude: number; longitude: number };
  addressComponents?: {
    streetNumber?: string;
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * Get autocomplete predictions for a search query
 */
export const getPlacePredictions = async (
  query: string,
  location?: { latitude: number; longitude: number },
  radius?: number
): Promise<PlacePrediction[]> => {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured. Please set EXPO_PUBLIC_GOOGLE_PLACES_API_KEY');
    return [];
  }

  if (!query.trim()) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      input: query.trim(),
      key: GOOGLE_PLACES_API_KEY,
      types: 'establishment|geocode', // Include both places and addresses
    });

    // Add location bias if available (prioritizes results near user)
    if (location) {
      params.append('location', `${location.latitude},${location.longitude}`);
      if (radius) {
        params.append('radius', radius.toString());
      } else {
        params.append('radius', '5000'); // Default 5km radius
      }
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      return (data.predictions || []).map((prediction: any) => ({
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting?.main_text || prediction.description,
        secondaryText: prediction.structured_formatting?.secondary_text || '',
        types: prediction.types || [],
      }));
    }

    if (data.status === 'REQUEST_DENIED') {
      console.error('Google Places API request denied. Check your API key and billing.');
      return [];
    }

    return [];
  } catch (error) {
    console.error('Error fetching place predictions:', error);
    return [];
  }
};

/**
 * Get detailed place information by place ID
 */
export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured');
    return null;
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_PLACES_API_KEY,
      fields: 'formatted_address,name,geometry,address_components',
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      const result = data.result;
      const geometry = result.geometry;
      const addressComponents = result.address_components || [];

      // Parse address components
      const getComponent = (type: string) => {
        const component = addressComponents.find((comp: any) => comp.types.includes(type));
        return component?.long_name || '';
      };

      return {
        placeId: result.place_id,
        formattedAddress: result.formatted_address || '',
        name: result.name || '',
        coordinates: geometry?.location
          ? {
              latitude: geometry.location.lat,
              longitude: geometry.location.lng,
            }
          : undefined,
        addressComponents: {
          streetNumber: getComponent('street_number'),
          street: getComponent('route'),
          city: getComponent('locality') || getComponent('administrative_area_level_2'),
          region: getComponent('administrative_area_level_1'),
          postalCode: getComponent('postal_code'),
          country: getComponent('country'),
        },
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
};

/**
 * Get nearby places based on current location
 */
export const getNearbyPlaces = async (
  location: { latitude: number; longitude: number },
  types: string[] = ['restaurant', 'cafe', 'park', 'store', 'gas_station']
): Promise<PlacePrediction[]> => {
  if (!GOOGLE_PLACES_API_KEY) {
    return [];
  }

  try {
    // Use text search for nearby places
    const results: PlacePrediction[] = [];

    for (const type of types.slice(0, 5)) {
      try {
        const params = new URLSearchParams({
          query: type,
          location: `${location.latitude},${location.longitude}`,
          radius: '2000', // 2km radius
          key: GOOGLE_PLACES_API_KEY,
        });

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const place = data.results[0];
            results.push({
              placeId: place.place_id,
              description: place.formatted_address || place.name,
              mainText: place.name,
              secondaryText: place.formatted_address || '',
              types: place.types || [],
            });
          }
        }
      } catch (err) {
        // Skip failed queries
      }
    }

    return results;
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return [];
  }
};
