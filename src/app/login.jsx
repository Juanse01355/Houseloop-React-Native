// ============================================================
//   LOGIN SCREEN — Pantalla de inicio de sesión
//   Equivalente de login.html para React Native
// ============================================================

import { ButtonPrimary } from "@/components/ui/Button";
import Header from "@/components/ui/Header";
import Input from "@/components/ui/Input";
import { BASE_URL } from "@/config/api"; // trae la URL de tu backend
import Toast from 'react-native-toast-message';   // para mostrar las alertas flotantes
import {
  colors,
  fontSizes,
  fontWeights,
  shadows,
  spacing,
} from "@/constants/theme-houseloop";
import AsyncStorage from "@react-native-async-storage/async-storage"; // para guardar el token en el celular
import { router } from "expo-router";
import { useEffect, useRef, useState } from 'react';   // useEffect: para cargar el correo guardado al abrir la pantalla
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Íconos
import IconAlternateEmail from "../../assets/icons/icon-alternate-email.svg";
import IconLock from "../../assets/icons/icon-lock.svg";
import IconVisibility from "../../assets/icons/icon-visibility.svg";

// ── Límites de longitud ──
// Correo: igual que en crear cuenta (60)
// Contraseña: solo un tope de 72 (lo que usa bcrypt). No se aplican las reglas de
// crear cuenta aquí para no dejar fuera a usuarios que ya tienen una contraseña guardada.
const LIMITS = {
  email:    { max: 60 },
  password: { max: 72 },
};

// Correo: solo letras, números y los símbolos . _ + - @ (los demás ni se pueden teclear)
const limpiarCorreo = (texto) => texto.replace(/[^A-Za-z0-9._+@-]/g, '');

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false); // controla si mostramos el spinner mientras espera al backend
  const [showPassword, setShowPassword] = useState(false); // true = la contraseña se ve, false = puntitos
  const [mostrarOjo, setMostrarOjo] = useState(false);     // true mientras el campo de contraseña está seleccionado (ojito), false = candado
  const passwordRef = useRef(null);   // referencia al campo de contraseña, para volver a seleccionarlo después de tocar el ojito
  const tocandoOjo = useRef(false);   // true mientras el dedo está sobre el ojito (evita que el candado vuelva a mitad del toque)

