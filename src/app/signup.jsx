//****AVISO IMPORTANTE PARA TENER EN CUENTA */
// No olvidar colocar esta linea 
// para que no se use el 100% de la pantalla en Android, y no se rompa, por eso hay que importar
//la libreria StatusBar de react-native y colocarla en la parte superior del return

// ============================================================
//   SIGNUP SCREEN — Pantalla de registro
//   Equivalente de signup.html para React Native
// ============================================================

import Header from '@/components/ui/Header';
import Input from '@/components/ui/Input';
import { ButtonPrimary } from '@/components/ui/Button';
import { colors, fontSizes, fontWeights, radii, spacing } from '@/constants/theme-houseloop';
import { BASE_URL } from '@/config/api';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable, ScrollView, StyleSheet,
  Text, useWindowDimensions, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Íconos
import IconAlternateEmail from '../../assets/icons/icon-alternate-email.svg';
import IconPerson from '../../assets/icons/icon-person.svg';
import IconVisibility from '../../assets/icons/icon-visibility.svg';

// ── Límites de longitud (estándares actuales de la industria) ──
// Nombre: 2-100 caracteres es un rango común para formularios de registro
// Email: RFC 5321 establece 254 caracteres como máximo para una dirección de correo
// Password: NIST SP 800-63B recomienda permitir un mínimo de 8 y hasta al menos 64 caracteres
const LIMITS = {
  name:     { min: 2, max: 100 },
  email:    { max: 254 },
  password: { min: 8, max: 64 },
};

// ── Reglas de validación de contraseña ──
const passwordRules = [
  { id: 'length',  label: `Entre ${LIMITS.password.min} y ${LIMITS.password.max} caracteres`, test: v => v.length >= LIMITS.password.min && v.length <= LIMITS.password.max },
  { id: 'upper',   label: 'Al menos una mayúscula',                test: v => /[A-Z]/.test(v) },
  { id: 'lower',   label: 'Al menos una minúscula',                test: v => /[a-z]/.test(v) },
  { id: 'number',  label: 'Al menos un número',                    test: v => /[0-9]/.test(v) },
];

// ── Términos y condiciones (texto de ejemplo, cámbialo por el definitivo) ──
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

