// ============================================================
//   DETAIL SCREEN — Detalle de una propiedad
//   Dos variantes según quién la mira:
//     - Dueño:    botón rojo de eliminar (abre una hoja inferior con
//                 "desliza para eliminar"), sin tarjeta de vendedor.
//     - Visitante: botón de compartir + tarjeta del vendedor con
//                  botón de copiar enlace y "Contactar Vendedor"
//                  (abre el formulario de contacto).
//                  El avatar y el nombre del vendedor abren su perfil.
//   Compartir y copiar enlace usan la util: src/utils/compartir.js
//   Datos reales desde GET /propiedades/:id
//
//   Guarda este archivo en: src/app/detail.jsx
// ============================================================

import Avatar from "@/components/ui/Avatar";
import { ButtonPrimary } from "@/components/ui/Button";
import SlideToConfirm from "@/components/ui/SlideToConfirm";
import { BASE_URL } from "@/config/api";
import {
  colors,
  darkColors,
  fontSizes,
  fontWeights,
  moderateScale,
  radii,
  scale,
  spacing,
} from "@/constants/theme-houseloop";
import { compartirPropiedad, copiarEnlacePropiedad } from "@/utils/compartir";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { mostrarToast } from "@/config/toast-config";

// Íconos SVG (los marcados con * hay que agregarlos en assets/icons)
import IconArrowBack from "../../assets/icons/icon-arrow-back.svg";
import IconBathtub from "../../assets/icons/icon-bathtub.svg"; // *
import IconBed from "../../assets/icons/icon-bed.svg"; // *
import IconChevronRight from "../../assets/icons/icon-chevron-right.svg";
import IconDelete from "../../assets/icons/icon-delete.svg"; // *
import IconEdit from "../../assets/icons/icon-edit.svg"; // *
import IconForward from "../../assets/icons/icon-forward.svg"; // *
import IconLink from "../../assets/icons/icon-link.svg"; // *
import IconLocationOn from "../../assets/icons/icon-location-outlined.svg"; // *
import IconPhotoLibrary from "../../assets/icons/icon-photo-library.svg"; // *
import IconPlay from "../../assets/icons/icon-play.svg";
import IconSquareFoot from "../../assets/icons/icon-square-foot.svg"; //
// Caritas del estado de la propiedad
import IconSentimentDissatisfied from "../../assets/icons/icon-sentiment-dissatisfied.svg";
import IconSentimentNeutral from "../../assets/icons/icon-sentiment-neutral.svg";
import IconSentimentSatisfied from "../../assets/icons/icon-sentiment-satisfied.svg";

// "contain" muestra el video completo sin recortarlo (igual que el feed)
const VIDEO_FIT = "contain";

// El valor que guarda publish.jsx → el nombre que se muestra
const CIUDADES = {
  pasto: "San Juan de Pasto",
};

// Cómo se ve cada estado de la propiedad (la clave es el valor que
// guarda la base de datos en la columna "estado")
const ESTADOS = {
  disponible: {
    texto: "Disponible",
    Icono: IconSentimentSatisfied,
    color: "#4CAF50",
  },
  en_negociacion: {
    texto: "En negociación",
    Icono: IconSentimentNeutral,
    color: "#FFB300",
  },
  no_disponible: {
    texto: "No disponible",
    Icono: IconSentimentDissatisfied,
    color: "#E53935",
  },
};

// Color rojo que se usa en la hoja de eliminar (el mismo de "No disponible")
const COLOR_ELIMINAR = ESTADOS.no_disponible.color;

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════

// 124000000 → "$124’000.000"   |   250000 → "$250.000"
function formatearPrecio(valor) {
  const digitos = String(Math.round(Number(valor) || 0));
  const grupos = [];
  for (let i = digitos.length; i > 0; i -= 3) {
    grupos.unshift(digitos.slice(Math.max(0, i - 3), i));
  }
  if (grupos.length <= 2) return `$${grupos.join(".")}`;
  const ultimos = grupos.slice(-2).join(".");
  const millones = grupos.slice(0, -2).join("’");
  return `$${millones}’${ultimos}`;
}

