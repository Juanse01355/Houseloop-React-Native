// ============================================================
//   PROPERTY MAP (WEB) — Wrapper que carga Leaflet de forma
//   diferida (dynamic import), evitando que se ejecute durante
//   el renderizado en servidor (SSR) de Expo Router, donde
//   `window` no existe todavía.
// ============================================================
import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";

export default function PropertyMap(props) {
  const [MapaCargado, setMapaCargado] = useState(null);

  useEffect(() => {
    let activo = true;

    import("./LeafletMap").then((modulo) => {
      if (activo) {
        setMapaCargado(() => modulo.default);
      }
    });

    return () => {
      activo = false;
    };
  }, []);

  if (!MapaCargado) {
    return <View style={styles.container} />;
  }

  const MapaComponente = MapaCargado;
  return <MapaComponente {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
});