// ============================================================
//   PROFILE SCREEN — Pantalla de MI perfil
//   Cabecera FIJA arriba (avatar, nombre, correo, ajustes y menú)
//   y debajo, con scroll, la grid de propiedades.
//   La grid de propiedades está en PropertyProfileGrid.
//
//   El perfil de OTROS usuarios está en user-profile.jsx
// ============================================================

import Avatar from "@/components/ui/Avatar";
import BottomNav from "@/components/ui/BottomNav";
import PropertyProfileGrid from "../components/ui/PropertyProfileGrid";
import { BASE_URL } from "@/config/api";
import { mostrarToast } from "@/config/toast-config";
import {
  colors,
  darkColors,
  fontSizes,
  fontWeights,
  radii,
  spacing,
} from "@/constants/theme-houseloop";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Íconos
import IconAlternateEmail from "../../assets/icons/icon-alternate-email.svg";
import IconLogout from "../../assets/icons/icon-logout.svg";
import IconMoreHorizontal from "../../assets/icons/icon-more-horizontal.svg";
import IconSettings from "../../assets/icons/icon-settings.svg";
import IconVideocamOutlined from "../../assets/icons/icon-videocam-outlined.svg";

// Cuánto hay que bajar (en px) para que aparezca la barra fija.
// Es más o menos el alto de la cabecera grande (avatar + nombre + botones).
const UMBRAL_BARRA = 230;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuBtnRef = useRef(null); // botón ⋯ de la cabecera grande
  const menuBtnFijoRef = useRef(null); // botón ⋯ de la barra fija
  const [cargando, setCargando] = useState(true);

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

  const [usuario, setUsuario] = useState({
    nombre: "",
    correo: "",
    foto: null,
    propiedades: [],
  });

  useFocusEffect(
    useCallback(() => {
      async function cargarUsuario() {
        try {
          setCargando(true);

          // Sacamos el token guardado en el login
          const token = await AsyncStorage.getItem("token");
          const usuarioRaw = await AsyncStorage.getItem("usuario");

          if (!token || !usuarioRaw) {
            // No hay token → no hay sesión activa, mandamos al login
            router.replace("/login");
            return;
          }

          const usuarioGuardado = JSON.parse(usuarioRaw);

          // Pedimos los datos actualizados del perfil directamente al backend
          const responsePerfil = await fetch(`${BASE_URL}/api/perfil`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const dataPerfil = await responsePerfil.json();

          if (!responsePerfil.ok) {
            console.error("Error al obtener perfil:", dataPerfil.mensaje);
            setCargando(false);
            return;
          }

          // Pedimos las propiedades publicadas por este usuario
          const responsePropiedades = await fetch(
            `${BASE_URL}/propiedades/usuario/${usuarioGuardado.id}`,
          );

          const dataPropiedades = await responsePropiedades.json();

          if (!responsePropiedades.ok) {
            console.error(
              "Error al obtener propiedades:",
              dataPropiedades,
            );
          }

          // Actualizamos el estado con lo que vino del backend
          setUsuario({
            nombre: dataPerfil.nombre,
            correo: dataPerfil.correo,
            foto: dataPerfil.foto_perfil_url,
            propiedades: responsePropiedades.ok ? dataPropiedades : [],
          });
        } catch (error) {
          console.error("Error al cargar el perfil:", error);
        } finally {
          setCargando(false);
        }
      }

      cargarUsuario();
    }, []),
  );

  const tienePropiedades = usuario.propiedades.length > 0;

  // ── Abre el menú, midiendo antes la posición real del botón ──
  // Ancla el borde DERECHO del menú con el borde derecho del botón,
  // para que crezca hacia la izquierda y no se salga de la pantalla.
  const abrirMenu = (ref) => {
    ref.current?.measureInWindow((x, y, width, height) => {
      const windowWidth = Dimensions.get("window").width;
      setMenuPos({
        top: y + height + spacing.xs,
        right: windowWidth - (x + width),
      });
      setMenuVisible(true);
    });
  };

  // ── Cerrar sesión: borra la sesión guardada, va al login y avisa con el toast ──
  const cerrarSesion = async () => {
    setMenuVisible(false);
    await AsyncStorage.multiRemove(["token", "usuario"]);
    router.replace("/login");
    mostrarToast("sesionCerrada");
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
          <Avatar uri={usuario.foto} size="xxl" />

          {/* Una sola línea: si el nombre es largo se corta con "..." */}
          <Text style={styles.userName} numberOfLines={1}>
            {usuario.nombre}
          </Text>

          <View style={styles.emailRow}>
            <IconAlternateEmail
              width={22}
              height={22}
              fill={colors.primary}
            />

            {/* flexShrink: 1 deja que el correo se achique y se corte con "..." */}
            <Text style={styles.userEmail} numberOfLines={1}>
              {usuario.correo}
            </Text>
          </View>

          {/* ── Fila de botones: Editar perfil + menú de opciones ── */}
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.editProfileBtn}
              onPress={() => router.push("/edit-profile")}
            >
              <IconSettings width={24} height={24} fill={colors.white} />
              <Text style={styles.editProfileBtnText}>Editar perfil</Text>
            </Pressable>

            <Pressable
              ref={menuBtnRef}
              style={styles.menuBtn}
              onPress={() => abrirMenu(menuBtnRef)}
            >
              <IconMoreHorizontal width={24} height={24} fill={colors.white} />
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

            <Text style={styles.emptyTitle}>
              Mis Publicaciones
            </Text>

            <Text style={styles.emptySubtitle}>
              Tus publicaciones se mostrarán aquí
            </Text>
          </View>
        ) : (
          <PropertyProfileGrid
            propiedades={usuario.propiedades}
            router={router}
          />
        )}

      </ScrollView>

      {/* ── Barra FIJA compacta: solo aparece al hacer scroll ──
          Avatar, nombre y correo a la izquierda; ruedita y menú a la derecha. */}
      <Animated.View
        style={[
          styles.barraFija,
          { paddingTop: insets.top + spacing.sm, opacity: opacidadBarra },
        ]}
        pointerEvents={barraVisible ? "auto" : "none"}
      >
        <Avatar uri={usuario.foto} size="sm" />

        <View style={styles.barraInfo}>
          <Text style={styles.barraNombre} numberOfLines={1}>
            {usuario.nombre}
          </Text>
          <View style={styles.barraCorreoRow}>
            <Text style={styles.barraCorreo} numberOfLines={1}>
              {usuario.correo}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.circleBtn}
          onPress={() => router.push("/edit-profile")}
          accessibilityLabel="Editar perfil"
        >
          <IconSettings width={22} height={22} fill={colors.white} />
        </Pressable>

        <Pressable
          ref={menuBtnFijoRef}
          style={styles.circleBtn}
          onPress={() => abrirMenu(menuBtnFijoRef)}
          accessibilityLabel="Más opciones"
        >
          <IconMoreHorizontal width={22} height={22} fill={colors.white} />
        </Pressable>
      </Animated.View>

      {/* ── Menú desplegable (fuera del ScrollView, en un Modal) ── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.menuDropdown,
              { top: menuPos.top, right: menuPos.right },
            ]}
          >
            <Pressable style={styles.menuItem} onPress={cerrarSesion}>
              <IconLogout width={20} height={20} fill={colors.primary} />
              <Text style={styles.menuItemText} numberOfLines={1}>
                Cerrar sesión
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Navegación inferior ── */}
      <View
        style={[
          styles.bottomNav,
          { paddingBottom: insets.bottom },
        ]}
      >
        <BottomNav activeTab="perfil" />
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

  // maxWidth: "100%" evita que el nombre sea más ancho que la pantalla
  userName: {
    maxWidth: "100%",
    textAlign: "center",
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
    color: darkColors.titles,
    marginTop: spacing.md,
    fontFamily: "Poppins_700Bold",
  },

  emailRow: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },

  userEmail: {
    flexShrink: 1,
    fontSize: fontSizes.body1,
    color: darkColors.typography,
    fontFamily: "Poppins_400Regular",
  },

  // ── Fila de botones (editar perfil + menú) ──
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.24)",
  },

  editProfileBtnText: {
    fontSize: fontSizes.body1,
    fontWeight: fontWeights.semibold,
    color: colors.white,
    fontFamily: "Poppins_700Bold",
  },

  menuBtn: {
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

  barraCorreoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 2,
  },

  barraCorreo: {
    flexShrink: 1,
    fontSize: fontSizes.body3,
    color: darkColors.typography,
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

  // ── Overlay + dropdown del menú (dentro del Modal) ──
  menuOverlay: {
    flex: 1,
  },

  menuDropdown: {
    position: "absolute",
    zIndex: 40,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 200,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },

  menuItemText: {
    fontSize: fontSizes.body2,
    color: colors.primary,
    fontFamily: "Poppins_400Regular",
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