// ============================================================
//   EDIT PROFILE SCREEN — Pantalla de editar perfil
//   Reutiliza Input (nombre, correo) y Avatar del resto de la app.
// ============================================================
import IconCheck from '../../assets/icons/icon-check.svg';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import { colors, fontSizes, fontWeights, radii, spacing } from '@/constants/theme-houseloop';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Íconos (mismos que usa signup.jsx)
import IconAlternateEmail from '../../assets/icons/icon-alternate-email.svg';
import IconPerson from '../../assets/icons/icon-person.svg';
import IconAdd from '../../assets/icons/icon-add.svg';

const LIMITS = {
  name:  { min: 2, max: 100 },
  email: { max: 254 },
};

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Guarda los valores originales (los que llegaron de AsyncStorage) ──
  // Sirven para comparar y saber si el usuario cambió algo de verdad.
  const [originalUsuario, setOriginalUsuario] = useState({
    nombre: '',
    correo: '',
    foto: null,
  });

  // ── Modales ──
  const [modalSalirVisible, setModalSalirVisible] = useState(false);
  const [modalExitoVisible, setModalExitoVisible] = useState(false);

  // ── Precargar los datos actuales del usuario ──
  useEffect(() => {
    async function cargarUsuario() {
      const datosGuardados = await AsyncStorage.getItem('usuario');
      if (datosGuardados) {
        const usuarioParseado = JSON.parse(datosGuardados);
        const datosIniciales = {
          nombre: usuarioParseado.nombre || '',
          correo: usuarioParseado.correo || '',
          foto: usuarioParseado.foto || null,
        };
        setName(datosIniciales.nombre);
        setEmail(datosIniciales.correo);
        setFoto(datosIniciales.foto);
        setOriginalUsuario(datosIniciales);
      }
    }
    cargarUsuario();
  }, []);

  // ── ¿El usuario cambió algo respecto a lo original? ──
  const fotoCambio  = foto !== originalUsuario.foto;
  const hayCambios  = name !== originalUsuario.nombre
    || email !== originalUsuario.correo
    || fotoCambio;

  // ── Elegir una foto nueva desde la galería ──
  const elegirFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Toast.show({ type: 'error', text1: 'Necesitamos permiso para acceder a tus fotos' });
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!resultado.canceled) {
      setFoto(resultado.assets[0].uri);
    }
  };

  const nameValid  = name.trim().length >= LIMITS.name.min && name.length <= LIMITS.name.max;
  const emailValid = email.length > 0 && email.length <= LIMITS.email.max;
  const canSubmit  = nameValid && emailValid;

 // ── Guardar cambios ──