// Vuelve a la pantalla anterior. Si no hay una (por ejemplo, al recargar
// la página en web o abrir el enlace directo), router.back() no hace nada,
// así que en ese caso mandamos al feed.
const volver = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/feed");
  }
};

// Alert.alert no se ve en Expo web, así que en web usamos window.*
const avisar = (titulo, mensaje) => {
  if (Platform.OS === "web") {
    window.alert(mensaje ? `${titulo}\n${mensaje}` : titulo);
  } else {
    Alert.alert(titulo, mensaje);
  }
};

// ══════════════════════════════════════════════════════════
// COMPONENTE: VideoHero
// Video de la propiedad. Muestra la miniatura con el botón play
// hasta que el usuario lo toca. Se pausa al salir de la pantalla.
// ══════════════════════════════════════════════════════════
function VideoHero({ videoUrl, posterUrl, width, height, isFocused }) {
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(true);

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
  });

  useEffect(() => {
    try {
      if (!isFocused || paused) {
        player.pause();
      } else {
        player.muted = false;
        player.play();
      }
    } catch (error) {
      console.warn("No se pudo controlar la reproducción:", error);
    }
  }, [isFocused, paused, player]);

  const handlePress = () => {
    setStarted(true);
    setPaused((prev) => !prev);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        width,
        height,
        backgroundColor: "#000",
        borderRadius: radii.lg,
        overflow: "hidden",
      }}
    >
      <VideoView
        style={{ width, height }}
        player={player}
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        contentFit={VIDEO_FIT}
      />

      {/* Miniatura mientras el video no ha empezado.
          Tiene fondo negro y zIndex para tapar el video por completo
          (así no se ven los dos a la vez). */}
      {!started && posterUrl ? (
        <Image
          source={{ uri: posterUrl }}
          style={[StyleSheet.absoluteFill, styles.poster]}
          resizeMode="contain"
        />
      ) : null}

      {paused && (
        <View style={styles.playBtn} pointerEvents="none">
          <IconPlay
            width={scale(48)}
            height={scale(48)}
            fill={darkColors.white}
          />
        </View>
      )}
    </Pressable>
  );
}

