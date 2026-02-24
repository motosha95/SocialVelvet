import { apiClient } from './client';
import { useAuthStore } from '../store/auth/authStore';

const getAuthToken = (): string | undefined => {
  const session = useAuthStore.getState().session;
  return session?.accessToken;
};

export interface UploadImageResponse {
  imageUrl: string;
  filename: string;
}

export const uploadApi = {
  uploadImage: async (imageUri: string): Promise<UploadImageResponse> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Create FormData
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await fetch(`${apiClient.baseURL}/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type - let the browser set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    return await response.json();
  },
};
