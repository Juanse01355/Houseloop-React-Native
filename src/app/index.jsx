import { colors, fontSizes, fontWeights } from '@/constants/theme-houseloop';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {

  // Valores de animación
  const iconOpacity  = useRef(new Animated.Value(0)).current;
  const iconSlide    = useRef(new Animated.Value(80)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const textSlide    = useRef(new Animated.Value(-15)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Ícono aparece y se desliza a su lugar
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(iconSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // 2. Texto aparece después del ícono
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textSlide, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // 3. Espera y hace fade out
      Animated.delay(2000),
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 4. Navega al Welcome
      router.replace('/welcome');
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: splashOpacity }]}>

      <View style={styles.logo}>

        {/* Ícono */}
        <Animated.View style={{
          opacity: iconOpacity,
          transform: [{ translateX: iconSlide }],
        }}>
          {/* SVG simplificado como View por ahora */}
          <Svg width={32} height={32} viewBox="0 0 26 26" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M25.2596 9.9205L12.5679 0L0 9.9205V25.2596H25.2596V9.9205ZM21.0271 11.9842V21.0269H4.23243V11.9719L12.5807 5.38196L21.0271 11.9842Z"
              fill="white"
            />
          </Svg>
        </Animated.View>

        {/* Texto House + Loop */}
        <Animated.View style={{
          opacity: textOpacity,
          transform: [{ translateX: textSlide }],
          flexDirection: 'row',
        }}>
          <Text style={styles.house}>House</Text>
          <Text style={styles.loop}>Loop</Text>
        </Animated.View>

      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  house: {
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
  },
  loop: {
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.regular,
    color: 'rgba(255,255,255,0.7)',
  },
});
