// ============================================================
//   CHIP — Componente reutilizable con estado normal y presionado
//   Usado por ejemplo en el selector de ciudad de la pantalla Buscar.
//   Normal:     fondo blanco 8% opacidad  + ícono outline
//   Presionado: fondo blanco 24% opacidad + ícono filled
// ============================================================
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fontSizes, fontWeights, radii, spacing } from "@/constants/theme-houseloop";
import IconLocationOutline from "../../../assets/icons/icon-location-outlined.svg";
import IconLocationFilled from "../../../assets/icons/icon-location-filled.svg";
export default function Chip({ label, selected = false, onPress }) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      {selected ? (
        <IconLocationFilled width={24} height={24} fill={colors.white} />
      ) : (
        <IconLocationOutline width={24} height={24} fill={colors.white} />
      )}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  chipSelected: {
    backgroundColor: "rgba(255,255,255,0.24)",
  },

  label: {
    fontSize: fontSizes.body2,
    fontWeight: fontWeights.medium,
    color: colors.white,
    fontFamily: "Poppins_700Bold",
  },
});