// Al abrir la pantalla de login, revisa si hay un correo guardado
// de una sesión anterior donde el usuario activó "Recordarme"
useEffect(() => {
  const cargarCorreoGuardado = async () => {
    const correoGuardado = await AsyncStorage.getItem('correoRecordado');
    if (correoGuardado) {
      setEmail(correoGuardado);
      setRemember(true);   // también marcamos el checkbox como activado
    }
  };
  cargarCorreoGuardado();
}, []);   // el array vacío [] significa "solo ejecuta esto una vez, al abrir la pantalla"

  const handleLogin = async () => {
    // Si ya hay un intento en curso, ignora el segundo toque
    if (loading) return;

    // Correo sin espacios y en minúsculas (la contraseña NO se toca)
    const correoLimpio = email.trim().toLowerCase();

    // Revisión rápida antes de molestar al servidor
    if (!correoLimpio || !password) {
      Toast.show({ type: 'error', text1: 'Escribe tu correo y tu contraseña' });
      return;
    }

    setLoading(true);

    try {
      // Petición POST real a tu endpoint /auth/login
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: correoLimpio, // debe llamarse "correo", igual que espera req.body en el backend
          contrasena: password, // debe llamarse "contrasena", igual que espera req.body en el backend
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // response.ok es false si el backend respondió 401 (credenciales incorrectas)
        Toast.show({ type: 'error', text1: data.error || "No se pudo iniciar sesión" });
        return;
      }

      // Login exitoso: el backend devolvió { token, usuario }.
      // Los guardamos en el celular para no pedir el login de nuevo cada vez,
      // y para usar el token después en peticiones que requieran estar logueado.
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('usuario', JSON.stringify(data.usuario));

      // Si "Recordarme" está activado, guardamos el correo para la próxima vez.
      // Si NO está activado, nos aseguramos de borrar cualquier correo guardado antes
      // (por si el usuario lo había activado en una sesión anterior y ahora lo desactivó)
      if (remember) {
        await AsyncStorage.setItem('correoRecordado', correoLimpio);
      } else {
        await AsyncStorage.removeItem('correoRecordado');
      }

      // ── ¿Es la primera vez que este dispositivo inicia sesión? ──
      const yaHaIniciadoSesion = await AsyncStorage.getItem('yaHaIniciadoSesion');

      if (!yaHaIniciadoSesion) {
        // Primer ingreso: guardamos la bandera y avisamos a /feed para que
        // sea esa pantalla la que muestre el confeti y el toast de bienvenida
        await AsyncStorage.setItem('yaHaIniciadoSesion', 'true');
        router.replace({ pathname: '/feed', params: { bienvenida: 'true' } });
      } else {
        // Ingresos posteriores: toast normal, sin confeti
        Toast.show({ type: 'success', text1: 'Sesión iniciada correctamente' });
        router.replace('/feed');
      }
    } catch (error) {
      // Este catch es por errores de RED, no de credenciales:
      // backend apagado, IP mal escrita, celular sin wifi, etc.
      Toast.show({ type: 'error', text1: "No se pudo conectar con el servidor. Verifica tu conexión." });
    } finally {
      setLoading(false); // pase lo que pase, apaga el spinner al final
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent={false} backgroundColor="#000" />
      {/* Header con logo */}
      <Header />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Título y subtítulo */}
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>
          Inicia sesión con tú correo electrónico con el que te registraste.
        </Text>

        {/* Input correo: solo letras, números y . _ + - @ */}
        <Input
          label="Correo electrónico"
          keyboardType="email-address"
          value={email}
          onChangeText={(texto) => setEmail(limpiarCorreo(texto))}
          maxLength={LIMITS.email.max}
          icon={
            <IconAlternateEmail
              width={24}
              height={24}
              fill={colors.primaryDisabled}
            />
          }
          iconActive={
            <IconAlternateEmail width={20} height={20} fill={colors.primary} />
          }
        />

        {/* Input contraseña: candado en reposo, ojito (ver / ocultar) cuando está seleccionado */}
        <Input
          ref={passwordRef}
          label="Contraseña"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          onFocusExternal={() => setMostrarOjo(true)}
          onBlurExternal={() => {
            // Si el campo pierde la selección, vuelve el candado,
            // salvo que el dedo esté justo sobre el ojito
            if (!tocandoOjo.current) setMostrarOjo(false);
          }}
          maxLength={LIMITS.password.max}
          icon={
            mostrarOjo ? (
              <Pressable
                onPressIn={() => { tocandoOjo.current = true; }}
                onPressOut={() => { tocandoOjo.current = false; }}
                onPress={() => {
                  setShowPassword(!showPassword);
                  passwordRef.current?.focus(); // devuelve la selección al campo
                }}
              >
                <IconVisibility
                  width={20}
                  height={20}
                  fill={showPassword ? colors.primary : colors.primaryDisabled}
                />
              </Pressable>
            ) : (
              <IconLock width={24} height={24} fill={colors.primaryDisabled} />
            )
          }
        />

        {/* Recordarme + Olvidaste contraseña */}
        <View style={styles.options}>
          <Pressable
            style={styles.remember}
            onPress={() => setRemember(!remember)}
          >
            <View style={[styles.radio, remember && styles.radioActive]}>
              {remember && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.rememberText}>Recordarme</Text>
          </Pressable>
        </View>


        {/* Botón iniciar sesión — mantiene su color siempre, ButtonPrimary decide mostrar spinner o texto */}
        <ButtonPrimary
          text="Iniciar sesión"
          onPress={handleLogin}
          loading={loading}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Aún no tienes cuenta? </Text>
          <Pressable onPress={() => router.push("/signup")}>
            <Text style={styles.footerLink}>Crear cuenta</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.bold,
    color: colors.titles,
    marginBottom: spacing.sm,
    fontFamily: "Poppins_700Bold",
  },
  subtitle: {
    fontSize: fontSizes.body1,
    color: colors.typography,
    marginBottom: spacing.lg,
    fontFamily: "Poppins_400Regular",
    lineHeight: 22,
  },
  options: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  remember: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    fontFamily: "Poppins_400Regular",
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: fontSizes.body2,
    color: colors.titles,
    fontFamily: "Poppins_400Regular",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
  },
  footerText: {
    fontSize: fontSizes.body3,
    color: colors.typography,
    fontFamily: "Poppins_400Regular",
  },
  footerLink: {
    fontSize: fontSizes.body3,
    color: colors.primary,
    fontWeight: 500,
    fontFamily: "Poppins_700Bold",
  },
});