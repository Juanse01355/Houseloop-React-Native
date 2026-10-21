// ============================================================
//   LOCATION PICKER MAP (WEB) — Carga el mapa Leaflet solo en el
//   navegador (Leaflet necesita "window", que no existe cuando
//   Expo renderiza en el servidor).
//
//   Guarda este archivo en: src/components/map/LocationPickerMap.web.jsx
// ============================================================
import { useEffect, useState } from "react";
import { View } from "react-native";
import { darkColors } from "@/constants/theme-houseloop";

export default function LocationPickerMap(props) {
  const [Mapa, setMapa] = useState(null);

  useEffect(() => {
    const modulo = require("./LeafletPicker");
    setMapa(() => modulo.default);
  }, []);

  if (!Mapa) {
    return <View style={{ flex: 1, backgroundColor: darkColors.background }} />;
  }

  return <Mapa {...props} />;
}