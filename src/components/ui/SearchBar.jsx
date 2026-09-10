// ============================================================
//   SEARCH BAR — Buscador con ícono de lupa + botón de filtros
// ============================================================
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors, fontSizes, radii, spacing } from "@/constants/theme-houseloop";
import IconSearch from "../../../assets/icons/icon-search.svg";
import IconTune from "../../../assets/icons/icon-tune.svg";

export default function SearchBar({ value, onChangeText, onFilterPress }) {
  return (
    <View style={styles.row}>
      <View style={styles.inputWrapper}>
        <View style={styles.iconLeft}>
          <IconSearch width={20} height={20} fill={colors.white} />
        </View>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="Buscar propiedades..."
          placeholderTextColor={colors.typography}
        />
      </View>

      <Pressable style={styles.filterBtn} onPress={onFilterPress}>
        <IconTune width={20} height={20} fill={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  inputWrapper: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    height: 44,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  iconLeft: {
    position: "absolute",
    left: spacing.md,
    zIndex: 1,
  },

  input: {
    flex: 1,
    fontSize: fontSizes.body1,
    color: colors.white,
    fontFamily: "Poppins_400Regular",
    paddingLeft: spacing.md + 20 + spacing.sm, // espacio para el ícono
  },

  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});