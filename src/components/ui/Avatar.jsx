// ============================================================
//   AVATAR — Componente reutilizable y dinámico
//   Muestra la foto de perfil del usuario o un ícono vacío
//   cuando el usuario no tiene foto registrada.
//   Tamaños disponibles: xs(28) | sm(40) | md(52) | xxl(116)
// ============================================================

import { colors, radii } from '@/constants/theme-houseloop';
import { Image, StyleSheet, View } from 'react-native';
import IconPerson from '../../../assets/icons/icon-person-outlined.svg';

// ── Tamaños del avatar según el contexto de uso ──
const SIZES = {
  xs:  28,   // nav inferior
  sm:  40,   // feed, tarjetas
  md:  52,   // listados, comentarios
  xxl: 116,  // pantalla de perfil
};

export default function Avatar({ uri, size = 'md' }) {
  const dimension = SIZES[size];

  // ── Tamaño del ícono vacío proporcional al avatar ──
  const iconSize = dimension * 0.5;

  return (
    <View
      style={[
        styles.container,
        {
          width:  dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
      ]}
    >
      {uri ? (
        // ── Con foto: muestra la imagen del usuario ──
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width:  dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
          resizeMode="cover"
        />
      ) : (
        // ── Sin foto: muestra el ícono de persona ──
        <IconPerson
          width={iconSize}
          height={iconSize}
          fill={colors.primary}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
});