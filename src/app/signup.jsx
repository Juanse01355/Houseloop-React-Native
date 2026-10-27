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
import TerminosSheet from '@/components/ui/TerminosSheet';
import { colors, fontSizes, fontWeights, radii, spacing } from '@/constants/theme-houseloop';
import { BASE_URL } from '@/config/api';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable, ScrollView, StyleSheet,
  Text, View
} from 'react-native';

// Íconos
import IconAlternateEmail from '../../assets/icons/icon-alternate-email.svg';
import IconPerson from '../../assets/icons/icon-person.svg';
import IconVisibility from '../../assets/icons/icon-visibility.svg';

// ── Límites de longitud ──
// Nombre: 2-30 caracteres, alcanza para un nombre y dos apellidos y no desborda el feed ni el perfil
// Email: máximo 60 caracteres (los correos reales rara vez pasan de 40)
// Password: 8-32 caracteres. NIST recomienda permitir al menos 64, pero 32 cubre
//           a los gestores de contraseñas y bcrypt solo usa los primeros 72
const LIMITS = {
  name:     { min: 2, max: 30 },
  email:    { max: 60 },
  password: { min: 8, max: 32 },
};

// ── Limpieza de lo que se escribe (los caracteres no permitidos ni se pueden teclear) ──

// Letras permitidas en el nombre: A-Z, con tildes, ñ y ü
const LETRAS = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';

// Nombre: solo letras y espacios. Un solo espacio seguido, y nunca al inicio
const limpiarNombre = (texto) =>
  texto
    .replace(new RegExp(`[^${LETRAS} ]`, 'g'), '') // borra todo lo que no sea letra o espacio
    .replace(/ {2,}/g, ' ')                        // no permite dos espacios seguidos
    .replace(/^ /, '');                            // no permite empezar con espacio

// Un nombre válido: palabras de letras separadas por un solo espacio
const NOMBRE_REGEX = new RegExp(`^[${LETRAS}]+( [${LETRAS}]+)*$`);

// Correo: solo letras, números y los símbolos . _ + - @ (sin espacios)
const limpiarCorreo = (texto) => texto.replace(/[^A-Za-z0-9._+@-]/g, '');

// Contraseña: cualquier carácter normal del teclado (ASCII visible), sin espacios ni tildes
const limpiarPassword = (texto) => texto.replace(/[^\x21-\x7E]/g, '');

// ── Dominios mal escritos muy comunes → el dominio correcto ──
const DOMINIOS_ERRONEOS = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'iclud.com': 'icloud.com',
  'icloud.con': 'icloud.com',
};

// Revisa el correo y devuelve '' si está bien, o el mensaje de error si no
function revisarCorreo(correo) {
  const partes = correo.split('@');
  if (partes.length !== 2) return 'Escribe un correo válido, por ejemplo nombre@correo.com';

  const [local, dominio] = partes;

  // Parte de antes de la @: letras y números, separados por un solo . _ + o -
  const localOk = /^[A-Za-z0-9]+([._+-][A-Za-z0-9]+)*$/.test(local);
  // Parte de después de la @: dominio con punto y terminación de solo letras (.com, .co, .edu.co)
  const dominioOk = /^([A-Za-z0-9]+(-[A-Za-z0-9]+)*\.)+[A-Za-z]{2,}$/.test(dominio);

  if (!localOk || !dominioOk) return 'Escribe un correo válido, por ejemplo nombre@correo.com';

  const sugerencia = DOMINIOS_ERRONEOS[dominio.toLowerCase()];
  if (sugerencia) return `¿Quisiste decir ${local}@${sugerencia}?`;

  return '';
}

// ── Reglas de validación de contraseña ──
const passwordRules = [
  { id: 'length',  label: `Entre ${LIMITS.password.min} y ${LIMITS.password.max} caracteres`, test: v => v.length >= LIMITS.password.min && v.length <= LIMITS.password.max },
  { id: 'upper',   label: 'Al menos una mayúscula',                test: v => /[A-Z]/.test(v) },
  { id: 'lower',   label: 'Al menos una minúscula',                test: v => /[a-z]/.test(v) },
  { id: 'number',  label: 'Al menos un número',                    test: v => /[0-9]/.test(v) },
];

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

  // ── Nombre y correo limpios (sin espacios al inicio/final, correo en minúsculas) ──
  const nameTrim  = name.trim();
  const emailTrim = email.trim().toLowerCase();

  // ── Validación de nombre y correo ──
  const nameValid =
    nameTrim.length >= LIMITS.name.min &&
    nameTrim.length <= LIMITS.name.max &&
    NOMBRE_REGEX.test(nameTrim);

  const emailError = emailTrim.length > 0 ? revisarCorreo(emailTrim) : '';
  const emailValid =
    emailTrim.length > 0 &&
    emailTrim.length <= LIMITS.email.max &&
    emailError === '';

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
        nombre: nameTrim,     // debe llamarse "nombre", igual que espera req.body en el backend
        correo: emailTrim,    // debe llamarse "correo"
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

        {/* Input nombre: solo letras y espacios */}
        <Input
          label="Ingresa tu nombre"
          value={name}
          onChangeText={(texto) => setName(limpiarNombre(texto))}
          maxLength={LIMITS.name.max}
          icon={<IconPerson width={20} height={20} fill={colors.primaryDisabled} />}
          iconActive={<IconPerson width={20} height={20} fill={colors.primary} />}
        />

        {/* Input correo: solo letras, números y . _ + - @ */}
        <Input
          label="Correo electrónico"
          keyboardType="email-address"
          value={email}
          onChangeText={(texto) => setEmail(limpiarCorreo(texto))}
          maxLength={LIMITS.email.max}
          icon={<IconAlternateEmail width={20} height={20} fill={colors.primaryDisabled} />}
          iconActive={<IconAlternateEmail width={20} height={20} fill={colors.primary} />}
        />

        {/* Aviso de correo inválido o con error de escritura */}
        {emailError !== '' && (
          <Text style={[styles.matchText, { color: '#ef4444' }]}>
            {emailError}
          </Text>
        )}

        {/* Input contraseña con toggle */}
        <Input
          label="Contraseña"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={(texto) => setPassword(limpiarPassword(texto))}
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
          onChangeText={(texto) => setConfirmPassword(limpiarPassword(texto))}
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
});