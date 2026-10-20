/* ============================================================
   CONTACT SCREEN — Formulario para contactar a un usuario
   Mismo estilo que publish.jsx: header con "Volver atrás"
   (componente TopNav), secciones con título e ícono, campos
   propios y botones ButtonPrimary / ButtonSecondary.

   Tiene DOS modos, según los parámetros que reciba:
     - Desde una propiedad:  { id }              → muestra la card
       de la propiedad y contacta a su vendedor.
     - Desde un perfil:      { usuario, nombre } → SIN card de
       propiedad; contacta directamente a ese usuario.

   El nombre y el correo NO se piden: salen de la sesión.
   Se piden: teléfono principal, teléfono opcional, motivo,
   cómo prefiere que lo contacten, horario (opcional) y mensaje.

   PASO 1: el formulario y sus validaciones.
   PASO 2 (pendiente): enviar los datos al backend y por correo.

   Guarda este archivo en: src/app/contact.jsx
   Se abre con:
     router.push({ pathname: "/contact", params: { id } })                 // desde detail.jsx
     router.push({ pathname: "/contact", params: { usuario, nombre } })    // desde user-profile.jsx
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import Toast from 'react-native-toast-message';

import { colors, fontSizes, radii, scale, spacing } from '@/constants/theme-houseloop';
import { BASE_URL } from '@/config/api';
import { ButtonPrimary, ButtonSecondary } from '@/components/ui/Button';

// Ícono SVG de ubicación (el mismo de detail.jsx)
import IconLocationOn from '../../assets/icons/icon-location-outlined.svg';

// Ícono SVG de play (sobre la miniatura del video)
import IconPlay from '../../assets/icons/icon-play.svg';

// Íconos SVG de los títulos de sección
import IconAssignment from '../../assets/icons/icon-assignment.svg'; // "Tus datos"
import IconMessage from '../../assets/icons/icon-message.svg'; // "Tu consulta"

import TopNav from '@/components/ui/TopNav';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';

const MAX_MENSAJE = 300;

// Opciones de los selectores
const FORMAS_CONTACTO = ['WhatsApp', 'Llamada', 'Correo'];
const HORARIOS = ['Mañana', 'Tarde', 'Noche'];

// Motivos de la consulta (cambian si la propiedad es en arriendo)
const MOTIVOS_VENTA = [
  'Quiero agendar una visita',
  'Quiero más información',
  'Quiero hacer una oferta',
];
const MOTIVOS_ARRIENDO = [
  'Quiero agendar una visita',
  'Quiero más información',
  'Preguntar requisitos',
];
// Motivos cuando se contacta desde un perfil (no hay propiedad de referencia)
const MOTIVOS_PERFIL = [
  'Quiero más información',
  'Quiero conocer sus propiedades',
  'Quiero hacer una consulta',
];

// Términos y condiciones (texto de ejemplo, cámbialo por el definitivo)
const TERMINOS = [
  {
    titulo: '1. Uso del formulario',
    texto:
      'Este formulario sirve únicamente para contactar a un usuario o al vendedor de una propiedad publicada en HouseLoop. Te comprometes a usarlo de forma respetuosa y con información real.',
  },
  {
    titulo: '2. Datos que compartes',
    texto:
      'Al enviar el formulario, HouseLoop comparte con el destinatario tu nombre, correo electrónico, número de teléfono, motivo de consulta, forma y horario de contacto, y el mensaje que escribas.',
  },
  {
    titulo: '3. Tratamiento de la información',
    texto:
      'Tus datos se usan solo para que el destinatario pueda comunicarse contigo. HouseLoop no los vende a terceros y los trata conforme a la normativa colombiana de protección de datos personales (Ley 1581 de 2012).',
  },
  {
    titulo: '4. Responsabilidad del vendedor',
    texto:
      'El vendedor es el único responsable de la veracidad de su publicación y de la negociación que acuerde contigo. HouseLoop actúa como intermediario de contacto y no participa en pagos, contratos ni visitas.',
  },
  {
    titulo: '5. Conducta esperada',
    texto:
      'No está permitido enviar mensajes ofensivos, spam, publicidad o contenido ilegal. HouseLoop puede restringir el acceso a quienes incumplan estas normas.',
  },
  {
    titulo: '6. Tus derechos',
    texto:
      'Puedes solicitar en cualquier momento que se corrijan o eliminen tus datos escribiendo a soporte@houseloop.co.',
  },
  {
    titulo: '7. Cambios en los términos',
    texto:
      'HouseLoop puede actualizar estos términos. Cuando haya cambios importantes te lo informaremos dentro de la app.',
  },
];

// ── Helpers ──

// 124000000 → "$124’000.000"   |   250000 → "$250.000"
function formatearPrecio(valor) {
  const digitos = String(Math.round(Number(valor) || 0));
  const grupos = [];
  for (let i = digitos.length; i > 0; i -= 3) {
    grupos.unshift(digitos.slice(Math.max(0, i - 3), i));
  }
  if (grupos.length <= 2) return `$${grupos.join('.')}`;
  const ultimos = grupos.slice(-2).join('.');
  const millones = grupos.slice(0, -2).join('’');
  return `$${millones}’${ultimos}`;
}

// Primera letra en mayúscula: "venta" → "Venta"
const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '');

// Un celular colombiano tiene 10 dígitos y empieza por 3
const celularValido = (tel) => /^3\d{9}$/.test(tel);

// Solo números, máximo 10 dígitos
const soloDigitos = (texto) => texto.replace(/\D/g, '').slice(0, 10);

// Texto sugerido del mensaje, según el motivo elegido.
// Si no hay título de propiedad (modo perfil), habla del perfil.
function mensajeSugerido(titulo, motivo) {
  const base = titulo
    ? `Hola, vi tu publicación "${titulo}" en HouseLoop.`
    : 'Hola, vi tu perfil en HouseLoop.';
  return motivo ? `${base} ${motivo}.` : base;
}

// Los parámetros de la ruta pueden llegar como arreglo; tomamos el primero
const primerValor = (v) => (Array.isArray(v) ? v[0] : v);

// Vuelve a la pantalla anterior; si no hay una, manda al feed
// (TopNav hace lo mismo en el header; esta función se usa en el
// botón secundario, el estado de error y el modal de éxito)
const volver = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/feed');
  }
};

// ── Campo de teléfono: Input con el ícono a la derecha (igual que login/signup) ──
function CampoTelefono({ etiqueta, value, onChangeText }) {
  return (
    <Input
      label={etiqueta}
      value={value}
      onChangeText={onChangeText}
      keyboardType="phone-pad"
      maxLength={10}
      contenedorStyle={{ marginBottom: 0 }}
      icon={<MaterialIcons name="phone" size={24} color={colors.primaryDisabled} />}
      iconActive={<MaterialIcons name="phone" size={20} color={colors.primary} />}
    />
  );
}

// ── Hoja inferior con los términos y condiciones ──
function TerminosSheet({ visible, onClose, onAceptar }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.dropOverlay}>
        {/* Fondo oscuro: tocarlo cierra la hoja */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.dropSheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.dropHandle} />
          <Text style={styles.dropTitulo}>Términos y condiciones</Text>

          <ScrollView style={{ maxHeight: height * 0.5 }} showsVerticalScrollIndicator={false}>
            {TERMINOS.map((t) => (
              <View key={t.titulo} style={styles.terminoItem}>
                <Text style={styles.terminoTitulo}>{t.titulo}</Text>
                <Text style={styles.terminoTexto}>{t.texto}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.terminosBtn}>
            <ButtonPrimary text="Aceptar" onPress={onAceptar} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Reproductor del video (se monta solo mientras el modal está abierto,
//    así el audio se corta al cerrar) ──
function Reproductor({ uri, onClose }) {
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });

  return (
    <View style={styles.videoOverlay}>
      <VideoView player={player} style={styles.videoView} contentFit="contain" nativeControls />
      <Pressable
        style={[styles.videoCerrar, { top: insets.top + spacing.md }]}
        onPress={onClose}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Cerrar video"
      >
        <MaterialIcons name="close" size={24} color={colors.white} />
      </Pressable>
    </View>
  );
}

function VideoModal({ visible, uri, onClose }) {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      {visible && uri ? <Reproductor uri={uri} onClose={onClose} /> : null}
    </Modal>
  );
}

