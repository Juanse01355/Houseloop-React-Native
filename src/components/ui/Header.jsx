// ============================================================
//   HEADER — Componente reutilizable
//   Equivalente de .header en components.css
//   Muestra el logo de HouseLoop con sombra inferior
// ============================================================

import { colors, layout, shadows, spacing } from '@/constants/theme-houseloop';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '../../../assets/images/logo.svg';

export default function Header() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          minHeight: layout.headerH + insets.top,
        },
      ]}
    >
      <View style={styles.logo}>
        <Logo width={120} height={28} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: layout.headerH,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    justifyContent: 'center',
    ...shadows.sm,
  },
  logo: {
    height: 28,
    justifyContent: 'center',
  },
});