import { router } from 'expo-router';
import { useState } from 'react';
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
  const [activeNav, setActiveNav] = useState('inicio');

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
      <Pressable
        style={({ pressed }) => [
          styles.navItem,
          { width: 40, },
          pressed && styles.navItemPressed,
        ]}
        onPress={() => setActiveNav('inicio')}
      >
        {activeNav === 'inicio'
          ? <IconHomeFilled width={24} height={24} fill={colors.primary} />
          : <IconHomeOutlined width={24} height={24} fill={colors.primary} opacity={0.55}  />}

        <Text
            style={[
              styles.navLabel,
              activeNav === 'inicio'
                ? styles.navLabelActive
                : styles.navLabelInactive,
            ]}
        >
          Inicio
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.navItem,
          { width: 60,},
          pressed && styles.navItemPressed,
        ]}
        onPress={() => setActiveNav('explorar')}
      >
        {activeNav === 'explorar'
          ? <IconLocationFilled width={24} height={24} fill={colors.primary} />
          : <IconLocationOutlined width={24} height={24} fill={colors.primary} opacity={0.55} />}

        <Text
            style={[
              styles.navLabel,
              activeNav === 'explorar'
                ? styles.navLabelActive
                : styles.navLabelInactive,
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
          { width: 50,},
          pressed && styles.navItemPressed,
        ]}
        onPress={() => setActiveNav('buscar')}
      >
        <IconSearch
          width={24}
          height={24}
          fill={activeNav === 'buscar' ? colors.primary : colors.primary}
          opacity={activeNav === 'buscar' ? 1 : 0.55}
        />
      
        <Text
            style={[
              styles.navLabel,
              activeNav === 'buscar'
                ? styles.navLabelActive
                : styles.navLabelInactive,
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
        onPress={() => setActiveNav('perfil')}
      >
        {activeNav === 'perfil'
          ? <IconProfileFilled width={24} height={24} fill={colors.primary} />
          : <IconProfileOutlined width={24} height={24} fill={colors.primary} opacity={0.55} />}

          <Text
            style={[
              styles.navLabel,
              activeNav === 'perfil'
                ? styles.navLabelActive
                : styles.navLabelInactive,
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