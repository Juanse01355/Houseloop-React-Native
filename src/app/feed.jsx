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
import { compartirPropiedad } from "@/utils/compartir";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import Toast from "react-native-toast-message";

// Íconos SVG
import IconChat from "../../assets/icons/icon-chat.svg";
import IconChevronRight from "../../assets/icons/icon-chevron-right.svg";
import IconPlay from "../../assets/icons/icon-play.svg";
import IconShare from "../../assets/icons/icon-share.svg";
import IconVolumeOff from "../../assets/icons/icon-volume-off.svg";
import IconVolumeUp from "../../assets/icons/icon-volume-up.svg";

// URL base del backend
import { BASE_URL } from "@/config/api";

// "contain" muestra el video COMPLETO sin recortarlo: se ajusta al ancho de la
// pantalla y la zona del video queda del tamaño real del video (barras negras
// arriba y abajo en videos horizontales). Con "cover" se llenaría toda la
// pantalla pero recortando los lados.
const VIDEO_FIT = "contain";

// Cada cuántos segundos se actualiza la barra de progreso del video
// (más bajo = más fluida, pero trabaja un poco más)
const INTERVALO_PROGRESO = 0.1;

// ══════════════════════════════════════════════════════════
// COMPONENTE: FeedCard
// Cada card del feed — un video con info de la propiedad
//
// - isActive: solo la card visible en pantalla (y con el feed en foco)
//   reproduce video; las demás quedan pausadas, silenciadas y reiniciadas.
// - soundOn / onToggleSound: el sonido es un estado GLOBAL del feed
//   (como TikTok), no por card — el audio "viaja" con la preferencia
//   del usuario, pero siempre suena solo en la card activa.
// - usuarioId: id del usuario logueado. Se usa para ocultar el botón
//   de contacto en las propiedades que son del propio usuario.
// ══════════════════════════════════════════════════════════
function FeedCard({
  propiedad,
  width,
  height,
  isActive,
  soundOn,
  onToggleSound,
  usuarioId,
}) {
  const [isPaused, setIsPaused] = useState(false);

  // Progreso del video (0 a 1) para la barra de arriba. Es un Animated.Value
  // para actualizar la barra sin volver a dibujar toda la card cada vez.
  const progreso = useRef(new Animated.Value(0)).current;

  // propiedad.video ya viene como URL completa desde el backend
  const videoUrl = propiedad.video || null;

  // ── ¿La propiedad es del usuario logueado? ──
  // Si es mía, no tiene sentido mostrarme el botón de contactar.
  const idDuenoPropiedad =
    propiedad.id_usuario ?? propiedad.id_propietario ?? propiedad.usuario_id;
  const esMia =
    usuarioId != null &&
    idDuenoPropiedad != null &&
    String(idDuenoPropiedad) === String(usuarioId);

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    // Arranca silenciado: los navegadores bloquean el autoplay CON sonido
    p.muted = true;
    // Cada cuánto avisa el reproductor el tiempo actual (para la barra)
    p.timeUpdateEventInterval = INTERVALO_PROGRESO;
  });

  // ── Controla play/pause/mute según si esta card está activa ──
  useEffect(() => {
    try {
      if (!isActive) {
        // Card fuera de pantalla: pausada, muda y reiniciada
        player.pause();
        player.muted = true;
        player.currentTime = 0;
        progreso.setValue(0);
        setIsPaused(false);
        return;
      }

      // Card activa: respeta la preferencia global de sonido
      player.muted = !soundOn;
      if (isPaused) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      // El navegador puede rechazar play() en ciertos contextos
      // (política de autoplay) — no rompemos la pantalla.
      console.warn("No se pudo controlar la reproducción:", error);
    }
  }, [isActive, isPaused, soundOn, player, progreso]);

  // ── Barra de progreso: sigue el tiempo del video ──
  // Solo escucha en la card activa. Al llegar al final el video da la
  // vuelta (loop) y la barra vuelve a empezar sola.
  useEffect(() => {
    if (!isActive || !videoUrl) return;

    const suscripcion = player.addListener("timeUpdate", ({ currentTime }) => {
      const duracion = player.duration;
      if (duracion > 0) {
        progreso.setValue(Math.min(currentTime / duracion, 1));
      }
    });

    return () => suscripcion.remove();
  }, [isActive, videoUrl, player, progreso]);

  // ── Cuenta una reproducción (como TikTok) ──
  // Solo se registra si el video se queda activo 1.5 s, así no se cuentan
  // las cards por las que el usuario pasa haciendo scroll rápido.
  useEffect(() => {
    if (!isActive || !videoUrl) return;
    const timer = setTimeout(() => {
      fetch(`${BASE_URL}/propiedades/${propiedad.id_propiedad}/reproduccion`, {
        method: "POST",
      }).catch(() => {
        // Si falla el conteo no afecta la experiencia del usuario
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [isActive, videoUrl, propiedad.id_propiedad]);

  const handlePress = () => setIsPaused((prev) => !prev);

  // ── Ir al perfil del propietario ──
  // Si la propiedad es mía abre mi perfil; si no, el perfil de ese usuario.
  const irAlPerfil = () => {
    // Id del dueño de la propiedad (por si el backend lo manda con otro nombre)
    const idDueno =
      propiedad.id_usuario ?? propiedad.id_propietario ?? propiedad.usuario_id;

    console.log(
      "👤 Tocaron el avatar. Campos que trae la propiedad:",
      Object.keys(propiedad),
    );
    console.log("👤 id del dueño:", idDueno, "| es mía:", esMia);

    if (esMia) {
      router.push("/profile");
      return;
    }

    // Sin id no se puede abrir el perfil: el backend del feed debe enviar id_usuario
    if (!idDueno) {
      Toast.show({
        type: "warning",
        text1: "No se pudo abrir el perfil de este usuario",
      });
      return;
    }

    router.push({
      pathname: "/user-profile",
      params: {
        id: idDueno,
        nombre: propiedad.propietario ?? "",
        foto: propiedad.foto_perfil_url ?? "",
      },
    });
  };

  return (
    <TouchableOpacity
      style={{ width, height, backgroundColor: "#000", overflow: "hidden" }}
      onPress={handlePress}
      activeOpacity={1}
    >
      {/* Video de la propiedad */}
      {videoUrl ? (
        <VideoView
          style={{ width, height }}
          player={player}
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          contentFit={VIDEO_FIT}
        />
      ) : (
        // Fondo oscuro si no hay video
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#111" }]} />
      )}

      {/* Overlay con degradado */}
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.5)",
          "rgba(0,0,0,0)",
          "rgba(0,0,0,0)",
          "rgba(0,0,0,0.5)",
        ]}
        locations={[0, 0.4, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Barra de tiempo del video (arriba de Ventas / Alquiler) */}
      {videoUrl ? (
        <View style={styles.progressTrack} pointerEvents="none">
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progreso.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      ) : null}

      {/* Botón play — aparece solo cuando está pausado */}
      {isPaused && (
        <View style={styles.playBtn} pointerEvents="none">
          <IconPlay width={48} height={48} fill={colors.white} />
        </View>
      )}

      {/* Acciones lado derecho */}
      <View style={styles.actions}>
        {/* Contactar: solo en propiedades de otros usuarios → abre el formulario de contacto */}
        {!esMia && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              router.push(`/contact?id=${propiedad.id_propiedad}`);
            }}
            accessibilityLabel="Contactar al propietario"
          >
            <IconChat width={28} height={28} fill={colors.white} />
          </TouchableOpacity>
        )}

        {/* Compartir: menú del sistema (celular) o copia el enlace (web en computador) */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            compartirPropiedad(propiedad);
          }}
          accessibilityLabel="Compartir propiedad"
        >
          <IconShare width={28} height={28} fill={colors.white} />
        </TouchableOpacity>

        {/* Botón de sonido — estado global del feed */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            onToggleSound();
          }}
        >
          {soundOn ? (
            <IconVolumeUp width={28} height={28} fill={colors.white} />
          ) : (
            <IconVolumeOff
              width={28}
              height={28}
              fill={colors.white}
              style={styles.muteIconDisabled}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Info inferior izquierda */}
      <View style={styles.info}>
        <Pressable style={styles.user} onPress={irAlPerfil}>
          <Avatar uri={propiedad.foto_perfil_url} size="sm" />
          <View>
            <Text style={styles.username}>{propiedad.propietario}</Text>
            <Text style={styles.userRole}>Propietario</Text>
          </View>
        </Pressable>

        {/* Botón Ver más → navega al detalle pasando el id */}
        <Pressable
          onPress={() => router.push(`/detail?id=${propiedad.id_propiedad}`)}
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
  );
}

