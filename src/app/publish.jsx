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
   términos y condiciones y todos los campos están llenos.

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
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, radii, spacing } from '@/constants/theme-houseloop';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import TopNav from '@/components/ui/TopNav';
import { BASE_URL } from "@/config/api"; // trae la URL de tu backend
import { mostrarToast } from '@/config/toast-config';
import Toast from 'react-native-toast-message';
import { ButtonPrimary } from '@/components/ui/Button';

const MAX_DESC = 720;

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

// ── Términos y condiciones (los mismos del registro, cámbialos por el definitivo) ──
const TERMINOS = [
  {
    titulo: '1. Aceptación',
    texto:
      'Al crear una cuenta en HouseLoop aceptas estos términos y condiciones. Si no estás de acuerdo con alguno de ellos, no podrás usar la plataforma.',
  },
  {
    titulo: '2. Tu cuenta',
    texto:
      'Debes registrar datos reales y mantenerlos actualizados. Eres responsable de la confidencialidad de tu contraseña y de todo lo que ocurra desde tu cuenta.',
  },
  {
    titulo: '3. Uso de la plataforma',
    texto:
      'HouseLoop permite publicar, buscar y contactar propiedades en Colombia. No está permitido publicar información falsa, contenido ofensivo, fotos o videos que no sean tuyos, ni usar la app para actividades ilegales.',
  },
  {
    titulo: '4. Publicaciones',
    texto:
      'Eres el único responsable de la veracidad de lo que publicas (precio, ubicación, fotos y descripción). HouseLoop puede retirar publicaciones que incumplan estas normas.',
  },
  {
    titulo: '5. Datos personales',
    texto:
      'Usamos tu nombre, correo y teléfono solo para el funcionamiento de la plataforma y para que otros usuarios puedan contactarte cuando tú lo permitas. Tratamos tus datos conforme a la normativa colombiana de protección de datos personales (Ley 1581 de 2012) y no los vendemos a terceros.',
  },
  {
    titulo: '6. Responsabilidad',
    texto:
      'HouseLoop es un intermediario de contacto. No participa en pagos, contratos ni visitas entre usuarios, y no se hace responsable por los acuerdos que ustedes realicen.',
  },
  {
    titulo: '7. Suspensión de la cuenta',
    texto:
      'Podemos suspender o eliminar cuentas que incumplan estos términos. También puedes pedir que eliminemos tu cuenta escribiendo a soporte@houseloop.co.',
  },
  {
    titulo: '8. Cambios',
    texto:
      'Podemos actualizar estos términos. Cuando haya cambios importantes te lo informaremos dentro de la app.',
  },
];

