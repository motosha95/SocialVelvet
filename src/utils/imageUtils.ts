/**
 * Utility for handling event images.
 * Supports both local images (for development) and remote URLs (for production).
 */

import { apiClient } from '../api/client';

// Local image mappings - these will be replaced when you add your image files
// For now, using placeholder approach that works with or without images
export const EVENT_IMAGES: Record<string, number | undefined> = {
  // Map event IDs to local image requires
  // Path is relative to this file (src/utils/imageUtils.ts)
  // Images should be placed in src/assets/events/
  'event-1': require('../assets/events/event-1.jpg'),
  'event-2': require('../assets/events/event-2.jpg'),
  'event-3': require('../assets/events/event-3.jpg'),
  // Add more as needed
};

/**
 * Get image source for an event.
 * Returns local image source if available, otherwise returns remote URL or undefined.
 * Automatically fixes old IP addresses in URLs to use the current API base URL.
 */
export const getEventImageSource = (imageUrl?: string): { uri?: string; source?: number } | undefined => {
  // If no imageUrl provided, return undefined (component will handle placeholder)
  if (!imageUrl) {
    return undefined;
  }

  // Helper to fix old IP addresses in URLs
  const fixImageUrl = (url: string): string => {
    // If it's already a full URL with http:// or https://
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Extract the path (everything after the host and port)
      // Replace any old IP address with current API base URL
      const urlMatch = url.match(/^https?:\/\/[^/]+(.*)$/);
      if (urlMatch && urlMatch[1]) {
        // Reconstruct URL with current API base URL
        return `${apiClient.baseURL}${urlMatch[1]}`;
      }
      // If no path found, check if it's the same base URL already
      if (url.startsWith(apiClient.baseURL)) {
        return url; // Already using current base URL
      }
      // Otherwise, replace the base URL part
      return url.replace(/^https?:\/\/[^/]+/, apiClient.baseURL);
    }

    // If it starts with /, it's a relative path - construct full URL
    if (url.startsWith('/')) {
      return `${apiClient.baseURL}${url}`;
    }

    // Otherwise, assume it's a server path - construct full URL
    return `${apiClient.baseURL}/${url}`;
  };

  // Check if it's a remote URL (starts with http:// or https://)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // Fix old IP addresses in the URL
    const fixedUrl = fixImageUrl(imageUrl);
    return { uri: fixedUrl };
  }

  // If it starts with /, it's a relative path from the backend
  if (imageUrl.startsWith('/')) {
    const fullUrl = `${apiClient.baseURL}${imageUrl}`;
    return { uri: fullUrl };
  }

  // For local images, we'll use the imageUrl as a key
  // This allows switching between local and remote seamlessly
  const localImage = EVENT_IMAGES[imageUrl];
  if (localImage) {
    return { source: localImage };
  }

  // If imageUrl doesn't match local and isn't a URL, assume it's a server path
  const fullUrl = `${apiClient.baseURL}/${imageUrl}`;
  return { uri: fullUrl };
};

