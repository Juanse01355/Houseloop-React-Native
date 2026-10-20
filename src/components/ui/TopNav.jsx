// ============================================================
//   TOP NAV — Navegación superior reutilizable
//   Botón "Volver atrás" en forma de píldora, con un espacio
//   opcional a la derecha para otros botones (editar, eliminar...).
//
//   Guarda este archivo en: src/components/ui/TopNav.jsx
//
//   Uso básico:
//     <TopNav />
//
//   Con tema oscuro y botones a la derecha:
//     <TopNav variant="dark" derecha={<MisBotones />} />
//
//   Props:
//     variant   "light" (por defecto) | "dark"
//     texto     texto del botón (por defecto "Volver atrás")
//     onBack    función al tocar el botón. Si no se pasa, vuelve a la
//               pantalla anterior o, si no hay, va a la ruta "fallback"
//     fallback  ruta a la que ir si no hay pantalla anterior ("/feed")
//     derecha   contenido opcional a la derecha de la barra
// ============================================================

import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  colors,
  darkColors,
  fontSizes,
  radii,
  scale,
  spacing,
} from "@/constants/theme-houseloop";

import IconArrowBack from "../../../assets/icons/icon-arrow-back.svg";

// Colores de cada variante
const TEMAS = {
  light: {
    fondo: colors.background,
    boton: "rgba(28,21,15,0.08)",
    texto: colors.titles,
    icono: colors.titles,
  },
  dark: {
    fondo: darkColors.background,
    boton: "rgba(255,255,255,0.24)",
    texto: darkColors.titles,
    icono: darkColors.white,
  },
};

export default function TopNav({
  variant = "light",
  texto = "Volver atrás",
  onBack,
  fallback = "/feed",
  derecha = null,
}) {
  const insets = useSafeAreaInsets();
  const tema = TEMAS[variant] || TEMAS.light;

  // Vuelve a la pantalla anterior. Si no hay una (por ejemplo, al recargar
  // la página en web), router.back() no hace nada, así que vamos al fallback.
  const volver = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback);
    }
  };

  return (
    <View
      style={[
        styles.barra,
        { backgroundColor: tema.fondo, paddingTop: insets.top + spacing.md },
      ]}
    >
      <Pressable
        style={[styles.boton, { backgroundColor: tema.boton }]}
        onPress={volver}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={texto}
      >
        <IconArrowBack width={scale(20)} height={scale(20)} fill={tema.icono} />
        <Text style={[styles.texto, { color: tema.texto }]}>{texto}</Text>
      </Pressable>

      {derecha}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    zIndex: 10,
  },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: scale(40),
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
  },
  texto: {
    fontSize: fontSizes.body2,
    fontFamily: "Poppins_400Regular",
  },
});