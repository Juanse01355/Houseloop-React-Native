// ============================================================
//   LOGIN SCREEN — Pantalla de inicio de sesión
//   Equivalente de login.html para React Native
// ============================================================

import { ButtonPrimary } from '@/components/ui/Button';
import Divider from '@/components/ui/Divider';
import Header from '@/components/ui/Header';
import Input from '@/components/ui/Input';
import { colors, fontSizes, fontWeights, radii, shadows, spacing } from '@/constants/theme-houseloop';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,StatusBar,  ScrollView, StyleSheet,
  Text, View
} from 'react-native';

// Íconos
import IconAlternateEmail from '../../assets/icons/icon-alternate-email.svg';
import IconLock from '../../assets/icons/icon-lock.svg';

// Logo Google SVG inline
import IconGoogle from '../../assets/icons/icon-google.svg';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleLogin = () => {
    // Por ahora navega al feed directamente
    router.replace('/feed');
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent={false} backgroundColor="#000" />
      {/* Header con logo */}
      <Header />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Título y subtítulo */}
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>
          Inicia sesión con tú correo electrónico con el que te registraste.
        </Text>

        {/* Input correo */}
        <Input
          label="Correo electrónico"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          icon={<IconAlternateEmail width={24} height={24} fill={colors.primaryDisabled} />}
          iconActive={<IconAlternateEmail width={20} height={20} fill={colors.primary} />}
        />

        {/* Input contraseña */}
        <Input
          label="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          icon={<IconLock width={24} height={24} fill={colors.primaryDisabled} />}
          iconActive={<IconLock width={20} height={20} fill={colors.primary} />}
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
          <Pressable>
            <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
        </View>

        {/* Botón iniciar sesión */}
        <ButtonPrimary text="Iniciar sesión" onPress={handleLogin} />

        {/* Divider */}
        <Divider text="O conectarse con" />

        {/* Botón Google */}
        <Pressable
          style={({ pressed }) => [
            styles.googleBtn,
            pressed && styles.googleBtnPressed,
          ]}
        >
          <IconGoogle width={20} height={20} />
          <Text style={styles.googleBtnText}>Continuar con Google</Text>
        </Pressable>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Aún no tienes cuenta? </Text>
          <Pressable onPress={() => router.push('/signup')}>
            <Text style={styles.footerLink} >Crear cuenta</Text>
            
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
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: fontSizes.body1,
    color: colors.typography,
    marginBottom: spacing.lg,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },
  options: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    fontFamily: 'Poppins_400Regular',
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
    fontSize: fontSizes.body2,
    color: colors.titles,
    fontFamily: 'Poppins_400Regular',
  },
  forgot: {
    fontSize: fontSizes.body2,
    color: colors.primary,
    fontFamily: 'Poppins_400Regular',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  googleBtnPressed: {
    backgroundColor: '#F5F5F5',
  },
  googleBtnText: {
    fontSize:14,
    color: colors.titles,
    fontFamily: 'Poppins_700Bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop:120,
  },
  footerText: {
    fontSize: fontSizes.body3,
    color: colors.typography,
    fontFamily: 'Poppins_400Regular',
  },
  footerLink: {
    fontSize: fontSizes.body3,
    color: colors.primary,
    fontWeight: 500,
    fontFamily: 'Poppins_700Bold',
  },
  
});