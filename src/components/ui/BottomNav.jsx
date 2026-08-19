import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  colors,
  fontSizes,
  moderateScale,
  radii,
  scale,
  verticalScale,
} from '@/constants/theme-houseloop';

// Íconos SVG
import IconAdd from '../../../assets/icons/icon-add.svg';
import IconHomeFilled from '../../../assets/icons/icon-home-filled.svg';
import IconHomeOutlined from '../../../assets/icons/icon-home-outlined.svg';
import IconLocationFilled from '../../../assets/icons/icon-location-filled.svg';
import IconLocationOutlined from '../../../assets/icons/icon-location-outlined.svg';
import IconProfileFilled from '../../../assets/icons/icon-profile-filled.svg';
import IconProfileOutlined from '../../../assets/icons/icon-profile-outlined.svg';
import IconSearch from '../../../assets/icons/icon-search.svg';

export default function BottomNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname(); // ruta actual real, ej: "/feed"

  const isActive = (route) => pathname === route || pathname.startsWith(route + '/');

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
      <Pressable
        style={({ pressed }) => [
          styles.navItem,
          { width: 40 },
          pressed && styles.navItemPressed,
        ]}
        onPress={() => router.push('/feed')}
      >
        {isActive('/feed')
          ? <IconHomeFilled width={24} height={24} fill={colors.primary} />
          : <IconHomeOutlined width={24} height={24} fill={colors.primary} opacity={0.55} />}
        <Text
          style={[
            styles.navLabel,
            isActive('/feed') ? styles.navLabelActive : styles.navLabelInactive,
          ]}
        >
          Inicio
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.navItem,
          { width: 60 },
          pressed && styles.navItemPressed,
        ]}
        onPress={() => router.push('/explore')}
      >
        {isActive('/explore')
          ? <IconLocationFilled width={24} height={24} fill={colors.primary} />
          : <IconLocationOutlined width={24} height={24} fill={colors.primary} opacity={0.55} />}
        <Text
          style={[
            styles.navLabel,
            isActive('/explore') ? styles.navLabelActive : styles.navLabelInactive,
          ]}
        >
          Explorar
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.navAdd,
          pressed && styles.navAddPressed,
        ]}
        onPress={() => router.push('/publish')}
      >
        <IconAdd width={20} height={20} fill={colors.white} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.navItem,
          { width: 50 },
          pressed && styles.navItemPressed,
        ]}
        onPress={() => router.push('/search')}
      >
        <IconSearch
          width={24}
          height={24}
          fill={colors.primary}
          opacity={isActive('/search') ? 1 : 0.55}
        />
        <Text
          style={[
            styles.navLabel,
            isActive('/search') ? styles.navLabelActive : styles.navLabelInactive,
          ]}
        >
          Buscar
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.navItem,
          { width: 40 },
          pressed && styles.navItemPressed,
        ]}
        onPress={() => router.push('/profile')}
      >
        {isActive('/profile')
          ? <IconProfileFilled width={24} height={24} fill={colors.primary} />
          : <IconProfileOutlined width={24} height={24} fill={colors.primary} opacity={0.55} />}
        <Text
          style={[
            styles.navLabel,
            isActive('/profile') ? styles.navLabelActive : styles.navLabelInactive,
          ]}
        >
          Perfil
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: verticalScale(58),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(32),
    zIndex: 20,
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  navItemPressed: {
    opacity: 0.7,
  },

  navLabel: {
    fontSize: moderateScale(fontSizes.overline),
    color: colors.typography,
    fontFamily: 'Poppins_400Regular',
  },
  navLabelInactive: {
    color: colors.primary,
    opacity: 0.55,
  },
  navLabelActive: {
    color: colors.primary,
    opacity: 1,
  },

  navAdd: {
    width: scale(38),
    height: scale(38),
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navAddPressed: {
    backgroundColor: colors.primaryHover,
  },
});