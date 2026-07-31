import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import Toast from 'react-native-toast-message';   // componente que muestra los toasts en toda la app
import { toastConfig } from '@/config/toast-config';   // el diseño personalizado que vamos a crear

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
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="feed" />
        <Stack.Screen name="publish" />
      </Stack>
      <Toast config={toastConfig}
             visibilityTime={4000}
             swipeable={true}  
             // ── Espaciado del sistema (notch, barra de estado) ──
             keyboardOffset={40}      // ajuste extra cuando el teclado está abierto       // true = se puede deslizar para cerrarlo con el dedo
             />
    </>
  );
}