// ============================================================
//   COMPARTIR — Compartir y copiar el enlace de una propiedad
//   Lo usan feed.jsx y detail.jsx.
//
//   Requiere:  npx expo install expo-clipboard
//
//   Guarda este archivo en: src/utils/compartir.js
// ============================================================
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { Platform, Share } from "react-native";
import Toast from "react-native-toast-message";

// Cuando tengas la versión web publicada, pon aquí su dirección (sin "/" al final),
// por ejemplo "https://houseloop.vercel.app". Si la dejas vacía, en el celular
// se comparte el enlace de la app.
const URL_WEB_PUBLICA = "";

// 124000000 → "$124’000.000"   |   250000 → "$250.000"
function formatearPrecio(valor) {
  const digitos = String(Math.round(Number(valor) || 0));
  const grupos = [];
  for (let i = digitos.length; i > 0; i -= 3) {
    grupos.unshift(digitos.slice(Math.max(0, i - 3), i));
  }
  if (grupos.length <= 2) return `$${grupos.join(".")}`;
  const ultimos = grupos.slice(-2).join(".");
  const millones = grupos.slice(0, -2).join("’");
  return `$${millones}’${ultimos}`;
}

// Enlace a la propiedad: /detail?id=...
export function enlacePropiedad(idPropiedad) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/detail?id=${idPropiedad}`;
  }
  if (URL_WEB_PUBLICA) return `${URL_WEB_PUBLICA}/detail?id=${idPropiedad}`;
  return Linking.createURL("/detail", {
    queryParams: { id: String(idPropiedad) },
  });
}

const toastCopiado = () =>
  Toast.show({
    type: "copiado",
    text1: "Enlace copiado",
    position: "bottom",
    bottomOffset: 80,
    visibilityTime: 2000,
  });

// ¿Es un navegador de celular? (el menú de compartir del navegador solo es
// confiable ahí; en el computador es mejor copiar el enlace)
const esNavegadorMovil = () =>
  typeof navigator !== "undefined" &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");

// Copia texto al portapapeles (con respaldo para web)
async function copiarTexto(texto) {
  try {
    await Clipboard.setStringAsync(texto);
  } catch (err) {
    if (Platform.OS === "web" && navigator?.clipboard) {
      await navigator.clipboard.writeText(texto);
    } else {
      throw err;
    }
  }
}

// Botón de compartir
//  - Celular (app) y navegador de celular: menú de compartir del sistema
//  - Web en computador: copia el enlace y avisa con un toast
export async function compartirPropiedad(propiedad) {
  console.log("[compartir] botón pulsado, propiedad:", propiedad?.id_propiedad);

  if (!propiedad?.id_propiedad) {
    Toast.show({ type: "error", text1: "No se pudo compartir esta propiedad" });
    return;
  }

  const enlace = enlacePropiedad(propiedad.id_propiedad);
  const titulo = propiedad.titulo || "una propiedad";
  const precio = propiedad.precio ? ` — ${formatearPrecio(propiedad.precio)}` : "";
  const mensaje = `Mira esta propiedad en HouseLoop: ${titulo}${precio}`;

  try {
    if (Platform.OS === "web") {
      if (esNavegadorMovil() && typeof navigator.share === "function") {
        await navigator.share({ title: titulo, text: mensaje, url: enlace });
      } else {
        await copiarTexto(`${mensaje}\n${enlace}`);
        toastCopiado();
      }
      return;
    }

    // Android / iOS: menú nativo (WhatsApp, Telegram, correo...)
    await Share.share({ message: `${mensaje}\n${enlace}` });
  } catch (err) {
    if (err?.name === "AbortError") return; // el usuario cerró el menú
    console.warn("[compartir] error:", err);
    Toast.show({ type: "error", text1: "No se pudo compartir" });
  }
}

// Botón del link: copia el enlace de la propiedad
export async function copiarEnlacePropiedad(propiedad) {
  console.log("[compartir] copiar enlace, propiedad:", propiedad?.id_propiedad);
  try {
    await copiarTexto(enlacePropiedad(propiedad.id_propiedad));
    toastCopiado();
  } catch (err) {
    console.warn("No se pudo copiar el enlace:", err);
    Toast.show({ type: "error", text1: "No se pudo copiar el enlace" });
  }
}