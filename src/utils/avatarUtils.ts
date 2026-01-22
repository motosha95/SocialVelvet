/**
 * Utility for handling user avatar images.
 * Automatically fixes old IP addresses in avatar URLs.
 */

import { apiClient } from '../api/client';

/**
 * Fix avatar URL by replacing old IP addresses with current API base URL.
 * Handles both full URLs and relative paths.
 */
export const fixAvatarUrl = (avatarUrl?: string | null): string | undefined => {
  if (!avatarUrl) {
    return undefined;
  }

  // Helper to fix old IP addresses in URLs
  const fixUrl = (url: string): string => {
    // If it's already a full URL with http:// or https://
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Extract the path (everything after the host and port)
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

  return fixUrl(avatarUrl);
};
