// ============================================================
//   PROFILE SCREEN — Pantalla de perfil del usuario
//   Muestra la información del usuario, sus publicaciones
//   en una grid de 2 columnas, y el menú de opciones.
//   Estado vacío: cuando el usuario no tiene publicaciones.
//   Estado con datos: grid de propiedades publicadas.
// ============================================================
import Avatar from "@/components/ui/Avatar";
import BottomNav from "@/components/ui/BottomNav";
import {
  colors,
  fontSizes,
  fontWeights,
  radii,
  spacing,
} from "@/constants/theme-houseloop";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Íconos
import IconAlternateEmail from "../../assets/icons/icon-alternate-email.svg";

const { width } = Dimensions.get("window");
const GRID_ITEM_SIZE = (width - 2) / 2; // 2 columnas con 1px de separación

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
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
          // Sacamos el token guardado en el login
          const token = await AsyncStorage.getItem('token');

          if (!token) {
            // No hay token → no hay sesión activa, mandamos al login
            router.replace('/login');
            return;
          }

          // Pedimos los datos actualizados directamente al backend
          const response = await fetch('http://localhost:3300/api/perfil', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            console.error('Error al obtener perfil:', data.mensaje);
            return;
          }

          // Actualizamos el estado con lo que vino del backend
          setUsuario({
            nombre: data.nombre,
            correo: data.correo,
            foto: null, // por ahora, ya que foto_perfil_url no está en este endpoint
            propiedades: [],
          });
        } catch (error) {
          console.error('Error al cargar el perfil:', error);
        }
      }

      cargarUsuario();
    }, [])
  );
  const tienePropiedades = usuario.propiedades.length > 0;

  return (
    <View style={styles.container}>
      {/* ── Menú de opciones (tres puntos) ── */}
      <Pressable
        style={[styles.menuBtn, { top: insets.top + spacing.sm }]}
        onPress={() => setMenuVisible(!menuVisible)}
      >
        <Text style={styles.menuDots}>⋮</Text>
      </Pressable>

      {/* ── Dropdown del menú ── */}
      {menuVisible && (
        <View style={[styles.menuDropdown, { top: insets.top + 52 }]}>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/edit-profile");
            }}
          >
            <Text style={styles.menuItemText}>⚙ Editar perfil</Text>
          </Pressable>
          <View style={styles.menuDivider} />
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.replace("/login");
            }}
          >
            <Text style={[styles.menuItemText, { color: colors.primary }]}>
              ⏻ Cerrar sesión
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Sección de información del usuario ── */}
        <View style={styles.userSection}>
          <Avatar uri={usuario.foto} size="xxl" />
          <Text style={styles.userName}>{usuario.nombre}</Text>
          <View style={styles.emailRow}>
            <IconAlternateEmail
              width={14}
              height={14}
              fill={colors.typography}
            />
            <Text style={styles.userEmail}>{usuario.correo}</Text>
          </View>
        </View>

        {/* ── Separador ── */}
        <View style={styles.separator} />

        {/* ── Estado vacío o grid de propiedades ── */}
        {!tienePropiedades ? (
          // ── Estado vacío ──
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>⌂+</Text>
            </View>
            <Text style={styles.emptyTitle}>Aún no tienes publicaciones</Text>
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
              <Text style={styles.publishBtnText}>Publicar Inmueble</Text>
            </Pressable>
          </View>
        ) : (
          // ── Grid de propiedades ──
          <FlatList
            data={usuario.propiedades}
            keyExtractor={(item) => item.id_propiedad}
            numColumns={2}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
            columnWrapperStyle={{ gap: 1 }}
            renderItem={({ item }) => (
              <Pressable
                style={styles.gridItem}
                onPress={() => router.push(`/detail?id=${item.id_propiedad}`)}
              >
                <Image
                  source={{ uri: item.media_url }}
                  style={styles.gridImage}
                  resizeMode="cover"
                />
                <View style={styles.gridLikes}>
                  <Text style={styles.gridLikesText}>♥ {item.likes || 0}</Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </ScrollView>

      {/* ── Navegación inferior ── */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <BottomNav activeTab="perfil" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 80,
  },

  // ── Botón tres puntos ──
  menuBtn: {
    position: "absolute",
    right: spacing.md,
    zIndex: 30,
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  menuDots: {
    fontSize: 20,
    color: colors.titles,
    lineHeight: 22,
  },

  // ── Dropdown menú ──
  menuDropdown: {
    position: "absolute",
    right: spacing.md,
    zIndex: 40,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
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
  menuDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  // ── Info del usuario ──
  userSection: {
    alignItems: "center",
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  userName: {
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
    color: colors.titles,
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
    fontSize: fontSizes.body2,
    color: colors.typography,
    fontFamily: "Poppins_400Regular",
  },

  // ── Separador ──
  separator: {
    height: 8,
    backgroundColor: colors.divider,
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
    color: colors.titles,
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

  // ── Grid de propiedades ──
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridLikes: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gridLikesText: {
    fontSize: fontSizes.body3,
    color: colors.white,
    fontFamily: "Poppins_700Bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
