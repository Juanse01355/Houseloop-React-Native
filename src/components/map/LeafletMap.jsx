// ============================================================
//   LEAFLET MAP — Mapa interactivo con Leaflet (solo para web).
//   Dos apariencias para elegir (ver PRESET_ACTIVO más abajo):
//     - "detallado":   mapa con muchos más lugares dibujados
//                      (negocios, canchas, colegios, farmacias...)
//                      con el mismo look oscuro y tinte coral.
//     - "minimalista": el estilo anterior (Alidade Smooth Dark).
//   Zoom hasta el detalle: botones + / -, rueda más suave y
//   marcadores con el icono de propiedad (círculo con casita).
//   Incluye radar "cerca de mí" con controles abajo.
//
//   La propiedad seleccionada SIEMPRE se muestra (con el marcador
//   resaltado), aunque el radar no esté activo. Así, al llegar desde
//   el detalle, se ve su casita seleccionada en el mapa.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  MapContainer,
  TileLayer,
  Marker,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  colors,
  darkColors,
  radii,
  spacing,
  verticalScale,
} from "@/constants/theme-houseloop";
import {
  ICONO_PROPIEDAD_PATH,
  ICONO_PROPIEDAD_VIEWBOX,
} from "@/components/map/iconoPropiedad";

// La key vive en el archivo .env (EXPO_PUBLIC_STADIA_KEY=...)
const STADIA_KEY = process.env.EXPO_PUBLIC_STADIA_KEY;

// ── Apariencia del mapa base ──
// Cambia PRESET_ACTIVO a "minimalista" para volver exactamente al
// mapa anterior (con menos lugares dibujados).
const PRESETS = {
  detallado: {
    estilo: "osm_bright", // el estilo de Stadia con más puntos de interés
    // Invierte los colores (oscuro), los pasa a gris y les da el tinte
    // coral del mapa anterior. Para ajustar:
    //   brightness: más alto = más claro (prueba 1.1 a 1.5)
    //   contrast:   más bajo = fondo más gris (prueba 0.8 a 1)
    filtro:
      "invert(1) hue-rotate(180deg) grayscale(1) sepia(0.2) hue-rotate(-42deg) saturate(1.1) contrast(0.9) brightness(1.25)",
  },
  minimalista: {
    estilo: "alidade_smooth_dark",
    filtro:
      "grayscale(1) sepia(0.2) hue-rotate(-42deg) saturate(1.1) brightness(0.95) contrast(1.05)",
  },
};
const PRESET_ACTIVO = "detallado";
const { estilo: ESTILO_MAPA, filtro: FILTRO_TILES } = PRESETS[PRESET_ACTIVO];

// ── Zoom ──
const ZOOM_INICIAL = 15;
const ZOOM_MAXIMO = 22; // hasta dónde se puede acercar
const ZOOM_MAXIMO_TILES = 20; // el proveedor da imágenes nítidas hasta aquí
const ZOOM_AL_SELECCIONAR = 18; // al tocar un marcador, se acerca a este nivel
const ALTO_CARD = 400; // alto aproximado de la tarjeta flotante (para no taparse el marcador)

// Radios disponibles para el radar (en metros)
const RADIOS = [500, 1000, 2000];
const etiquetaRadio = (m) => (m >= 1000 ? `${m / 1000} km` : `${m} m`);

// Distancia desde el borde inferior donde viven los controles
const BOTTOM_CONTROLES = verticalScale(90);

