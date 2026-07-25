// ============================================================
//   DIVIDER — Componente reutilizable
//   Equivalente de .divider en login.css
//   Línea separadora con texto en el centro, usada en la pantalla de login
// ============================================================

import { colors, fontSizes, spacing } from '@/constants/theme-houseloop';
import { StyleSheet, Text, View } from 'react-native';

export default function Divider({ text = 'O conectarse con' }) {
  return (
    <View style={styles.divider}>
      <View style={styles.line} />
      <Text style={styles.text}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  text: {
    marginHorizontal: 12,
    fontSize: fontSizes.body3,
    color: colors.typography,
    fontFamily: 'Poppins_400Regular',
  },
});