// Manda nombre y correo al backend (PUT /api/perfil) para actualizar
// la base de datos, y si sale bien, refleja el cambio también en
// AsyncStorage para que el resto de la app vea el dato actualizado.
const handleGuardar = async () => {
  if (!canSubmit) return;

  // Si no cambió nada respecto a los datos originales, no llamamos
  // al backend — no tiene sentido hacer un PUT sin cambios
  if (!hayCambios) {
    Toast.show({ type: 'info', text1: 'No hay cambios para guardar' });
    return;
  }

  setLoading(true);

  try {
    // Sacamos el token guardado en el login, lo necesitamos para
    // que el middleware del backend sepa quién es el usuario
    const token = await AsyncStorage.getItem('token');

    // Mandamos la petición PUT con los datos nuevos en el body
    const response = await fetch('http://localhost:3300/api/perfil', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nombre: name, correo: email }),
    });

    const data = await response.json();

    // Si el backend respondió con error (ej: correo duplicado,
    // 400, 500, etc.), avisamos y NO tocamos nada localmente
    if (!response.ok) {
      Toast.show({ type: 'error', text1: data.mensaje || 'No se pudo guardar los cambios' });
      return;
    }

    // Si todo salió bien, actualizamos también lo que está guardado
    // en AsyncStorage bajo la key 'usuario', para que otras pantallas
    // que todavía lean de ahí (en vez de pedirle al backend) vean
    // el dato nuevo sin necesidad de volver a loguearse
    const datosGuardados = await AsyncStorage.getItem('usuario');
    const usuarioActual = datosGuardados ? JSON.parse(datosGuardados) : {};

    const usuarioActualizado = {
      ...usuarioActual,
      nombre: name,
      correo: email,
      foto: foto,
    };

    await AsyncStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

    // Actualizamos el "original" para que hayCambios vuelva a false
    // (si el usuario vuelve a esta pantalla sin cambiar nada más)
    setOriginalUsuario({ nombre: name, correo: email, foto });

    // Mostramos el modal de éxito
    setModalExitoVisible(true);
  } catch (error) {
    // Este catch agarra errores de red (ej: el backend no responde,
    // no hay conexión, etc.) — distinto al caso de arriba donde el
    // backend SÍ respondió, pero con un error
    console.error('Error al guardar perfil:', error);
    Toast.show({ type: 'error', text1: 'No se pudo guardar los cambios' });
  } finally {
    setLoading(false);
  }
};

  // ── Salir (botón cerrar o "volver atrás") ──
  const handleSalir = () => {
    if (hayCambios) {
      setModalSalirVisible(true);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Título + botón cerrar ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Editar perfil</Text>
          <Pressable style={styles.closeBtn} onPress={handleSalir} disabled={loading}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        {/* ── Avatar con botón de cambiar foto ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Avatar uri={foto} size="xxl" />

            {/* ── Spinner sobre el avatar mientras se guarda la foto ── */}
            {loading && fotoCambio && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color={colors.white} />
              </View>
            )}

            <Pressable style={styles.addPhotoBtn} onPress={elegirFoto} disabled={loading}>
              <IconAdd width={16} height={16} fill={colors.white} />
            </Pressable>
          </View>
        </View>

        {/* ── Input nombre (reutilizado de signup.jsx) ── */}
        <Input
          label="Nombre y apellido"
          value={name}
          onChangeText={setName}
          maxLength={LIMITS.name.max}
          icon={<IconPerson width={20} height={20} fill={colors.primaryDisabled} />}
          iconActive={<IconPerson width={20} height={20} fill={colors.primary} />}
        />

        {/* ── Input correo (igual que en signup.jsx) ── */}
        <Input
          label="Correo electrónico"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          maxLength={LIMITS.email.max}
          icon={<IconAlternateEmail width={20} height={20} fill={colors.primaryDisabled} />}
          iconActive={<IconAlternateEmail width={20} height={20} fill={colors.primary} />}
        />

        {/* ── Botón guardar cambios ── */}
        <Pressable
          style={[styles.btnPrimary, !canSubmit && styles.btnDisabled]}
          onPress={handleGuardar}
          disabled={!canSubmit || loading}
        >
          {loading
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.btnPrimaryText}>Guardar cambios</Text>
          }
        </Pressable>

        {/* ── Botón volver atrás ── */}
        <Pressable style={styles.btnOutline} onPress={handleSalir} disabled={loading}>
          <Text style={styles.btnOutlineText}>Volver atrás</Text>
        </Pressable>
      </ScrollView>

      {/* ── Modal: salir sin guardar cambios ── */}
      <Modal
        visible={modalSalirVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalSalirVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Deseas salir sin guardar cambios?</Text>
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnOutline]}
                onPress={() => setModalSalirVisible(false)}
              >
                <Text style={styles.modalBtnOutlineText}>No</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={() => {
                  setModalSalirVisible(false);
                  router.back();
                }}
              >
                <Text style={styles.modalBtnPrimaryText}>Sí</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

        {/* ── Modal: cambios guardados con éxito ── */}
      <Modal
        visible={modalExitoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalExitoVisible(false)}
        >
        <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
            <View style={styles.checkCircle}>
                <IconCheck width={32} height={32} fill="#22c55e" />
            </View>
            <Text style={styles.modalTitle}>¡Felicidades!</Text>
            <Text style={styles.modalSubtitle}>
                Se ha actualizado tu información correctamente
            </Text>
            <View style={styles.modalButtonsRow}>
                <Pressable
                style={[styles.modalBtn, styles.modalBtnOutline]}
                onPress={() => {
                    setModalExitoVisible(false);
                    router.back();
                }}
                >
                <Text style={styles.modalBtnOutlineText}>Ahora no</Text>
                </Pressable>
                <Pressable
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={() => {
                    setModalExitoVisible(false);
                    router.replace('/feed');
                }}
                >
                <Text style={styles.modalBtnPrimaryText}>Ir a inicio</Text>
                </Pressable>
            </View>
            </View>
        </View>
    </Modal>            
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
    color: colors.titles,
    fontFamily: 'Poppins_700Bold',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: colors.primary,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 58,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  btnPrimary: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  btnDisabled: {
    backgroundColor: colors.primaryDisabled,
  },
  btnPrimaryText: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: colors.white,
    fontFamily: 'Poppins_700Bold',
  },
  btnOutline: {
    width: '100%',
    height: 56,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  btnOutlineText: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    fontFamily: 'Poppins_700Bold',
  },

  // ── Modales ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: colors.titles,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
  },
  modalSubtitle: {
    fontSize: fontSizes.body2,
    color: colors.typography,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    marginBottom: spacing.sm,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
  },
  modalBtnPrimaryText: {
    color: colors.white,
    fontWeight: fontWeights.bold,
    fontFamily: 'Poppins_700Bold',
    fontSize: fontSizes.body2,
  },
  modalBtnOutline: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  modalBtnOutlineText: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
    fontFamily: 'Poppins_700Bold',
    fontSize: fontSizes.body2,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  checkIcon: {
    fontSize: 32,
    color: '#22c55e',
    fontWeight: 'bold',
  },
});