export default function ContactScreen() {
  const params = useLocalSearchParams();
  const id = primerValor(params.id); // propiedad (modo propiedad)
  const usuarioParam = primerValor(params.usuario); // usuario destino (modo perfil)
  const nombreParam = primerValor(params.nombre); // nombre del usuario destino (modo perfil)

  // ── Datos cargados ──
  const [propiedad, setPropiedad] = useState(null); // null en modo perfil
  const [perfil, setPerfil] = useState(null); // nombre y correo del usuario logueado
  const [usuarioId, setUsuarioId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  // ── Estado del formulario ──
  const [telefono, setTelefono] = useState('');
  const [telefono2, setTelefono2] = useState('');
  const [motivo, setMotivo] = useState('');
  const [formaContacto, setFormaContacto] = useState('WhatsApp');
  const [horario, setHorario] = useState('');
  const [mensaje, setMensaje] = useState('');
  const ultimoSugerido = useRef('');

  const [intentoEnvio, setIntentoEnvio] = useState(false);
  const [mensajeFoco, setMensajeFoco] = useState(false);
  const [terminos, setTerminos] = useState(false);
  const [verTerminos, setVerTerminos] = useState(false);
  const [verVideo, setVerVideo] = useState(false);

  // ── Carga la propiedad (si hay) y los datos del usuario logueado ──
  useEffect(() => {
    async function cargar() {
      // Sin propiedad ni usuario no sabemos a quién contactar
      if (!id && !usuarioParam) {
        setError(true);
        setCargando(false);
        return;
      }
      try {
        setCargando(true);
        setError(false);

        const usuarioRaw = await AsyncStorage.getItem('usuario');
        if (usuarioRaw) setUsuarioId(String(JSON.parse(usuarioRaw).id));

        // Solo se pide la propiedad si el formulario viene desde una
        let titulo = null;
        if (id) {
          const response = await fetch(`${BASE_URL}/propiedades/${id}`);
          const data = await response.json();
          if (!response.ok) {
            setError(true);
            return;
          }
          setPropiedad(data);
          titulo = data.titulo;
        }

        // Mensaje sugerido inicial
        const inicial = mensajeSugerido(titulo, null);
        ultimoSugerido.current = inicial;
        setMensaje(inicial);

        // Nombre y correo para mostrar con qué datos se enviará (solo informativo)
        try {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            const resPerfil = await fetch(`${BASE_URL}/api/perfil`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (resPerfil.ok) setPerfil(await resPerfil.json());
          }
        } catch (errPerfil) {
          console.warn('No se pudo cargar el perfil:', errPerfil);
        }
      } catch (err) {
        console.error('Error al cargar el formulario:', err);
        setError(true);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [id, usuarioParam]);

  // ── Estados de carga / error ──
  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.errorGrande}>
          {id ? 'No se pudo cargar la propiedad' : 'No se pudo cargar el formulario'}
        </Text>
        <ButtonSecondary text="Volver atrás" onPress={volver} />
      </View>
    );
  }

  // ── Datos derivados ──
  // Modo perfil = no hay propiedad de referencia
  const modoPerfil = !propiedad;
  // A quién va dirigido el mensaje
  const idDestinatario = propiedad ? String(propiedad.id_usuario) : String(usuarioParam);
  const nombreDestino = nombreParam || propiedad?.propietario || 'el vendedor';

  const esDueno = usuarioId !== null && idDestinatario === usuarioId;
  const noDisponible = !modoPerfil && propiedad.estado === 'no_disponible';
  const bloqueado = esDueno || noDisponible;
  const motivos = modoPerfil
    ? MOTIVOS_PERFIL
    : propiedad.tipo_operacion === 'arriendo'
      ? MOTIVOS_ARRIENDO
      : MOTIVOS_VENTA;

  // URL del video (si viene como ruta relativa, se le antepone el servidor)
  const urlVideo = propiedad?.video
    ? /^https?:\/\//.test(propiedad.video)
      ? propiedad.video
      : `${BASE_URL}${propiedad.video.startsWith('/') ? '' : '/'}${propiedad.video}`
    : null;
  const imagen = propiedad?.miniatura || propiedad?.fotos?.[0] || null;

  // Datos extra del preview (solo se muestran los que existen)
  const etiquetaPrecio =
    propiedad?.tipo_operacion === 'arriendo' ? 'Precio de arriendo' : 'Precio de venta';
  const tipoInmuebleMostrado = propiedad?.tipo_inmueble
    ? capitalizar(propiedad.tipo_inmueble)
    : null;
  // Chips: tipo de oferta y tipo de inmueble (ej. "Venta", "Casa")
  const etiquetas = [propiedad?.tipo_operacion, propiedad?.tipo_inmueble]
    .filter(Boolean)
    .map(capitalizar);

  // Ubicación (solo se muestran los datos que existan): "Barrio, Ciudad"
  const ubicacion = [propiedad?.barrio, propiedad?.ciudad].filter(Boolean).join(', ');

  // ── Validaciones ──
  const errores = {};
  if (!telefono) {
    errores.telefono = 'Escribe tu número de celular.';
  } else if (!celularValido(telefono)) {
    errores.telefono = 'Debe tener 10 dígitos y empezar por 3.';
  }
  if (telefono2 && !celularValido(telefono2)) {
    errores.telefono2 = 'Debe tener 10 dígitos y empezar por 3.';
  } else if (telefono2 && telefono2 === telefono) {
    errores.telefono2 = 'Debe ser distinto al principal.';
  }
  if (!motivo) errores.motivo = 'Elige el motivo de tu consulta.';
  if (!mensaje.trim()) {
    errores.mensaje = modoPerfil
      ? `Escribe un mensaje para ${nombreDestino}.`
      : 'Escribe un mensaje para el vendedor.';
  }
  if (!terminos) errores.terminos = 'Debes aceptar los términos y condiciones.';

  const verError = (campo) => (intentoEnvio ? errores[campo] : undefined);

  // ── Acciones ──
  const elegirMotivo = (nuevo) => {
    setMotivo(nuevo);
    // Si el mensaje sigue siendo el sugerido (no lo editó), lo actualizamos
    if (mensaje === ultimoSugerido.current || !mensaje.trim()) {
      const nuevoTexto = mensajeSugerido(propiedad?.titulo, nuevo);
      ultimoSugerido.current = nuevoTexto;
      setMensaje(nuevoTexto);
    }
  };

  const enviar = () => {
    setIntentoEnvio(true);
    if (bloqueado) return;
    if (Object.keys(errores).length > 0) return;

    // TODO (paso 2): enviar estos datos al backend para guardarlos y avisar al destinatario:
    // {
    //   id_destinatario: idDestinatario,
    //   ...(propiedad && { id_propiedad: propiedad.id_propiedad }),
    //   telefono, telefono2, motivo, formaContacto, horario, mensaje,
    // }

    // Volvemos a la pantalla anterior (detail o user-profile) y, cuando
    // termina la transición, mostramos el toast de éxito allí
    volver();
    setTimeout(() => {
      Toast.show({
        type: 'success',
        text1: 'Información enviada con éxito',
        position: 'top',
      });
    }, 300);
  };

  return (
    <KeyboardAvoidingView
      style={styles.app}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── HEADER ── */}
      <TopNav />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Título y subtítulo ── */}
        <Text style={styles.title}>Contactar</Text>
        <Text style={styles.subtitle}>
          {modoPerfil
            ? `Déjale tus datos a ${nombreDestino} para que se comunique contigo.`
            : 'Déjale tus datos al vendedor para que se comunique contigo.'}
        </Text>

        {/* ── Propiedad (solo para ver). Solo aparece si el formulario viene de una propiedad ── */}
        {propiedad && (
          <View style={styles.propiedadCard}>
            <Pressable
              style={styles.propiedadMedia}
              onPress={() => urlVideo && setVerVideo(true)}
              disabled={!urlVideo}
              accessibilityRole="button"
              accessibilityLabel="Reproducir video"
            >
              {imagen ? (
                <Image source={{ uri: imagen }} style={styles.propiedadImg} />
              ) : (
                <View style={styles.propiedadImg} />
              )}
              {urlVideo && (
                <View style={styles.playIcono} pointerEvents="none">
                  <IconPlay
                    width={scale(32)}
                    height={scale(32)}
                    fill={colors.white}
                    color={colors.white}
                  />
                </View>
              )}
            </Pressable>
            <View style={styles.propiedadInfo}>
              {etiquetas.length > 0 && (
                <View style={styles.etiquetas}>
                  {etiquetas.map((e) => (
                    <View key={e} style={styles.etiqueta}>
                      <Text style={styles.etiquetaTexto}>{e}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.propiedadEtiqueta} numberOfLines={1}>
                {etiquetaPrecio}
                {tipoInmuebleMostrado ? (
                  <>
                    {'  •  '}
                    <Text style={styles.propiedadTipo}>{tipoInmuebleMostrado}</Text>
                  </>
                ) : null}
              </Text>
              <Text style={styles.propiedadPrecio}>{formatearPrecio(propiedad.precio)}</Text>
              {ubicacion ? (
                <View style={styles.ubicacionFila}>
                  <IconLocationOn
                    width={scale(14)}
                    height={scale(14)}
                    fill={colors.typography}
                    color={colors.typography}
                  />
                  <Text style={styles.propiedadUbicacion} numberOfLines={1}>
                    {ubicacion}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* ── Avisos que bloquean el envío ── */}
        {esDueno && (
          <Text style={styles.aviso}>
            {modoPerfil
              ? 'Este es tu perfil, no puedes enviarte un mensaje.'
              : 'Esta propiedad es tuya, no puedes enviarte un mensaje.'}
          </Text>
        )}
        {!esDueno && noDisponible && (
          <Text style={styles.aviso}>Esta propiedad ya no está disponible.</Text>
        )}

        {/* ── SECCIÓN TUS DATOS ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <IconAssignment
              width={scale(22)}
              height={scale(22)}
              fill={colors.typography}
              color={colors.typography}
            />
            <Text style={styles.sectionTitle}>Tus datos</Text>
          </View>

          {/* Teléfono principal */}
          <View style={styles.field}>
            <CampoTelefono
              etiqueta="Teléfono principal"
              value={telefono}
              onChangeText={(t) => setTelefono(soloDigitos(t))}
            />
            {verError('telefono') ? <Text style={styles.error}>{verError('telefono')}</Text> : null}
          </View>

          {/* Teléfono secundario */}
          <View style={styles.field}>
            <CampoTelefono
              etiqueta="Teléfono secundario (opcional)"
              value={telefono2}
              onChangeText={(t) => setTelefono2(soloDigitos(t))}
            />
            {verError('telefono2') ? (
              <Text style={styles.error}>{verError('telefono2')}</Text>
            ) : null}
          </View>
        </View>

        {/* ── SECCIÓN TU CONSULTA ── */}
        <View style={[styles.section, styles.sectionConsulta]}>
          <View style={styles.sectionTitleRow}>
            <IconMessage
              width={scale(22)}
              height={scale(22)}
              fill={colors.typography}
              color={colors.typography}
            />
            <Text style={styles.sectionTitle}>Tu consulta</Text>
          </View>

          {/* Motivo */}
          <View style={styles.field}>
            <Dropdown
              label="Motivo de tu consulta"
              titulo="Motivo de tu consulta"
              valor={motivo}
              opciones={motivos}
              onChange={elegirMotivo}
            />
            {verError('motivo') ? <Text style={styles.error}>{verError('motivo')}</Text> : null}
          </View>

          {/* Cómo prefiere que lo contacten */}
          <View style={styles.field}>
            <Dropdown
              label="¿Cómo prefieres que te contacten?"
              titulo="¿Cómo prefieres que te contacten?"
              valor={formaContacto}
              opciones={FORMAS_CONTACTO}
              onChange={setFormaContacto}
            />
          </View>

          {/* Horario */}
          <View style={styles.field}>
            <Dropdown
              label="Mejor horario para contactarte (opcional)"
              titulo="Mejor horario para contactarte"
              valor={horario}
              opciones={HORARIOS}
              opcionVacia="Sin preferencia"
              onChange={setHorario}
            />
          </View>

          {/* Mensaje */}
          <View style={styles.field}>
            <View style={[styles.textareaGroup, mensajeFoco && styles.textareaGroupFoco]}>
              <Text style={styles.textareaLabel}>Mensaje</Text>
              <TextInput
                style={styles.textarea}
                onFocus={() => setMensajeFoco(true)}
                onBlur={() => setMensajeFoco(false)}
                multiline
                maxLength={MAX_MENSAJE}
                value={mensaje}
                onChangeText={(t) => setMensaje(t.slice(0, MAX_MENSAJE))}
              />
              <Text style={styles.charCount}>
                {mensaje.length}/{MAX_MENSAJE}
              </Text>
            </View>
            {verError('mensaje') ? <Text style={styles.error}>{verError('mensaje')}</Text> : null}
          </View>

          <Text style={styles.privacidad}>
            Al enviar, compartes tu nombre, correo y teléfono con{' '}
            {modoPerfil ? nombreDestino : 'el vendedor'}. Solo {modoPerfil ? 'esa persona' : 'él'}{' '}
            podrá verlos.
          </Text>

          {/* Términos y condiciones */}
          <View style={styles.field}>
            <View style={styles.terminosFila}>
              <Pressable
                onPress={() => setTerminos(!terminos)}
                hitSlop={8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: terminos }}
              >
                <View style={[styles.radio, terminos && styles.radioActive]}>
                  {terminos && <View style={styles.radioDot} />}
                </View>
              </Pressable>
              <Text style={styles.checkTexto}>
                Acepto los{' '}
                <Text style={styles.terminosLink} onPress={() => setVerTerminos(true)}>
                  términos y condiciones
                </Text>
              </Text>
            </View>
            {verError('terminos') ? <Text style={styles.error}>{verError('terminos')}</Text> : null}
          </View>
        </View>

        {/* ── BOTONES ── */}
        <View style={styles.actions}>
          <ButtonPrimary text="Enviar" onPress={enviar} disabled={bloqueado || !terminos} />
          <Pressable
            style={({ pressed }) => [styles.btnVolver, pressed && styles.btnVolverPresionado]}
            onPress={volver}
            accessibilityRole="button"
          >
            <Text style={styles.btnVolverTexto}>Volver atrás</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Hoja de términos y condiciones ── */}
      <TerminosSheet
        visible={verTerminos}
        onClose={() => setVerTerminos(false)}
        onAceptar={() => {
          setTerminos(true);
          setVerTerminos(false);
        }}
      />

      {/* ── Video de la propiedad ── */}
      <VideoModal visible={verVideo} uri={urlVideo} onClose={() => setVerVideo(false)} />

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
    padding: spacing.lg,
  },
  errorGrande: {
    fontSize: fontSizes.body1,
    color: colors.titles,
    textAlign: 'center',
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

  // ── Propiedad ──
  propiedadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  propiedadMedia: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcono: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  videoCerrar: {
    position: 'absolute',
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propiedadImg: {
    width: 88,
    height: 88,
    borderRadius: radii.sm,
    backgroundColor: colors.divider,
  },
  propiedadInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  propiedadPrecio: {
    fontSize: fontSizes.body1,
    fontWeight: '700',
    color: colors.primary,
  },
  etiquetas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  etiqueta: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: colors.divider,
  },
  etiquetaTexto: {
    fontSize: fontSizes.overline,
    color: colors.typography,
    fontFamily: 'Poppins_400Regular',
  },
  propiedadEtiqueta: {
    fontSize: fontSizes.body3,
    color: colors.typography,
    fontFamily: 'Poppins_400Regular',
  },
  propiedadTipo: {
    color: colors.titles,
    fontFamily: 'Poppins_700Bold',
  },
  ubicacionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  propiedadUbicacion: {
    flexShrink: 1,
    fontSize: fontSizes.body3,
    color: colors.typography,
    fontFamily: 'Poppins_400Regular',
  },
  aviso: {
    fontSize: fontSizes.body2,
    color: colors.primaryHover,
    marginBottom: spacing.md,
  },

  // ── Secciones (igual que publish) ──
  section: {
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginBottom: spacing.md,
  },
  // Más espacio entre los campos de "Tu consulta" (los labels flotantes sobresalen del borde)
  sectionConsulta: {
    gap: spacing.lg,
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
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSizes.body3,
    color: colors.typography,
  },
  error: {
    fontSize: fontSizes.body3,
    color: colors.primaryHover,
  },
  dropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dropSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  dropHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  dropTitulo: {
    fontSize: fontSizes.h3,
    fontWeight: '700',
    color: colors.titles,
    marginBottom: spacing.sm,
  },
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
  privacidad: {
    fontSize: fontSizes.body3,
    color: colors.typography,
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    marginTop: spacing.md,
  },

  // ── Botón "Volver atrás" del final ──
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

  // ── Términos y condiciones ──
  terminosFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  checkTexto: {
    flex: 1,
    fontSize: fontSizes.body2,
    color: colors.titles,
    fontFamily: 'Poppins_400Regular',
  },
  terminosLink: {
    color: colors.primary,
    fontFamily: 'Poppins_400Regular',
    textDecorationLine: 'underline',
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
  terminosBtn: {
    marginTop: spacing.md,
  },

});