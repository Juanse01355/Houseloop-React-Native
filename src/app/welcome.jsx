import { ButtonIcon } from '@/components/ui/Button';
import { colors, fontSizes, fontWeights, spacing } from '@/constants/theme-houseloop';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import ArrowRight from '../../assets/icons/arrow-right.svg';
import Logo from '../../assets/images/logo.svg';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>

      {/* Imagen hero — ocupa toda la pantalla */}
      <Image
        source={require('../../assets/images/house-welcome.png')}
        style={styles.heroImg}
        resizeMode="cover"
      />

     {/* Degradado real sobre la imagen */}
      <LinearGradient
        colors={['transparent', 'rgba(250,250,250,0.7)', colors.background]}
        locations={[0.5, 0.6, 1]}
        style={styles.overlay}
      />

      {/* Contenido encima de todo */}
      <View style={styles.content}>

        {/* Logo */}
        <View style={styles.logo}>
          <Logo width={120} height={20} />
        </View>

        {/* Título */}
        <Text style={styles.title}>
          Encuentra casa cerca de forma facil y segura.
        </Text>

        {/* Subtítulo */}
        <Text style={styles.subtitle}>
          Encuentra arriendo o vivienda cerca de ti y elige tu mejor opción.
        </Text>

        {/* Botón traido de components, Button.jsx */}
        <ButtonIcon
          text="Encontrar ahora"
          icon={<ArrowRight width={22} height={22} color="#FFFFFF"  />}
          onPress={() => router.push('/login')}
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Imagen ocupa toda la pantalla
  heroImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  // Degradado de transparente a blanco
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }, 
  logo: {
    marginBottom: spacing.md,
  },
  // Contenido pegado abajo
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },

  title: {
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.bold,
    color: colors.titles,
    marginBottom: spacing.sm,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 33.6,
  },

  subtitle: {
    fontSize: fontSizes.body1,
    color: colors.typography,
    marginBottom: spacing.lg,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22.5,
  },

});