// ══════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL: FeedScreen
// ══════════════════════════════════════════════════════════
export default function FeedScreen() {
  const { width } = useWindowDimensions();
  const { bienvenida } = useLocalSearchParams();

  // ── Altura real del área del feed (medida con onLayout) ──
  // Así cada card ocupa exactamente una pantalla y el paging encaja.
  const [itemHeight, setItemHeight] = useState(0);

  const [activeFilter, setActiveFilter] = useState("ventas");
  const [propiedades, setPropiedades] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [usuario, setUsuario] = useState({ nombre: "", foto: null });

  // ── Id del usuario logueado (para saber cuáles propiedades son mías) ──
  const [usuarioId, setUsuarioId] = useState(null);

  // ── Índice de la card actualmente visible en pantalla ──
  const [activeIndex, setActiveIndex] = useState(0);

  // ── Referencia a la lista, para volver al primer video al cambiar de filtro ──
  const listRef = useRef(null);

  // ── Filtro Ventas / Alquiler ──
  // En la base de datos tipo_operacion vale "venta" o "arriendo".
  const propiedadesFiltradas = useMemo(() => {
    const tipo = activeFilter === "ventas" ? "venta" : "arriendo";
    return propiedades.filter((p) => p.tipo_operacion === tipo);
  }, [propiedades, activeFilter]);

  // ── Cambia el filtro y vuelve al primer video de la nueva lista ──
  const cambiarFiltro = (filtro) => {
    if (filtro === activeFilter) return;
    setActiveFilter(filtro);
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  // ── true solo mientras la pantalla del feed está en foco ──
  const [isFocused, setIsFocused] = useState(true);

  // ── Preferencia de sonido del usuario, compartida por todo el feed ──
  // Arranca en false (silenciado) porque los navegadores no dejan
  // autoplay con sonido. El usuario la activa con el botón de volumen.
  const [soundOn, setSoundOn] = useState(false);
  const toggleSound = useCallback(() => setSoundOn((s) => !s), []);

  // ── Detecta qué card está visible mientras el usuario hace scroll ──
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  // ── Al salir del feed (detalle, perfil, otra pestaña) NINGUNA card suena ──
  // No tocamos activeIndex, así al volver sigues en el mismo video.
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  // ── Cargar propiedades del feed desde el backend ──
  const cargarFeed = async () => {
    try {
      const response = await fetch(`${BASE_URL}/propiedades/feed`);
      const data = await response.json();
      setPropiedades(data);
    } catch (error) {
      console.error("Error cargando el feed:", error);
    }
  };

  useEffect(() => {
    cargarFeed();
  }, []);

  // ── Leer el id del usuario logueado (guardado en el login) ──
  useEffect(() => {
    async function cargarUsuarioId() {
      try {
        const usuarioRaw = await AsyncStorage.getItem("usuario");
        if (usuarioRaw) {
          setUsuarioId(JSON.parse(usuarioRaw).id);
        }
      } catch (error) {
        console.error("Error leyendo el usuario guardado:", error);
      }
    }
    cargarUsuarioId();
  }, []);

  // ── Cargar datos del usuario logueado ──
  useEffect(() => {
    async function cargarUsuario() {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        const response = await fetch(`${BASE_URL}/api/perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setUsuario({ nombre: data.nombre, foto: data.foto_perfil_url });
        }
      } catch (error) {
        console.error("Error al cargar el usuario:", error);
      }
    }
    cargarUsuario();
  }, []);

  // ── Bienvenida primer ingreso ──
  useEffect(() => {
    if (bienvenida === "true") {
      Toast.show({
        type: "bienvenida",
        text1: "¡Holaa! 🚀 Bienvenido a HouseLoop 🎉",
      });
      setTimeout(() => {
        setShowConfetti(true);
      }, 600);
    }
  }, [bienvenida]);

  return (
    <View
      style={styles.container}
      onLayout={(e) => setItemHeight(e.nativeEvent.layout.height)}
    >
      <StatusBar translucent={false} backgroundColor="#000" />

      {/* Feed tipo TikTok — cada propiedad ocupa toda la pantalla */}
      {itemHeight > 0 && (
        <FlatList
          ref={listRef}
          data={propiedadesFiltradas}
          keyExtractor={(item) => String(item.id_propiedad)}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          getItemLayout={(_, index) => ({
            length: itemHeight,
            offset: itemHeight * index,
            index,
          })}
          // Mantiene montados solo unos pocos videos (ahorra RAM)
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={3}
          removeClippedSubviews
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item, index }) => (
            <FeedCard
              propiedad={item}
              width={width}
              height={itemHeight}
              isActive={isFocused && index === activeIndex}
              soundOn={soundOn}
              onToggleSound={toggleSound}
              usuarioId={usuarioId}
            />
          )}
        />
      )}

      {/* Mensaje cuando no hay propiedades en el filtro elegido */}
      {itemHeight > 0 && propiedadesFiltradas.length === 0 && (
        <View style={styles.sinResultados} pointerEvents="none">
          <Text style={styles.sinResultadosTexto}>
            {activeFilter === "ventas"
              ? "Aún no hay propiedades en venta"
              : "Aún no hay propiedades en alquiler"}
          </Text>
        </View>
      )}

      {/* Filtros superiores — encima del feed */}
      <View style={styles.filters}>
        <TouchableOpacity onPress={() => cambiarFiltro("ventas")}>
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
        <TouchableOpacity onPress={() => cambiarFiltro("alquiler")}>
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

      {/* Confeti de bienvenida */}
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
  sinResultados: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  sinResultadosTexto: {
    fontSize: moderateScale(fontSizes.h4),
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
  // ── Barra de tiempo del video ──
  // Una línea delgada pegada al borde de arriba de la card.
  // Para cambiar el grosor, ajusta "height".
  progressTrack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: scale(3),
    backgroundColor: "rgba(255,255,255,0.25)",
    zIndex: 15,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
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
  actionBtn: {
    padding: scale(4),
  },
  muteIconDisabled: {
    opacity: 0.5,
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
  confettiOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
  },
});