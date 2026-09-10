// ============================================================
//   LEAFLET MAP — Mapa interactivo con Leaflet (solo para web).
//   Estilo oscuro con Stadia Maps (Alidade Smooth Dark), con un
//   filtro CSS que acerca la paleta del mapa al color de marca
//   de HouseLoop. Marcadores tipo "burbuja de precio", resaltados
//   cuando están seleccionados.
// ============================================================
import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

function crearIconoPrecio(precio, seleccionado) {
  const texto = formatearPrecioCorto(precio);

  return L.divIcon({
    className: "",
    html: `
      <div style="
        background: ${seleccionado ? "#ffffff" : "#ff5a5f"};
        color: ${seleccionado ? "#ff5a5f" : "#ffffff"};
        padding: 6px 12px;
        border-radius: 16px;
        font-weight: 700;
        font-size: 13px;
        font-family: sans-serif;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        border: 2px solid ${seleccionado ? "#ff5a5f" : "#ffffff"};
        transform: ${seleccionado ? "scale(1.1)" : "scale(1)"};
        transition: transform 0.15s ease;
      ">
        ${texto}
      </div>
    `,
    iconSize: null,
    iconAnchor: [30, 15],
  });
}

function RecentrarMapa({ propiedadSeleccionada }) {
  const map = useMap();

  useEffect(() => {
    if (propiedadSeleccionada) {
      map.flyTo([propiedadSeleccionada.latitude, propiedadSeleccionada.longitude], 16, {
        duration: 0.6,
      });
    }
  }, [propiedadSeleccionada]);

  return null;
}

export default function LeafletMap({
  propiedades,
  centroInicial,
  propiedadSeleccionada,
  onSelectPropiedad,
}) {
  return (
    <View style={styles.container}>
      {/* Este View extra es el que lleva el filtro CSS que tiñe el mapa
          hacia el color de marca. Solo envuelve al MapContainer. */}
      <View style={styles.mapaConFiltro}>
        <MapContainer
          center={[centroInicial.latitude, centroInicial.longitude]}
          zoom={14}
          style={{ width: "100%", height: "100%", background: "#1a1a2e" }}
          zoomControl={false}
        >
          <TileLayer
            // Tiles de Stadia Maps, estilo "Alidade Smooth Dark":
            // fondo oscuro con edificios en gris claro, buen contraste
            // para que se distingan las manzanas/bloques.
            url={`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=0db5c7d2-846c-477b-9838-ac45e89197dd`}
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; OpenStreetMap contributors'
          />

          {propiedades.map((p) => {
            const estaSeleccionada =
              propiedadSeleccionada?.id_propiedad === p.id_propiedad;

            return (
              <Marker
                key={p.id_propiedad}
                position={[p.latitude, p.longitude]}
                icon={crearIconoPrecio(p.precio, estaSeleccionada)}
                eventHandlers={{
                  click: () => onSelectPropiedad(p),
                }}
                zIndexOffset={estaSeleccionada ? 1000 : 0}
              />
            );
          })}

          <RecentrarMapa propiedadSeleccionada={propiedadSeleccionada} />
        </MapContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapaConFiltro: {
    flex: 1,
    // Filtro CSS aplicado solo en web (React Native lo ignora en móvil,
    // no rompe nada ahí, simplemente no tiene efecto):
    // - hue-rotate mueve el tono general del mapa hacia el rojo/coral
    //   de la marca HouseLoop (ajusta el número entre -180 y 180 hasta
    //   que se vea bien; empieza probando -15deg)
    // - saturate intensifica un poco los colores para que no se vea "lavado"
    // - brightness aclara levemente para resaltar más los edificios
    filter: "hue-rotate(-15deg) saturate(1.2) brightness(1.05)",
  },
});