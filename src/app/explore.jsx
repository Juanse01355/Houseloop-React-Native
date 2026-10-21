// ============================================================
//   EXPLORE SCREEN — Mapa interactivo con las propiedades en venta.
//   Cada propiedad se muestra con un marcador (círculo con casita);
//   al tocarlo aparece la tarjeta flotante.
//
//   Ubicación de cada propiedad:
//     1. Si el backend manda latitud/longitud (las que se marcan con el
//        GPS al publicar) se usan directo: aparecen al instante y exactas.
//     2. Si no (propiedades viejas), se geocodifica su dirección como antes.
//
//   Si se llega desde el detalle (botón "Ubicación"), recibe por
//   parámetros "propiedadId" (y opcionalmente "lat" / "lng"): el mapa
//   arranca en ese punto y, apenas la propiedad está cargada, se
//   selecciona y se abre su tarjeta.
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
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Centro por defecto: San Juan de Pasto
const CENTRO_PASTO = { latitude: 1.2136, longitude: -77.2811 };

// Los parámetros de la ruta pueden venir como string o como arreglo
const primero = (valor) => (Array.isArray(valor) ? valor[0] : valor);

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const propiedadIdBuscada = primero(params.propiedadId);
  const latParam = primero(params.lat);
  const lngParam = primero(params.lng);

  const [propiedades, setPropiedades] = useState([]);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);

  // Id que ya se seleccionó automáticamente (para no volver a abrir la
  // tarjeta si el usuario la cierra)
  const idYaSeleccionado = useRef(null);

  // Si llegaron coordenadas desde el detalle, el mapa arranca ahí;
  // si no, en el centro de Pasto
  const centroInicial = useMemo(() => {
    const latitude = Number(latParam);
    const longitude = Number(lngParam);
    if (
      latParam != null &&
      lngParam != null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      return { latitude, longitude };
    }
    return CENTRO_PASTO;
  }, [latParam, lngParam]);

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

          // Separa las que ya traen coordenadas exactas de las que no
          const conCoords = [];
          const sinCoords = [];
          Array.from(vistas.values()).forEach((fila) => {
            const latitude = Number(fila.latitud);
            const longitude = Number(fila.longitud);
            if (
              fila.latitud != null &&
              fila.longitud != null &&
              Number.isFinite(latitude) &&
              Number.isFinite(longitude)
            ) {
              conCoords.push({ ...fila, latitude, longitude });
            } else {
              sinCoords.push(fila);
            }
          });

          // 1. Las exactas aparecen de inmediato
          if (activo) setPropiedades(conCoords);

          // 2. Las demás se van agregando apenas se geocodifica su dirección
          if (sinCoords.length > 0) {
            await geocodificarPropiedadesProgresivo(
              sinCoords,
              (propiedadConCoords) => {
                if (activo) {
                  setPropiedades((prev) => [...prev, propiedadConCoords]);
                }
              },
            );
          }
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

  // Cuando la propiedad que mandó el detalle ya está en el mapa,
  // se selecciona (esto abre su tarjeta y mueve el mapa hacia ella)
  useEffect(() => {
    if (!propiedadIdBuscada) return;
    if (idYaSeleccionado.current === propiedadIdBuscada) return;

    const encontrada = propiedades.find(
      (p) => String(p.id_propiedad) === String(propiedadIdBuscada),
    );
    if (encontrada) {
      idYaSeleccionado.current = propiedadIdBuscada;
      setPropiedadSeleccionada(encontrada);
    }
  }, [propiedades, propiedadIdBuscada]);

  return (
    <View style={styles.container}>
      <PropertyMap
        propiedades={propiedades}
        centroInicial={centroInicial}
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