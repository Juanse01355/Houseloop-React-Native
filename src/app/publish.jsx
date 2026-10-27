//****AVISO IMPORTANTE PARA TENER EN CUENTA */
// No olvidar colocar esta linea 
// para que no se use el 100% de la pantalla en Android, y no se rompa, por eso hay que importar
//la libreria StatusBar de react-native y colocarla en la parte superior del return

/* ============================================================
   PUBLISH SCREEN — Publicar inmueble
   Equivalente en React Native de publish.html / publish.css
   Usa los componentes reutilizables Input.jsx, Dropdown.jsx,
   TopNav.jsx, Button.jsx y el tema en @/constants/theme-houseloop

   Mismo estilo que contact.jsx: header con TopNav, campos con
   label flotante, listas desplegables en hoja inferior.

   El botón Publicar solo se habilita cuando se aceptan los
   términos y condiciones y todos los campos están llenos y válidos.

   Dependencias que asume este archivo (instálalas si no las
   tienes):
     expo install @expo/vector-icons
     expo install expo-image-picker   (para elegir foto/video)
*/

import { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors, fontSizes, radii, spacing } from '@/constants/theme-houseloop';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import TopNav from '@/components/ui/TopNav';
import TerminosSheet from '@/components/ui/TerminosSheet';
import UbicacionPicker from '@/components/map/UbicacionPicker';
import { BASE_URL } from "@/config/api"; // trae la URL de tu backend
import { mostrarToast } from '@/config/toast-config';
import Toast from 'react-native-toast-message';
import { ButtonPrimary } from '@/components/ui/Button';

const MAX_DESC = 720;

// ── Límites de los archivos (deben ser iguales o menores a los del servidor y de Cloudinary gratis) ──
// Video: 40 MB (la transformación de video de Cloudinary gratis llega hasta 40 MB)
// Foto: 10 MB y 25 megapíxeles por foto, hasta 10 fotos por publicación
const MB = 1024 * 1024;
const MAX_VIDEO_MB = 40;
const MAX_FOTO_MB = 10;
const MAX_FOTOS = 10;
const MAX_MEGAPIXELES = 25;

// ── Límites de cada campo ──
// Precio: hasta 12 dígitos (hasta 999.999.999.999). Está pendiente confirmarlo con la columna de la base.
// Área: hasta 7 dígitos y 2 decimales (hasta 9.999.999,99 m²)
// Habitaciones y baños: de 0 a 20
const LIMITS = {
  precio:    { max: 12 },
  area:      { maxEntero: 7, maxDecimales: 2 },
  contador:  { max: 20 },
  direccion: { min: 5, max: 60 },
  barrio:    { min: 3, max: 40 },
};

// ── Limpieza de lo que se escribe (los caracteres no permitidos ni se pueden teclear) ──

// Letras permitidas: A-Z, con tildes, ñ y ü
const LETRAS = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';

// Solo números, sin ceros a la izquierda (007 → 7, pero 0 se queda como 0)
const limpiarEntero = (texto) =>
  texto.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');

// Números con un solo punto decimal y máximo 2 decimales (85.5, 120.25)
const limpiarDecimal = (texto) => {
  const soloValidos = texto.replace(/[^0-9.]/g, '');
  const [entero, ...resto] = soloValidos.split('.');
  const enteroLimpio = entero.replace(/^0+(?=\d)/, '');
  if (resto.length === 0) return enteroLimpio;
  return `${enteroLimpio}.${resto.join('').slice(0, LIMITS.area.maxDecimales)}`;
};

// Dirección: letras, números, espacio y # . , -  (ej: "Calle 18 # 25-30")
const limpiarDireccion = (texto) =>
  texto
    .replace(new RegExp(`[^${LETRAS}0-9 #.,-]`, 'g'), '')
    .replace(/ {2,}/g, ' ')   // no permite dos espacios seguidos
    .replace(/^ /, '');       // no permite empezar con espacio

// Barrio: letras, números, espacio, punto y guion (ej: "Villa Flor II")
const limpiarBarrio = (texto) =>
  texto
    .replace(new RegExp(`[^${LETRAS}0-9 .-]`, 'g'), '')
    .replace(/ {2,}/g, ' ')
    .replace(/^ /, '');

