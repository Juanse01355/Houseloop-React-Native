// ============================================================
//   PROPERTY MAP CARD — Tarjeta flotante que aparece al tocar
//   un pin del mapa. Muestra imagen, precio, dirección y specs.
// ============================================================
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import {
  colors,
  fontSizes,
  fontWeights,
  moderateScale,
  radii,
  scale,
  spacing,
  verticalScale,
} from "@/constants/theme-houseloop";

// Ícono de cierre
import IconClose from "../../../assets/icons/icon-close.svg";

function formatearPrecio(precio) {
  const numero = Number(precio) || 0;
  return `$${numero.toLocaleString("es-CO")}`;
}

export default function PropertyMapCard({ propiedad, onVerDetalles, onClose }) {
  if (!propiedad) return null;

  return (
    <View style={styles.card}>
      <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
        <IconClose width={12} height={12} fill={colors.white} />
      </Pressable>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>Venta</Text>
      </View>

      {propiedad.media_url ? (
        <Image
          source={{ uri: propiedad.media_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.image} />
      )}

      <View style={styles.info}>
        <Text style={styles.precio}>{formatearPrecio(propiedad.precio)}</Text>
        <Text style={styles.direccion} numberOfLines={1}>
          {propiedad.direccion}
        </Text>

        <View style={styles.specsRow}>
          <Text style={styles.specText}>{propiedad.habitaciones} Habitaciones</Text>
          <Text style={styles.specDot}>·</Text>
          <Text style={styles.specText}>{propiedad.banos} Baños</Text>
        </View>

        <Pressable
          style={styles.detalleBtn}
          onPress={() => onVerDetalles(propiedad)}
        >
          <Text style={styles.detalleBtnText}>Ver detalles</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: scale(260),
    backgroundColor: colors.white,
    borderRadius: radii.md,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  closeBtn: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    zIndex: 3,
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    position: "absolute",
    top: spacing.xs,
    left: spacing.xs,
    zIndex: 3,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },

  badgeText: {
    color: colors.white,
    fontSize: fontSizes.overline,
    fontFamily: "Poppins_700Bold",
  },

  image: {
    width: "100%",
    height: verticalScale(140),
    backgroundColor: colors.divider,
  },

  info: {
    padding: spacing.sm,
    gap: 4,
  },

  precio: {
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.semibold,
    color: colors.titles,
    fontFamily: "Poppins_700Bold",
  },

  direccion: {
    fontSize: fontSizes.body2,
    color: colors.typography,
    fontFamily: "Poppins_400Regular",
  },

  specsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },

  specText: {
    fontSize: fontSizes.overline,
    color: colors.typography,
    fontFamily: "Poppins_400Regular",
  },

  specDot: {
    color: colors.typography,
  },

  detalleBtn: {
    marginTop: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: verticalScale(10),
    alignItems: "center",
  },

  detalleBtnText: {
    color: colors.white,
    fontSize: fontSizes.body2,
    fontFamily: "Poppins_700Bold",
  },
});