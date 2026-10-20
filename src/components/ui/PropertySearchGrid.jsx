// ============================================================
//   PROPERTY SEARCH GRID — Grid de propiedades del módulo Buscar
//   - Propiedades de OTROS usuarios: como siempre (degradado
//     completo + avatar y nombre de quien publicó).
//   - Propiedades MÍAS: la misma card que se ve en el perfil
//     (miniatura, degradado inferior y contador de reproducciones),
//     sin avatar, para diferenciarlas de las demás.
//   Si no hay imagen, se evita pasarle uri: null a <Image>
//   (rompe el render en web) mostrando un View vacío en su lugar.
// ============================================================
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import {
  colors,
  fontSizes,
  fontWeights,
  moderateScale,
  radii,
  scale,
  spacing,
} from "@/constants/theme-houseloop";
import Avatar from "@/components/ui/Avatar";
import { BASE_URL } from "@/config/api";

// Ícono (el archivo debe estar en assets/icons)
import IconPlayOutlined from "../../../assets/icons/icon-play-outlined.svg";

// Chip de disponibilidad: texto corto + color del puntito.
// La clave es el valor que guarda la base de datos en la columna "estado"
// (los mismos colores que usa detail.jsx).
const ESTADOS_CHIP = {
  disponible: { texto: "Disponible", color: "#4CAF50" },
  en_negociacion: { texto: "Negociación", color: "#FFB300" },
  no_disponible: { texto: "No disponible", color: "#E53935" },
};

