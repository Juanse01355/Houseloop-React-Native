//****AVISO IMPORTANTE PARA TENER EN CUENTA */
// No olvidar colocar esta linea 
// para que no se use el 100% de la pantalla en Android, y no se rompa, por eso hay que importar
//la libreria StatusBar de react-native y colocarla en la parte superior del return

/* ============================================================
   PUBLISH SCREEN — Publicar inmueble
   Equivalente en React Native de publish.html / publish.css
   Usa los componentes reutilizables Input.jsx, Button.jsx
   y el tema en @/constants/theme-houseloop
   ============================================================

   Dependencias que asume este archivo (instálalas si no las
   tienes):
     expo install @expo/vector-icons
     npm install @react-native-picker/picker
     expo install expo-image-picker   (para elegir foto/video)
*/

import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import { colors, fontSizes, radii, spacing } from '@/constants/theme-houseloop';
import Input from '@/components/ui/Input';
import { ButtonPrimary, ButtonSecondary } from '@/components/ui/Button';

const MAX_DESC = 720;

export default function PublishScreen() {
  const router = useRouter();
  // ── Estado del formulario ──
  const [videoUri, setVideoUri] = useState(null);
  const [photos, setPhotos] = useState([]);

  const [tipoOferta, setTipoOferta] = useState('venta');
  const [tipoInmueble, setTipoInmueble] = useState('casa');
  const [precio, setPrecio] = useState('');
  const [area, setArea] = useState('0');
  const [habitaciones, setHabitaciones] = useState(0);
  const [banos, setBanos] = useState(0);
  const [descripcion, setDescripcion] = useState('');

  const [ciudad, setCiudad] = useState('pasto');
  const [direccion, setDireccion] = useState('');
  const [barrio, setBarrio] = useState('');

  // ── Contadores habitaciones / baños ──
  const changeCounter = (setter) => (delta) => {
    setter((prev) => Math.max(0, prev + delta));
  };
  const changeHabitaciones = changeCounter(setHabitaciones);
  const changeBanos = changeCounter(setBanos);

  // ── Selección de video ──
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (!result.canceled) setVideoUri(result.assets[0].uri);
  };

  // ── Selección de fotos (múltiples) ──
  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) {
      setPhotos(result.assets.map((a) => a.uri));
    }
  };

  const handlePublicar = () => {
    const payload = {
      videoUri,
      photos,
      tipoOferta,
      tipoInmueble,
      precio,
      area,
      habitaciones,
      banos,
      descripcion,
      ciudad,
      direccion,
      barrio,
    };
    console.log('Publicar inmueble:', payload);
    // TODO: conectar con el backend / API real
  };

  return (
    <View style={styles.app}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Pressable style={styles.btnBack} onPress={() => router.back()}>
          <MaterialIcons name="keyboard-arrow-left" size={22} color={colors.titles} />
          <Text style={styles.btnBackText}>Volver atrás</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Título y subtítulo ── */}
        <Text style={styles.title}>Publica tú inmueble</Text>
        <Text style={styles.subtitle}>
          Sube un video descriptivo del lugar que está ofertando, para que las
          personas interesadas puedan ver mejor de que se trata
        </Text>

        {/* ── ZONA MULTIMEDIA ── */}
        <View style={styles.mediaRow}>
          <Pressable style={styles.mediaUpload} onPress={pickVideo}>
            <MaterialIcons name="videocam" size={36} color={colors.primary} />
            <Text style={styles.mediaUploadText}>
              {videoUri ? 'Video seleccionado ✓' : 'Agregar video'}
            </Text>
          </Pressable>

          <Pressable style={styles.mediaUpload} onPress={pickPhotos}>
            <MaterialIcons name="image" size={36} color={colors.primary} />
            <Text style={styles.mediaUploadText}>
              {photos.length > 0 ? `${photos.length} foto(s) seleccionadas` : 'Agregar fotos'}
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
          <View style={styles.field}>
            <Text style={styles.label}>Tipo de oferta</Text>
            <View style={styles.selectGroup}>
              <Picker
                selectedValue={tipoOferta}
                onValueChange={setTipoOferta}
                style={styles.picker}
              >
                <Picker.Item label="Venta" value="venta" />
                <Picker.Item label="Arriendo" value="arriendo" />
              </Picker>
            </View>
          </View>

          {/* Tipo de inmueble */}
          <View style={styles.field}>
            <Text style={styles.label}>Tipo de inmueble</Text>
            <View style={styles.selectGroup}>
              <Picker
                selectedValue={tipoInmueble}
                onValueChange={setTipoInmueble}
                style={styles.picker}
              >
                <Picker.Item label="Casa" value="casa" />
                <Picker.Item label="Apartamento" value="apartamento" />
                <Picker.Item label="Local" value="local" />
                <Picker.Item label="Lote" value="lote" />
                <Picker.Item label="Finca" value="finca" />
              </Picker>
            </View>
          </View>

          {/* Precio */}
          <Input
            label="Precio $ (Sin puntos y comas)"
            value={precio}
            onChangeText={setPrecio}
            keyboardType="numeric"
          />

          {/* Área */}
          <Input
            label="Área (en m²)"
            value={area}
            onChangeText={setArea}
            keyboardType="numeric"
          />

          {/* Habitaciones y Baños */}
          <View style={styles.row}>
            <View style={[styles.field, styles.fieldHalf]}>
              <Text style={styles.label}>Habitaciones</Text>
              <View style={styles.counterGroup}>
                <TextInput
                  style={styles.counterInput}
                  value={String(habitaciones)}
                  editable={false}
                />
                <View style={styles.counterBtns}>
                  <Pressable onPress={() => changeHabitaciones(1)}>
                    <MaterialIcons name="expand-less" size={20} color={colors.typography} />
                  </Pressable>
                  <Pressable onPress={() => changeHabitaciones(-1)}>
                    <MaterialIcons name="expand-more" size={20} color={colors.typography} />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={[styles.field, styles.fieldHalf]}>
              <Text style={styles.label}>Baños</Text>
              <View style={styles.counterGroup}>
                <TextInput
                  style={styles.counterInput}
                  value={String(banos)}
                  editable={false}
                />
                <View style={styles.counterBtns}>
                  <Pressable onPress={() => changeBanos(1)}>
                    <MaterialIcons name="expand-less" size={20} color={colors.typography} />
                  </Pressable>
                  <Pressable onPress={() => changeBanos(-1)}>
                    <MaterialIcons name="expand-more" size={20} color={colors.typography} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Descripción */}
          <View style={styles.field}>
            <Text style={styles.label}>Describe tú inmueble</Text>
            <View style={styles.textareaGroup}>
              <TextInput
                style={styles.textarea}
                placeholder="Ingrese información adicional"
                placeholderTextColor={colors.typography}
                multiline
                maxLength={MAX_DESC}
                value={descripcion}
                onChangeText={setDescripcion}
              />
              <Text style={styles.charCount}>{descripcion.length}/{MAX_DESC}</Text>
            </View>
          </View>
        </View>

        {/* ── SECCIÓN UBICACIÓN ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="location-on" size={22} color="#A2A1A4" />
            <Text style={styles.sectionTitle}>Ubicación</Text>
          </View>

          {/* Ciudad */}
          <View style={styles.field}>
            <Text style={styles.label}>Ciudad/Departamento</Text>
            <View style={styles.selectGroup}>
              <Picker
                selectedValue={ciudad}
                onValueChange={setCiudad}
                style={styles.picker}
              >
                <Picker.Item label="San Juan de Pasto, Nariño" value="pasto" />
              </Picker>
            </View>
          </View>

          {/* Dirección */}
          <Input label="Dirección" value={direccion} onChangeText={setDireccion} />

          {/* Barrio */}
          <Input label="Barrio" value={barrio} onChangeText={setBarrio} />
        </View>

        {/* ── BOTONES ── */}
        <View style={styles.actions}>
          <ButtonPrimary text="Publicar" onPress={handlePublicar} />
          <ButtonSecondary text="Volver atrás" onPress={() => router.back()} />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.white,
  },
  btnBack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnBackText: {
    fontSize: fontSizes.body2,
    color: colors.titles,
    marginLeft: 2,
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
  section: {
    gap: spacing.md,
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
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSizes.body3,
    color: colors.typography,
  },
  selectGroup: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  picker: {
    color: colors.titles,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fieldHalf: {
    flex: 1,
  },
  counterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
  },
  counterInput: {
    flex: 1,
    fontSize: fontSizes.body2,
    color: colors.titles,
    paddingVertical: spacing.md,
  },
  counterBtns: {
    flexDirection: 'column',
    gap: 2,
  },
  textareaGroup: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
  },
  textarea: {
    minHeight: 100,
    padding: spacing.md,
    fontSize: fontSizes.body2,
    color: colors.titles,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    fontSize: fontSizes.overline,
    color: colors.typography,
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    marginTop: spacing.md,
  },
});
