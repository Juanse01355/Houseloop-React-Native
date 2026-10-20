// ============================================================
//   USER PROFILE SCREEN — Perfil de OTRO usuario
//   Ruta: /user-profile?id=...&nombre=...&foto=...
//
//   Muestra solo las propiedades DISPONIBLES de ese usuario,
//   con el botón "Contactar" y el botón para copiar el enlace
//   del perfil. Mi propio perfil está en profile.jsx
//
//   Guarda este archivo en: src/app/user-profile.jsx
// ============================================================

import Avatar from "@/components/ui/Avatar";
import BottomNav from "@/components/ui/BottomNav";
import PropertyProfileGrid from "../components/ui/PropertyProfileGrid";
import { BASE_URL } from "@/config/api";
import {
  colors,
  darkColors,
  fontSizes,
  fontWeights,
  radii,
  spacing,
} from "@/constants/theme-houseloop";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// Íconos
import IconChat from "../../assets/icons/icon-chat.svg";
import IconLink from "../../assets/icons/icon-link.svg";
import IconVideocamOutlined from "../../assets/icons/icon-videocam-outlined.svg";

// Cuánto hay que bajar (en px) para que aparezca la barra fija.
const UMBRAL_BARRA = 230;

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();

  // Datos del usuario que llegan por parámetros (desde el feed o desde el enlace copiado)
  const { id, nombre, foto } = useLocalSearchParams();

  const [propiedades, setPropiedades] = useState([]);

  // Barra compacta: aparece solo cuando se hace scroll hacia abajo
  const [barraVisible, setBarraVisible] = useState(false);
  const opacidadBarra = useRef(new Animated.Value(0)).current;

  const alHacerScroll = (e) => {
    const mostrar = e.nativeEvent.contentOffset.y > UMBRAL_BARRA;
    if (mostrar !== barraVisible) {
      setBarraVisible(mostrar);
      Animated.timing(opacidadBarra, {
        toValue: mostrar ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  };

  useFocusEffect(
    useCallback(() => {
      async function cargarPropiedades() {
        try {
          // Si el perfil que abrieron es el MÍO, mandamos a mi pantalla de perfil
          const usuarioRaw = await AsyncStorage.getItem("usuario");
          if (usuarioRaw && String(JSON.parse(usuarioRaw).id) === String(id)) {
            router.replace("/profile");
            return;
          }

          const response = await fetch(`${BASE_URL}/propiedades/usuario/${id}`);
          const data = await response.json();

          if (!response.ok) {
            console.error("Error al obtener propiedades:", data);
            return;
          }

          // Solo las disponibles (si la propiedad no trae "estado", se deja pasar)
          setPropiedades(
            data.filter((p) => (p.estado ?? "disponible") === "disponible"),
          );
        } catch (error) {
          console.error("Error al cargar el perfil:", error);
        }
      }

      if (id) cargarPropiedades();
    }, [id]),
  );

  const tienePropiedades = propiedades.length > 0;

  // ── Ir al formulario de contacto ──
  // Se envía solo el usuario (y su nombre), SIN id de propiedad:
  // así el formulario se abre en "modo perfil", sin la card de propiedad.
  const irAContactar = () => {
    router.push({
      pathname: "/contact",
      params: { usuario: id, nombre: nombre ?? "" },
    });
  };

  // ── Copiar el enlace del perfil y avisar con el toast "copiado" ──
  const copiarEnlace = async () => {
    const enlace = Linking.createURL("/user-profile", {
      queryParams: { id, nombre: nombre ?? "", foto: foto ?? "" },
    });
    await Clipboard.setStringAsync(enlace);
    Toast.show({
      type: "copiado",
      text1: "Enlace copiado con éxito",
      position: "bottom",
      bottomOffset: 80,
      visibilityTime: 2000,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={alHacerScroll}
        scrollEventThrottle={16}
      >

        {/* ── Sección de información del usuario ── */}
        <View style={styles.userSection}>
          <Avatar uri={foto || null} size="xxl" />

          <Text style={styles.userName}>{nombre}</Text>
          <Text style={styles.userRole}>Propietario</Text>

          {/* ── Botones: Contactar + copiar enlace ── */}
          <View style={styles.actionsRow}>
            <Pressable style={styles.contactBtn} onPress={irAContactar}>
              <IconChat width={24} height={24} fill={colors.white} />
              <Text style={styles.contactBtnText}>Contactar</Text>
            </Pressable>

            <Pressable
              style={styles.linkBtn}
              onPress={copiarEnlace}
              accessibilityLabel="Copiar enlace del perfil"
            >
              <IconLink width={24} height={24} fill={colors.white} />
            </Pressable>
          </View>
        </View>

        {/* ── Estado vacío o grid de propiedades ── */}
        {!tienePropiedades ? (
          <View style={styles.emptyState}>
            <IconVideocamOutlined
              width={68}
              height={68}
              fill={darkColors.typography}
            />
            <Text style={styles.emptyTitle}>Publicaciones</Text>
            <Text style={styles.emptySubtitle}>
              Este usuario no tiene propiedades disponibles
            </Text>
          </View>
        ) : (
          <PropertyProfileGrid propiedades={propiedades} router={router} />
        )}

      </ScrollView>

      {/* ── Barra FIJA compacta: solo aparece al hacer scroll ── */}
      <Animated.View
        style={[
          styles.barraFija,
          { paddingTop: insets.top + spacing.sm, opacity: opacidadBarra },
        ]}
        pointerEvents={barraVisible ? "auto" : "none"}
      >
        <Avatar uri={foto || null} size="sm" />

        <View style={styles.barraInfo}>
          <Text style={styles.barraNombre} numberOfLines={1}>
            {nombre}
          </Text>
          <Text style={styles.barraRol} numberOfLines={1}>
            Propietario
          </Text>
        </View>

        <Pressable
          style={[styles.circleBtn, styles.circleBtnPrimario]}
          onPress={irAContactar}
          accessibilityLabel="Contactar"
        >
          <IconChat width={22} height={22} fill={colors.white} />
        </Pressable>

        <Pressable
          style={styles.circleBtn}
          onPress={copiarEnlace}
          accessibilityLabel="Copiar enlace del perfil"
        >
          <IconLink width={22} height={22} fill={colors.white} />
        </Pressable>
      </Animated.View>

      {/* ── Navegación inferior ── */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <BottomNav />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },

  scrollContent: {
    paddingBottom: 80,
  },

  // ── Info del usuario ──
  userSection: {
    alignItems: "center",
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },

  userName: {
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
    color: darkColors.titles,
    marginTop: spacing.md,
    fontFamily: "Poppins_700Bold",
  },

  userRole: {
    fontSize: fontSizes.body1,
    color: darkColors.typography,
    marginTop: spacing.xs,
    fontFamily: "Poppins_400Regular",
  },

  // ── Fila de botones ──
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  // Botón "Contactar" en el color primario
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },

  contactBtnText: {
    fontSize: fontSizes.body1,
    fontWeight: fontWeights.semibold,
    color: colors.white,
    fontFamily: "Poppins_700Bold",
  },

  linkBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.24)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Barra fija compacta (aparece al hacer scroll) ──
  barraFija: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: darkColors.background,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  barraInfo: {
    flex: 1,
  },

  barraNombre: {
    fontSize: fontSizes.body2,
    fontWeight: fontWeights.bold,
    color: darkColors.titles,
    fontFamily: "Poppins_700Bold",
  },

  barraRol: {
    fontSize: fontSizes.body3,
    color: darkColors.typography,
    marginTop: 2,
    fontFamily: "Poppins_400Regular",
  },

  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.24)",
    alignItems: "center",
    justifyContent: "center",
  },

  circleBtnPrimario: {
    backgroundColor: colors.primary,
  },

  // ── Estado vacío (mismo tamaño que ocuparía el grid) ──
  emptyState: {
    marginHorizontal: 14,
    minHeight: 398,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
  },

  emptyTitle: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.semibold,
    color: darkColors.titles,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    marginTop: spacing.xs,
  },

  emptySubtitle: {
    fontSize: fontSizes.body2,
    color: darkColors.typography,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
    lineHeight: 20,
  },

  // ── Bottom Nav ──
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});