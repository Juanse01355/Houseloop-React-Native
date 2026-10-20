// ============================================================
//   HOUSELOOP — Configuración de Toasts
//   6 tipos: success (verde), error (rojo),
//            warning (amarillo), info (azul),
//            copiado (ícono de copiar),
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
import IconCopy from '../../assets/icons/icon-content-copy.svg'; // * hay que agregarlo en assets/icons
import IconHand from '../../assets/icons/icon-hand.svg'; // * hay que agregarlo en assets/icons (sesión cerrada)
import Toast from 'react-native-toast-message';

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

// ── Toast tipo píldora oscura (estilo WhatsApp): ícono + texto, ancho ajustado ──
function ToastPildora({ text1, IconComponent }) {
  return (
    <View style={styles.pildoraWrapper} pointerEvents="none">
      <View style={styles.pildora}>
        <IconComponent width={26} height={26} fill={colors.white} style={styles.pildoraIcon} />
        <Text style={styles.pildoraText} numberOfLines={1}>{text1}</Text>
      </View>
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
  // ── Toast genérico tipo píldora oscura (estilo WhatsApp) ──
  // El ícono se pasa al llamarlo: Toast.show({ type: 'pildora', props: { Icono: MiIcono } })
  // Si no se pasa ninguno, usa el check de éxito.
  pildora: ({ text1, props }) => (
    <ToastPildora text1={text1} IconComponent={props?.Icono ?? IconCheckCircle} />
  ),
  // ── Toast de "copiado": ya existía y se usa en detail.jsx, sigue igual ──
  copiado: (props) => (
    <ToastPildora text1={props.text1} IconComponent={IconCopy} />
  ),
  // ── Toast de bienvenida, sin ícono, solo texto/emojis ──
  bienvenida: (props) => (
    <ToastSinIcono text1={props.text1} />
  ),
};

// ── Catálogo de toasts rápidos (píldora oscura) ──
// Cada uno tiene su texto y su ícono. Los que no llevan ícono propio usan el check.
const TOASTS_RAPIDOS = {
  disponibilidad: { text1: 'Disponibilidad actualizada', Icono: IconCheckCircle },
  propiedadEliminada: { text1: 'Propiedad eliminada con éxito', Icono: IconCheckCircle },
  fotoPerfil: { text1: 'Foto de perfil actualizada', Icono: IconCheckCircle },
  cambiosGuardados: { text1: 'Cambios guardados', Icono: IconCheckCircle },
  videoAgregado: { text1: 'Video agregado', Icono: IconCheckCircle },
  fotosAgregadas: { text1: 'Fotos agregadas', Icono: IconCheckCircle },
  sesionCerrada: { text1: 'Te esperamos pronto', Icono: IconHand },
};

// Muestra uno de los toasts del catálogo:
//   mostrarToast('sesionCerrada');
//   mostrarToast('fotosAgregadas', '3 fotos agregadas');   // texto opcional distinto
export function mostrarToast(clave, texto) {
  const toast = TOASTS_RAPIDOS[clave];
  if (!toast) return;

  Toast.show({
    type: 'pildora',
    text1: texto ?? toast.text1,
    position: 'bottom',
    bottomOffset: 80,
    visibilityTime: 2000,
    props: { Icono: toast.Icono },
  });
}

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

  // ── Estilos del toast "copiado" (píldora oscura, estilo WhatsApp) ──
  pildoraWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  pildora: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(32, 32, 32, 0.95)',
    borderRadius: radii.sm,        // mismas esquinas que los otros toasts
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pildoraIcon: {
    marginRight: spacing.sm,
  },
  pildoraText: {
    fontSize: fontSizes.h3,        // misma fuente y tamaño que los otros toasts
    fontFamily: 'Poppins_600Semibold',
    color: colors.white,
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
