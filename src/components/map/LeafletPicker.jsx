// ============================================================
//   LEAFLET PICKER — Mapa para marcar la ubicación exacta (solo web).
//   Tocar el mapa coloca el pin; el pin se puede arrastrar.
//
//   Guarda este archivo en: src/components/map/LeafletPicker.jsx
// ============================================================
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { colors, darkColors } from "@/constants/theme-houseloop";

// La key vive en el archivo .env (EXPO_PUBLIC_STADIA_KEY=...)
const STADIA_KEY = process.env.EXPO_PUBLIC_STADIA_KEY;

// Pin en forma de gota; la punta marca el punto exacto
const ICONO_PIN = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${colors.primary};border:3px solid #fff;box-sizing:border-box;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 31],
});

// Tocar el mapa mueve el pin a ese punto
function AlTocar({ onPick }) {
  useMapEvents({
    click: (e) => onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng }),
  });
  return null;
}

// Cuando llega una posición desde afuera (la dirección encontrada), el mapa vuela hasta ella
function Volar({ punto }) {
  const map = useMap();
  useEffect(() => {
    if (punto) {
      map.flyTo([punto.latitude, punto.longitude], Math.max(map.getZoom(), 18), {
        duration: 0.5,
      });
    }
  }, [punto?.latitude, punto?.longitude]);
  return null;
}

export default function LeafletPicker({ centro, puntoInicial, onChange }) {
  const [punto, setPunto] = useState(puntoInicial);

  // Si llega una posición nueva desde afuera, el pin se mueve ahí
  useEffect(() => {
    if (puntoInicial) setPunto(puntoInicial);
  }, [puntoInicial]);

  const elegir = (coords) => {
    setPunto(coords);
    onChange(coords);
  };

  return (
    <MapContainer
      center={[centro.latitude, centro.longitude]}
      zoom={puntoInicial ? 18 : 14}
      maxZoom={20}
      style={{ width: "100%", height: "100%", background: darkColors.background }}
    >
      <TileLayer
        url={`https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=${STADIA_KEY}`}
        attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; OpenStreetMap contributors'
        maxZoom={20}
      />

      <AlTocar onPick={elegir} />
      <Volar punto={puntoInicial} />

      {punto && (
        <Marker
          position={[punto.latitude, punto.longitude]}
          icon={ICONO_PIN}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const ll = e.target.getLatLng();
              elegir({ latitude: ll.lat, longitude: ll.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}