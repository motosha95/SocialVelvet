import React from 'react';
import { Image, ImageStyle, StyleSheet, View, ViewStyle } from 'react-native';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export const Logo = ({ size = 120, style, imageStyle }: LogoProps): React.JSX.Element => {
  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        justifyContent: 'center',
      },
      image: {
        width: size,
        height: size,
        resizeMode: 'contain',
      },
    });
  }, [size]);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../assets/logo.png')}
        style={[styles.image, imageStyle]}
        accessibilityLabel="Socializing Logo"
      />
    </View>
  );
};
