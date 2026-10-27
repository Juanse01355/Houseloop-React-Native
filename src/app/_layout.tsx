import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import Toast from 'react-native-toast-message';   // componente que muestra los toasts en toda la app
import { toastConfig } from '@/config/toast-config';   // el diseño personalizado que vamos a crear
import { darkColors } from '@/constants/theme-houseloop';

// Ancho máximo de la app en web (escritorio). Debe ser el mismo 430 que usa
// theme-houseloop.ts para limitar la escala (SCREEN_WIDTH); si cambias uno, cambia el otro.
const MAX_ANCHO_WEB = 430;

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    // Fondo que se ve a los lados cuando la app se abre en un computador
    <View style={styles.fondoWeb}>
      {/* Contenedor de la app: en web mide máximo MAX_ANCHO_WEB y queda centrado;
          en el celular ocupa toda la pantalla como siempre */}
      <View style={styles.contenedorApp}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="feed" />
          <Stack.Screen name="publish" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="explore" />
          <Stack.Screen name="search" />
        </Stack>
        <Toast config={toastConfig}
               visibilityTime={4000}
               swipeable={true}  
               // ── Espaciado del sistema (notch, barra de estado) ──
               keyboardOffset={40}      // ajuste extra cuando el teclado está abierto       // true = se puede deslizar para cerrarlo con el dedo
               />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fondoWeb: {
    flex: 1,
    alignItems: 'center',
    // El color solo se aplica en web; en el celular no se nota porque el contenedor ocupa todo
    backgroundColor: Platform.OS === 'web' ? darkColors.background : undefined,
  },
  contenedorApp: {
    flex: 1,
    width: '100%',
    // El ancho máximo solo se aplica en web
    maxWidth: Platform.OS === 'web' ? MAX_ANCHO_WEB : undefined,
    overflow: 'hidden',
  },
});