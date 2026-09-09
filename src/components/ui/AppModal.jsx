// ============================================================
//   APP MODAL — Modal reutilizable de confirmación / feedback
//   Sirve para casos como "¿salir sin guardar?" o "¡éxito!"
//   El contenido se pasa por props: título, subtítulo, ícono
//   y hasta 2 botones (outline + primary).
// ============================================================
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes, fontWeights, radii, spacing } from '@/constants/theme-houseloop';

export default function AppModal({
  visible,
  onRequestClose,
  icon = null,           // opcional: <IconCheck .../> u otro ícono, ya con su tamaño/fill
  title,
  subtitle,              // opcional
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          {icon && <View style={styles.checkCircle}>{icon}</View>}

          <Text style={styles.modalTitle}>{title}</Text>
          {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}

          <View style={styles.modalButtonsRow}>
            {secondaryLabel && (
              <Pressable
                style={[styles.modalBtn, styles.modalBtnOutline]}
                onPress={onSecondaryPress}
              >
                <Text style={styles.modalBtnOutlineText}>{secondaryLabel}</Text>
              </Pressable>
            )}
            {primaryLabel && (
              <Pressable
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={onPrimaryPress}
              >
                <Text style={styles.modalBtnPrimaryText}>{primaryLabel}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: colors.titles,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
  },
  modalSubtitle: {
    fontSize: fontSizes.body2,
    color: colors.typography,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    marginBottom: spacing.sm,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
  },
  modalBtnPrimaryText: {
    color: colors.white,
    fontWeight: fontWeights.bold,
    fontFamily: 'Poppins_700Bold',
    fontSize: fontSizes.body2,
  },
  modalBtnOutline: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  modalBtnOutlineText: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
    fontFamily: 'Poppins_700Bold',
    fontSize: fontSizes.body2,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});