// ============================================================
//   PROPERTY PROFILE GRID — Grid de propiedades del perfil
//   Layout, tamaño y padding tomados de PropertySearchGrid.
//   El degradado se mantiene como estaba (franja inferior sutil,
//   no cubre toda la imagen). Abajo a la izquierda de cada card
//   se muestra el contador de reproducciones (ícono play + número).
//   Arriba a la izquierda se muestra un chip pequeño con la
//   disponibilidad (Disponible / Negociación / No disponible).
//   Los estilos usan los tokens de theme-houseloop.
// ============================================================
import { LinearGradient } from "expo-linear-gradient";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import {
  colors,
  fontSizes,
  moderateScale,
  radii,
  scale,
  spacing,
} from "@/constants/theme-houseloop";

// Ícono (el archivo debe estar en assets/icons)
import IconPlayOutlined from "../../../assets/icons/icon-play-outlined.svg";

type PropertyProfileGridProps = {
  propiedades: any[];
  router: any;
};

// Chip de disponibilidad: texto corto + color del puntito.
// La clave es el valor que guarda la base de datos en la columna "estado"
// (los mismos colores que usa detail.jsx).
const ESTADOS_CHIP: Record<string, { texto: string; color: string }> = {
  disponible: { texto: "Disponible", color: "#4CAF50" },
  en_negociacion: { texto: "Negociación", color: "#FFB300" },
  no_disponible: { texto: "No disponible", color: "#E53935" },
};

// Abrevia el número como en TikTok: 950, 1,2 K, 3,4 M
function formatearReproducciones(valor: number | string | null | undefined): string {
  const n = Number(valor) || 0;
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "")} M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(".", ",").replace(",0", "")} K`;
  }
  return String(n);
}

export default function PropertyProfileGrid({
  propiedades,
  router,
}: PropertyProfileGridProps) {
  // La miniatura del video tiene prioridad; si la propiedad no tiene
  // (publicaciones antiguas), usamos la primera foto como respaldo.
  // Solo mostramos propiedades que tengan alguna de las dos.
  const propiedadesConImagen = propiedades.filter(
    (item) => item.miniatura || item.media_url,
  );

  // Mostramos las más recientes primero
  const propiedadesOrdenadas = [...propiedadesConImagen].reverse();

  return (
    <FlatList
      data={propiedadesOrdenadas}
      keyExtractor={(item) => item.id_propiedad}
      numColumns={2}
      scrollEnabled={false}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.columnWrapper}
      ItemSeparatorComponent={() => null}
      renderItem={({ item }) => {
        // Si la propiedad no trae "estado", no se muestra el chip
        const estado = ESTADOS_CHIP[item.estado];

        return (
          <Pressable
            style={styles.gridItem}
            onPress={() =>
              router.push(`/detail?id=${item.id_propiedad}`)
            }
          >
            {/* Imagen */}
            <Image
              source={{ uri: item.miniatura || item.media_url }}
              style={styles.gridImage}
              resizeMode="cover"
            />

            {/* Degradado inferior sutil */}
            <LinearGradient
              colors={[
                "rgba(0,0,0,0)",
                "rgba(0,0,0,0.10)",
                "rgba(0,0,0,0.30)",
                "rgba(0,0,0,0.55)",
              ]}
              locations={[0, 0.4, 0.75, 1]}
              style={styles.gridFade}
              pointerEvents="none"
            />

            {/* Chip de disponibilidad — arriba a la izquierda */}
            {estado && (
              <View style={styles.chip} pointerEvents="none">
                <View style={[styles.chipDot, { backgroundColor: estado.color }]} />
                <Text style={styles.chipText} numberOfLines={1}>
                  {estado.texto}
                </Text>
              </View>
            )}

            {/* Reproducciones — abajo a la izquierda */}
            <View style={styles.statsRow} pointerEvents="none">
              <IconPlayOutlined
                width={scale(18)}
                height={scale(18)}
                fill={colors.white}
              />
              <Text style={styles.statsText}>
                {formatearReproducciones(item.reproducciones)}
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    rowGap: spacing.sm,
    // 14 (no spacing.md) para quedar alineado con el estado vacío de profile.js
    paddingHorizontal: 14,
  },

  columnWrapper: {
    gap: spacing.sm,
  },

  gridItem: {
    width: "48%",
    height: 240,
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.divider,
    borderRadius: radii.sm,
  },

  gridImage: {
    width: "100%",
    height: 240,
  },

  gridFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 88,
  },

  // ── Chip de disponibilidad (pequeño y discreto) ──
  chip: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 2,
  },

  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  chipText: {
    color: colors.white,
    fontSize: fontSizes.overline,
    fontFamily: "Poppins_400Regular",
  },

  statsRow: {
    position: "absolute",
    left: spacing.sm + spacing.xs / 2,
    bottom: spacing.sm + spacing.xs / 2,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    zIndex: 2,
  },

  statsText: {
    color: colors.white,
    fontSize: moderateScale(fontSizes.h4),
    fontFamily: "Poppins_700Bold",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});