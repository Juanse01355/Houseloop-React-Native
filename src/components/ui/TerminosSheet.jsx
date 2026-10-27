// ============================================================
//   TERMINOS SHEET — Hoja inferior con los términos y condiciones
//   La usan signup.jsx, publish.jsx y contact.jsx.
//
//   Props:
//     visible     abre / cierra la hoja
//     onClose     se llama al tocar el fondo oscuro o el botón atrás
//     onAceptar   se llama al pulsar "Aceptar"
//     terminos    (opcional) lista de { titulo, texto }; si no se pasa,
//                 usa los términos generales de la plataforma
//
//   Guarda este archivo en: src/components/ui/TerminosSheet.jsx
// ============================================================
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ButtonPrimary } from '@/components/ui/Button';
import ModalFrame from '@/components/ui/ModalFrame';
import { colors, fontSizes, radii, spacing } from '@/constants/theme-houseloop';

// Términos generales (registro y publicar). Cámbialos por el texto definitivo.
export const TERMINOS_GENERALES = [
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

export default function TerminosSheet({ visible, onClose, onAceptar, terminos = TERMINOS_GENERALES }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Fondo oscuro: cubre toda la ventana */}
      <View style={styles.overlay}>
        {/* Tocar el fondo cierra la hoja */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Marco: en web limita la hoja al ancho de la app (430 px) */}
        <ModalFrame style={styles.marco}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.handle} />
            <Text style={styles.titulo}>Términos y condiciones</Text>

            <ScrollView style={{ maxHeight: height * 0.5 }} showsVerticalScrollIndicator={false}>
              {terminos.map((t) => (
                <View key={t.titulo} style={styles.item}>
                  <Text style={styles.itemTitulo}>{t.titulo}</Text>
                  <Text style={styles.itemTexto}>{t.texto}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.boton}>
              <ButtonPrimary text="Aceptar" onPress={onAceptar} />
            </View>
          </View>
        </ModalFrame>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  // La hoja queda pegada abajo, dentro del marco
  marco: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  titulo: {
    fontSize: fontSizes.h3,
    fontWeight: '700',
    color: colors.titles,
    fontFamily: 'Poppins_700Bold',
    marginBottom: spacing.md,
  },
  item: {
    marginBottom: spacing.md,
  },
  itemTitulo: {
    fontSize: fontSizes.body2,
    fontWeight: '700',
    color: colors.titles,
    fontFamily: 'Poppins_400Regular',
    marginBottom: spacing.xs,
  },
  itemTexto: {
    fontSize: fontSizes.body3,
    color: colors.typography,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  boton: {
    marginTop: spacing.md,
  },
});