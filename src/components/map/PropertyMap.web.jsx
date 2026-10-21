// ============================================================
//   PROPERTY MAP (WEB) — Carga el mapa Leaflet solo en el navegador.
//   Leaflet necesita "window" y "document", que no existen cuando
//   Expo renderiza la página en el servidor; por eso se importa
//   dentro del useEffect (que solo corre en el navegador).
// ============================================================
import { useEffect, useState } from "react";
import { View } from "react-native";
import { darkColors } from "@/constants/theme-houseloop";

export default function PropertyMap(props) {
  const [Mapa, setMapa] = useState(null);

  useEffect(() => {
    const modulo = require("./LeafletMap");
    setMapa(() => modulo.default);
  }, []);

  if (!Mapa) {
    return <View style={{ flex: 1, backgroundColor: darkColors.background }} />;
  }

  return <Mapa {...props} />;
}