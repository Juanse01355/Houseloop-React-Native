import {
  colors,
  fontSizes,
  fontWeights,
  radii,
  spacing,
} from '@/constants/theme-houseloop';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// ============================================================
//   BUTTON — Componente reutilizable
// ============================================================

export function ButtonPrimary({ text, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        pressed && !disabled && styles.btnPressed,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text style={styles.btnText}>{text}</Text>
    </Pressable>
  );
}

export function ButtonSecondary({ text, onPress, disabled }) {
  return (
    <Pressable
          onPress={onPress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.btnSecondary,
            pressed && !disabled && styles.btnSecondaryPressed,
            disabled && styles.btnSecondaryDisabled,
          ]}
        >
          {({ pressed }) => (
            <Text
              style={[
                styles.btnSecondaryText,
                pressed && !disabled && styles.btnSecondaryTextPressed,
              ]}
            >
              {text}
            </Text>
          )}
    </Pressable>
  );
}

export function ButtonIcon({ text, icon, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btnIcon,
        pressed && !disabled && styles.btnPressed,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text style={styles.btnText}>{text}</Text>

      <View style={styles.iconWrapper}>
        {icon}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // ==========================
  // Botón primario
  // ==========================

  btn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },

  btnPressed: {
    backgroundColor: colors.primaryHover,
  },

  btnDisabled: {
    backgroundColor: colors.primaryDisabled,
    opacity: 0.6,
  },

  btnText: {
    fontSize: fontSizes.h3,
    fontWeight: 400,
    color: colors.white,
    fontFamily: 'Poppins_700Bold',
  },

  // ==========================
  // Botón secundario
  // ==========================

  btnSecondary: {
    width: '100%',
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnSecondaryPressed: {
    borderColor: colors.primaryHover,
  },

  btnSecondaryDisabled: {
    borderColor: colors.primaryDisabled,
    opacity: 0.6,
  },

  btnSecondaryText: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    fontFamily: 'Poppins_400Bold',
  },

  btnSecondaryTextPressed: {
    color: colors.primaryHover,
  },

  // ==========================
  // Botón con ícono
  // ==========================

  btnIcon: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,

    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },

  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});