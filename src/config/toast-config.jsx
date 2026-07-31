// ============================================================
//   HOUSELOOP — Configuración de Toasts
//   4 tipos: success (verde), error (rojo),
//            warning (amarillo), info (azul)
//   Diseño simple: ícono SVG + texto en una sola línea
// ============================================================

import { colors, fontSizes, radii, spacing } from '@/constants/theme-houseloop';
import { StyleSheet, Text, View } from 'react-native';

// Íconos SVG
import IconCheckCircle from '../../assets/icons/icon-check-circle.svg';
import IconError from '../../assets/icons/icon-error.svg';
import IconWarning from '../../assets/icons/icon-warning.svg';
import IconInfo from '../../assets/icons/icon-info.svg';

// ── Componente base reutilizable para los 4 tipos ──
function ToastBase({ text1, IconComponent, iconColor }) {
  return (
    <View style={styles.container}>
      <IconComponent width={26} height={26} fill={iconColor} style={styles.icon} />
      <Text style={styles.text} numberOfLines={2}>{text1}</Text>
    </View>
  );
}

// ── Configuración exportada: los 4 tipos disponibles ──
export const toastConfig = {
  success: (props) => (
    <ToastBase text1={props.text1} IconComponent={IconCheckCircle} iconColor="#22C55E" />
  ),
  error: (props) => (
    <ToastBase text1={props.text1} IconComponent={IconError} iconColor="#EF4444" />
  ),
  warning: (props) => (
    <ToastBase text1={props.text1} IconComponent={IconWarning} iconColor="#F59E0B" />
  ),
  info: (props) => (
    <ToastBase text1={props.text1} IconComponent={IconInfo} iconColor="#3B82F6" />
  ),
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.sm,        // esquinas más redondeadas
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: fontSizes.h3,
    fontFamily: 'Poppins_600Semibold',
    color: colors.titles,
  },
});