// Descripción: texto normal, pero sin los símbolos que se usan para meter código
const CARACTERES_PROHIBIDOS_DESC = /[<>{}\[\]\\|^~`]/;
const limpiarDescripcion = (texto) => texto.replace(/[<>{}\[\]\\|^~`]/g, '');

// Formatos válidos (para revisar también lo que ya venía guardado)
const DIRECCION_REGEX = new RegExp(`^[${LETRAS}0-9#.,-]+( [${LETRAS}0-9#.,-]+)*$`);
const BARRIO_REGEX    = new RegExp(`^[${LETRAS}0-9.-]+( [${LETRAS}0-9.-]+)*$`);

// Opciones de las listas desplegables
const OFERTAS = [
  { label: 'Venta', value: 'venta' },
  { label: 'Arriendo', value: 'arriendo' },
];
const INMUEBLES = [
  { label: 'Casa', value: 'casa' },
  { label: 'Apartamento', value: 'apartamento' },
  { label: 'Local', value: 'local' },
  { label: 'Lote', value: 'lote' },
  { label: 'Finca', value: 'finca' },
];
const CIUDADES = [{ label: 'San Juan de Pasto, Nariño', value: 'pasto' }];

// Quita el margen de abajo del Input: el espacio entre campos lo da el "gap" de la sección
const SIN_MARGEN = { marginBottom: 0 };

// ── Tipos MIME según la extensión del archivo ──
// En el celular hay que decirle al FormData de qué tipo es cada archivo.
const MIME_POR_EXTENSION = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  '3gp': 'video/3gpp',
  webm: 'video/webm',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

// Devuelve { nombre, tipo } a partir del uri. Si el uri no trae
// extensión (pasa con algunos content:// de Android), usa los valores por defecto.
const infoDeArchivo = (uri, baseNombre, extPorDefecto) => {
  const limpio = uri.split('?')[0];
  const ext = limpio.includes('.') ? limpio.split('.').pop().toLowerCase() : '';
  const extFinal = MIME_POR_EXTENSION[ext] ? ext : extPorDefecto;
  return {
    nombre: `${baseNombre}.${extFinal}`,
    tipo: MIME_POR_EXTENSION[extFinal],
  };
};

// ── Adjunta un archivo al FormData según la plataforma ──
// - Web: FormData necesita un Blob real, así que se descarga el contenido del uri.
// - Celular (Android/iOS): NO se debe usar fetch(uri).blob() porque llega vacío
//   (0 bytes). React Native lee el archivo por sí solo cuando recibe
//   el objeto { uri, name, type }.
const adjuntarArchivo = async (formData, campo, uri, nombre, tipo) => {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    formData.append(campo, blob, nombre);
  } else {
    // Expo SDK 57: el fetch de Expo NO acepta { uri, name, type }
    // ("Unsupported FormDataPart implementation"). Hay que usar un File
    // de expo-file-system, que se comporta como un Blob y se lee desde el disco.
    formData.append(campo, new File(uri));
  }
};

// ── Contador (habitaciones / baños) con el mismo look del Input ──
function Contador({ label, valor, onMas, onMenos }) {
  return (
    <View style={styles.contador}>
      <Text style={styles.contadorLabel}>{label}</Text>
      <Text style={styles.contadorValor}>{valor}</Text>
      <View style={styles.counterBtns}>
        <Pressable onPress={onMas} hitSlop={6}>
          <MaterialIcons name="expand-less" size={20} color={colors.typography} />
        </Pressable>
        <Pressable onPress={onMenos} hitSlop={6}>
          <MaterialIcons name="expand-more" size={20} color={colors.typography} />
        </Pressable>
      </View>
    </View>
  );
}