// Abrevia el número como en TikTok: 950, 1,2 K, 3,4 M
function formatearReproducciones(valor) {
  const n = Number(valor) || 0;
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "")} M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(".", ",").replace(",0", "")} K`;
  }
  return String(n);
}

export default function PropertySearchGrid({
  propiedades,
  router,
  usuarioId,
}) {
  // Datos del usuario logueado. Si la pantalla no pasa usuarioId, se leen de
  // la sesión guardada (igual que la pantalla de perfil) y el nombre se pide
  // al mismo endpoint /api/perfil.
  const [idGuardado, setIdGuardado] = useState(null);
  const [nombreLogueado, setNombreLogueado] = useState(null);

  useEffect(() => {
    async function leerSesion() {
      try {
        const token = await AsyncStorage.getItem("token");
        const raw = await AsyncStorage.getItem("usuario");

        if (raw) {
          const guardado = JSON.parse(raw);
          if (guardado?.id != null) setIdGuardado(String(guardado.id));
          if (guardado?.nombre) setNombreLogueado(String(guardado.nombre));
        }

        if (token) {
          const response = await fetch(`${BASE_URL}/api/perfil`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (response.ok && data?.nombre) setNombreLogueado(String(data.nombre));
        }
      } catch (error) {
        console.error("Error al leer la sesión:", error);
      }
    }
    leerSesion();
  }, []);

  const idLogueado = usuarioId ?? idGuardado;

  // ¿Es una propiedad mía?
  // 1) Si la propiedad trae el id del dueño, se compara por id.
  // 2) Si no trae ningún id, se compara el nombre de quien publicó con mi nombre.
  const esPropiedadMia = (item) => {
    const idDueno =
      item.id_usuario ?? item.usuario_id ?? item.id_propietario ?? item.propietario_id;

    if (idDueno != null && idLogueado != null) {
      return String(idDueno) === String(idLogueado);
    }

    if (nombreLogueado && item.propietario) {
      return (
        String(item.propietario).trim().toLowerCase() ===
        nombreLogueado.trim().toLowerCase()
      );
    }

    return false;
  };

  return (
    <FlatList
      data={propiedades}
      extraData={[idLogueado, nombreLogueado]}
      keyExtractor={(item) => item.id_propiedad}
      numColumns={2}
      scrollEnabled={false}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.columnWrapper}
      ItemSeparatorComponent={() => null}
      renderItem={({ item }) => {
        // Si la propiedad no trae "estado", no se muestra el chip
        const estado = ESTADOS_CHIP[item.estado];

        // ¿Es una propiedad mía?
        const esMia = item.esMia === true || esPropiedadMia(item);

        // ── MIS PROPIEDADES: card igual a la del perfil ──
        if (esMia) {
          const uriMia = item.miniatura || item.media_url;

          return (
            <Pressable
              style={styles.miaItem}
              onPress={() => router.push(`/detail?id=${item.id_propiedad}`)}
            >
              {uriMia ? (
                <Image
                  source={{ uri: uriMia }}
                  style={styles.miaImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.miaImage} />
              )}

              {/* Degradado inferior sutil */}
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0)",
                  "rgba(0,0,0,0.10)",
                  "rgba(0,0,0,0.30)",
                  "rgba(0,0,0,0.55)",
                ]}
                locations={[0, 0.4, 0.75, 1]}
                style={styles.miaFade}
                pointerEvents="none"
              />

              {/* Chip de disponibilidad — arriba a la izquierda */}
              {estado && (
                <View style={styles.miaChip} pointerEvents="none">
                  <View style={[styles.chipDot, { backgroundColor: estado.color }]} />
                  <Text style={styles.chipText} numberOfLines={1}>
                    {estado.texto}
                  </Text>
                </View>
              )}

              {/* Reproducciones — abajo a la izquierda */}
              <View style={styles.miaStatsRow} pointerEvents="none">
                <IconPlayOutlined
                  width={scale(18)}
                  height={scale(18)}
                  fill={colors.white}
                />
                <Text style={styles.miaStatsText}>
                  {formatearReproducciones(item.reproducciones)}
                </Text>
              </View>
            </Pressable>
          );
        }

        // ── PROPIEDADES DE OTROS: como estaban ──
        return (
          <Pressable
            style={styles.gridItem}
            onPress={() => router.push(`/detail?id=${item.id_propiedad}`)}
          >
            {/* Miniatura del video primero (como en el perfil); si no hay,
                la primera foto; si tampoco, View vacío */}
            {item.miniatura || item.media_url ? (
              <Image
                source={{ uri: item.miniatura || item.media_url }}
                style={styles.gridImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.gridImage} />
            )}

            {/* Degradado sobre toda la imagen */}
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

            {/* Avatar (con su propio estado vacío) + nombre de quien publicó */}
            <View style={styles.userRow}>
              <Avatar uri={item.foto_perfil_url} size="xxs" />
              <Text style={styles.userName} numberOfLines={1}>
                {item.propietario}
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
    rowGap: 8,
    paddingHorizontal: 14,
  },

  columnWrapper: {
    gap: 8,
  },

  // ── Cards de otros usuarios (como estaban) ──
  gridItem: {
    width: "48%",
    height: 240,
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.divider,
    borderRadius: 8,
  },

  gridImage: {
    width: "100%",
    height: 240,
  },

  gridFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  chip: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
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

  userRow: {
    position: "absolute",
    left: 10,
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 2,
  },

  userName: {
    fontSize: fontSizes.overline,
    fontWeight: fontWeights.regular,
    color: colors.white,
    fontFamily: "Poppins_700Bold",
    flexShrink: 1,
  },

  // ── Mis cards: copiadas de PropertyProfileGrid ──
  miaItem: {
    width: "48%",
    height: 240,
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.divider,
    borderRadius: radii.sm,
  },

  miaImage: {
    width: "100%",
    height: 240,
  },

  miaFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 88,
  },

  miaChip: {
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

  miaStatsRow: {
    position: "absolute",
    left: spacing.sm + spacing.xs / 2,
    bottom: spacing.sm + spacing.xs / 2,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    zIndex: 2,
  },

  miaStatsText: {
    color: colors.white,
    fontSize: moderateScale(fontSizes.h4),
    fontFamily: "Poppins_700Bold",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});