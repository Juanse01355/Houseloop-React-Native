// ============================================================
//   PROFILE SCREEN — Pantalla de perfil del usuario
//   Muestra la información del usuario y el menú de opciones.
//   La grid de propiedades está en PropertyProfileGrid.
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
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
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
import IconMoreHorizontal from "../../assets/icons/icon-more-horizontal.svg";
import IconSettings from "../../assets/icons/icon-settings.svg";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuBtnRef = useRef(null);
  const [cargando, setCargando] = useState(true);

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
  const abrirMenu = () => {
    menuBtnRef.current?.measureInWindow((x, y, width, height) => {
      const windowWidth = Dimensions.get("window").width;
      setMenuPos({
        top: y + height + spacing.xs,
        right: windowWidth - (x + width),
      });
      setMenuVisible(true);
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ── Sección de información del usuario ── */}
        <View style={styles.userSection}>
          <Avatar uri={usuario.foto} size="xxl" />

          <Text style={styles.userName}>
            {usuario.nombre}
          </Text>

          <View style={styles.emailRow}>
            <IconAlternateEmail
              width={22}
              height={22}
              fill={colors.primary}
            />

            <Text style={styles.userEmail}>
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
              onPress={abrirMenu}
            >
              <IconMoreHorizontal width={24} height={24} fill={colors.white} />
            </Pressable>
          </View>
        </View>

        {/* ── Estado vacío o grid de propiedades ── */}
        {!tienePropiedades ? (
          <View style={styles.emptyState}>

            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>
                ⌂+
              </Text>
            </View>

            <Text style={styles.emptyTitle}>
              Aún no tienes publicaciones
            </Text>

            <Text style={styles.emptySubtitle}>
              Tus propiedades, apartamento, casa, arriendo o lotes se mostrarán
              aquí.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.publishBtn,
                pressed && styles.publishBtnPressed,
              ]}
              onPress={() => router.push("/publish")}
            >
              <Text style={styles.publishBtnText}>
                Publicar Inmueble
              </Text>
            </Pressable>

          </View>
        ) : (
          <PropertyProfileGrid
            propiedades={usuario.propiedades}
            router={router}
          />
        )}

      </ScrollView>

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
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.replace("/login");
              }}
            >
              <Text
                style={[
                  styles.menuItemText,
                  { color: colors.primary },
                ]}
              >
                ⏻ Cerrar sesión
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

  userName: {
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
    color: darkColors.titles,
    marginTop: spacing.md,
    fontFamily: "Poppins_700Bold",
  },

  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },

  userEmail: {
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
    minWidth: 180,
  },

  menuItem: {
    padding: spacing.md,
  },

  menuItemText: {
    fontSize: fontSizes.body2,
    color: colors.titles,
    fontFamily: "Poppins_400Regular",
  },

  // ── Estado vacío ──
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },

  emptyIconText: {
    fontSize: 60,
    color: colors.primaryDisabled,
  },

  emptyTitle: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: darkColors.titles,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
  },

  emptySubtitle: {
    fontSize: fontSizes.body2,
    color: colors.typography,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
    lineHeight: 20,
  },

  publishBtn: {
    marginTop: spacing.md,
    width: "100%",
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },

  publishBtnPressed: {
    backgroundColor: colors.primaryHover,
  },

  publishBtnText: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: colors.white,
    fontFamily: "Poppins_700Bold",
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
