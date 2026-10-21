// ============================================================
//   UBICACION PICKER — Ventana para marcar la UBICACIÓN ACTUAL
//   de la propiedad en un mapa. Se usa desde publish.jsx.
//
//   - Si la propiedad ya tiene un punto guardado (edición), arranca ahí.
//   - Si no, al abrir pide permiso y marca TU UBICACIÓN ACTUAL (GPS).
//   - El botón "Usar mi ubicación actual" vuelve a marcarla cuando quieras.
//   - Si el GPS falla o se niega el permiso, el mapa queda centrado en
//     Pasto y se puede tocar el mapa / arrastrar el pin como respaldo.
//
//   Requiere:  npx expo install expo-location
//
//   Guarda este archivo en: src/components/map/UbicacionPicker.jsx
// ============================================================
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LocationPickerMap from "@/components/map/LocationPickerMap";
import { ButtonPrimary } from "@/components/ui/Button";
import {
  colors,
  darkColors,
  fontSizes,
  radii,
  spacing,
} from "@/constants/theme-houseloop";
import * as Location from "expo-location";

const CENTRO_PASTO = { latitude: 1.2136, longitude: -77.2811 };

// Precisión del GPS: se deja de buscar al llegar a META_METROS de margen,
// o a los TIEMPO_MAX_MS segundos con la mejor lectura obtenida.
const META_METROS = 8;
const TIEMPO_MAX_MS = 20000;

export default function UbicacionPicker({
  visible,
  onClose,
  onConfirm,
  puntoGuardado,
  direccion,
  barrio,
}) {
  const insets = useSafeAreaInsets();

  const [listo, setListo] = useState(false); // el mapa se monta cuando ya se sabe dónde empezar
  const [centro, setCentro] = useState(CENTRO_PASTO);
  const [puntoInicial, setPuntoInicial] = useState(null); // punto de partida (guardado o encontrado)
  const [punto, setPunto] = useState(null); // punto actual del pin
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);
  const [precision, setPrecision] = useState(null); // margen de error del GPS, en metros

  // ── Escucha el GPS unos segundos y se queda con la lectura MÁS PRECISA ──
  // Una sola lectura suele traer 20-100 m de error (el GPS necesita "calentar").
  // Aquí se siguen leyendo posiciones; el pin se va afinando solo y se detiene
  // cuando el margen baja de META_METROS o pasan TIEMPO_MAX_MS.
  const obtenerMejorPosicion = async () => {
    let mejor = null;
    let sub = null;
    let temporizador = null;
    let terminado = false;

    await new Promise((resolve, reject) => {
      const terminar = () => {
        if (terminado) return;
        terminado = true;
        clearTimeout(temporizador);
        sub?.remove();
        mejor ? resolve() : reject(new Error("Sin lectura de GPS"));
      };

      temporizador = setTimeout(terminar, TIEMPO_MAX_MS);

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        (pos) => {
          const margen = pos.coords.accuracy ?? Infinity;
          if (!mejor || margen < (mejor.coords.accuracy ?? Infinity)) {
            mejor = pos;
            const coords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            };
            setPuntoInicial(coords); // el pin se afina en vivo
            setPunto(coords);
            setPrecision(Math.round(margen));
          }
          if (margen <= META_METROS) terminar();
        },
      )
        .then((suscripcion) => {
          sub = suscripcion;
          // Si ya se llegó a la meta antes de recibir la suscripción, se cierra aquí
          if (terminado) sub.remove();
        })
        .catch((e) => {
          clearTimeout(temporizador);
          reject(e);
        });
    });
  };

  // ── Obtiene la ubicación actual del dispositivo y pone el pin ahí ──
  const usarUbicacionActual = async () => {
    setBuscando(true);
    setError(null);
    try {
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (permiso.status !== "granted") {
        setError("Permiso de ubicación denegado. Actívalo o toca el mapa para marcar el punto.");
        return;
      }

      setPrecision(null);
      await obtenerMejorPosicion();
    } catch (e) {
      console.warn("No se pudo obtener la ubicación:", e);
      setError("No se pudo obtener tu ubicación. Toca el mapa para marcar el punto.");
    } finally {
      setBuscando(false);
    }
  };

  useEffect(() => {
    if (!visible) {
      setListo(false);
      return;
    }

    const inicio = puntoGuardado ?? null;
    setPuntoInicial(inicio);
    setPunto(inicio);
    setCentro(inicio ?? CENTRO_PASTO);
    setListo(true);

    setError(null);

    // Sin punto guardado: se marca la ubicación actual automáticamente
    if (!inicio) {
      usarUbicacionActual();
    }
  }, [visible]);

  const confirmar = () => {
    if (!punto) return;
    onConfirm(punto);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.titulo}>Ubicación actual</Text>
          <Text style={styles.subtitulo}>
            Marcamos donde estás ahora. Si el pin no quedó justo en el inmueble,
            arrástralo o toca el mapa para ajustarlo.
          </Text>
        </View>

        <View style={styles.mapa}>
          {listo && (
            <LocationPickerMap
              centro={centro}
              puntoInicial={puntoInicial}
              onChange={setPunto}
            />
          )}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Text style={styles.estado}>
            {buscando
              ? `Afinando tu ubicación${precision != null ? ` (margen de ±${precision} m)` : "..."}`
              : error
                ? error
                : punto
                  ? precision != null
                    ? precision > 30
                      ? `Margen de ±${precision} m. Sal a un lugar abierto y toca "Usar mi ubicación actual" para mejorarla, o ajusta el pin.`
                      : `Ubicación marcada con un margen de ±${precision} m. Revisa que el pin esté en el lugar correcto.`
                    : "Ubicación marcada. Revisa que el pin esté en el lugar correcto."
                  : "Toca el mapa para marcar la ubicación."}
          </Text>

          <Pressable
            style={[styles.btnCancelar, buscando && styles.btnDeshabilitado]}
            onPress={usarUbicacionActual}
            disabled={buscando}
            accessibilityRole="button"
          >
            <Text style={styles.btnCancelarTexto}>
              {buscando ? "Buscando..." : "Usar mi ubicación actual"}
            </Text>
          </Pressable>

          <ButtonPrimary
            text="Confirmar ubicación"
            onPress={confirmar}
            disabled={!punto}
          />

          <Pressable style={styles.btnCancelar} onPress={onClose} accessibilityRole="button">
            <Text style={styles.btnCancelarTexto}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  titulo: {
    fontSize: fontSizes.h3,
    color: darkColors.titles,
    fontFamily: "Poppins_700Bold",
  },
  subtitulo: {
    fontSize: fontSizes.body3,
    color: darkColors.typography,
    fontFamily: "Poppins_400Regular",
  },
  mapa: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
    backgroundColor: darkColors.background,
  },
  estado: {
    fontSize: fontSizes.body3,
    color: darkColors.typography,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
  btnCancelar: {
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDeshabilitado: {
    opacity: 0.5,
  },
  btnCancelarTexto: {
    fontSize: fontSizes.body1,
    fontFamily: "Poppins_700Bold",
    color: colors.primary,
  },
});