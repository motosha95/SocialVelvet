import React from 'react';
import { View, StyleSheet, Image, Dimensions, Modal, PanResponder } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { AppText } from './AppText';
import { Button } from './Button';
import { useTheme } from '../../theme/useTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageCropperProps {
  imageUri: string;
  aspectRatio: [number, number];
  visible: boolean;
  onCrop: (croppedUri: string) => void;
  onCancel: () => void;
}

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const HANDLE_SIZE = 30;
const HANDLE_HIT_AREA = 40; // Larger hit area for easier grabbing

export const ImageCropper = ({
  imageUri,
  aspectRatio,
  visible,
  onCrop,
  onCancel,
}: ImageCropperProps): React.JSX.Element => {
  const theme = useTheme();
  const [imageSize, setImageSize] = React.useState<{ width: number; height: number } | null>(null);
  const [cropBox, setCropBox] = React.useState<CropBox | null>(null);
  
  const panStartRef = React.useRef<{ x: number; y: number; handle: 'move' | 'tl' | 'tr' | 'bl' | 'br' } | null>(null);
  const initialCropBoxRef = React.useRef<CropBox | null>(null);
  const isInitializedRef = React.useRef(false);
  const containerRef = React.useRef<View>(null);
  const cropBoxRef = React.useRef<CropBox | null>(null);

  const [widthRatio, heightRatio] = aspectRatio;

  // Keep ref in sync with state
  React.useEffect(() => {
    cropBoxRef.current = cropBox;
  }, [cropBox]);

  React.useEffect(() => {
    if (visible && imageUri) {
      Image.getSize(
        imageUri,
        (width, height) => {
          setImageSize({ width, height });
        },
        (error) => {
          console.error('Failed to get image size:', error);
        }
      );
    }
  }, [visible, imageUri]);

  React.useEffect(() => {
    if (imageSize && !isInitializedRef.current) {
      const containerWidth = SCREEN_WIDTH - 40;
      const containerHeight = SCREEN_HEIGHT * 0.6;
      
      const containerAspect = containerWidth / containerHeight;
      const desiredAspect = widthRatio / heightRatio;

      let cropWidth: number;
      let cropHeight: number;

      if (desiredAspect > containerAspect) {
        cropWidth = containerWidth * 0.8;
        cropHeight = cropWidth / desiredAspect;
      } else {
        cropHeight = containerHeight * 0.8;
        cropWidth = cropHeight * desiredAspect;
      }

      const x = (containerWidth - cropWidth) / 2;
      const y = (containerHeight - cropHeight) / 2;

      setCropBox({ x, y, width: cropWidth, height: cropHeight });
      isInitializedRef.current = true;
    }
  }, [imageSize, widthRatio, heightRatio]);

  React.useEffect(() => {
    if (!visible) {
      isInitializedRef.current = false;
      setCropBox(null);
      panStartRef.current = null;
      initialCropBoxRef.current = null;
    }
  }, [visible]);

  // Detect which handle or area was touched
  const detectTouchHandle = (touchX: number, touchY: number, box: CropBox): 'move' | 'tl' | 'tr' | 'bl' | 'br' => {
    const halfHit = HANDLE_HIT_AREA / 2;
    
    // Check corners
    const topLeft = { x: box.x, y: box.y };
    const topRight = { x: box.x + box.width, y: box.y };
    const bottomLeft = { x: box.x, y: box.y + box.height };
    const bottomRight = { x: box.x + box.width, y: box.y + box.height };

    // Check if touch is within handle hit area
    if (
      touchX >= topLeft.x - halfHit && touchX <= topLeft.x + halfHit &&
      touchY >= topLeft.y - halfHit && touchY <= topLeft.y + halfHit
    ) {
      return 'tl';
    }
    if (
      touchX >= topRight.x - halfHit && touchX <= topRight.x + halfHit &&
      touchY >= topRight.y - halfHit && touchY <= topRight.y + halfHit
    ) {
      return 'tr';
    }
    if (
      touchX >= bottomLeft.x - halfHit && touchX <= bottomLeft.x + halfHit &&
      touchY >= bottomLeft.y - halfHit && touchY <= bottomLeft.y + halfHit
    ) {
      return 'bl';
    }
    if (
      touchX >= bottomRight.x - halfHit && touchX <= bottomRight.x + halfHit &&
      touchY >= bottomRight.y - halfHit && touchY <= bottomRight.y + halfHit
    ) {
      return 'br';
    }

    // Otherwise, it's a move
    return 'move';
  };

  // Create PanResponder for reliable drag handling
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const currentCropBox = cropBoxRef.current;
          if (!currentCropBox) return;

          const { locationX, locationY, pageX, pageY } = evt.nativeEvent;
          
          // locationX/locationY are relative to the cropBox view itself
          // We need to add the cropBox position to get container-relative coordinates
          const touchX = locationX + currentCropBox.x;
          const touchY = locationY + currentCropBox.y;

          const handle = detectTouchHandle(touchX, touchY, currentCropBox);
          
          panStartRef.current = {
            x: pageX,
            y: pageY,
            handle,
          };
          
          initialCropBoxRef.current = { ...currentCropBox };
        },
        onPanResponderMove: (evt) => {
          const currentCropBox = cropBoxRef.current;
          if (!currentCropBox || !panStartRef.current || !initialCropBoxRef.current) return;

          const { pageX, pageY } = evt.nativeEvent;
          const deltaX = pageX - panStartRef.current.x;
          const deltaY = pageY - panStartRef.current.y;

          const containerWidth = SCREEN_WIDTH - 40;
          const containerHeight = SCREEN_HEIGHT * 0.6;
          const aspectRatioValue = widthRatio / heightRatio;

          const handle = panStartRef.current.handle;
          const initial = initialCropBoxRef.current;

          let newBox: CropBox;

          if (handle === 'move') {
            // Handle move
            newBox = {
              ...currentCropBox,
              x: Math.max(0, Math.min(containerWidth - currentCropBox.width, currentCropBox.x + deltaX)),
              y: Math.max(0, Math.min(containerHeight - currentCropBox.height, currentCropBox.y + deltaY)),
            };
          } else {
            // Handle resize
            if (handle === 'br') {
              // Bottom-right: expand/shrink from top-left
              let newWidth = Math.max(50, Math.min(containerWidth - initial.x, initial.width + deltaX));
              let newHeight = newWidth / aspectRatioValue;
              
              if (initial.y + newHeight > containerHeight) {
                newHeight = containerHeight - initial.y;
                newWidth = newHeight * aspectRatioValue;
              }

              newBox = {
                x: initial.x,
                y: initial.y,
                width: newWidth,
                height: newHeight,
              };
            } else if (handle === 'bl') {
              // Bottom-left: expand/shrink from top-right
              let newWidth = Math.max(50, Math.min(initial.x + initial.width, initial.width - deltaX));
              let newHeight = newWidth / aspectRatioValue;
              
              if (initial.y + newHeight > containerHeight) {
                newHeight = containerHeight - initial.y;
                newWidth = newHeight * aspectRatioValue;
              }

              newBox = {
                x: initial.x + initial.width - newWidth,
                y: initial.y,
                width: newWidth,
                height: newHeight,
              };
            } else if (handle === 'tr') {
              // Top-right: expand/shrink from bottom-left
              let newWidth = Math.max(50, Math.min(containerWidth - initial.x, initial.width + deltaX));
              let newHeight = newWidth / aspectRatioValue;
              
              if (initial.y + newHeight > containerHeight) {
                newHeight = containerHeight - initial.y;
                newWidth = newHeight * aspectRatioValue;
              }

              newBox = {
                x: initial.x,
                y: initial.y + initial.height - newHeight,
                width: newWidth,
                height: newHeight,
              };
            } else {
              // Top-left: expand/shrink from bottom-right
              let newWidth = Math.max(50, Math.min(initial.x + initial.width, initial.width - deltaX));
              let newHeight = newWidth / aspectRatioValue;
              
              if (initial.y + newHeight > containerHeight) {
                newHeight = containerHeight - initial.y;
                newWidth = newHeight * aspectRatioValue;
              }

              newBox = {
                x: initial.x + initial.width - newWidth,
                y: initial.y + initial.height - newHeight,
                width: newWidth,
                height: newHeight,
              };
            }

            // Ensure within bounds
            newBox.x = Math.max(0, Math.min(containerWidth - newBox.width, newBox.x));
            newBox.y = Math.max(0, Math.min(containerHeight - newBox.height, newBox.y));
            newBox.width = Math.min(newBox.width, containerWidth - newBox.x);
            newBox.height = Math.min(newBox.height, containerHeight - newBox.y);
          }

          setCropBox(newBox);
          // Update pan start to current position for next move
          panStartRef.current = { ...panStartRef.current, x: pageX, y: pageY };
        },
        onPanResponderRelease: () => {
          panStartRef.current = null;
        },
      }),
    [widthRatio, heightRatio]
  );

  const handleCrop = async () => {
    if (!imageSize || !cropBox) return;

    try {
      const imageAspect = imageSize.width / imageSize.height;
      const displayWidth = SCREEN_WIDTH - 40;
      const displayHeight = SCREEN_HEIGHT * 0.6;
      
      let displayedImageWidth: number;
      let displayedImageHeight: number;
      
      const displayAspect = displayWidth / displayHeight;
      
      if (imageAspect > displayAspect) {
        displayedImageWidth = displayWidth;
        displayedImageHeight = displayWidth / imageAspect;
      } else {
        displayedImageHeight = displayHeight;
        displayedImageWidth = displayHeight * imageAspect;
      }

      const scaleX = imageSize.width / displayedImageWidth;
      const scaleY = imageSize.height / displayedImageHeight;

      const originX = cropBox.x * scaleX;
      const originY = cropBox.y * scaleY;
      const cropWidth = cropBox.width * scaleX;
      const cropHeight = cropBox.height * scaleY;

      const manipulatedImage = await manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.max(0, originX),
              originY: Math.max(0, originY),
              width: Math.min(imageSize.width - originX, cropWidth),
              height: Math.min(imageSize.height - originY, cropHeight),
            },
          },
        ],
        {
          compress: 0.8,
          format: SaveFormat.JPEG,
        }
      );

      onCrop(manipulatedImage.uri);
    } catch (error) {
      console.error('Crop error:', error);
      alert('Failed to crop image');
    }
  };

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      modal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      container: {
        width: SCREEN_WIDTH - 40,
        height: SCREEN_HEIGHT * 0.6,
        position: 'relative',
      },
      imageContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      },
      image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
      },
      overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
      },
      cropBox: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: theme.colors.primary,
        backgroundColor: 'transparent',
      },
      cropBoxHandles: {
        position: 'absolute',
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        borderRadius: HANDLE_SIZE / 2,
        zIndex: 10,
      },
      controls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
      },
      instruction: {
        position: 'absolute',
        top: 40,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 12,
        borderRadius: 8,
      },
    });
  }, [theme.colors.primary]);

  if (!visible || !imageSize || !cropBox) {
    return <></>;
  }

  const createOverlay = () => {
    return (
      <View style={styles.overlay}>
        <View style={{ height: cropBox.y, backgroundColor: 'rgba(0, 0, 0, 0.6)' }} />
        <View style={{ flexDirection: 'row', height: cropBox.height }}>
          <View style={{ width: cropBox.x, backgroundColor: 'rgba(0, 0, 0, 0.6)' }} />
          <View style={{ width: cropBox.width, backgroundColor: 'transparent' }} />
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' }} />
        </View>
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' }} />
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modal}>
        <View style={styles.instruction}>
          <AppText style={{ color: '#FFFFFF', textAlign: 'center' }}>
            Drag center to move • Drag corners to resize • Tap "Crop" to confirm
          </AppText>
        </View>

        <View style={styles.container}>
          <View ref={containerRef} style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            {createOverlay()}
            <View
              style={[
                styles.cropBox,
                {
                  left: cropBox.x,
                  top: cropBox.y,
                  width: cropBox.width,
                  height: cropBox.height,
                },
              ]}
              {...panResponder.panHandlers}
            >
              {/* Corner handles - visual only, touch is handled by parent */}
              <View style={[styles.cropBoxHandles, { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 }]} />
              <View style={[styles.cropBoxHandles, { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 }]} />
              <View style={[styles.cropBoxHandles, { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 }]} />
              <View style={[styles.cropBoxHandles, { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 }]} />
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          <Button label="Cancel" onPress={onCancel} variant="secondary" style={{ flex: 0.4 }} />
          <Button label="Crop" onPress={handleCrop} style={{ flex: 0.4 }} />
        </View>
      </View>
    </Modal>
  );
};
