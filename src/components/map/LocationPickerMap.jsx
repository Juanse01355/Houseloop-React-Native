// ============================================================
//   LOCATION PICKER MAP (NATIVE) — Mapa para marcar la ubicación
//   exacta de una propiedad. Leaflet dentro de un WebView.
//   - Tocar el mapa coloca el pin; el pin se puede arrastrar.
//   - Cada cambio se avisa con onChange({ latitude, longitude }).
//
//   Guarda este archivo en: src/components/map/LocationPickerMap.jsx
//   (la versión para navegador es LocationPickerMap.web.jsx)
// ============================================================
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { colors, darkColors } from "@/constants/theme-houseloop";

// La key vive en el archivo .env (EXPO_PUBLIC_STADIA_KEY=...)
const STADIA_KEY = process.env.EXPO_PUBLIC_STADIA_KEY;

const crearHtml = (centro, punto) => `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; background: ${darkColors.background}; }
</style>
</head><body><div id="map"></div><script>
var PRIMARY = '${colors.primary}';

var map = L.map('map').setView([${centro.latitude}, ${centro.longitude}], ${punto ? 18 : 14});
L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=${STADIA_KEY}',
  { maxZoom: 20, attribution: '&copy; Stadia Maps &copy; OpenStreetMap' }).addTo(map);

var marker = null;

// Pin en forma de gota; la punta marca el punto exacto
function icono() {
  return L.divIcon({
    className: '',
    html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:' + PRIMARY +
      ';border:3px solid #fff;box-sizing:border-box;transform:rotate(-45deg);' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 31]
  });
}

function avisar(ll) {
  window.ReactNativeWebView.postMessage(JSON.stringify({ lat: ll.lat, lng: ll.lng }));
}

function poner(lat, lng, notificar) {
  if (!marker) {
    marker = L.marker([lat, lng], { draggable: true, icon: icono() }).addTo(map);
    marker.on('dragend', function () { avisar(marker.getLatLng()); });
  } else {
    marker.setLatLng([lat, lng]);
  }
  if (notificar) avisar(marker.getLatLng());
}

// Tocar el mapa mueve el pin a ese punto
map.on('click', function (e) { poner(e.latlng.lat, e.latlng.lng, true); });

// Lo llama React Native cuando llega una posición desde afuera (por ejemplo, la dirección encontrada)
window.setPunto = function (lat, lng) {
  poner(lat, lng, false);
  map.flyTo([lat, lng], 18, { duration: 0.5 });
};

${punto ? `poner(${punto.latitude}, ${punto.longitude}, false);` : ""}
</script></body></html>`;

export default function LocationPickerMap({ centro, puntoInicial, onChange }) {
  const webRef = useRef(null);
  const listo = useRef(false);

  // El HTML se arma una sola vez; los cambios posteriores entran por injectJavaScript
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => crearHtml(centro, puntoInicial), []);

  const aplicarPunto = () => {
    if (listo.current && puntoInicial) {
      webRef.current?.injectJavaScript(
        `window.setPunto(${puntoInicial.latitude}, ${puntoInicial.longitude}); true;`,
      );
    }
  };

  useEffect(aplicarPunto, [puntoInicial]);

  const onMessage = (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      onChange({ latitude: msg.lat, longitude: msg.lng });
    } catch {
      // mensaje que no es del mapa: se ignora
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        style={styles.webview}
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://houseloop.local" }}
        javaScriptEnabled
        onLoadEnd={() => {
          listo.current = true;
          aplicarPunto();
        }}
        onMessage={onMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: darkColors.background },
  webview: { flex: 1, backgroundColor: darkColors.background },
});