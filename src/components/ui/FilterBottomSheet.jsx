// ============================================================
//   FILTER BOTTOM SHEET — Hoja inferior con filtros de búsqueda
//   Modo claro, mismo estilo que Input.jsx. Precio (min/max con
//   Input + rangos rápidos), tipo de inmueble y disponibilidad
//   (dropdown con ícono icon-arrow-down).
// ============================================================
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  colors,
  fontSizes,
  fontWeights,
  radii,
  spacing,
} from "@/constants/theme-houseloop";
import Input from "@/components/ui/Input";
import IconArrowDown from "../../../assets/icons/icon-arrow-down.svg";

const TIPOS_INMUEBLE = ["apartamento", "casa", "local", "lote"];

// value = lo que guarda el filtro (igual que p.estado en la BD)
const DISPONIBILIDADES = [
  { value: "disponible", label: "Disponible" },
  { value: "en_negociacion", label: "En negociación" },
];

const RANGOS_PRECIO = [
  { label: "Hasta 100M", min: 0, max: 100000000 },
  { label: "100M - 300M", min: 100000000, max: 300000000 },
  { label: "300M - 600M", min: 300000000, max: 600000000 },
];

export const FILTROS_VACIOS = {
  precioMin: "",
  precioMax: "",
  tipoInmueble: null,
  estado: null,
};

export default function FilterBottomSheet({
  visible,
  onClose,
  initialFilters,
  onApply,
}) {
  const [filtros, setFiltros] = useState(initialFilters || FILTROS_VACIOS);
  const [tipoAbierto, setTipoAbierto] = useState(false);
  const [estadoAbierto, setEstadoAbierto] = useState(false);

  // Cada vez que se abre el sheet, partimos de los filtros ya aplicados
  useEffect(() => {
    if (visible) {
      setFiltros(initialFilters || FILTROS_VACIOS);
      setTipoAbierto(false);
      setEstadoAbierto(false);
    }
  }, [visible]);

  const estadoSeleccionado = DISPONIBILIDADES.find(
    (d) => d.value === filtros.estado,
  );

  const aplicarRangoRapido = (rango) => {
    setFiltros((prev) => ({
      ...prev,
      precioMin: rango.min ? String(rango.min) : "",
      precioMax: rango.max ? String(rango.max) : "",
    }));
  };

  const handleBuscar = () => {
    onApply(filtros);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Filtrar propiedades</Text>

            {/* ── Precio ── */}
            <Text style={styles.sectionLabel}>Precio</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceInputWrapper}>
                <Input
                  label="Mínimo"
                  keyboardType="numeric"
                  maxLength={9}
                  value={filtros.precioMin}
                  onChangeText={(text) =>
                    setFiltros((prev) => ({
                      ...prev,
                      precioMin: text.replace(/[^0-9]/g, "").slice(0, 9),
                    }))
                  }
                />
              </View>
              <View style={styles.priceInputWrapper}>
                <Input
                  label="Máximo"
                  keyboardType="numeric"
                  maxLength={9}
                  value={filtros.precioMax}
                  onChangeText={(text) =>
                    setFiltros((prev) => ({
                      ...prev,
                      precioMax: text.replace(/[^0-9]/g, "").slice(0, 9),
                    }))
                  }
                />
              </View>
            </View>

            <View style={styles.chipsWrap}>
              {RANGOS_PRECIO.map((rango) => (
                <Pressable
                  key={rango.label}
                  style={styles.rangeChip}
                  onPress={() => aplicarRangoRapido(rango)}
                >
                  <Text style={styles.rangeChipText}>{rango.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* ── Tipo de inmueble ── */}
            <Text style={styles.sectionLabel}>Tipo de inmueble</Text>
            <Pressable
              style={styles.selectField}
              onPress={() => setTipoAbierto(!tipoAbierto)}
            >
              <Text style={styles.selectFieldText}>
                {filtros.tipoInmueble || "Cualquiera"}
              </Text>
              <View style={styles.selectIconWrapper}>
                <IconArrowDown width={16} height={16} fill={colors.typography} />
              </View>
            </Pressable>

            {tipoAbierto && (
              <View style={styles.optionsList}>
                <Pressable
                  style={styles.optionItem}
                  onPress={() => {
                    setFiltros((prev) => ({ ...prev, tipoInmueble: null }));
                    setTipoAbierto(false);
                  }}
                >
                  <Text style={styles.optionText}>Cualquiera</Text>
                </Pressable>
                {TIPOS_INMUEBLE.map((tipo) => (
                  <Pressable
                    key={tipo}
                    style={styles.optionItem}
                    onPress={() => {
                      setFiltros((prev) => ({ ...prev, tipoInmueble: tipo }));
                      setTipoAbierto(false);
                    }}
                  >
                    <Text style={styles.optionText}>{tipo}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* ── Disponibilidad ── */}
            <Text style={styles.sectionLabel}>Disponibilidad</Text>
            <Pressable
              style={styles.selectField}
              onPress={() => setEstadoAbierto(!estadoAbierto)}
            >
              <Text style={styles.selectFieldText}>
                {estadoSeleccionado?.label || "Cualquiera"}
              </Text>
              <View style={styles.selectIconWrapper}>
                <IconArrowDown width={16} height={16} fill={colors.typography} />
              </View>
            </Pressable>

            {estadoAbierto && (
              <View style={styles.optionsList}>
                <Pressable
                  style={styles.optionItem}
                  onPress={() => {
                    setFiltros((prev) => ({ ...prev, estado: null }));
                    setEstadoAbierto(false);
                  }}
                >
                  <Text style={styles.optionText}>Cualquiera</Text>
                </Pressable>
                {DISPONIBILIDADES.map((d) => (
                  <Pressable
                    key={d.value}
                    style={styles.optionItem}
                    onPress={() => {
                      setFiltros((prev) => ({ ...prev, estado: d.value }));
                      setEstadoAbierto(false);
                    }}
                  >
                    <Text style={styles.optionText}>{d.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>

          <Pressable style={styles.searchBtn} onPress={handleBuscar}>
            <Text style={styles.searchBtnText}>Buscar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "85%",
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.medium,
    color: colors.titles,
    fontFamily: "Poppins_700Bold",
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSizes.body3,
    fontWeight: fontWeights.medium,
    color: colors.titles,
    fontFamily: "Poppins_700Bold",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  priceInputWrapper: {
    flex: 1,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  rangeChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  rangeChipText: {
    fontSize: fontSizes.body3,
    color: colors.titles,
    fontFamily: "Poppins_400Regular",
  },
  selectField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 58,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  selectFieldText: {
    fontSize: fontSizes.body2,
    color: colors.titles,
    fontFamily: "Poppins_400Regular",
    textTransform: "capitalize",
  },
  selectIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  optionsList: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  optionItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionText: {
    fontSize: fontSizes.body2,
    color: colors.titles,
    fontFamily: "Poppins_400Regular",
    textTransform: "capitalize",
  },
  searchBtn: {
    height: 58,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  searchBtnText: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: colors.white,
    fontFamily: "Poppins_700Bold",
  },
});