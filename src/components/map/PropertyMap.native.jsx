// ============================================================
//   PROPERTY MAP (NATIVE) — Mapa con Leaflet dentro de un WebView.
//   Estilo de marca HouseLoop: tiles oscuros de Stadia (Alidade
//   Smooth Dark) con tinte coral suave y marcadores con el icono
//   de propiedad (círculo con casita).
//   Incluye radar "cerca de mí": ondas desde tu ubicación que
//   iluminan las propiedades dentro del radio elegido.
//   Los controles del radar viven abajo, sobre la barra de navegación.
//
//   La propiedad seleccionada SIEMPRE se muestra (con el marcador
//   resaltado), aunque el radar no esté activo. Así, al llegar desde
//   el detalle, se ve su casita seleccionada en el mapa.
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import {
  ICONO_PROPIEDAD_PATH,
  ICONO_PROPIEDAD_VIEWBOX,
} from "@/components/map/iconoPropiedad";
import {
  colors,
  darkColors,
  radii,
  spacing,
  verticalScale,
} from "@/constants/theme-houseloop";

// La key vive en el archivo .env (EXPO_PUBLIC_STADIA_KEY=...)
const STADIA_KEY = process.env.EXPO_PUBLIC_STADIA_KEY;

// Radios disponibles para el radar (en metros)
const RADIOS = [500, 1000, 2000];
const etiquetaRadio = (m) => (m >= 1000 ? `${m / 1000} km` : `${m} m`);