// ── Estilos CSS del mapa (se inyectan una sola vez) ──
const CSS_MAPA = `
  /* Filtro solo sobre los tiles (no afecta burbujas, radar ni botones) */
  .hl-mapa .leaflet-tile-pane {
    filter: ${FILTRO_TILES};
  }

  /* Botones de zoom (+ / -) con el estilo oscuro de la app */
  .hl-mapa .leaflet-bar {
    border: none;
    box-shadow: 0 2px 10px rgba(0,0,0,0.4);
  }
  .hl-mapa .leaflet-bar a {
    background: rgba(7,7,7,0.85);
    color: #fff;
    border-bottom: 1px solid rgba(255,255,255,0.2);
    width: 36px; height: 36px; line-height: 36px;
    font-size: 20px;
  }
  .hl-mapa .leaflet-bar a:hover {
    background: ${colors.primary};
    color: #fff;
  }
  .hl-mapa .leaflet-bar a:first-child { border-radius: 10px 10px 0 0; }
  .hl-mapa .leaflet-bar a:last-child { border-radius: 0 0 10px 10px; border-bottom: none; }

  .hl-yo { position: relative; width: 18px; height: 18px; }
  .hl-yo .punto {
    position: absolute; inset: 0; border-radius: 50%;
    background: ${colors.primary}; border: 3px solid #fff; box-sizing: border-box;
    box-shadow: 0 0 10px rgba(243,97,98,0.8);
  }
  .hl-yo .pulso {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(243,97,98,0.45);
    animation: hl-pulso 1.6s ease-out infinite;
  }
  /* Los marcadores aparecen con un pequeño "pop" al encenderse el radar */
  @keyframes hl-aparece {
    0%   { transform: scale(0.3); opacity: 0; }
    100% { transform: scale(1);   opacity: 1; }
  }
  @keyframes hl-pulso {
    0%   { transform: scale(1);   opacity: 0.8; }
    100% { transform: scale(3.2); opacity: 0; }
  }
`;

function useEstilosMapa() {
  useEffect(() => {
    if (document.getElementById("hl-mapa-estilos")) return;
    const estilo = document.createElement("style");
    estilo.id = "hl-mapa-estilos";
    estilo.textContent = CSS_MAPA;
    document.head.appendChild(estilo);
  }, []);
}

// Marcador: círculo con el icono de propiedad. El CENTRO del círculo es la
// ubicación exacta de la propiedad.
//   Normal:       círculo rosado con la casita blanca.
//   Seleccionado: círculo blanco con la casita rosada, borde rosado y resplandor.
const TAMANO_MARCADOR = 48;

