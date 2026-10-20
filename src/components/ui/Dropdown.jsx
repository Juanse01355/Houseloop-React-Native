// ============================================================
//   DROPDOWN — Lista desplegable reutilizable
//   Se ve como el Input (borde, label flotante, ícono a la derecha)
//   pero al tocarla abre una hoja inferior con las opciones.
//
//   Guarda este archivo en: src/components/ui/Dropdown.jsx
//
//   Uso:
//     <Dropdown
//       label="Tipo de oferta"
//       valor={tipoOferta}
//       opciones={[{ label: 'Venta', value: 'venta' }, { label: 'Arriendo', value: 'arriendo' }]}
//       onChange={setTipoOferta}
//     />
//
//   Props:
//     label        texto del label (flota arriba cuando hay un valor)
//     titulo       título de la hoja inferior (por defecto, el label)
//     valor        valor seleccionado actualmente
//     opciones     lista de opciones: ['A', 'B']  o  [{ label, value }]
//     opcionVacia  texto de una primera opción con valor '' (ej. "Sin preferencia")
//     onChange     función que recibe el nuevo valor
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, radii, spacing } from '@/constants/theme-houseloop';

export default function Dropdown({ label, titulo, valor, opciones, opcionVacia, onChange }) {
  const insets = useSafeAreaInsets();
  const [abierto, setAbierto] = useState(false);

  // Acepta opciones como texto simple o como { label, value }
  const normalizadas = opciones.map((o) =>
    typeof o === 'string' ? { label: o, value: o } : o
  );
  const lista = opcionVacia
    ? [{ label: opcionVacia, value: '' }, ...normalizadas]
    : normalizadas;

  // Igual que Input: el label sube (y se pone rosado) cuando hay un valor;
  // si no hay valor, se queda adentro como si fuera el placeholder
  const seleccionada = lista.find((o) => o.value === valor);
  const textoMostrado = seleccionada ? seleccionada.label : '';
  const flotante = Boolean(textoMostrado);

  const elegir = (nuevo) => {
    onChange(nuevo);
    setAbierto(false);
  };

  return (
    <>
      <Pressable
        style={[styles.dropdown, abierto && styles.dropdownActivo]}
        onPress={() => setAbierto(true)}
      >
        <Text
          style={[styles.dropLabel, flotante ? styles.dropLabelFlotante : styles.dropLabelBase]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text style={styles.dropdownTexto} numberOfLines={1}>
          {textoMostrado}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.typography} />
      </Pressable>

      <Modal
        visible={abierto}
        transparent
        animationType="slide"
        onRequestClose={() => setAbierto(false)}
      >
        <View style={styles.dropOverlay}>
          {/* Fondo oscuro: tocarlo cierra la lista */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAbierto(false)} />

          <View style={[styles.dropSheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.dropHandle} />
            <Text style={styles.dropTitulo}>{titulo || label}</Text>

            {lista.map((op) => {
              const activa = op.value === valor;
              return (
                <Pressable
                  key={op.value || op.label}
                  style={styles.dropOpcion}
                  onPress={() => elegir(op.value)}
                >
                  <Text style={[styles.dropOpcionTexto, activa && styles.dropOpcionActiva]}>
                    {op.label}
                  </Text>
                  {activa && <MaterialIcons name="check" size={20} color={colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  dropdownActivo: {
    borderColor: colors.primary,
  },
  dropLabel: {
    position: 'absolute',
    left: spacing.md,
    right: 48,
    backgroundColor: colors.white,
    paddingHorizontal: 4,
    zIndex: 1,
    fontFamily: 'Poppins_400Regular',
  },
  dropLabelBase: {
    top: 16,
    fontSize: fontSizes.body2,
    color: colors.typography,
  },
  dropLabelFlotante: {
    top: -10,
    right: undefined,
    fontSize: fontSizes.body3,
    color: colors.primary,
  },
  dropdownTexto: {
    flex: 1,
    fontSize: fontSizes.body2,
    color: colors.titles,
    fontFamily: 'Poppins_400Regular',
    paddingTop: 8,
  },
  dropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dropSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  dropHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  dropTitulo: {
    fontSize: fontSizes.h3,
    fontWeight: '700',
    color: colors.titles,
    marginBottom: spacing.sm,
  },
  dropOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  dropOpcionTexto: {
    flex: 1,
    fontSize: fontSizes.body1,
    color: colors.titles,
  },
  dropOpcionActiva: {
    color: colors.primary,
    fontWeight: '700',
  },
});