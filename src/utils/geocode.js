// ============================================================
//   GEOCODE — Convierte una dirección en texto a coordenadas
//   (lat/lng) usando Nominatim (OpenStreetMap, gratis, sin API key).
//   Guarda un caché en memoria para no repetir la misma consulta
//   varias veces mientras la app está abierta.
// ============================================================
const cache = new Map();

export async function geocodeDireccion(direccion, ciudad = 'San Juan de Pasto') {
  const query = `${direccion}, ${ciudad}, Colombia`;

  if (cache.has(query)) {
    return cache.get(query);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HouseLoopApp/1.0',
      },
    });
    const data = await response.json();

    if (data.length === 0) {
      cache.set(query, null);
      return null;
    }

    const coords = {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };

    cache.set(query, coords);
    return coords;
  } catch (error) {
    console.error('Error al geocodificar:', error);
    return null;
  }
}

// ── Geocodifica una lista de propiedades, notificando cada
// resultado apenas está listo (en vez de esperar a que termine todo) ──
export async function geocodificarPropiedadesProgresivo(propiedades, onCadaUna) {
  for (const propiedad of propiedades) {
    const coords = await geocodeDireccion(propiedad.direccion, propiedad.barrio);

    if (coords) {
      onCadaUna({ ...propiedad, ...coords });
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}