// ============================================================
//   EDIT PROFILE SCREEN — Pantalla de editar perfil
//   Reutiliza Input (nombre, correo) y Avatar del resto de la app.
// ============================================================
import IconSave from '../../assets/icons/icon-save.svg';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import { BASE_URL } from '@/config/api';
import { mostrarToast } from '@/config/toast-config';
import { colors, fontSizes, fontWeights, radii, spacing } from '@/constants/theme-houseloop';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { File } from 'expo-file-system';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Íconos (mismos que usa signup.jsx)
import IconAlternateEmail from '../../assets/icons/icon-alternate-email.svg';
import IconPerson from '../../assets/icons/icon-person.svg';
import IconAdd from '../../assets/icons/icon-add.svg';

const LIMITS = {
  name:  { min: 2, max: 100 },
  email: { max: 254 },
};

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
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

  // ── Hoja de "guardar cambios antes de salir" ──
  const [modalSalirVisible, setModalSalirVisible] = useState(false);

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
      mediaTypes: ['images'],
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

  // ── Sube la foto de perfil al backend, si el usuario eligió una nueva ──
  const subirFotoPerfil = async (token) => {
    if (!fotoCambio || !foto) return null;

    const formData = new FormData();

    // Web: FormData necesita un Blob. Celular: fetch(uri).blob() llega vacío,
    // así que se usa un File de expo-file-system (igual que en publish.jsx).
    if (Platform.OS === 'web') {
      const respuestaBlob = await fetch(foto);
      const blob = await respuestaBlob.blob();
      formData.append('foto_perfil', blob, 'foto_perfil.jpg');
    } else {
      formData.append('foto_perfil', new File(foto));
    }

    const response = await fetch(`${BASE_URL}/api/perfil/foto_perfil`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'No se pudo subir la foto de perfil');
    }

    return data.foto_perfil_url;
  };

  // ── Guardar cambios ──
  // Manda nombre y correo al backend (PUT /api/perfil) para actualizar
  // la base de datos, y si sale bien, refleja el cambio también en
  // AsyncStorage para que el resto de la app vea el dato actualizado.
  //
  // Al terminar va al perfil y muestra un toast:
  //   - Si cambió la foto → "Foto de perfil actualizada".
  //   - Si cambió solo el nombre o el correo → "Cambios guardados".
  const handleGuardar = async () => {
    if (!canSubmit) return;

    if (!hayCambios) {
      Toast.show({ type: 'info', text1: 'No hay cambios para guardar' });
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');

      let fotoUrlFinal = originalUsuario.foto;
      if (fotoCambio) {
        fotoUrlFinal = await subirFotoPerfil(token);
      }

      const response = await fetch(`${BASE_URL}/api/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre: name, correo: email }),
      });

      const data = await response.json();

      if (!response.ok) {
        Toast.show({ type: 'error', text1: data.mensaje || 'No se pudo guardar los cambios' });
        return;
      }

      const datosGuardados = await AsyncStorage.getItem('usuario');
      const usuarioActual = datosGuardados ? JSON.parse(datosGuardados) : {};

      const usuarioActualizado = {
        ...usuarioActual,
        nombre: name,
        correo: email,
        foto: fotoUrlFinal,
      };

      await AsyncStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

      setOriginalUsuario({ nombre: name, correo: email, foto: fotoUrlFinal });
      setFoto(fotoUrlFinal);

      // Toast según lo que cambió y directo al perfil
      mostrarToast(fotoCambio ? 'fotoPerfil' : 'cambiosGuardados');
      router.replace('/profile');
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      Toast.show({ type: 'error', text1: 'No se pudo guardar los cambios' });
    } finally {
      setLoading(false);
    }
  };

  // ── Guardar desde la hoja de "salir": cierra la hoja y guarda ──
  const guardarYSalir = () => {
    setModalSalirVisible(false);

    if (!canSubmit) {
      Toast.show({ type: 'error', text1: 'Revisa tu nombre y correo antes de guardar' });
      return;
    }

    handleGuardar();
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

      {/* ── Hoja inferior: ¿guardar los cambios antes de salir? ── */}
      <Modal
        visible={modalSalirVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalSalirVisible(false)}
      >
        <View style={styles.salirOverlay}>
          {/* Fondo oscuro: tocarlo cierra la hoja y sigue editando */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalSalirVisible(false)}
          />

          <View style={[styles.salirSheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.salirHandle} />

            <View style={styles.salirBadge}>
              <IconSave width={28} height={28} fill={colors.primary} />
            </View>

            <Text style={styles.salirTitulo}>¿Quieres guardar los cambios?</Text>
            <Text style={styles.salirSubtitulo}>
              Si sales ahora, perderás los cambios que hiciste en tu perfil.
            </Text>

            <View style={styles.salirAcciones}>
              <Pressable style={styles.btnPrimary} onPress={guardarYSalir}>
                <Text style={styles.btnPrimaryText}>Guardar cambios</Text>
              </Pressable>

              <Pressable
                style={styles.btnOutline}
                onPress={() => {
                  setModalSalirVisible(false);
                  router.back();
                }}
              >
                <Text style={styles.btnOutlineText}>Salir sin guardar</Text>
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

  // ── Hoja inferior de "guardar cambios" (mismo estilo que "Cambiar disponibilidad") ──
  salirOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  salirSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  salirHandle: {
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  salirBadge: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.secondaryHover,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  salirTitulo: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: colors.titles,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  salirSubtitulo: {
    fontSize: fontSizes.body2,
    color: colors.typography,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  salirAcciones: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});