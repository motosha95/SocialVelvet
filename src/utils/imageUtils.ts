/**
 * Utility for handling event images.
 * Supports both local images (for development) and remote URLs (for production).
 */

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
 */
export const getEventImageSource = (imageUrl?: string): { uri?: string; source?: number } | undefined => {
	
  // If no imageUrl provided, return undefined (component will handle placeholder)
  if (!imageUrl) {
    return undefined;
  }

  // Check if it's a remote URL (starts with http:// or https://)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return { uri: imageUrl };
  }

  // For local images, we'll use the imageUrl as a key
  // This allows switching between local and remote seamlessly
  const localImage = EVENT_IMAGES[imageUrl];
  if (localImage) {
    return { source: localImage };
  }

  // If imageUrl doesn't match local and isn't a URL, assume it's a server path
  // In production, this would be constructed with a base URL
  // For now, return undefined to show placeholder
  return undefined;
};

