// ============================================================
//   INPUT — Componente reutilizable
//   Equivalente de .input-group en components.css
//   Campo de texto con label flotante e ícono 
//
//   Props opcionales nuevas (no afectan a login ni signup):
//     maxLength        máximo de caracteres del campo
//     contenedorStyle  estilos extra para la caja (ej. quitar el marginBottom)
//     onBlurExternal   función que se ejecuta cuando el campo pierde la selección
//     ref              referencia al TextInput, para poder enfocarlo desde afuera
// ============================================================

import { colors, fontSizes, radii, spacing } from '@/constants/theme-houseloop';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TextInput, View } from 'react-native';

export default function Input({
  label,
  icon,
  iconActive,
  secureTextEntry,
  keyboardType,
  value,
  onChangeText,
  onFocusExternal,
  onBlurExternal,
  maxLength,
  contenedorStyle,
  ref,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  // ── Animación del label flotante ──
  const animateLabel = (toValue) => {
    Animated.timing(labelAnim, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };
  // Vigila el valor del input: si cambia desde AFUERA del componente
  // (ej: AsyncStorage llenando el correo automáticamente), sube el label
  // igual que si el usuario lo hubiera tocado con el dedo
  useEffect(() => {
    if (value) {
      animateLabel(1);
    } else if (!isFocused) {
      animateLabel(0);
    }
  }, [value]);
  const handleFocus = () => {
    setIsFocused(true);
    animateLabel(1);
    if (onFocusExternal) onFocusExternal();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) animateLabel(0);
    if (onBlurExternal) onBlurExternal();
  };

  // ── Interpolaciones del label ──
  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, -10],
  });

  const labelSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [fontSizes.body2, fontSizes.body3],
  });

  const labelColor = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.typography, colors.primary],
  });

  return (
    <View
      style={[
        styles.inputGroup,
        isFocused && styles.inputGroupFocused,
        contenedorStyle,
      ]}
    >

      {/* Label flotante */}
      <Animated.Text
        style={[
          styles.label,
          { top: labelTop, fontSize: labelSize, color: labelColor }
        ]}
      >
        {label}
      </Animated.Text>

      {/* Input */}
      <TextInput
        ref={ref}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        maxLength={maxLength}
        placeholderTextColor="transparent"
      />

      {/* Ícono derecho */}
        {icon && (
          <View style={styles.iconWrapper}>
            {isFocused && iconActive ? iconActive : icon}
          </View>
        )}

    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 56,
    position: 'relative',
  
  },
  inputGroupFocused: {
    borderColor: colors.primary,
  },
  label: {
    position: 'absolute',
    left: spacing.md,
    backgroundColor: colors.white,
    paddingHorizontal: 4,
    zIndex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: fontSizes.body2,
    fontcolor: colors.typography,
    transition: 'all 0.2s ease-in-out',
    //backgroundColor: '#664e4e',
  },
  input: {
    flex: 1,
    fontSize: fontSizes.body2,
    color: colors.titles,
    fontFamily: 'Poppins_400Regular',
    paddingTop: 8,
  },
  iconWrapper: {
    marginLeft: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});