// ══════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL: DetailScreen
// ══════════════════════════════════════════════════════════
export default function DetailScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [propiedad, setPropiedad] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [usuarioId, setUsuarioId] = useState(null);
  const [isFocused, setIsFocused] = useState(true);

  // Galería de fotos
  const [galeriaVisible, setGaleriaVisible] = useState(false);
  const [indiceFoto, setIndiceFoto] = useState(0);

  // Ventana para cambiar el estado (solo la ve el dueño)
  const [estadoVisible, setEstadoVisible] = useState(false);
  const [guardandoEstado, setGuardandoEstado] = useState(false);

  // Hoja para eliminar la propiedad (solo la ve el dueño)
  const [eliminarVisible, setEliminarVisible] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // Proporción (ancho / alto) del video. La sacamos de la miniatura, que
  // se genera con la misma proporción que el video. Así la tarjeta del
  // video ocupa todo el ancho y su alto se ajusta, sin recortar ni dejar
  // barras negras a los lados.
  const [aspectoVideo, setAspectoVideo] = useState(null);

  useEffect(() => {
    const url = propiedad?.miniatura;
    if (!url) return;
    Image.getSize(
      url,
      (w, h) => {
        if (w && h) setAspectoVideo(w / h);
      },
      () => {
        // Si no se puede leer, se usa la proporción por defecto
      },
    );
  }, [propiedad?.miniatura]);

  // ── Pausa el video al salir de esta pantalla ──
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  // ── Carga la propiedad y el usuario logueado ──
  const cargarPropiedad = useCallback(async () => {
    if (!id) return;
    try {
      setCargando(true);
      setError(false);

      const usuarioRaw = await AsyncStorage.getItem("usuario");
      if (usuarioRaw) {
        setUsuarioId(String(JSON.parse(usuarioRaw).id));
      }

      const response = await fetch(`${BASE_URL}/propiedades/${id}`);
      const data = await response.json();

      if (!response.ok) {
        console.error("Error al obtener la propiedad:", data);
        setError(true);
        return;
      }
      setPropiedad(data);
    } catch (err) {
      console.error("Error al cargar el detalle:", err);
      setError(true);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargarPropiedad();
  }, [cargarPropiedad]);

  // ── Estados de carga / error ──
  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !propiedad) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.errorText}>No se pudo cargar la propiedad</Text>
        <Pressable style={styles.errorBtn} onPress={volver}>
          <Text style={styles.errorBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  // ── Datos derivados ──
  const esDueno =
    usuarioId !== null && String(propiedad.id_usuario) === usuarioId;

  const fotos = propiedad.fotos || [];
  // Si el estado viene vacío o con un valor desconocido, se muestra "Disponible"
  const estadoActual = ESTADOS[propiedad.estado] || ESTADOS.disponible;
  // Portada para cuando NO hay video: miniatura o, si no hay, la primera foto
  const posterUrl = propiedad.miniatura || fotos[0] || null;
  const etiquetaPrecio =
    propiedad.tipo_operacion === "arriendo"
      ? "Precio de arriendo"
      : "Precio de venta";
  const tipoInmuebleMostrado = propiedad.tipo_inmueble
    ? propiedad.tipo_inmueble.charAt(0).toUpperCase() +
      propiedad.tipo_inmueble.slice(1)
    : null;
  const ciudadMostrada =
    CIUDADES[String(propiedad.ciudad).toLowerCase()] || propiedad.ciudad;
  const direccionCompleta = [propiedad.direccion, propiedad.barrio]
    .filter(Boolean)
    .join(", ");

  // El video va como tarjeta con márgenes a los lados
  const mediaWidth = width - spacing.md * 2;
  const aspecto = aspectoVideo || 0.82; // por defecto, si aún no se conoce
  // El alto sale de la proporción del video; se limita para que no pase de la pantalla
  const mediaHeight = Math.min(mediaWidth / aspecto, height * 0.85);

  // ── Acciones ──

  // Elimina la propiedad (se llama cuando el usuario desliza hasta el final).
  // Orden: DELETE → cierra la hoja → sale de la pantalla → muestra el toast.
  const confirmarEliminacion = async () => {
    if (eliminando) return;

    let exito = false;
    try {
      setEliminando(true);
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/propiedades/${propiedad.id_propiedad}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();

      if (!response.ok) {
        console.error("Error al eliminar:", data);
        avisar("No se pudo eliminar", data.detalle || data.error);
        return; // el finally apaga "eliminando" y el círculo vuelve al inicio
      }

      exito = true;

      // 1) Cerramos la hoja
      setEliminarVisible(false);

      // 2) Cuando termina su animación de cierre, salimos de esta pantalla
      //    y mostramos el toast en la pantalla de destino
      setTimeout(() => {
        router.replace("/profile");
        Toast.show({
          type: "success",
          text1: "Propiedad eliminada con éxito",
          position: "top",
        });
      }, 300);
    } catch (err) {
      console.error("Error de red al eliminar:", err);
      avisar("Error de red", "No se pudo conectar con el servidor.");
    } finally {
      // Si salió bien, no lo apagamos: así el círculo no "salta" al inicio
      // mientras la hoja se está cerrando
      if (!exito) setEliminando(false);
    }
  };

  // Cambia el estado: PUT /propiedades/:id/estado (solo el dueño, con token)
  const cambiarEstado = async (nuevoEstado) => {
    // Si elige el mismo estado que ya tiene, solo cerramos la ventana
    if (nuevoEstado === propiedad.estado) {
      setEstadoVisible(false);
      return;
    }

    try {
      setGuardandoEstado(true);
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/propiedades/${propiedad.id_propiedad}/estado`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        console.error("Error al cambiar el estado:", data);
        avisar("No se pudo cambiar el estado", data.error || data.mensaje);
        return;
      }

      // Actualizamos la pantalla con el estado que confirmó el servidor
      setPropiedad((prev) => ({ ...prev, estado: data.estado }));
      setEstadoVisible(false);
      mostrarToast("disponibilidad");
    } catch (err) {
      console.error("Error de red al cambiar el estado:", err);
      avisar("Error de red", "No se pudo conectar con el servidor.");
    } finally {
      setGuardandoEstado(false);
    }
  };

  const editarPropiedad = () => {
    router.push({
      pathname: "/publish",
      params: { id: propiedad.id_propiedad },
    });
  };

  const contactarVendedor = () => {
    // Si el dueño la marcó como no disponible, no se puede contactar
    if (propiedad.estado === "no_disponible") {
      avisar("No disponible", "Esta propiedad ya no está disponible.");
      return;
    }
    // Abre el formulario de contacto de esta propiedad
    router.push({
      pathname: "/contact",
      params: { id: propiedad.id_propiedad },
    });
  };

  // Abre el perfil del vendedor (el que publicó la propiedad).
  // Usa los mismos parámetros que lee user-profile.jsx: id, nombre y foto.
  const verPerfilVendedor = () => {
    router.push({
      pathname: "/user-profile",
      params: {
        id: propiedad.id_usuario,
        nombre: propiedad.propietario ?? "",
        foto: propiedad.foto_perfil_url ?? "",
      },
    });
  };

  // Lleva a la sección Explorar (que ya tiene el mapa) centrada en esta
  // propiedad. Se mandan el id y, si existen, las coordenadas.
  const verUbicacion = () => {
    const lat = Number(propiedad.latitud ?? propiedad.lat);
    const lng = Number(propiedad.longitud ?? propiedad.lng);
    const tieneCoordenadas =
      Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);

    router.push({
      pathname: "/explore",
      params: {
        propiedadId: String(propiedad.id_propiedad),
        ...(tieneCoordenadas ? { lat: String(lat), lng: String(lng) } : {}),
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={darkColors.background}
      />

      {/* ── Barra superior FIJA: volver + acciones del dueño ──
          Queda fuera del ScrollView, así no se mueve al hacer scroll. */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <Pressable style={styles.backBtn} onPress={volver} hitSlop={8}>
          <IconArrowBack
            width={scale(20)}
            height={scale(20)}
            fill={darkColors.white}
          />
          <Text style={styles.backBtnText}>Volver atrás</Text>
        </Pressable>

        {esDueno && (
          <View style={styles.ownerActions}>
            <Pressable
              style={[styles.circleBtn, styles.editBtn]}
              onPress={editarPropiedad}
              accessibilityLabel="Editar publicación"
            >
              <IconEdit
                width={scale(20)}
                height={scale(20)}
                fill={darkColors.white}
              />
            </Pressable>
            <Pressable
              style={[styles.circleBtn, styles.deleteBtn]}
              onPress={() => setEliminarVisible(true)}
              accessibilityLabel="Eliminar publicación"
            >
              <IconDelete
                width={scale(20)}
                height={scale(20)}
                fill={darkColors.white}
              />
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Video / miniatura ──
            Con video, la portada es SOLO la miniatura del video (si no hay,
            se ve el video tal cual). Así no se superpone una foto cualquiera. */}
        {propiedad.video ? (
          <VideoHero
            videoUrl={propiedad.video}
            posterUrl={propiedad.miniatura}
            width={mediaWidth}
            height={mediaHeight}
            isFocused={isFocused && !galeriaVisible}
          />
        ) : (
          <View
            style={[
              styles.sinVideo,
              { width: mediaWidth, height: mediaHeight },
            ]}
          >
            {posterUrl ? (
              <Image
                source={{ uri: posterUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : null}
          </View>
        )}

        {/* ── Tarjetas de información ── */}
        <View style={styles.cards}>
          {/* Tarjeta: precio + ubicación + descripción */}
          <View style={styles.card}>
            <View style={styles.priceRow}>
              <View style={styles.priceInfo}>
                <Text style={styles.priceLabel}>
                  {etiquetaPrecio}
                  {tipoInmuebleMostrado ? (
                    <>
                      {"  •  "}
                      <Text style={styles.priceType}>
                        {tipoInmuebleMostrado}
                      </Text>
                    </>
                  ) : null}
                </Text>
                <Text style={styles.price}>
                  {formatearPrecio(propiedad.precio)}
                </Text>
              </View>

              {/* Compartir: menú del sistema (celular / web) */}
              {!esDueno && (
                <Pressable
                  style={styles.shareBtn}
                  onPress={() => compartirPropiedad(propiedad)}
                  accessibilityLabel="Compartir propiedad"
                >
                  <IconForward
                    width={scale(22)}
                    height={scale(22)}
                    fill={darkColors.white}
                  />
                </Pressable>
              )}
            </View>

            <View style={styles.locationRow}>
              <IconLocationOn
                width={scale(22)}
                height={scale(22)}
                fill={darkColors.white}
              />
              <Text style={styles.locationCity}>{ciudadMostrada}</Text>
            </View>
            <Text style={styles.locationAddress}>{direccionCompleta}</Text>

            <View style={styles.divider} />

            <Text style={styles.descTitle}>Descripción</Text>
            <Text style={styles.descText}>
              {propiedad.descripcion || "Sin descripción."}
            </Text>
          </View>

          {/* Tarjeta: habitaciones, baños, metros cuadrados y estado */}
          <View style={styles.card}>
            <View style={styles.statsGrid}>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Habitaciones</Text>
                <View style={styles.statValueRow}>
                  <IconBed
                    width={scale(22)}
                    height={scale(22)}
                    fill={darkColors.white}
                  />
                  <Text style={styles.statValue}>
                    {propiedad.habitaciones ?? 0}
                  </Text>
                </View>
              </View>

              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Baños</Text>
                <View style={styles.statValueRow}>
                  <IconBathtub
                    width={scale(22)}
                    height={scale(22)}
                    fill={darkColors.white}
                  />
                  <Text style={styles.statValue}>{propiedad.banos ?? 0}</Text>
                </View>
              </View>

              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Metros cuadrados</Text>
                <View style={styles.statValueRow}>
                  <IconSquareFoot
                    width={scale(22)}
                    height={scale(22)}
                    fill={darkColors.white}
                  />
                  <Text style={styles.statValue}>
                    {propiedad.area_m2 ?? 0} m²
                  </Text>
                </View>
              </View>

              {/* Estado de la propiedad: carita + texto (solo informativa) */}
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Estado</Text>
                <View style={styles.statValueRow}>
                  <estadoActual.Icono
                    width={scale(22)}
                    height={scale(22)}
                    fill={estadoActual.color}
                  />
                  <Text
                    style={[
                      styles.statValue,
                      {
                        color: estadoActual.color,
                        fontSize: moderateScale(fontSizes.body1),
                      },
                    ]}
                  >
                    {estadoActual.texto}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Fila: Galería de Fotos */}
          <Pressable
            style={styles.rowCard}
            onPress={() => {
              setIndiceFoto(0);
              setGaleriaVisible(true);
            }}
          >
            <IconPhotoLibrary
              width={scale(24)}
              height={scale(24)}
              fill={colors.primary}
            />
            <Text style={styles.rowText}>Galería de Fotos</Text>
            <IconChevronRight
              width={scale(18)}
              height={scale(18)}
              fill={darkColors.white}
            />
          </Pressable>

          {/* Fila: Ubicación */}
          <Pressable style={styles.rowCard} onPress={verUbicacion}>
            <IconLocationOn
              width={scale(24)}
              height={scale(24)}
              fill={colors.primary}
            />
            <Text style={styles.rowText}>Ubicación</Text>
            <IconChevronRight
              width={scale(18)}
              height={scale(18)}
              fill={darkColors.white}
            />
          </Pressable>

          {/* Tarjeta del vendedor (solo si la propiedad es de otra persona) */}
          {!esDueno && (
            <View style={styles.card}>
              <View style={styles.sellerRow}>
                {/* Avatar + nombre: abren el perfil del vendedor */}
                <Pressable
                  style={styles.sellerPerfil}
                  onPress={verPerfilVendedor}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver perfil de ${propiedad.propietario}`}
                >
                  <Avatar uri={propiedad.foto_perfil_url} size="sm" />
                  <View style={styles.sellerInfo}>
                    <Text style={styles.sellerName}>
                      {propiedad.propietario}
                    </Text>
                    <Text style={styles.sellerRole}>Vendedor</Text>
                  </View>
                </Pressable>

                {/* Botón de link: copia el enlace de la propiedad */}
                <Pressable
                  style={styles.linkBtn}
                  onPress={() => copiarEnlacePropiedad(propiedad)}
                  accessibilityLabel="Copiar enlace de la propiedad"
                >
                  <IconLink
                    width={scale(20)}
                    height={scale(20)}
                    fill={darkColors.white}
                  />
                </Pressable>
              </View>

              {/* Aviso según el estado de la propiedad */}
              {propiedad.estado === "en_negociacion" && (
                <Text
                  style={[styles.estadoAviso, { color: darkColors.typography }]}
                >
                  Ya hay una negociación en curso. Aun así, puedes contactar al
                  vendedor.
                </Text>
              )}
              {propiedad.estado === "no_disponible" && (
                <Text
                  style={[
                    styles.estadoAviso,
                    { color: ESTADOS.no_disponible.color },
                  ]}
                >
                  Esta propiedad ya no está disponible.
                </Text>
              )}

              {/* En "No disponible" el botón se ve apagado y no responde */}
              <View
                style={[
                  styles.contactBtn,
                  propiedad.estado === "no_disponible" && styles.contactBtnOff,
                  {
                    pointerEvents:
                      propiedad.estado === "no_disponible" ? "none" : "auto",
                  },
                ]}
              >
                <ButtonPrimary
                  text="Contactar Vendedor"
                  onPress={contactarVendedor}
                />
              </View>
            </View>
          )}

          {/* Botón del dueño: cambiar la disponibilidad (abre el modal inferior) */}
          {esDueno && (
            <View style={styles.cambiarEstadoBtn}>
              <ButtonPrimary
                text="Cambiar disponibilidad"
                onPress={() => setEstadoVisible(true)}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Eliminar propiedad (hoja inferior, solo dueño) ──
          Mismo estilo que la hoja de disponibilidad. Para confirmar,
          hay que deslizar el círculo hasta el final. */}
      <Modal
        visible={eliminarVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !eliminando && setEliminarVisible(false)}
      >
        <View style={styles.estadoOverlay}>
          {/* Fondo oscuro: tocarlo cierra la hoja */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => !eliminando && setEliminarVisible(false)}
          />

          <View
            style={[
              styles.estadoSheet,
              { paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <View style={styles.estadoHandle} />

            <View
              style={[
                styles.estadoBadge,
                { backgroundColor: COLOR_ELIMINAR + "33" },
              ]}
            >
              <IconDelete
                width={scale(28)}
                height={scale(28)}
                fill={COLOR_ELIMINAR}
              />
            </View>

            <Text style={styles.estadoTitulo}>¿Eliminar esta propiedad?</Text>
            <Text style={styles.estadoSubtitulo}>
              Esta acción no se puede deshacer. Desliza para confirmar.
            </Text>

            <View style={styles.eliminarSlider}>
              <SlideToConfirm
                text="Desliza para eliminar"
                loadingText="Eliminando..."
                color={COLOR_ELIMINAR}
                loading={eliminando}
                onConfirm={confirmarEliminacion}
                icon={
                  <IconDelete
                    width={scale(22)}
                    height={scale(22)}
                    fill={darkColors.white}
                  />
                }
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Cambiar disponibilidad (hoja inferior, solo dueño) ── */}
      <Modal
        visible={estadoVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEstadoVisible(false)}
      >
        <View style={styles.estadoOverlay}>
          {/* Fondo oscuro: tocarlo cierra la hoja */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => !guardandoEstado && setEstadoVisible(false)}
          />

          <View
            style={[
              styles.estadoSheet,
              { paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <View style={styles.estadoHandle} />
            <View
              style={[
                styles.estadoBadge,
                { backgroundColor: estadoActual.color + "33" },
              ]}
            >
              <estadoActual.Icono
                width={scale(28)}
                height={scale(28)}
                fill={estadoActual.color}
              />
            </View>

            <Text style={styles.estadoTitulo}>¿Cambiar la disponibilidad?</Text>
            <Text style={styles.estadoSubtitulo}>
              Elige cómo quieres mostrar esta propiedad a los demás usuarios.
            </Text>

            <View style={styles.estadoOpciones}>
              {Object.entries(ESTADOS).map(([valor, info]) => {
                const seleccionado = valor === propiedad.estado;
                return (
                  <Pressable
                    key={valor}
                    style={[
                      styles.estadoOpcion,
                      seleccionado && { borderColor: info.color },
                    ]}
                    disabled={guardandoEstado}
                    onPress={() => cambiarEstado(valor)}
                  >
                    <info.Icono
                      width={scale(24)}
                      height={scale(24)}
                      fill={info.color}
                    />
                    <Text style={styles.estadoOpcionTexto}>{info.texto}</Text>
                    {seleccionado && (
                      <Text style={[styles.estadoCheck, { color: info.color }]}>
                        ✓
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {guardandoEstado && (
              <ActivityIndicator
                style={styles.estadoCargando}
                color={colors.primary}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ── Galería de fotos (modal) ── */}
      <Modal
        visible={galeriaVisible}
        animationType="fade"
        onRequestClose={() => setGaleriaVisible(false)}
      >
        <View style={styles.galeria}>
          <Pressable
            style={styles.galeriaCerrar}
            onPress={() => setGaleriaVisible(false)}
            hitSlop={8}
          >
            <Text style={styles.galeriaCerrarText}>✕</Text>
          </Pressable>

          {fotos.length === 0 ? (
            <View style={styles.centrado}>
              <Text style={styles.errorText}>
                Esta propiedad no tiene fotos
              </Text>
            </View>
          ) : (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) =>
                  setIndiceFoto(
                    Math.round(e.nativeEvent.contentOffset.x / width),
                  )
                }
              >
                {fotos.map((url) => (
                  <Image
                    key={url}
                    source={{ uri: url }}
                    style={{ width, height: "100%" }}
                    resizeMode="contain"
                  />
                ))}
              </ScrollView>
              <Text style={styles.galeriaContador}>
                {indiceFoto + 1} / {fotos.length}
              </Text>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

// Superficies sobre fondo oscuro (mismos valores que usa profile.js)
const SURFACE = "rgba(255,255,255,0.04)";
const SURFACE_STRONG = "rgba(255,255,255,0.24)";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },

  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: darkColors.background,
    gap: spacing.md,
    padding: spacing.lg,
  },
  errorText: {
    fontSize: fontSizes.body1,
    color: darkColors.typography,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  errorBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  errorBtnText: {
    fontSize: fontSizes.body1,
    color: colors.white,
    fontFamily: "Poppins_700Bold",
  },

  // ── Video ──
  playBtn: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -scale(24) }, { translateY: -scale(24) }],
  },
  // Portada del video: fondo negro y por encima del video hasta que empieza
  poster: {
    backgroundColor: "#000",
    zIndex: 1,
  },

  // ── Contenido de la pantalla ──
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: darkColors.background,
    zIndex: 10,
  },
  ownerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  backBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: scale(40),
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: SURFACE_STRONG,
  },
  backBtnText: {
    fontSize: fontSizes.body2,
    color: darkColors.titles,
    fontFamily: "Poppins_400Regular",
  },
  sinVideo: {
    backgroundColor: "#111",
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  cards: {
    gap: spacing.md,
  },

  card: {
    backgroundColor: SURFACE,
    borderRadius: radii.lg,
    padding: spacing.md,
  },

  // ── Precio ──
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: fontSizes.body3,
    color: darkColors.typography,
    fontFamily: "Poppins_400Regular",
  },
  priceType: {
    fontWeight: fontWeights.bold,
    color: darkColors.titles,
    fontFamily: "Poppins_700Bold",
  },
  price: {
    fontSize: moderateScale(fontSizes.h1),
    fontWeight: fontWeights.bold,
    color: colors.primary,
    fontFamily: "Poppins_700Bold",
  },
  // Botones circulares de la barra superior (mismo alto que "Volver atrás")
  circleBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    backgroundColor: SURFACE_STRONG,
  },
  deleteBtn: {
    backgroundColor: colors.primaryHover,
  },
  shareBtn: {
    width: scale(48),
    height: scale(48),
    borderRadius: radii.md,
    backgroundColor: SURFACE_STRONG,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Ubicación ──
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  locationCity: {
    fontSize: fontSizes.body1,
    color: darkColors.typography,
    fontFamily: "Poppins_400Regular",
  },
  locationAddress: {
    fontSize: fontSizes.body1,
    color: darkColors.typography,
    fontFamily: "Poppins_400Regular",
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: spacing.md,
  },

  // ── Descripción ──
  descTitle: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: darkColors.titles,
    fontFamily: "Poppins_700Bold",
    marginBottom: spacing.xs,
  },
  descText: {
    fontSize: fontSizes.body2,
    color: darkColors.typography,
    fontFamily: "Poppins_400Regular",
    lineHeight: moderateScale(20),
  },

  // ── Estadísticas ──
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.md,
  },
  statCell: {
    width: "50%",
    gap: spacing.sm,
  },
  statLabel: {
    fontSize: fontSizes.body3,
    fontWeight: fontWeights.bold,
    color: darkColors.titles,
    fontFamily: "Poppins_700Bold",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statValue: {
    fontSize: moderateScale(fontSizes.h2),
    fontWeight: fontWeights.bold,
    color: darkColors.typography,
    fontFamily: "Poppins_700Bold",
  },

  // ── Filas (Galería / Ubicación) ──
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: SURFACE,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowText: {
    flex: 1,
    fontSize: fontSizes.body1,
    fontWeight: fontWeights.bold,
    color: darkColors.titles,
    fontFamily: "Poppins_700Bold",
  },

  // ── Vendedor ──
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  // Zona tocable (avatar + nombre) que abre el perfil del vendedor
  sellerPerfil: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: fontSizes.body2,
    fontWeight: fontWeights.bold,
    color: darkColors.titles,
    fontFamily: "Poppins_700Bold",
  },
  sellerRole: {
    fontSize: fontSizes.body3,
    color: darkColors.typography,
    fontFamily: "Poppins_400Regular",
  },
  linkBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: radii.full,
    backgroundColor: SURFACE_STRONG,
    alignItems: "center",
    justifyContent: "center",
  },
  contactBtn: {
    marginTop: spacing.md,
  },
  contactBtnOff: {
    opacity: 0.4,
  },
  estadoAviso: {
    marginTop: spacing.md,
    fontSize: fontSizes.body3,
    fontFamily: "Poppins_400Regular",
  },

  // ── Cambiar estado (modal) ──
  cambiarEstadoBtn: {
    marginTop: spacing.xs,
  },
  estadoOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  estadoHandle: {
    width: scale(40),
    height: scale(4),
    borderRadius: radii.full,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  estadoSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    alignItems: "center",
    borderTopWidth: 0,
  },
  estadoBadge: {
    width: scale(56),
    height: scale(56),
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  estadoTitulo: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: colors.titles,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },
  estadoSubtitulo: {
    fontSize: fontSizes.body2,
    color: colors.typography,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: spacing.xs,
  },
  estadoOpciones: {
    alignSelf: "stretch",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  estadoOpcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  estadoOpcionTexto: {
    flex: 1,
    fontSize: fontSizes.body1,
    color: colors.titles,
    fontFamily: "Poppins_400Regular",
  },
  estadoCheck: {
    fontSize: fontSizes.h3,
    fontFamily: "Poppins_700Bold",
  },
  estadoCargando: {
    marginTop: spacing.md,
  },

  // ── Eliminar propiedad (modal) ──
  eliminarSlider: {
    alignSelf: "stretch",
    marginTop: spacing.lg,
  },

  // ── Galería (modal) ──
  galeria: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  galeriaCerrar: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.md,
    zIndex: 10,
    width: scale(36),
    height: scale(36),
    borderRadius: radii.full,
    backgroundColor: SURFACE_STRONG,
    alignItems: "center",
    justifyContent: "center",
  },
  galeriaCerrarText: {
    color: darkColors.titles,
    fontSize: fontSizes.h3,
  },
  galeriaContador: {
    position: "absolute",
    bottom: spacing.xl,
    alignSelf: "center",
    color: darkColors.titles,
    fontSize: fontSizes.body2,
    fontFamily: "Poppins_700Bold",
  },
});