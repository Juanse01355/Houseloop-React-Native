// ============================================================
//   PROPERTY MAP CARD — Tarjeta flotante que aparece al tocar una
//   propiedad en el mapa (ExploreScreen).
//
//   Diseño: imagen con etiqueta "Venta"/"Arriendo" y botón de play,
//   precio, dirección, habitaciones / baños / área y "Ver detalles".
//
//   Props:
//     propiedad     objeto de la propiedad (viene del feed)
//     onClose       cierra la tarjeta
//     onVerDetalles se llama con la propiedad al tocar "Ver detalles"
//
//   Guarda este archivo en: src/components/ui/PropertyMapCard.jsx
// ============================================================
import { MaterialIcons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { createElement, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/ui/Button";
import {
  colors,
  fontSizes,
  radii,
  spacing,
} from "@/constants/theme-houseloop";

// 24000000 -> $24'000.000   |   350000 -> $350.000
const formatearPrecio = (valor) => {
  const n = Math.round(Number(valor) || 0);
  const grupos = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".").split(".");
  if (n >= 1000000 && grupos.length >= 3) {
    // el separador entre millones y miles lleva apóstrofo: 24'000.000
    const millones = grupos.slice(0, grupos.length - 2).join(".");
    return `$${millones}'${grupos.slice(-2).join(".")}`;
  }
  return `$${grupos.join(".")}`;
};

const etiquetaOperacion = (tipo) =>
  tipo === "arriendo" ? "Arriendo" : "Venta";

// Respaldo cuando la propiedad no tiene miniatura: muestra el primer
// cuadro del VIDEO, quieto y sin sonido (no se reproduce).
function PreviewVideo({ uri }) {
  // Navegador: expo-video deja el <video> con su tamaño natural y desborda la
  // card. Se usa un <video> HTML normal con tamaño fijo y object-fit: cover.
  if (Platform.OS === "web") {
    return createElement(
      "div",
      {
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          pointerEvents: "none",
        },
      },
      createElement("video", {
        // #t=0.1 hace que el navegador muestre un cuadro del video sin reproducirlo
        src: `${uri}#t=0.1`,
        muted: true,
        playsInline: true,
        preload: "metadata",
        style: {
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        },
      }),
    );
  }

  return <PreviewVideoNativo uri={uri} />;
}

// Celular: primer cuadro con expo-video
function PreviewVideoNativo({ uri }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.loop = false;
    p.pause();
    p.currentTime = 0.1; // evita el cuadro negro del instante 0
  });

  return (
    // El contenedor tiene tamaño fijo y recorta (overflow hidden): el video se
    // ajusta a ese recuadro con "cover" y nunca cambia el tamaño de la card.
    <View style={styles.previewContenedor} pointerEvents="none">
      <VideoView
        style={styles.previewVideo}
        player={player}
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        contentFit="cover"
      />
    </View>
  );
}

export default function PropertyMapCard({ propiedad, onClose, onVerDetalles }) {
  const direccion = [propiedad.direccion, propiedad.barrio]
    .filter(Boolean)
    .join(", ");
  const area = Number(propiedad.area_m2);

  // Vista previa del video: primero la miniatura generada del video;
  // si no existe o no carga, el primer cuadro del propio video.
  const [miniaturaFalla, setMiniaturaFalla] = useState(false);
  const usarMiniatura = !!propiedad.miniatura && !miniaturaFalla;

  return (
    <View style={styles.card}>
      {/* ── Imagen / video con etiqueta y play ── */}
      <Pressable
        style={styles.media}
        onPress={() => onVerDetalles(propiedad)}
        accessibilityLabel="Ver la propiedad"
      >
        {usarMiniatura ? (
          <Image
            source={{ uri: propiedad.miniatura }}
            style={styles.previewVideo}
            resizeMode="cover"
            onError={() => setMiniaturaFalla(true)}
          />
        ) : propiedad.video ? (
          <PreviewVideo uri={propiedad.video} />
        ) : null}

        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>
            {etiquetaOperacion(propiedad.tipo_operacion)}
          </Text>
        </View>

        {propiedad.video ? (
          <MaterialIcons name="play-arrow" size={64} color="#fff" style={styles.play} />
        ) : null}

        <Pressable
          style={styles.cerrar}
          onPress={onClose}
          hitSlop={8}
          accessibilityLabel="Cerrar"
        >
          <MaterialIcons name="close" size={18} color="#fff" />
        </Pressable>
      </Pressable>

      {/* ── Datos ── */}
      <View style={styles.cuerpo}>
        <Text style={styles.precio}>{formatearPrecio(propiedad.precio)}</Text>
        {direccion ? (
          <Text style={styles.direccion} numberOfLines={1}>
            {direccion}
          </Text>
        ) : null}

        <View style={styles.datos}>
          <View style={styles.dato}>
            <MaterialIcons name="bed" size={22} color={colors.typography} />
            <Text style={styles.datoTexto}>
              {Number(propiedad.habitaciones) || 0} Habitaciones
            </Text>
          </View>
          <View style={styles.dato}>
            <MaterialIcons name="bathtub" size={20} color={colors.typography} />
            <Text style={styles.datoTexto}>
              {Number(propiedad.banos) || 0} Baños
            </Text>
          </View>
          {area > 0 ? (
            <View style={styles.dato}>
              <MaterialIcons name="square-foot" size={20} color={colors.typography} />
              <Text style={styles.datoTexto}>{area} m²</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.divisor} />

        <ButtonPrimary text="Ver detalles" onPress={() => onVerDetalles(propiedad)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "92%",
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  media: {
    height: 190,
    backgroundColor: "#1b1b1b",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  previewContenedor: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  previewVideo: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  badgeTexto: {
    color: colors.white,
    fontSize: fontSizes.body3,
    fontFamily: "Poppins_700Bold",
  },
  play: {
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowRadius: 8,
  },
  cerrar: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  cuerpo: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  precio: {
    fontSize: fontSizes.h2,
    color: colors.primary,
    fontFamily: "Poppins_700Bold",
  },
  direccion: {
    fontSize: fontSizes.body2,
    color: colors.typography,
    fontFamily: "Poppins_400Regular",
  },
  datos: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  dato: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  datoTexto: {
    fontSize: fontSizes.body3,
    color: colors.typography,
    fontFamily: "Poppins_400Regular",
  },
  divisor: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
});