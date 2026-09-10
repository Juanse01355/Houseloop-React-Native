// ============================================================
//   PROPERTY MAP (NATIVE) — Mapa interactivo con react-native-maps.
//   Modo oscuro (userInterfaceStyle) + marcadores tipo
//   "burbuja de precio", resaltados cuando están seleccionados.
// ============================================================
import { useRef, useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { colors } from "@/constants/theme-houseloop";

function formatearPrecioCorto(precio) {
  const numero = Number(precio) || 0;
  if (numero >= 1000000) {
    return `$${(numero / 1000000).toFixed(0)}M`;
  }
  if (numero >= 1000) {
    return `$${(numero / 1000).toFixed(0)}K`;
  }
  return `$${numero}`;
}

export default function PropertyMap({
  propiedades,
  centroInicial,
  propiedadSeleccionada,
  onSelectPropiedad,
}) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (propiedadSeleccionada && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: propiedadSeleccionada.latitude,
          longitude: propiedadSeleccionada.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );
    }
  }, [propiedadSeleccionada]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      userInterfaceStyle="dark"
      initialRegion={{
        latitude: centroInicial.latitude,
        longitude: centroInicial.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {propiedades.map((p) => {
        const estaSeleccionada =
          propiedadSeleccionada?.id_propiedad === p.id_propiedad;

        return (
          <Marker
            key={p.id_propiedad}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            onPress={() => onSelectPropiedad(p)}
            zIndex={estaSeleccionada ? 999 : 1}
          >
            <View
              style={[
                styles.bubble,
                estaSeleccionada && styles.bubbleSeleccionada,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  estaSeleccionada && styles.bubbleTextSeleccionada,
                ]}
              >
                {formatearPrecioCorto(p.precio)}
              </Text>
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  bubble: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.white,
  },
  bubbleSeleccionada: {
    backgroundColor: colors.white,
    borderColor: colors.primary,
    transform: [{ scale: 1.1 }],
  },
  bubbleText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },
  bubbleTextSeleccionada: {
    color: colors.primary,
  },
});