const crearHtml = (c) => `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; background: ${darkColors.background}; }
  .leaflet-container { background: ${darkColors.background}; }

  /* Tinte de marca sobre los tiles (no afecta burbujas ni radar).
     - sepia: cantidad de tinte (0 = gris puro)
     - hue-rotate: tono (más negativo = más rojo)
     - brightness: qué tan oscuro queda el mapa */
  .leaflet-tile-pane {
    filter: grayscale(1) sepia(0.2) hue-rotate(-42deg) saturate(1.1) brightness(0.95) contrast(1.05);
  }

  /* Punto pulsante de "tu ubicación" */
  .yo { position: relative; width: 18px; height: 18px; }
  .yo .punto {
    position: absolute; inset: 0; border-radius: 50%;
    background: ${colors.primary}; border: 3px solid #fff; box-sizing: border-box;
    box-shadow: 0 0 10px rgba(243,97,98,0.8);
  }
  .yo .pulso {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(243,97,98,0.45);
    animation: pulso 1.6s ease-out infinite;
  }
  @keyframes pulso {
    0%   { transform: scale(1);   opacity: 0.8; }
    100% { transform: scale(3.2); opacity: 0; }
  }
</style>
</head><body><div id="map"></div><script>
var PRIMARY = '${colors.primary}';
var BLANCO  = '${colors.white}';
var ICONO_VIEWBOX = '${ICONO_PROPIEDAD_VIEWBOX}';
var ICONO_PATH = '${ICONO_PROPIEDAD_PATH}';

var map = L.map('map',{zoomControl:false}).setView([${c.latitude},${c.longitude}],14);
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${STADIA_KEY}',
  {maxZoom:20,attribution:'&copy; Stadia Maps &copy; OpenMapTiles &copy; OpenStreetMap'}).addTo(map);

var capa = L.layerGroup().addTo(map);
var marcadores = [];
var radarActivo = null;
var reveladas = {}; // con el radar activo: ids de propiedades ya alcanzadas por la onda
var puntoUsuario = null, circulo = null, anillo = null, animId = null;
var idSeleccionado = null; // propiedad seleccionada: siempre visible
var idFijo = null; // última seleccionada: se queda aunque se cierre la tarjeta

// Marcador: círculo con el icono de propiedad.
// Normal: círculo rosado con icono blanco.
// Seleccionado: círculo blanco con icono rosado, borde rosado y resplandor.
function icono(sel){
  var T = 48;
  return L.divIcon({
    className: '',
    html: '<div style="width:' + T + 'px;height:' + T + 'px;border-radius:50%;' +
      'display:flex;align-items:center;justify-content:center;box-sizing:border-box;' +
      'background:' + (sel ? BLANCO : PRIMARY) + ';' +
      'color:' + (sel ? PRIMARY : BLANCO) + ';' +
      'border:' + (sel ? '3px solid ' + PRIMARY : '0') + ';' +
      'box-shadow:' + (sel
        ? '0 0 0 6px rgba(243,97,98,0.35), 0 0 18px rgba(243,97,98,0.8)'
        : '0 2px 8px rgba(0,0,0,0.35)') + ';' +
      'transform:' + (sel ? 'scale(1.1)' : 'scale(1)') + '">' +
      '<svg width="26" height="26" viewBox="' + ICONO_VIEWBOX + '" fill="currentColor">' +
      ICONO_PATH + '</svg></div>',
    iconSize: [T, T],
    iconAnchor: [T / 2, T / 2]
  });
}

function iconoUsuario(){
  return L.divIcon({
    className: '',
    html: '<div class="yo"><div class="pulso"></div><div class="punto"></div></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

function dentro(p){
  return radarActivo &&
    map.distance([radarActivo.lat, radarActivo.lng], [p.latitude, p.longitude]) <= radarActivo.r;
}

// Vuelve a mostrar el marcador de la propiedad seleccionada
// (después de limpiar la capa, por ejemplo al reiniciar el radar)
function mostrarSeleccionado(){
  marcadores.forEach(function(o){
    var id = String(o.p.id_propiedad);
    var esSel = idSeleccionado !== null && id === String(idSeleccionado);
    var esFijo = idFijo !== null && id === String(idFijo);
    if ((esSel || esFijo) && !capa.hasLayer(o.m)) {
      capa.addLayer(o.m);
    }
  });
}

window.setPins = function(lista, idSel, idFj){
  idSeleccionado = idSel;
  idFijo = idFj;
  capa.clearLayers();
  marcadores = [];
  lista.forEach(function(p){
    var sel = idSel !== null && String(p.id_propiedad) === String(idSel);
    var fijo = idFj !== null && String(p.id_propiedad) === String(idFj);
    var m = L.marker([p.latitude, p.longitude], {
      icon: icono(sel),
      zIndexOffset: sel ? 1000 : 0
    }).on('click', function(){
      window.ReactNativeWebView.postMessage(JSON.stringify({tipo:'pin', id:p.id_propiedad}));
    });
    marcadores.push({ m: m, p: p });
    // Se muestra la seleccionada siempre, y las que la onda del radar
    // ya alcanzó (las cercanas). Las demás no se muestran.
    if (sel || fijo || (radarActivo && reveladas[p.id_propiedad])) capa.addLayer(m);
  });
};

// tapado: píxeles de abajo que cubren la tarjeta y la barra. El marcador
// queda centrado en la parte visible, arriba de la tarjeta.
window.irA = function(lat, lng, tapado){
  var zoom = Math.max(map.getZoom(), 17);
  var max = map.getSize().y * 0.7;
  var t = Math.min(tapado || 0, max);
  var punto = map.project([lat, lng], zoom).add([0, t / 2]);
  map.flyTo(map.unproject(punto, zoom), zoom, {duration: 0.6});
};

window.limpiarRadar = function(){
  if (animId) cancelAnimationFrame(animId);
  animId = null;
  [puntoUsuario, circulo, anillo].forEach(function(x){ if (x) map.removeLayer(x); });
  puntoUsuario = circulo = anillo = null;
  radarActivo = null;
  reveladas = {};
  // Sin radar no se muestra ninguna propiedad (salvo la seleccionada)
  capa.clearLayers();
  mostrarSeleccionado();
};

// padBottom: espacio que tapan los controles de abajo, para que el
// círculo del radar quede completo a la vista
window.radar = function(lat, lng, r, padBottom){
  window.limpiarRadar();
  radarActivo = { lat: lat, lng: lng, r: r };
  var c = L.latLng(lat, lng);

  puntoUsuario = L.marker(c, { icon: iconoUsuario(), interactive: false, zIndexOffset: 2000 }).addTo(map);
  circulo = L.circle(c, {
    radius: r, color: PRIMARY, weight: 1.5, opacity: 0.7,
    fillColor: PRIMARY, fillOpacity: 0.06, interactive: false
  }).addTo(map);
  anillo = L.circle(c, {
    radius: 1, color: PRIMARY, weight: 2, opacity: 0.9,
    fillColor: PRIMARY, fillOpacity: 0.22, interactive: false
  }).addTo(map);

  map.fitBounds(circulo.getBounds(), {
    paddingTopLeft: [30, 40],
    paddingBottomRight: [30, padBottom || 40]
  });

  // Todas las propiedades se ocultan; la onda las va mostrando
  reveladas = {};
  capa.clearLayers();
  mostrarSeleccionado();

  var DUR = 1600;
  var OLAS = 2;
  var inicio = null;

  function paso(t){
    if (inicio === null) inicio = t;
    var el = t - inicio;
    var prog = (el % DUR) / DUR;
    var rad = r * (1 - Math.pow(1 - prog, 2));

    anillo.setRadius(Math.max(rad, 1));
    anillo.setStyle({ opacity: 0.9 * (1 - prog), fillOpacity: 0.22 * (1 - prog) });

    marcadores.forEach(function(o){
      if (!reveladas[o.p.id_propiedad] && map.distance(c, o.m.getLatLng()) <= rad) {
        reveladas[o.p.id_propiedad] = true;
        capa.addLayer(o.m);
      }
    });

    if (el < DUR * OLAS) {
      animId = requestAnimationFrame(paso);
    } else {
      if (anillo) { map.removeLayer(anillo); anillo = null; }
      var n = 0;
      marcadores.forEach(function(o){
        var ok = dentro(o.p);
        if (ok) {
          n++;
          reveladas[o.p.id_propiedad] = true;
          if (!capa.hasLayer(o.m)) capa.addLayer(o.m);
        }
      });
      window.ReactNativeWebView.postMessage(JSON.stringify({tipo:'cerca', n:n}));
    }
  }
  animId = requestAnimationFrame(paso);
};
</script></body></html>`;

