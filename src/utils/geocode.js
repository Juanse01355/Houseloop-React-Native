// ============================================================
//   GEOCODE — Convierte una dirección en texto a coordenadas
//   (lat/lng) usando Nominatim (OpenStreetMap, gratis, sin API key).
//
//   Reglas de Nominatim que este archivo respeta:
//   - Máximo 1 petición por segundo (si no, responde 429 y bloquea).
//   - En el navegador NO se debe mandar la cabecera "User-Agent": eso
//     obliga al navegador a hacer una petición previa (OPTIONS) que
//     Nominatim rechaza y aparece como error de CORS.
//
//   Mejoras frente a la versión anterior:
//   - Siempre busca dentro de Pasto, Nariño (antes salía "Lorenzo,
//     Lorenzo, Colombia" y el punto caía en cualquier lado).
//   - Una sola cola con 1.1 s entre peticiones reales.
//   - Caché que se GUARDA en el dispositivo (AsyncStorage / localStorage):
//     cada dirección se consulta una sola vez, no en cada recarga.
//   - Si el backend ya manda latitude/longitude, no se consulta nada.
// ============================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CLAVE_CACHE = 'hl_geocode_cache_v1';
const ESPERA_MS = 1100; // Nominatim permite 1 petición por segundo
const BLOQUEO_MS = 60000; // si responde 429, se deja de insistir por 1 minuto

// Zona de búsqueda (alrededor de Pasto): izquierda, arriba, derecha, abajo
const VIEWBOX = '-77.36,1.28,-77.20,1.15';

const cache = new Map();
let cacheCargado = false;
let ultimaPeticion = 0;
let bloqueadoHasta = 0;

// ── Caché persistente ──
async function cargarCache() {
  if (cacheCargado) return;
  cacheCargado = true;
  try {
    const raw = await AsyncStorage.getItem(CLAVE_CACHE);
    if (raw) {
      Object.entries(JSON.parse(raw)).forEach(([k, v]) => cache.set(k, v));
    }
  } catch (error) {
    console.warn('No se pudo leer el caché de geocodificación:', error);
  }
}

async function guardarCache() {
  try {
    await AsyncStorage.setItem(
      CLAVE_CACHE,
      JSON.stringify(Object.fromEntries(cache)),
    );
  } catch (error) {
    console.warn('No se pudo guardar el caché de geocodificación:', error);
  }
}

// ── Espera su turno: nunca más de 1 petición por segundo, aunque haya
// varias búsquedas corriendo al mismo tiempo ──
async function esperarTurno() {
  const ahora = Date.now();
  const espera = Math.max(0, ultimaPeticion + ESPERA_MS - ahora);
  ultimaPeticion = ahora + espera; // reserva el turno de inmediato
  if (espera > 0) {
    await new Promise((resolve) => setTimeout(resolve, espera));
  }
}

export async function geocodeDireccion(direccion, barrio = '') {
  await cargarCache();

  // Siempre dentro de Pasto: dirección, barrio, ciudad y país
  const partes = [direccion, barrio, 'San Juan de Pasto', 'Nariño', 'Colombia']
    .map((x) => (x ?? '').toString().trim())
    .filter(Boolean);
  const query = partes.join(', ');

  if (cache.has(query)) {
    return cache.get(query);
  }

  // Si Nominatim nos bloqueó hace poco, no insistimos
  if (Date.now() < bloqueadoHasta) {
    return null;
  }

  try {
    await esperarTurno();

    const url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=1' +
      '&countrycodes=co' +
      `&viewbox=${VIEWBOX}` +
      `&q=${encodeURIComponent(query)}`;

    // En el navegador NO se manda User-Agent (provoca el error de CORS).
    // En el celular sí, porque ahí no hay problema.
    const opciones =
      Platform.OS === 'web'
        ? undefined
        : { headers: { 'User-Agent': 'HouseLoopApp/1.0' } };

    const response = await fetch(url, opciones);

    if (response.status === 429) {
      bloqueadoHasta = Date.now() + BLOQUEO_MS;
      console.warn('Nominatim pidió esperar (429). Se reintentará más tarde.');
      return null; // no se guarda en caché: se reintenta después
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      // Nominatim respondió bien pero no encontró la dirección
      cache.set(query, null);
      guardarCache();
      return null;
    }

    const coords = {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };

    cache.set(query, coords);
    guardarCache();
    return coords;
  } catch (error) {
    // Un "NetworkError" aquí casi siempre es que Nominatim está bloqueando
    // esta conexión (su respuesta de bloqueo no trae permiso de CORS).
    // Se deja de insistir un rato y se avisa con warn (no con error, para
    // que no salte la pantalla roja de Expo por cada propiedad).
    bloqueadoHasta = Date.now() + BLOQUEO_MS;
    console.warn('No se pudo consultar Nominatim, se reintentará en 1 minuto:', error?.message);
    return null;
  }
}

// ── Geocodifica una lista de propiedades, notificando cada
// resultado apenas está listo (en vez de esperar a que termine todo) ──
export async function geocodificarPropiedadesProgresivo(propiedades, onCadaUna) {
  for (const propiedad of propiedades) {
    // Si el backend ya trae las coordenadas, no hace falta consultar nada
    if (propiedad.latitude != null && propiedad.longitude != null) {
      onCadaUna({
        ...propiedad,
        latitude: Number(propiedad.latitude),
        longitude: Number(propiedad.longitude),
      });
      continue;
    }

    const coords = await geocodeDireccion(propiedad.direccion, propiedad.barrio);

    if (coords) {
      onCadaUna({ ...propiedad, ...coords });
    }
  }
}