function crearIconoPropiedad(seleccionado) {
  const T = TAMANO_MARCADOR;
  const fondo = seleccionado ? "#ffffff" : colors.primary;
  const icono = seleccionado ? colors.primary : "#ffffff";
  const borde = seleccionado ? `3px solid ${colors.primary}` : "0";
  const sombra = seleccionado
    ? "0 0 0 6px rgba(243,97,98,0.35), 0 0 18px rgba(243,97,98,0.8)"
    : "0 2px 8px rgba(0,0,0,0.35)";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: ${T}px;
        height: ${T}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        background: ${fondo};
        color: ${icono};
        border: ${borde};
        box-shadow: ${sombra};
        transform: scale(${seleccionado ? 1.1 : 1});
        ${seleccionado ? "" : "animation: hl-aparece 0.35s ease-out;"}
      ">
        <svg width="26" height="26" viewBox="${ICONO_PROPIEDAD_VIEWBOX}" fill="currentColor">
          ${ICONO_PROPIEDAD_PATH}
        </svg>
      </div>
    `,
    iconSize: [T, T],
    iconAnchor: [T / 2, T / 2],
  });
}

// Los dos iconos se crean una sola vez: así el marcador no se vuelve a
// dibujar (ni repite su animación) cada vez que cambia algo en la pantalla.
const ICONOS = {
  normal: crearIconoPropiedad(false),
  seleccionado: crearIconoPropiedad(true),
};

function crearIconoUsuario() {
  return L.divIcon({
    className: "",
    html: '<div class="hl-yo"><div class="pulso"></div><div class="punto"></div></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// Al seleccionar una propiedad, el mapa vuela hasta ella y se acerca
// lo suficiente para ver el punto exacto (si ya estabas más cerca, no se aleja).
// El marcador queda en la parte VISIBLE del mapa, arriba de la tarjeta
// flotante, para que siempre se sepa cuál propiedad está abierta.
function RecentrarMapa({ propiedadSeleccionada }) {
  const map = useMap();

  useEffect(() => {
    if (propiedadSeleccionada) {
      const zoom = Math.max(map.getZoom(), ZOOM_AL_SELECCIONAR);
      const alto = map.getSize().y;
      // Parte del mapa que tapan la tarjeta y la barra de abajo
      const tapado = Math.min(BOTTOM_CONTROLES + ALTO_CARD, alto * 0.7);

      // El centro del mapa se corre hacia abajo la mitad de lo tapado:
      // así el marcador queda centrado en la zona que sí se ve.
      const punto = map
        .project(
          [propiedadSeleccionada.latitude, propiedadSeleccionada.longitude],
          zoom,
        )
        .add([0, tapado / 2]);

      map.flyTo(map.unproject(punto, zoom), zoom, { duration: 0.6 });
    }
  }, [propiedadSeleccionada]);

  return null;
}

// ── Radar: ondas desde tu ubicación hasta r metros ──
function Radar({ radar, propiedades, onReveal, onFin }) {
  const map = useMap();
  const propsRef = useRef(propiedades);
  propsRef.current = propiedades;

  useEffect(() => {
    if (!radar) return;

    const centro = L.latLng(radar.lat, radar.lng);
    const r = radar.r;

    const punto = L.marker(centro, {
      icon: crearIconoUsuario(),
      interactive: false,
      zIndexOffset: 2000,
    }).addTo(map);

    const circulo = L.circle(centro, {
      radius: r,
      color: colors.primary,
      weight: 1.5,
      opacity: 0.7,
      fillColor: colors.primary,
      fillOpacity: 0.06,
      interactive: false,
    }).addTo(map);

    const anillo = L.circle(centro, {
      radius: 1,
      color: colors.primary,
      weight: 2,
      opacity: 0.9,
      fillColor: colors.primary,
      fillOpacity: 0.22,
      interactive: false,
    }).addTo(map);

    // Deja espacio abajo para que los controles no tapen el círculo
    map.fitBounds(circulo.getBounds(), {
      paddingTopLeft: [30, 40],
      paddingBottomRight: [30, Math.round(BOTTOM_CONTROLES + 170)],
    });

    // Todas las propiedades arrancan apagadas; la onda las va encendiendo
    const revelados = new Set();
    onReveal(new Set());

    const DUR = 1600; // duración de cada onda (ms)
    const OLAS = 2; // cuántas ondas salen
    let inicio = null;
    let animId = null;

    const distancia = (p) =>
      map.distance(centro, L.latLng(p.latitude, p.longitude));

    function paso(t) {
      if (inicio === null) inicio = t;
      const el = t - inicio;
      const prog = (el % DUR) / DUR;
      const rad = r * (1 - Math.pow(1 - prog, 2)); // sale rápido y frena al llegar

      anillo.setRadius(Math.max(rad, 1));
      anillo.setStyle({
        opacity: 0.9 * (1 - prog),
        fillOpacity: 0.22 * (1 - prog),
      });

      let cambio = false;
      propsRef.current.forEach((p) => {
        if (!revelados.has(p.id_propiedad) && distancia(p) <= rad) {
          revelados.add(p.id_propiedad);
          cambio = true;
        }
      });
      if (cambio) onReveal(new Set(revelados));

      if (el < DUR * OLAS) {
        animId = requestAnimationFrame(paso);
      } else {
        map.removeLayer(anillo);
        const dentro = propsRef.current.filter((p) => distancia(p) <= r);
        onReveal(new Set(dentro.map((p) => p.id_propiedad)));
        onFin(dentro.length);
      }
    }

    animId = requestAnimationFrame(paso);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      [punto, circulo, anillo].forEach((capa) => map.removeLayer(capa));
    };
  }, [radar]);

  return null;
}

export default function LeafletMap({
  propiedades = [],
  centroInicial,
  propiedadSeleccionada,
  onSelectPropiedad,
}) {
  useEstilosMapa();

  const [radio, setRadio] = useState(1000);
  const [escaneando, setEscaneando] = useState(false);
  const [cercanas, setCercanas] = useState(null);
  const [radar, setRadar] = useState(null); // { lat, lng, r, id } o null
  const [revelados, setRevelados] = useState(null); // Set de ids o null

  // Última propiedad seleccionada: su marcador se queda en el mapa
  // aunque se cierre la tarjeta
  // (se actualiza durante el render, sin esperar a un efecto)
  const idFijadoRef = useRef(null);
  if (propiedadSeleccionada) {
    idFijadoRef.current = propiedadSeleccionada.id_propiedad;
  }
  const idFijado = idFijadoRef.current;

  const buscarCerca = () => {
    if (!navigator.geolocation) {
      window.alert("Tu navegador no permite obtener la ubicación.");
      return;
    }

    setEscaneando(true);
    setCercanas(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRadar({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          r: radio,
          id: Date.now(),
        });
      },
      () => {
        setEscaneando(false);
        window.alert(
          "No pude obtener tu ubicación. Revisa el permiso de ubicación del navegador (ícono del candado junto a la dirección).",
        );
      },
      { timeout: 10000 },
    );
  };

  const elegirRadio = (r) => {
    setRadio(r);
    // Si ya hay un radar en pantalla, lo repite con el radio nuevo
    if (radar && !escaneando) {
      setEscaneando(true);
      setCercanas(null);
      setRadar({ ...radar, r, id: Date.now() });
    }
  };

  const limpiar = () => {
    setRadar(null);
    setRevelados(null);
    setCercanas(null);
    setEscaneando(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapaWrapper}>
        <MapContainer
          className="hl-mapa"
          center={[centroInicial.latitude, centroInicial.longitude]}
          zoom={ZOOM_INICIAL}
          maxZoom={ZOOM_MAXIMO}
          zoomSnap={0.5}
          wheelPxPerZoomLevel={90}
          style={{
            width: "100%",
            height: "100%",
            background: darkColors.background,
          }}
          zoomControl={false}
        >
          <TileLayer
            url={`https://tiles.stadiamaps.com/tiles/${ESTILO_MAPA}/{z}/{x}/{y}{r}.png?api_key=${STADIA_KEY}`}
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; OpenStreetMap contributors'
            maxZoom={ZOOM_MAXIMO}
            maxNativeZoom={ZOOM_MAXIMO_TILES}
          />

          {/* Botones + / - arriba a la derecha */}
          <ZoomControl position="topright" />

          {propiedades.map((p) => {
            const estaSeleccionada =
              propiedadSeleccionada?.id_propiedad === p.id_propiedad;
            // Se muestra la propiedad seleccionada (y se queda aunque se
            // cierre la tarjeta), y las que la onda del radar ya alcanzó
            // (las cercanas). Las demás no se muestran.
            const visible =
              estaSeleccionada ||
              (idFijado !== null && String(idFijado) === String(p.id_propiedad)) ||
              (revelados !== null && revelados.has(p.id_propiedad));
            if (!visible) return null;

            return (
              <Marker
                key={p.id_propiedad}
                position={[p.latitude, p.longitude]}
                icon={estaSeleccionada ? ICONOS.seleccionado : ICONOS.normal}
                eventHandlers={{
                  click: () => onSelectPropiedad(p),
                }}
                zIndexOffset={estaSeleccionada ? 1000 : 0}
              />
            );
          })}

          <Radar
            radar={radar}
            propiedades={propiedades}
            onReveal={setRevelados}
            onFin={(n) => {
              setCercanas(n);
              setEscaneando(false);
            }}
          />
          <RecentrarMapa propiedadSeleccionada={propiedadSeleccionada} />
        </MapContainer>
      </View>

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
                onPress={() => elegirRadio(r)}
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
  // zIndex: 0 encierra los z-index internos de Leaflet para que el mapa
  // no quede por encima de la barra de navegación ni de la tarjeta.
  container: { flex: 1, zIndex: 0 },
  mapaWrapper: { flex: 1, zIndex: 0 },

  panel: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: BOTTOM_CONTROLES,
    gap: spacing.sm,
    alignItems: "center",
    zIndex: 2,
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

// FIN DEL ARCHIVO