// ── Hoja inferior con los términos y condiciones ──
function TerminosSheet({ visible, onClose, onAceptar }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        {/* Fondo oscuro: tocarlo cierra la hoja */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitulo}>Términos y condiciones</Text>

          <ScrollView style={{ maxHeight: height * 0.5 }} showsVerticalScrollIndicator={false}>
            {TERMINOS.map((t) => (
              <View key={t.titulo} style={styles.terminoItem}>
                <Text style={styles.terminoTitulo}>{t.titulo}</Text>
                <Text style={styles.terminoTexto}>{t.texto}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.sheetBtn}>
            <ButtonPrimary text="Aceptar" onPress={onAceptar} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

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
  const [area, setArea] = useState('0');
  const [habitaciones, setHabitaciones] = useState(0);
  const [banos, setBanos] = useState(0);
  const [descripcion, setDescripcion] = useState('');
  const [descFoco, setDescFoco] = useState(false);

  const [ciudad, setCiudad] = useState('pasto');
  const [direccion, setDireccion] = useState('');
  const [barrio, setBarrio] = useState('');

  // ── Términos y condiciones ──
  const [terms, setTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false); // abre / cierra la hoja de términos

  const [enviando, setEnviando] = useState(false);

  // ── El botón Publicar solo se habilita con todos los campos llenos y los términos aceptados ──
  const camposCompletos =
    precio.trim() !== '' &&
    area.trim() !== '' &&
    direccion.trim() !== '' &&
    barrio.trim() !== '' &&
    descripcion.trim() !== '';

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
        setPrecio(String(p.precio ?? ''));
        setArea(String(p.area_m2 ?? '0'));
        setHabitaciones(Number(p.habitaciones) || 0);
        setBanos(Number(p.banos) || 0);
        setDescripcion(p.descripcion || '');
        setCiudad(p.ciudad || 'pasto');
        setDireccion(p.direccion || '');
        setBarrio(p.barrio || '');
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

  // ── Contadores habitaciones / baños ──
  const changeCounter = (setter) => (delta) => {
    setter((prev) => Math.max(0, prev + delta));
  };
  const changeHabitaciones = changeCounter(setHabitaciones);
  const changeBanos = changeCounter(setBanos);

  // ── Selección de video ──
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:['videos'],
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      // Para depurar: si fileSize sale 0 o undefined, el problema está en la selección
      console.log('🎥 Video elegido:', asset.uri, asset.fileSize, asset.mimeType);
      setVideoUri(asset.uri);
      mostrarToast('videoAgregado');
    }
  };

  // ── Selección de fotos (múltiples) ──
  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:['images'],
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) {
      console.log('🖼️ Fotos elegidas:', result.assets.map((a) => a.fileSize));
      setPhotos(result.assets.map((a) => a.uri));
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

    console.log('BASE_URL:', BASE_URL);
    console.log('📦 Se subirá:', { video: !!videoUri, fotos: photos.length });

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
      body: formData,
      // OJO: no pongas 'Content-Type' a mano aquí. El navegador/RN
      // necesita generar el "boundary" del multipart automáticamente;
      // si lo fijas tú mismo, la subida se rompe.
    });

    if (!response.ok) {
      throw new Error('No se pudieron subir las fotos/video');
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
    console.log('🟡 Publicar presionado');

    // Seguro extra: el botón ya está deshabilitado en estos casos
    if (!puedePublicar) return;

    if (!precio || !direccion || !barrio) {
      console.log('🔴 Validación falló:', { precio, direccion, barrio });
      Alert.alert('Campos incompletos', 'Por favor llena el precio, dirección y barrio.');
      return;
    }

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

      console.log('👤 Usuario desde AsyncStorage:', usuario);

      // 1. Subir archivos primero, para obtener sus URLs reales
      console.log('🟣 Subiendo archivos...');
      const archivosSubidos = await subirArchivos();
      console.log('🟣 Archivos subidos:', archivosSubidos);

      // 2. Armar el payload con las URLs reales (no las URIs locales)
      const payload = {
        ciudad: ciudad || 'pasto',
        direccion,
        barrio,
        titulo: `${tipoInmueble.toUpperCase()} en ${tipoOferta}`,
        descripcion,
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
      console.log('🟢 Enviando a:', url);

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
        console.log('🔴 Error del backend:', data);
        Alert.alert('Error', data.error || data.detalle || 'No se pudo guardar la propiedad.');
      }
    } catch (error) {
      console.error('🔴 Error de red:', error?.message, error);
      Alert.alert('Error de red', 'No se pudo conectar con el servidor backend.');
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
                  : 'Agregar video'}
            </Text>
          </Pressable>

          <Pressable style={styles.mediaUpload} onPress={pickPhotos}>
            <MaterialIcons name="image" size={36} color={colors.primary} />
            <Text style={styles.mediaUploadText}>
              {photos.length > 0
                ? `${photos.length} foto(s) nuevas seleccionadas`
                : fotosActuales.length > 0
                  ? `${fotosActuales.length} foto(s) actuales (toca para cambiarlas)`
                  : 'Agregar fotos'}
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

          {/* Precio */}
          <Input
            label="Precio $ (Sin puntos y comas)"
            value={precio}
            onChangeText={setPrecio}
            keyboardType="numeric"
            contenedorStyle={SIN_MARGEN}
          />

          {/* Área */}
          <Input
            label="Área (en m²)"
            value={area}
            onChangeText={setArea}
            keyboardType="numeric"
            contenedorStyle={SIN_MARGEN}
          />

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
              onChangeText={setDescripcion}
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

          {/* Dirección */}
          <Input
            label="Dirección"
            value={direccion}
            onChangeText={setDireccion}
            contenedorStyle={SIN_MARGEN}
          />

          {/* Barrio */}
          <Input
            label="Barrio"
            value={barrio}
            onChangeText={setBarrio}
            contenedorStyle={SIN_MARGEN}
          />
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

  // ── Hoja de términos y condiciones ──
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitulo: {
    fontSize: fontSizes.h3,
    fontWeight: '700',
    color: colors.titles,
    fontFamily: 'Poppins_700Bold',
    marginBottom: spacing.md,
  },
  terminoItem: {
    marginBottom: spacing.md,
  },
  terminoTitulo: {
    fontSize: fontSizes.body2,
    fontWeight: '700',
    color: colors.titles,
    fontFamily: 'Poppins_400Regular',
    marginBottom: spacing.xs,
  },
  terminoTexto: {
    fontSize: fontSizes.body3,
    color: colors.typography,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  sheetBtn: {
    marginTop: spacing.md,
  },
});