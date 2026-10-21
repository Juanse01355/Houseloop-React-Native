// ============================================================
//   ICONO DE PROPIEDAD — Casita que va dentro de los marcadores del mapa.
//   Lo usan los dos mapas: PropertyMap.jsx (celular) y LeafletMap.jsx (web).
//
//   Los mapas se dibujan con HTML (Leaflet), donde no se puede importar un
//   .svg como en el resto de la app. Para usar tu icon-property.svg:
//   abre el archivo, copia su viewBox y los <path .../> de adentro, y
//   pégalos aquí abajo. Se pinta con "currentColor" (blanco / rosado).
//
//   Guarda este archivo en: src/components/map/iconoPropiedad.js
// ============================================================
export const ICONO_PROPIEDAD_VIEWBOX = "0 0 24 24";
export const ICONO_PROPIEDAD_PATH = '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>';