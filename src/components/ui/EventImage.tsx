import React from 'react';
import { Image, ImageStyle, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../../theme/useTheme';
import { AppText } from './AppText';
import { getEventImageSource } from '../../utils/imageUtils';

interface EventImageProps {
  imageUrl?: string;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  aspectRatio?: number; // width / height
}

export const EventImage = ({ imageUrl, style, imageStyle, aspectRatio = 16 / 9 }: EventImageProps): React.JSX.Element => {
  const theme = useTheme();
  const [imageError, setImageError] = React.useState<boolean>(false);
  const imageSource = getEventImageSource(imageUrl);

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: theme.colors.border,
        borderRadius: 12,
        overflow: 'hidden',
        aspectRatio,
      },
      image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
      },
      placeholder: {
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
      },
      placeholderText: {
        color: theme.colors.mutedText,
      },
    });
  }, [aspectRatio, theme.colors.border, theme.colors.mutedText]);

  // Reset error state when imageUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  if (!imageSource || imageError) {
    return (
      <View style={[styles.container, styles.placeholder, style]}>
        <AppText variant="caption" color="muted" style={styles.placeholderText}>
          📸 No image
        </AppText>
      </View>
    );
  }

  const handleImageError = (): void => {
    console.warn('[EventImage] Failed to load image:', imageSource.uri || 'local image');
    setImageError(true);
  };

  return (
    <View style={[styles.container, style]}>
      {imageSource.uri ? (
        <Image
          source={{ uri: imageSource.uri }}
          style={[styles.image, imageStyle]}
          onError={handleImageError}
          onLoadStart={() => setImageError(false)}
        />
      ) : imageSource.source ? (
        <Image
          source={imageSource.source}
          style={[styles.image, imageStyle]}
          onError={handleImageError}
        />
      ) : (
        <View style={[styles.placeholder, imageStyle]}>
          <AppText variant="caption" color="muted" style={styles.placeholderText}>
            📸 No image
          </AppText>
        </View>
      )}
    </View>
  );
};