export default function PublishScreen() {
  const router = useRouter();

  // ── Modo edición: si llega un "id" por la ruta, el formulario edita en vez de crear ──
  const { id } = useLocalSearchParams();
  const modoEdicion = !!id;
  const [cargando, setCargando] = useState(modoEdicion);

  // ── Estado del formulario ──
  const [videoUri, setVideoUri] = useState(null);   // video NUEVO elegido (uri local)
  const [photos, setPhotos] = useState([]);          // fotos NUEVAS elegidas (uris locales)
  const [videoActual, setVideoActual] = useState(null);   // URL del video ya guardado (edición)
  const [fotosActuales, setFotosActuales] = useState([]); // URLs de fotos ya guardadas (edición)

  const [tipoOferta, setTipoOferta] = useState('venta');
  const [tipoInmueble, setTipoInmueble] = useState('casa');
  const [precio, setPrecio] = useState('');
  const [area, setArea] = useState('');
  const [habitaciones, setHabitaciones] = useState(0);
  const [banos, setBanos] = useState(0);
  const [descripcion, setDescripcion] = useState('');
  const [descFoco, setDescFoco] = useState(false);

  const [ciudad, setCiudad] = useState('pasto');
  const [direccion, setDireccion] = useState('');
  const [barrio, setBarrio] = useState('');

  // ── Ubicación exacta marcada en el mapa ──
  const [coords, setCoords] = useState(null); // { latitude, longitude } o null
  const [showMapa, setShowMapa] = useState(false); // abre / cierra el mapa para marcar el punto

  // ── Términos y condiciones ──
  const [terms, setTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false); // abre / cierra la hoja de términos

  const [enviando, setEnviando] = useState(false);

  // ── Validación de cada campo ──
  const direccionLimpia   = direccion.trim();
  const barrioLimpio      = barrio.trim();
  const descripcionLimpia = descripcion.trim();

  const precioValido =
    /^[1-9]\d*$/.test(precio) && precio.length <= LIMITS.precio.max;

  const areaValida =
    new RegExp(`^\\d{1,${LIMITS.area.maxEntero}}(\\.\\d{1,${LIMITS.area.maxDecimales}})?$`).test(area) &&
    Number(area) > 0;

  const direccionValida =
    direccionLimpia.length >= LIMITS.direccion.min &&
    direccionLimpia.length <= LIMITS.direccion.max &&
    DIRECCION_REGEX.test(direccionLimpia);

  const barrioValido =
    barrioLimpio.length >= LIMITS.barrio.min &&
    barrioLimpio.length <= LIMITS.barrio.max &&
    BARRIO_REGEX.test(barrioLimpio);

  const descripcionValida =
    descripcionLimpia !== '' &&
    descripcion.length <= MAX_DESC &&
    !CARACTERES_PROHIBIDOS_DESC.test(descripcion);

  // ── El botón Publicar solo se habilita con todos los campos válidos y los términos aceptados ──
  const camposCompletos =
    precioValido &&
    areaValida &&
    direccionValida &&
    barrioValido &&
    descripcionValida &&
    coords !== null;

  const puedePublicar = camposCompletos && terms && !enviando && !cargando;

  // ── En modo edición: cargar los datos de la propiedad y llenar el formulario ──
  useEffect(() => {
    if (!modoEdicion) return;

    const cargarPropiedad = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/propiedades/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const p = await response.json();

        if (!response.ok) {
          Alert.alert('Error', p.error || 'No se pudo cargar la propiedad.');
          router.back();
          return;
        }

        setTipoOferta(p.tipo_operacion || 'venta');
        setTipoInmueble(p.tipo_inmueble || 'casa');
        // El precio y el área pueden venir como "350000000.00": se llevan a número limpio
        setPrecio(p.precio != null ? String(Math.round(Number(p.precio))) : '');
        setArea(p.area_m2 != null ? String(Number(p.area_m2)) : '');
        setHabitaciones(Number(p.habitaciones) || 0);
        setBanos(Number(p.banos) || 0);
        setDescripcion(p.descripcion || '');
        setCiudad(p.ciudad || 'pasto');
        setDireccion(p.direccion || '');
        setBarrio(p.barrio || '');
        if (p.latitud != null && p.longitud != null) {
          setCoords({ latitude: Number(p.latitud), longitude: Number(p.longitud) });
        }
        setVideoActual(p.video || null);
        setFotosActuales(Array.isArray(p.fotos) ? p.fotos : []);
        setTerms(true); // ya los aceptó al publicar
      } catch (error) {
        console.error('🔴 Error cargando propiedad:', error);
        Alert.alert('Error de red', 'No se pudo cargar la propiedad.');
        router.back();
      } finally {
        setCargando(false);
      }
    };

    cargarPropiedad();
  }, [id]);

  // ── Contadores habitaciones / baños (de 0 a 20) ──
  const changeCounter = (setter) => (delta) => {
    setter((prev) => Math.min(LIMITS.contador.max, Math.max(0, prev + delta)));
  };
  const changeHabitaciones = changeCounter(setHabitaciones);
  const changeBanos = changeCounter(setBanos);

  // ── Selección de video ──
  // Si pesa más de MAX_VIDEO_MB se avisa y NO se selecciona (el servidor
  // lo rechazaría igual, pero así el usuario no espera la subida para enterarse).
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:['videos'],
      quality: 1,
    });
    if (result.canceled) return;

    const video = result.assets[0];

    // fileSize puede venir vacío en algunos celulares: en ese caso no se puede revisar aquí
    if (video.fileSize && video.fileSize > MAX_VIDEO_MB * MB) {
      Alert.alert(
        'Video muy pesado',
        `Tu video pesa ${(video.fileSize / MB).toFixed(1)} MB y el máximo es ${MAX_VIDEO_MB} MB. Elige uno más corto.`
      );
      return;
    }

    setVideoUri(video.uri);
    mostrarToast('videoAgregado');
  };

  // ── Selección de fotos (múltiples) ──
  // quality: 0.7 comprime cada foto al elegirla. Las que pesen más de
  // MAX_FOTO_MB o tengan más de MAX_MEGAPIXELES se descartan con un aviso.
  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_FOTOS,
      quality: 0.7,
    });
    if (result.canceled) return;

    const aceptadas = [];
    let descartadas = 0;

    // slice: seguro extra por si el selector deja elegir más del límite
    result.assets.slice(0, MAX_FOTOS).forEach((foto) => {
      const muyPesada = foto.fileSize && foto.fileSize > MAX_FOTO_MB * MB;
      const muyGrande =
        foto.width && foto.height && foto.width * foto.height > MAX_MEGAPIXELES * 1000000;

      if (muyPesada || muyGrande) {
        descartadas += 1;
      } else {
        aceptadas.push(foto.uri);
      }
    });

    if (descartadas > 0) {
      Alert.alert(
        'Algunas fotos no se agregaron',
        `${descartadas} foto(s) son demasiado grandes (máximo ${MAX_FOTO_MB} MB y ${MAX_MEGAPIXELES} megapíxeles). Elige otras o tómalas con menor resolución.`
      );
    }

    if (aceptadas.length > 0) {
      setPhotos(aceptadas);
      mostrarToast('fotosAgregadas');
    }
  };

  // ── Sube video + fotos al backend y devuelve sus URLs reales ──
  const subirArchivos = async () => {
    // Si no hay nada NUEVO que subir, no llamamos al backend.
    // En edición se conservan el video y las fotos que ya estaban guardados.
    if (!videoUri && photos.length === 0) {
      return { video: videoActual, miniatura: null, fotos: fotosActuales };
    }

    // /upload exige sesión iniciada: el token va en el header Authorization
    const token = await AsyncStorage.getItem('token');

    const formData = new FormData();

    if (videoUri) {
      const { nombre, tipo } = infoDeArchivo(videoUri, 'video', 'mp4');
      await adjuntarArchivo(formData, 'video', videoUri, nombre, tipo);
    }

    for (let i = 0; i < photos.length; i++) {
      const { nombre, tipo } = infoDeArchivo(photos[i], `foto_${i}`, 'jpg');
      await adjuntarArchivo(formData, 'fotos', photos[i], nombre, tipo);
    }

    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      // OJO: no pongas 'Content-Type' a mano aquí. El navegador/RN
      // necesita generar el "boundary" del multipart automáticamente;
      // si lo fijas tú mismo, la subida se rompe.
    });

    if (!response.ok) {
      // El backend responde { error: '...' } o { mensaje: '...' }
      let motivo = '';
      try {
        const err = await response.json();
        motivo = err.error || err.mensaje || '';
      } catch (e) {
        // la respuesta no era JSON; se usa el mensaje genérico
      }
      console.warn('/upload respondió', response.status, motivo);
      throw new Error(motivo || 'No se pudieron subir las fotos/video');
    }

    const subidos = await response.json(); // { video, miniatura, fotos }

    // Lo que no se cambió se conserva (en creación estos valores están vacíos)
    return {
      video: subidos.video || videoActual,
      miniatura: subidos.miniatura || null,
      fotos: subidos.fotos && subidos.fotos.length > 0 ? subidos.fotos : fotosActuales,
    };
  };

  // ── Envío de datos al backend ──
  const handlePublicar = async () => {
    // Seguro extra: el botón ya está deshabilitado en estos casos
    if (!puedePublicar) return;

    setEnviando(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const usuarioRaw = await AsyncStorage.getItem('usuario');

      if (!token || !usuarioRaw) {
        Alert.alert('Sesión no encontrada', 'Debes iniciar sesión para publicar un inmueble.');
        setEnviando(false);
        return;
      }

      const usuario = JSON.parse(usuarioRaw);

      // 1. Subir archivos primero, para obtener sus URLs reales
      const archivosSubidos = await subirArchivos();

      // 2. Armar el payload con las URLs reales (no las URIs locales)
      const payload = {
        ciudad: ciudad || 'pasto',
        direccion: direccionLimpia,
        barrio: barrioLimpio,
        latitud: coords?.latitude,
        longitud: coords?.longitude,
        titulo: `${tipoInmueble.toUpperCase()} en ${tipoOferta}`,
        descripcion: descripcionLimpia,
        precio: Number(precio),
        area_m2: Number(area),
        habitaciones: Number(habitaciones),
        banos: Number(banos),
        tipo_operacion: tipoOferta,
        tipo_inmueble: tipoInmueble,
        estado: 'disponible',
        id_usuario: usuario.id,
        video: archivosSubidos.video,
        miniatura: archivosSubidos.miniatura,
        fotos: archivosSubidos.fotos,
      };

      const url = modoEdicion ? `${BASE_URL}/propiedades/${id}` : `${BASE_URL}/propiedades`;

      const response = await fetch(url, {
        method: modoEdicion ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: modoEdicion ? '¡Cambios guardados con éxito!' : '¡Propiedad publicada con éxito!',
        });
        router.replace('/feed');
      } else {
        console.warn('Error del backend al guardar la propiedad:', data);
        Alert.alert('Error', data.error || data.detalle || 'No se pudo guardar la propiedad.');
      }
    } catch (error) {
      console.error('🔴 Error de red:', error?.message, error);
      Alert.alert('No se pudo publicar', error?.message || 'No se pudo conectar con el servidor backend.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.app}>

      {/* ── HEADER ── */}
      <TopNav />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Título y subtítulo ── */}
        <Text style={styles.title}>{modoEdicion ? 'Edita tú inmueble' : 'Publica tú inmueble'}</Text>
        <Text style={styles.subtitle}>
          Sube un video descriptivo del lugar que está ofertando, para que las
          personas interesadas puedan ver mejor de que se trata
        </Text>

        {/* ── ZONA MULTIMEDIA ── */}
        <View style={styles.mediaRow}>
          <Pressable style={styles.mediaUpload} onPress={pickVideo}>
            <MaterialIcons name="videocam" size={36} color={colors.primary} />
            <Text style={styles.mediaUploadText}>
              {videoUri
                ? 'Video nuevo seleccionado ✓'
                : videoActual
                  ? 'Video actual ✓ (toca para cambiarlo)'
                  : `Agregar video (máx. ${MAX_VIDEO_MB} MB)`}
            </Text>
          </Pressable>

          <Pressable style={styles.mediaUpload} onPress={pickPhotos}>
            <MaterialIcons name="image" size={36} color={colors.primary} />
            <Text style={styles.mediaUploadText}>
              {photos.length > 0
                ? `${photos.length} foto(s) nuevas seleccionadas`
                : fotosActuales.length > 0
                  ? `${fotosActuales.length} foto(s) actuales (toca para cambiarlas)`
                  : `Agregar fotos (hasta ${MAX_FOTOS})`}
            </Text>
          </Pressable>
        </View>

        {/* ── SECCIÓN DATOS ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="home-work" size={22} color="#A2A1A4" />
            <Text style={styles.sectionTitle}>Datos</Text>
          </View>

          {/* Tipo de oferta */}
          <Dropdown
            label="Tipo de oferta"
            valor={tipoOferta}
            opciones={OFERTAS}
            onChange={setTipoOferta}
          />

          {/* Tipo de inmueble */}
          <Dropdown
            label="Tipo de inmueble"
            valor={tipoInmueble}
            opciones={INMUEBLES}
            onChange={setTipoInmueble}
          />

          {/* Precio: solo números */}
          <Input
            label="Precio $ (Sin puntos y comas)"
            value={precio}
            onChangeText={(texto) => setPrecio(limpiarEntero(texto))}
            keyboardType="numeric"
            maxLength={LIMITS.precio.max}
            contenedorStyle={SIN_MARGEN}
          />
          {precio !== '' && !precioValido && (
            <Text style={styles.errorText}>
              Escribe un precio mayor a 0, solo números (máximo {LIMITS.precio.max} dígitos)
            </Text>
          )}

          {/* Área: números con un punto decimal */}
          <Input
            label="Área (en m²)"
            value={area}
            onChangeText={(texto) => setArea(limpiarDecimal(texto))}
            keyboardType="decimal-pad"
            maxLength={LIMITS.area.maxEntero + 1 + LIMITS.area.maxDecimales}
            contenedorStyle={SIN_MARGEN}
          />
          {area !== '' && !areaValida && (
            <Text style={styles.errorText}>
              Escribe un área mayor a 0, por ejemplo 85 u 85.5
            </Text>
          )}

          {/* Habitaciones y Baños */}
          <View style={styles.row}>
            <View style={styles.fieldHalf}>
              <Contador
                label="Habitaciones"
                valor={habitaciones}
                onMas={() => changeHabitaciones(1)}
                onMenos={() => changeHabitaciones(-1)}
              />
            </View>

            <View style={styles.fieldHalf}>
              <Contador
                label="Baños"
                valor={banos}
                onMas={() => changeBanos(1)}
                onMenos={() => changeBanos(-1)}
              />
            </View>
          </View>

          {/* Descripción */}
          <View style={[styles.textareaGroup, descFoco && styles.textareaGroupFoco]}>
            <Text style={styles.textareaLabel}>Describe tú inmueble</Text>
            <TextInput
              style={styles.textarea}
              onFocus={() => setDescFoco(true)}
              onBlur={() => setDescFoco(false)}
              multiline
              maxLength={MAX_DESC}
              value={descripcion}
              onChangeText={(texto) => setDescripcion(limpiarDescripcion(texto))}
            />
            <Text style={styles.charCount}>{descripcion.length}/{MAX_DESC}</Text>
          </View>
        </View>

        {/* ── SECCIÓN UBICACIÓN ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="location-on" size={22} color="#A2A1A4" />
            <Text style={styles.sectionTitle}>Ubicación</Text>
          </View>

          {/* Ciudad */}
          <Dropdown
            label="Ciudad/Departamento"
            valor={ciudad}
            opciones={CIUDADES}
            onChange={setCiudad}
          />

          {/* Dirección: letras, números y # . , - */}
          <Input
            label="Dirección"
            value={direccion}
            onChangeText={(texto) => setDireccion(limpiarDireccion(texto))}
            maxLength={LIMITS.direccion.max}
            contenedorStyle={SIN_MARGEN}
          />
          {direccion !== '' && !direccionValida && (
            <Text style={styles.errorText}>
              La dirección debe tener entre {LIMITS.direccion.min} y {LIMITS.direccion.max} caracteres
            </Text>
          )}

          {/* Barrio: letras, números, punto y guion */}
          <Input
            label="Barrio"
            value={barrio}
            onChangeText={(texto) => setBarrio(limpiarBarrio(texto))}
            maxLength={LIMITS.barrio.max}
            contenedorStyle={SIN_MARGEN}
          />
          {barrio !== '' && !barrioValido && (
            <Text style={styles.errorText}>
              El barrio debe tener entre {LIMITS.barrio.min} y {LIMITS.barrio.max} caracteres
            </Text>
          )}

          {/* Marcar el punto exacto en el mapa */}
          <Pressable style={styles.mapaBtn} onPress={() => setShowMapa(true)}>
            <MaterialIcons name="place" size={24} color={colors.primary} />
            <Text style={styles.mapaBtnTexto}>
              {coords
                ? 'Ubicación marcada ✓ (toca para cambiarla)'
                : 'Marcar ubicación exacta en el mapa'}
            </Text>
          </Pressable>
        </View>

        {/* ── Términos y condiciones: el círculo marca/desmarca, el texto rosado abre la hoja ── */}
        <View style={styles.terminosRow}>
          <Pressable
            onPress={() => setTerms(!terms)}
            hitSlop={8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: terms }}
          >
            <View style={[styles.radio, terms && styles.radioActive]}>
              {terms && <View style={styles.radioDot} />}
            </View>
          </Pressable>
          <Text style={styles.terminosText}>
            Acepto los{' '}
            <Text style={styles.terminosLink} onPress={() => setShowTerms(true)}>
              términos y condiciones
            </Text>
          </Text>
        </View>

        {/* ── BOTONES ── */}
        <View style={styles.actions}>
          <ButtonPrimary
            text={
              enviando
                ? modoEdicion ? 'Guardando...' : 'Publicando...'
                : modoEdicion ? 'Guardar cambios' : 'Publicar'
            }
            onPress={handlePublicar}
            disabled={!puedePublicar}
          />
          <Pressable
            style={({ pressed }) => [styles.btnVolver, pressed && styles.btnVolverPresionado]}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <Text style={styles.btnVolverTexto}>Volver atrás</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* Hoja de términos y condiciones */}
      <TerminosSheet
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        onAceptar={() => {
          setTerms(true);
          setShowTerms(false);
        }}
      />

      {/* Ventana para marcar la ubicación exacta en el mapa */}
      <UbicacionPicker
        visible={showMapa}
        onClose={() => setShowMapa(false)}
        onConfirm={setCoords}
        puntoGuardado={coords}
        direccion={direccion}
        barrio={barrio}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: fontSizes.h1,
    fontWeight: '700',
    color: colors.titles,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSizes.body2,
    color: colors.typography,
    marginBottom: spacing.lg,
  },
  mediaRow: {
    flexDirection: 'column',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  mediaUpload: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radii.md,
  },
  mediaUploadText: {
    fontSize: fontSizes.h4,
    fontWeight: '700',
    color: colors.primary,
  },

  // ── Secciones: más espacio entre campos (los labels flotantes sobresalen del borde) ──
  section: {
    gap: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.h2,
    fontWeight: '700',
    color: colors.titles,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fieldHalf: {
    flex: 1,
  },

  // ── Aviso rojo bajo un campo inválido ──
  // marginTop negativo: lo acerca al campo de arriba (la sección ya deja un espacio entre hijos)
  errorText: {
    fontSize: fontSizes.body3,
    fontFamily: 'Poppins_400Regular',
    color: '#ef4444',
    marginTop: -spacing.md,
  },

  // ── Contadores (habitaciones / baños) ──
  contador: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  contadorLabel: {
    position: 'absolute',
    top: -10,
    left: spacing.md,
    backgroundColor: colors.white,
    paddingHorizontal: 4,
    zIndex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: fontSizes.body3,
    color: colors.primary,
  },
  contadorValor: {
    flex: 1,
    fontSize: fontSizes.body2,
    color: colors.titles,
    fontFamily: 'Poppins_400Regular',
    paddingTop: 8,
  },
  counterBtns: {
    flexDirection: 'column',
    gap: 2,
  },

  // ── Descripción ──
  textareaGroup: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    position: 'relative',
  },
  textareaGroupFoco: {
    borderColor: colors.primary,
  },
  textareaLabel: {
    position: 'absolute',
    top: -10,
    left: spacing.md,
    backgroundColor: colors.white,
    paddingHorizontal: 4,
    zIndex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: fontSizes.body3,
    color: colors.primary,
  },
  textarea: {
    minHeight: 100,
    padding: spacing.md,
    fontSize: fontSizes.body2,
    color: colors.titles,
    fontFamily: 'Poppins_400Regular',
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    fontSize: fontSizes.overline,
    color: colors.typography,
  },

  // ── Botón para marcar la ubicación exacta en el mapa ──
  mapaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radii.md,
  },
  mapaBtnTexto: {
    fontSize: fontSizes.body2,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },

  // ── Términos y condiciones ──
  terminosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  terminosText: {
    flexShrink: 1,
    fontSize: fontSizes.body2,
    color: colors.titles,
    fontFamily: 'Poppins_400Regular',
  },
  terminosLink: {
    color: colors.primary,
    fontFamily: 'Poppins_400Regular',
    textDecorationLine: 'underline',
  },

  actions: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    marginTop: spacing.md,
  },

  // ── Botón "Volver atrás" del final (mismo estilo que contact.jsx) ──
  btnVolver: {
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnVolverPresionado: {
    backgroundColor: colors.secondaryHover,
  },
  btnVolverTexto: {
    fontSize: fontSizes.h3,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
});