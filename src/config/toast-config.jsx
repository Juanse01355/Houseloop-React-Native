// ============================================================
//   HOUSELOOP — Configuración de Toasts
//   5 tipos: success (verde), error (rojo),
//            warning (amarillo), info (azul),
//            bienvenida (sin ícono, solo texto/emojis)
//   Diseño simple: ícono SVG + texto en una sola línea
// ============================================================

import { colors, fontSizes, radii, spacing } from '@/constants/theme-houseloop';
import { StyleSheet, Text, View } from 'react-native';

// Íconos SVG
import IconCheckCircle from '../../assets/icons/icon-check-circle.svg';
import IconError from '../../assets/icons/icon-error.svg';
import IconWarning from '../../assets/icons/icon-warning.svg';
import IconInfo from '../../assets/icons/icon-info.svg';

// ── Componente base reutilizable para los tipos con ícono ──
function ToastBase({ text1, IconComponent, iconColor }) {
  return (
    <View style={styles.container}>
      <IconComponent width={26} height={26} fill={iconColor} style={styles.icon} />
      <Text style={styles.text} numberOfLines={2}>{text1}</Text>
    </View>
  );
}

// ── Toast sin ícono: solo texto centrado (para bienvenida con emojis) ──
function ToastSinIcono({ text1 }) {
  return (
    <View style={styles.containerSinIcono}>
      <Text style={styles.textSinIcono} numberOfLines={2}>{text1}</Text>
    </View>
  );
}

// ── Configuración exportada: los tipos disponibles ──
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
  // ── Nuevo: toast de bienvenida, sin ícono, solo texto/emojis ──
  bienvenida: (props) => (
    <ToastSinIcono text1={props.text1} />
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

  // ── Estilos del toast de bienvenida (sin ícono) ──
  containerSinIcono: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  textSinIcono: {
    textAlign: 'center',
    fontSize: fontSizes.h3,
    fontFamily: 'Poppins_600Semibold',
    color: colors.titles,
  },
});
