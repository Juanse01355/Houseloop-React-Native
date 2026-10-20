import { Platform } from "react-native";
import Constants from "expo-constants";

const PORT = 3300;

function getBaseUrl() {
  // Producción: se define en .env (ej. https://tu-backend.com)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Navegador: usa el mismo host desde el que se abrió la app.
  // typeof window evita el error cuando Expo renderiza en el servidor.
  if (Platform.OS === "web") {
    const host =
      typeof window !== "undefined" && window.location?.hostname
        ? window.location.hostname
        : "localhost";
    return `http://${host}:${PORT}`;
  }

  // Celular: usa la IP actual del PC que sirve Expo
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host) {
    return `http://${host}:${PORT}`;
  }

  // Respaldo para emulador Android
  return `http://10.0.2.2:${PORT}`;
}

export const BASE_URL = getBaseUrl();