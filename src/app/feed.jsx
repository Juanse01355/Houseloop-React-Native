import Avatar from "@/components/ui/Avatar";
import BottomNav from "@/components/ui/BottomNav";
import {
  colors,
  fontSizes,
  fontWeights,
  moderateScale,
  radii,
  scale,
  spacing,
  verticalScale,
} from "@/constants/theme-houseloop";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// Íconos SVG
import IconChevronRight from "../../assets/icons/icon-chevron-right.svg";
import IconFavorite from "../../assets/icons/icon-favorite.svg";
import IconPlay from "../../assets/icons/icon-play.svg";
import IconShare from "../../assets/icons/icon-share.svg";

// URL base del backend
const API_URL = "http://localhost:3300";

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { bienvenida } = useLocalSearchParams();

  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeFilter, setActiveFilter] = useState("ventas");
  const [propiedades, setPropiedades] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [usuario, setUsuario] = useState({ nombre: "", foto: null });
  const videoRef = useRef(null);

  const player = useVideoPlayer(
    require("../../assets/videos/prueba.mp4"),
    (p) => {
      p.loop = true;
      p.play();
    },
  );

  // ── Cargar propiedades del feed desde el backend ──
  const cargarFeed = async () => {
    try {
      const response = await fetch(`${API_URL}/propiedades/feed`);
      const data = await response.json();
      setPropiedades(data);
      console.log("Propiedades:", data);
    } catch (error) {
      console.error("Error cargando el feed:", error);
    }
  };

  useEffect(() => {
    cargarFeed();
  }, []);

  // ── Cargar datos del usuario logueado (nombre y foto) ──
  useEffect(() => {
    async function cargarUsuario() {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_URL}/api/perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (response.ok) {
          setUsuario({ nombre: data.nombre, foto: data.foto_perfil_url }); // foto null por ahora
        }
      } catch (error) {
        console.error("Error al cargar el usuario:", error);
      }
    }

    cargarUsuario();
  }, []);

  // ── Bienvenida: solo la primera vez que el usuario inicia sesión ──
  // (login.jsx manda ?bienvenida=true la primera vez que alguien entra)
  useEffect(() => {
    if (bienvenida === "true") {
      Toast.show({
        type: "bienvenida", // tipo custom sin ícono, definido en tu Toast config (toast-config.jsx)
        text1: "¡Holaa! 🚀 Bienvenido a HouseLoop 🎉",
      });
      // El confeti sale un instante después del toast, no al mismo tiempo
      setTimeout(() => {
        setShowConfetti(true);
      }, 600);
    }
  }, [bienvenida]);

  const handleVideoPress = () => {
    if (isPaused) {
      player.play();
    } else {
      player.pause();
    }
    setIsPaused(!isPaused);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent={false} backgroundColor="#000" />

      {/* Card del feed */}
      <TouchableOpacity
        style={styles.card}
        onPress={handleVideoPress}
        activeOpacity={1}
      >
        <VideoView
          ref={videoRef}
          style={styles.video}
          player={player}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />

        <LinearGradient
          colors={[
            "rgba(0,0,0,0.5)",
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0.5)",
          ]}
          locations={[0, 0.4, 0.75, 1]}
          style={styles.overlay}
        />

        {isPaused && (
          <View style={styles.playBtn}>
            <IconPlay width={48} height={48} fill={colors.white} />
          </View>
        )}

        {/* Acciones lado derecho */}
        <View style={styles.actions}>
          <View style={styles.action}>
            <TouchableOpacity style={styles.actionBtn}>
              <IconFavorite width={28} height={28} fill={colors.white} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.actionBtn}>
            <IconShare width={28} height={28} fill={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Info inferior */}
        <View style={styles.info}>
          <View style={styles.user}>
            <Avatar uri={usuario.foto} size="sm" />
            <View>
              <Text style={styles.username}>{usuario.nombre}</Text>
              <Text style={styles.userRole}>Propietario</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push("/detail")}
            style={({ pressed }) => [
              styles.detailBtn,
              pressed && styles.detailBtnPressed,
            ]}
          >
            <View style={styles.detailCircle}>
              <IconChevronRight width={12} height={12} fill={colors.white} />
            </View>
            <Text style={styles.detailBtnText}>Ver más</Text>
          </Pressable>
        </View>
      </TouchableOpacity>

      {/* Barra de progreso */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

      {/* Filtros superiores */}
      <View style={styles.filters}>
        <TouchableOpacity onPress={() => setActiveFilter("ventas")}>
          <Text
            style={[
              styles.filterBtn,
              activeFilter === "ventas" && styles.filterBtnActive,
            ]}
          >
            Ventas
          </Text>
        </TouchableOpacity>
        <View style={styles.filterDivider} />
        <TouchableOpacity onPress={() => setActiveFilter("alquiler")}>
          <Text
            style={[
              styles.filterBtn,
              activeFilter === "alquiler" && styles.filterBtnActive,
            ]}
          >
            Alquiler
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <BottomNav />
      </View>

      {/* ── Confeti de bienvenida (solo primer ingreso) ── */}
      {/* Va al final del árbol y con zIndex alto para quedar SIEMPRE por encima del video ── */}
      {showConfetti && (
        <View style={styles.confettiOverlay} pointerEvents="none">
          <ConfettiCannon
            count={150}
            origin={{ x: width / 2, y: -20 }}
            fadeOut
            autoStart
            onAnimationEnd={() => setShowConfetti(false)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  progressContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(3),
    backgroundColor: "rgba(255,255,255,0.35)",
    zIndex: 30,
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  filters: {
    position: "absolute",
    top: spacing.lg,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  filterBtn: {
    fontSize: moderateScale(fontSizes.h3),
    fontWeight: fontWeights.bold,
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Poppins_700Bold",
  },
  filterBtnActive: {
    color: colors.white,
  },
  filterDivider: {
    width: scale(2),
    height: scale(14),
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  card: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playBtn: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -24 }, { translateY: -24 }],
    zIndex: 10,
  },
  actions: {
    position: "absolute",
    right: spacing.md,
    bottom: verticalScale(80),
    zIndex: 10,
    alignItems: "center",
    gap: scale(20),
  },
  action: {
    alignItems: "center",
    gap: 2,
  },
  actionBtn: {
    padding: scale(4),
  },
  info: {
    position: "absolute",
    bottom: verticalScale(80),
    left: spacing.md,
    zIndex: 10,
    gap: scale(12),
  },
  user: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  username: {
    fontSize: moderateScale(fontSizes.h4),
    fontWeight: fontWeights.bold,
    color: colors.white,
    fontFamily: "Poppins_700Bold",
  },
  userRole: {
    fontSize: moderateScale(fontSizes.body3),
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Poppins_400Regular",
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    alignSelf: "flex-start",
  },
  detailBtnPressed: {
    backgroundColor: colors.primaryHover,
  },
  detailCircle: {
    width: scale(18),
    height: scale(18),
    borderRadius: radii.full,
    backgroundColor: "#F8A0A1",
    alignItems: "center",
    justifyContent: "center",
  },
  detailBtnText: {
    fontSize: moderateScale(fontSizes.h4),
    fontWeight: fontWeights.bold,
    color: colors.white,
    fontFamily: "Poppins_700Bold",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: verticalScale(58),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(32),
    zIndex: 20,
  },

  // ── Overlay del confeti: cubre toda la pantalla y queda por encima de todo ──
  confettiOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999, // necesario en Android para respetar el zIndex
  },
});