export default function SignupScreen() {
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [terms, setTerms]         = useState(false);
  const [showTerms, setShowTerms] = useState(false); // abre / cierra la hoja de términos
  const [loading, setLoading]     = useState(false);


  // ── Verifica si todas las reglas se cumplen ──
  const allRulesPass = passwordRules.every(rule => rule.test(password));

  // ── Validación de longitud para nombre y correo ──
  const nameValid  = name.trim().length >= LIMITS.name.min && name.length <= LIMITS.name.max;
  const emailValid = email.length > 0 && email.length <= LIMITS.email.max;

  // ── Validación de coincidencia de contraseñas ──
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const canSubmit = allRulesPass && nameValid && emailValid && passwordsMatch && terms;

  // ── Manejo del submit ──
 const handleSignup = async () => {
  if (!canSubmit) return;
  setLoading(true);

  try {
    // Petición POST real a tu endpoint /auth/registro (Se usa await para esperar que el servidor responda)
    const response = await fetch(`${BASE_URL}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: name,         // debe llamarse "nombre", igual que espera req.body en el backend
        correo: email,        // debe llamarse "correo"
        contrasena: password, // debe llamarse "contrasena"
      }),
    });

    const data = await response.json();

  if (!response.ok) {
    Toast.show({ type: 'error', text1: data.error || 'No se pudo crear la cuenta' });
    return;
  }

  // Registro exitoso — mostramos el toast y mandamos al login
  Toast.show({ type: 'success', text1: 'Cuenta creada correctamente' });
  router.replace('/login');
  } catch (error) {
    Toast.show({ type: 'error', text1: 'No se pudo conectar con el servidor. Verifica tu conexión.' });
  } finally {
    setLoading(false); // pase lo que pase, apaga el spinner
  }
};

  return (
    <View style={styles.container}>

      {/* Header con logo */}
      <Header />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Título y subtítulo */}
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>
          Regístrate en nuestra plataforma y da el primer paso en tú camino.
        </Text>

        {/* Input nombre */}
        <Input
          label="Ingresa tu nombre"
          value={name}
          onChangeText={setName}
          maxLength={LIMITS.name.max}
          icon={<IconPerson width={20} height={20} fill={colors.primaryDisabled} />}
          iconActive={<IconPerson width={20} height={20} fill={colors.primary} />}
        />

        {/* Input correo */}
        <Input
          label="Correo electrónico"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          maxLength={LIMITS.email.max}
          icon={<IconAlternateEmail width={20} height={20} fill={colors.primaryDisabled} />}
          iconActive={<IconAlternateEmail width={20} height={20} fill={colors.primary} />}
        />

        {/* Input contraseña con toggle */}
        <Input
          label="Contraseña"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          onFocusExternal={() => setShowRules(true)}
          maxLength={LIMITS.password.max}
          icon={
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <IconVisibility
                width={20}
                height={20}
                fill={showPassword ? colors.primary : colors.primaryDisabled}
              />
            </Pressable>
          }
        />

        {/* Reglas de validación */}
        {showRules && (
          <View style={styles.rulesBox}>
            {passwordRules.map(rule => {
              const passed  = rule.test(password);
              const touched = password.length > 0;
              const color   = passed ? '#22c55e' : touched ? '#ef4444' : colors.typography;
              return (
                <View key={rule.id} style={styles.rule}>
                  <Text style={[styles.ruleIcon, { color }]}>
                    {passed ? '●' : '○'}
                  </Text>
                  <Text style={[styles.ruleText, { color }]}>
                    {rule.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Input confirmar contraseña */}
        <Input
          label="Confirmar contraseña"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          maxLength={LIMITS.password.max}
          icon={
            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <IconVisibility
                width={20}
                height={20}
                fill={showConfirmPassword ? colors.primary : colors.primaryDisabled}
              />
            </Pressable>
          }
        />

        {/* Aviso de coincidencia de contraseñas */}
        {confirmPassword.length > 0 && (
          <Text style={[styles.matchText, { color: passwordsMatch ? '#22c55e' : '#ef4444' }]}>
            {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
          </Text>
        )}

        {/* Términos y condiciones: el círculo marca/desmarca, el texto rosado abre la hoja */}
        <View style={styles.options}>
          <View style={styles.remember}>
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
            <Text style={styles.rememberText}>
              Acepto los{' '}
              <Text style={styles.terminosLink} onPress={() => setShowTerms(true)}>
                términos y condiciones
              </Text>
            </Text>
          </View>
        </View>

        {/* Botón crear cuenta */}
        <Pressable
          style={[styles.btn, !canSubmit && styles.btnDisabled]}
          onPress={handleSignup}
          disabled={!canSubmit}
        >
          {loading
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.btnText}>Crear cuenta</Text>
          }
        </Pressable>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}>Ingresar</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.bold,
    color: colors.titles,
    marginBottom: spacing.sm,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: fontSizes.body1,
    color: colors.typography,
    marginBottom: spacing.lg,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },
  rulesBox: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ruleIcon: {
    fontSize: 10,
  },
  ruleText: {
    fontSize: fontSizes.body3,
    fontFamily: 'Poppins_400Regular',
  },
  matchText: {
    fontSize: fontSizes.body3,
    fontFamily: 'Poppins_400Regular',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  options: {
    marginBottom: spacing.lg,
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  rememberText: {
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

  btn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    backgroundColor: colors.primaryDisabled,
  },
  btnText: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: colors.white,
    fontFamily: 'Poppins_700Bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: fontSizes.body3,
    color: colors.typography,
    fontFamily: 'Poppins_400Regular',
  },
  footerLink: {
    fontSize: fontSizes.body3,
    color: colors.primary,
    fontWeight: fontWeights.bold,
    fontFamily: 'Poppins_700Bold',
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