// ============================================================
//   SEARCH SCREEN — Módulo de Buscar
//   Fila de chips de ciudad + grid con todas las propiedades
//   registradas en la base de datos (por ahora, San Juan de Pasto).
// ============================================================
import BottomNav from '@/components/ui/BottomNav';
import Chip from '@/components/ui/Chip';
import PropertySearchGrid from '@/components/ui/PropertySearchGrid';
import { BASE_URL } from '@/config/api';
import { colors, darkColors, fontSizes, fontWeights, spacing } from '@/constants/theme-houseloop';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CIUDAD_PRINCIPAL = 'San Juan de Pasto';

const CIUDADES = [
  CIUDAD_PRINCIPAL,
  'San Pablo',
  'La Union',
  'El Tambo',
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [ciudad, setCiudad] = useState(CIUDAD_PRINCIPAL);
  const [propiedades, setPropiedades] = useState([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function cargarFeed() {
        try {
          setCargando(true);

          const response = await fetch(`${BASE_URL}/propiedades/feed`);
          const data = await response.json();

          if (!response.ok) {
            console.error('Error al obtener el feed:', data);
            setPropiedades([]);
            return;
          }

          const vistas = new Map();
          data.forEach((fila) => {
            if (!vistas.has(fila.id_propiedad)) {
              vistas.set(fila.id_propiedad, fila);
            }
          });

          setPropiedades(Array.from(vistas.values()));
        } catch (error) {
          console.error('Error al cargar el feed:', error);
          setPropiedades([]);
        } finally {
          setCargando(false);
        }
      }

      cargarFeed();
    }, []),
  );

  const esCiudadPrincipal = ciudad === CIUDAD_PRINCIPAL;
  const propiedadesFiltradas = esCiudadPrincipal ? propiedades : [];

  let contenido;
  if (cargando) {
    contenido = <ActivityIndicator color={colors.primary} style={styles.loader} />;
  } else if (!esCiudadPrincipal) {
    contenido = (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Aún no hay diseño para esta ciudad</Text>
        <Text style={styles.emptySubtitle}>
          Falta diseñar el estado vacío para {ciudad}.
        </Text>
      </View>
    );
  } else if (propiedadesFiltradas.length === 0) {
    contenido = (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No hay publicaciones todavía</Text>
        <Text style={styles.emptySubtitle}>
          Cuando alguien publique un inmueble en {CIUDAD_PRINCIPAL}, aparecerá aquí.
        </Text>
      </View>
    );
  } else {
    contenido = <PropertySearchGrid propiedades={propiedadesFiltradas} router={router} />;
  }

  return (
    <View style={styles.container}>
      {/* ── Fila de chips de ciudad ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {CIUDADES.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={item === ciudad}
            onPress={() => setCiudad(item)}
          />
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {contenido}
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <BottomNav activeTab="buscar" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xl,   // más espacio al final para que el último chip no quede pegado al borde
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  scrollContent: {
    paddingBottom: 180,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: darkColors.titles,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
  },
  emptySubtitle: {
    fontSize: fontSizes.body2,
    color: darkColors.typography,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});