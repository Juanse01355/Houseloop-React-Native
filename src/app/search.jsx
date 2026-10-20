// ============================================================
//   SEARCH SCREEN — Módulo de Buscar
//   Buscador + filtros + fila de chips de ciudad + grid con
//   todas las propiedades registradas (por ahora, San Juan de Pasto).
//   Las propiedades "No disponible" no aparecen en la búsqueda.
// ============================================================
import BottomNav from '@/components/ui/BottomNav';
import Chip from '@/components/ui/Chip';
import FilterBottomSheet, { FILTROS_VACIOS } from '@/components/ui/FilterBottomSheet';
import PropertySearchGrid from '@/components/ui/PropertySearchGrid';
import SearchBar from '@/components/ui/SearchBar';
import { BASE_URL } from '@/config/api';
import { colors, darkColors, fontSizes, fontWeights, spacing } from '@/constants/theme-houseloop';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Íconos
import IconAutoAwesomeOutlined from '../../assets/icons/icon-autoawesome-outlined.svg';

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

  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [filtrosVisible, setFiltrosVisible] = useState(false);

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

          // ── Mis propiedades ──
          // Se piden a la misma ruta que usa el perfil, para que en Buscar
          // lleguen con los mismos datos (miniatura, reproducciones, estado).
          // Las "No disponible" no se muestran en la búsqueda.
          try {
            const usuarioRaw = await AsyncStorage.getItem('usuario');
            const miId = usuarioRaw ? JSON.parse(usuarioRaw).id : null;

            if (miId != null) {
              const resMias = await fetch(`${BASE_URL}/propiedades/usuario/${miId}`);
              const mias = await resMias.json();

              if (resMias.ok && Array.isArray(mias)) {
                mias
                  .filter((m) => m.estado !== 'no_disponible')
                  .forEach((m) => {
                    vistas.set(m.id_propiedad, {
                      ...(vistas.get(m.id_propiedad) || {}),
                      ...m,
                      esMia: true,
                    });
                  });
              }
            }
          } catch (errorMias) {
            console.error('Error al cargar mis propiedades:', errorMias);
          }

          // ── Miniatura del video ──
          // Si el feed no la trae, se pide a la ruta de detalle (que sí la
          // devuelve) para que todas las cards muestren el preview del video
          // y no la foto.
          const sinMiniatura = Array.from(vistas.values()).filter((p) => !p.miniatura);

          await Promise.all(
            sinMiniatura.map(async (p) => {
              try {
                const resDetalle = await fetch(`${BASE_URL}/propiedades/${p.id_propiedad}`);
                const detalle = await resDetalle.json();

                if (resDetalle.ok && detalle?.miniatura) {
                  vistas.set(p.id_propiedad, {
                    ...vistas.get(p.id_propiedad),
                    miniatura: detalle.miniatura,
                    id_usuario: vistas.get(p.id_propiedad).id_usuario ?? detalle.id_usuario,
                  });
                }
              } catch (errorDetalle) {
                console.error('Error al pedir la miniatura:', errorDetalle);
              }
            }),
          );

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

  // ── Aplica búsqueda por palabras + filtros del Bottom Sheet ──
  // sobre todas las propiedades de la ciudad principal.
  // Las propiedades "No disponible" no se muestran en la búsqueda.
  let propiedadesFiltradas = esCiudadPrincipal
    ? propiedades.filter((p) => p.estado !== 'no_disponible')
    : [];

  if (esCiudadPrincipal) {
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      propiedadesFiltradas = propiedadesFiltradas.filter((p) =>
        [p.titulo, p.descripcion, p.barrio, p.tipo_inmueble]
          .filter(Boolean)
          .some((campo) => campo.toLowerCase().includes(q)),
      );
    }

    if (filtros.precioMin) {
      propiedadesFiltradas = propiedadesFiltradas.filter(
        (p) => Number(p.precio) >= Number(filtros.precioMin),
      );
    }
    if (filtros.precioMax) {
      propiedadesFiltradas = propiedadesFiltradas.filter(
        (p) => Number(p.precio) <= Number(filtros.precioMax),
      );
    }
    if (filtros.tipoInmueble) {
      propiedadesFiltradas = propiedadesFiltradas.filter(
        (p) => p.tipo_inmueble === filtros.tipoInmueble,
      );
    }
    if (filtros.habitaciones > 0) {
      propiedadesFiltradas = propiedadesFiltradas.filter(
        (p) => Number(p.habitaciones) >= filtros.habitaciones,
      );
    }
    if (filtros.banos > 0) {
      propiedadesFiltradas = propiedadesFiltradas.filter(
        (p) => Number(p.banos) >= filtros.banos,
      );
    }
    if (filtros.barrio) {
      propiedadesFiltradas = propiedadesFiltradas.filter(
        (p) => p.barrio === filtros.barrio,
      );
    }
  }

  let contenido;
  if (cargando) {
    contenido = <ActivityIndicator color={colors.primary} style={styles.loader} />;
  } else if (!esCiudadPrincipal) {
    contenido = (
      <View style={styles.emptyState}>
        <IconAutoAwesomeOutlined
          width={68}
          height={68}
          fill={darkColors.typography}
        />
        <Text style={styles.emptyTitle}>Próximamente</Text>
        <Text style={styles.emptySubtitle}>
          Estamos trabajando para traer propiedades de {ciudad} muy pronto.
        </Text>
      </View>
    );
  } else if (propiedadesFiltradas.length === 0) {
    contenido = (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No hay publicaciones todavía</Text>
        <Text style={styles.emptySubtitle}>
          No se encontraron resultados para tu búsqueda.
        </Text>
      </View>
    );
  } else {
    contenido = (
      <>
        <Text style={styles.resultsOverline}>
          Se encontraron {propiedadesFiltradas.length} publicaciones
        </Text>
        <PropertySearchGrid propiedades={propiedadesFiltradas} router={router} />
      </>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Buscador + botón de filtros ── */}
      <SearchBar
        value={busqueda}
        onChangeText={setBusqueda}
        onFilterPress={() => setFiltrosVisible(true)}
      />

      {/* ── Fila de chips de ciudad ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
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

      <ScrollView
        style={styles.mainScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {contenido}
      </ScrollView>

      <FilterBottomSheet
        visible={filtrosVisible}
        onClose={() => setFiltrosVisible(false)}
        propiedades={propiedades}
        initialFilters={filtros}
        onApply={setFiltros}
      />

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
  chipsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  mainScroll: {
    flex: 1,
  },
  resultsOverline: {
    fontSize: fontSizes.overline,
    fontWeight: fontWeights.medium,
    color: darkColors.typography,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    marginBottom: spacing.sm,
  },
  scrollContent: {
    paddingBottom: 180,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  emptyState: {
    marginHorizontal: 14,
    minHeight: 470,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.semibold,
    color: darkColors.titles,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSizes.body2,
    color: darkColors.typography,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
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