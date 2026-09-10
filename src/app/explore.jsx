// ============================================================
//   EXPLORE SCREEN — Mapa interactivo con las propiedades en venta.
//   Geocodifica las direcciones guardadas y muestra un pin por
//   cada propiedad; al tocar un pin aparece la tarjeta flotante.
// ============================================================
import BottomNav from "@/components/ui/BottomNav";
import PropertyMap from "@/components/map/PropertyMap";
import PropertyMapCard from "@/components/ui/PropertyMapCard";
import { BASE_URL } from "@/config/api";
import {
  colors,
  darkColors,
  spacing,
  verticalScale,
} from "@/constants/theme-houseloop";
import { geocodificarPropiedadesProgresivo } from "@/utils/geocode";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Centro por defecto: San Juan de Pasto
const CENTRO_PASTO = { latitude: 1.2136, longitude: -77.2811 };

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [propiedades, setPropiedades] = useState([]);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setPropiedades([]); // limpia pines de una visita anterior

      async function cargarYGeocodificar() {
        try {
          const response = await fetch(`${BASE_URL}/propiedades/feed`);
          const data = await response.json();

          if (!response.ok) {
            console.error("Error al obtener el feed:", data);
            return;
          }

          const vistas = new Map();
          data.forEach((fila) => {
            if (!vistas.has(fila.id_propiedad)) {
              vistas.set(fila.id_propiedad, fila);
            }
          });

          // Va agregando cada propiedad al mapa apenas se geocodifica,
          // en vez de esperar a que termine el lote completo.
          await geocodificarPropiedadesProgresivo(
            Array.from(vistas.values()),
            (propiedadConCoords) => {
              if (activo) {
                setPropiedades((prev) => [...prev, propiedadConCoords]);
              }
            },
          );
        } catch (error) {
          console.error("Error al cargar el mapa:", error);
        }
      }

      cargarYGeocodificar();

      return () => {
        activo = false;
      };
    }, []),
  );

  return (
    <View style={styles.container}>
      <PropertyMap
        propiedades={propiedades}
        centroInicial={CENTRO_PASTO}
        propiedadSeleccionada={propiedadSeleccionada}
        onSelectPropiedad={setPropiedadSeleccionada}
      />

      {propiedadSeleccionada && (
        <View style={styles.cardOverlay}>
          <PropertyMapCard
            propiedad={propiedadSeleccionada}
            onClose={() => setPropiedadSeleccionada(null)}
            onVerDetalles={(p) => router.push(`/detail?id=${p.id_propiedad}`)}
          />
        </View>
      )}

      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <BottomNav activeTab="explorar" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  cardOverlay: {
    position: "absolute",
    bottom: verticalScale(90),
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});