// Distancia desde el borde inferior donde viven los controles
// (misma que usa la tarjeta flotante de la propiedad en ExploreScreen)
const BOTTOM_CONTROLES = verticalScale(90);

// Alto aproximado de la tarjeta flotante (para no taparse el marcador)
const ALTO_CARD = 400;

export default function PropertyMap({
  propiedades = [],
  centroInicial,
  propiedadSeleccionada,
  onSelectPropiedad,
}) {
  const webRef = useRef(null);
  const listo = useRef(false);
  const html = useMemo(() => crearHtml(centroInicial), [centroInicial]);

  const [radio, setRadio] = useState(1000);
  const [escaneando, setEscaneando] = useState(false);
  const [cercanas, setCercanas] = useState(null);

  // Última propiedad seleccionada: su marcador se queda aunque se cierre la tarjeta
  const idFijado = useRef(null);

  const enviarPines = () => {
    const lista = propiedades.map((p) => ({
      id_propiedad: p.id_propiedad,
      latitude: p.latitude,
      longitude: p.longitude,
      precio: p.precio,
    }));
    const idSel = propiedadSeleccionada?.id_propiedad ?? null;
    if (idSel !== null) idFijado.current = idSel;
    webRef.current?.injectJavaScript(
      `window.setPins(${JSON.stringify(lista)}, ${JSON.stringify(idSel)}, ${JSON.stringify(idFijado.current)}); true;`,
    );
  };

  // Mueve el mapa hasta la propiedad seleccionada
  const irASeleccionada = () => {
    if (!propiedadSeleccionada) return;
    webRef.current?.injectJavaScript(
      `window.irA(${propiedadSeleccionada.latitude}, ${propiedadSeleccionada.longitude}, ${Math.round(BOTTOM_CONTROLES + ALTO_CARD)}); true;`,
    );
  };

  useEffect(() => {
    if (listo.current) enviarPines();
  }, [propiedades, propiedadSeleccionada]);

  useEffect(() => {
    if (listo.current) irASeleccionada();
  }, [propiedadSeleccionada]);

  const buscarCerca = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Ubicación desactivada",
          "Activa el permiso de ubicación para buscar propiedades cerca de ti.",
        );
        return;
      }

      setEscaneando(true);
      setCercanas(null);

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const padBottom = Math.round(BOTTOM_CONTROLES + 150);
      webRef.current?.injectJavaScript(
        `window.radar(${pos.coords.latitude}, ${pos.coords.longitude}, ${radio}, ${padBottom}); true;`,
      );
    } catch (error) {
      console.error("Error al obtener la ubicación:", error);
      setEscaneando(false);
      Alert.alert(
        "No pude obtener tu ubicación",
        "Revisa que el GPS esté encendido e inténtalo de nuevo.",
      );
    }
  };

  const limpiar = () => {
    webRef.current?.injectJavaScript(`window.limpiarRadar(); true;`);
    setCercanas(null);
    setEscaneando(false);
  };

  const onMessage = (e) => {
    let msg;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }

    if (msg.tipo === "pin") {
      const p = propiedades.find(
        (x) => String(x.id_propiedad) === String(msg.id),
      );
      if (p) onSelectPropiedad(p);
    }

    if (msg.tipo === "cerca") {
      setCercanas(msg.n);
      setEscaneando(false);
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
          enviarPines();
          // Si la propiedad ya venía seleccionada (llegada desde el detalle)
          // antes de que cargara el mapa, también se mueve hasta ella
          irASeleccionada();
        }}
        onMessage={onMessage}
      />

      {/* Controles del radar (abajo, sobre la barra de navegación).
          Se esconden si hay una tarjeta de propiedad abierta. */}
      {!propiedadSeleccionada && (
        <View style={styles.panel} pointerEvents="box-none">
          {cercanas === null && !escaneando && (
            <Text style={styles.resultado}>
              Toca "Buscar cerca de mí" para ver las propiedades a tu alrededor
            </Text>
          )}

          {cercanas !== null && (
            <Text style={styles.resultado}>
              {cercanas === 0
                ? `Sin propiedades en ${etiquetaRadio(radio)}`
                : `${cercanas} ${cercanas === 1 ? "propiedad" : "propiedades"} en ${etiquetaRadio(radio)}`}
            </Text>
          )}

          <View style={styles.chips}>
            {RADIOS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRadio(r)}
                style={[styles.chip, radio === r && styles.chipActivo]}
              >
                <Text style={styles.chipTexto}>{etiquetaRadio(r)}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.fila}>
            <Pressable
              style={[styles.btnRadar, escaneando && styles.btnDeshabilitado]}
              onPress={buscarCerca}
              disabled={escaneando}
            >
              <Text style={styles.btnRadarTexto}>
                {escaneando ? "Buscando..." : "Buscar cerca de mí"}
              </Text>
            </Pressable>

            {(cercanas !== null || escaneando) && (
              <Pressable style={styles.btnLimpiar} onPress={limpiar}>
                <Text style={styles.btnLimpiarTexto}>Limpiar</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: darkColors.background },
  webview: { flex: 1, backgroundColor: darkColors.background },

  panel: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: BOTTOM_CONTROLES,
    gap: spacing.sm,
    alignItems: "center",
  },
  chips: { flexDirection: "row", gap: spacing.xs, justifyContent: "center" },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: "rgba(7,7,7,0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  chipActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTexto: {
    color: colors.white,
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
  },

  fila: { flexDirection: "row", gap: spacing.sm, justifyContent: "center" },
  btnRadar: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.full,
  },
  btnDeshabilitado: { opacity: 0.7 },
  btnRadarTexto: {
    color: colors.white,
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },
  btnLimpiar: {
    backgroundColor: "rgba(7,7,7,0.85)",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  btnLimpiarTexto: {
    color: colors.white,
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },
  resultado: {
    color: colors.white,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    backgroundColor: "rgba(7,7,7,0.85)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
});