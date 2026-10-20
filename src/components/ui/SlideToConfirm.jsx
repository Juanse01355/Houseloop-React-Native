// ============================================================
//   SLIDE TO CONFIRM — Control "desliza para confirmar"
//   El usuario arrastra el círculo hasta el final para confirmar
//   una acción (por ejemplo, eliminar una propiedad).
//   Usa PanResponder + Animated de React Native, así que no
//   necesita librerías extra y funciona dentro de un <Modal>.
//
//   Guarda este archivo en: src/components/ui/SlideToConfirm.jsx
// ============================================================

import { fontSizes, radii, scale } from "@/constants/theme-houseloop";
import { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, Text, View } from "react-native";

const THUMB = scale(52); // tamaño del círculo que se arrastra
const PAD = 4; // espacio entre el círculo y el borde de la barra
const UMBRAL = 0.85; // hay que llegar al 85 % del recorrido para confirmar

export default function SlideToConfirm({
  text = "Desliza para eliminar",
  loadingText = "Eliminando...",
  color = "#E53935",
  icon = null, // ícono que va dentro del círculo (opcional)
  loading = false, // true mientras se hace la petición al backend
  onConfirm,
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  // Recorrido máximo del círculo
  const max = Math.max(trackWidth - THUMB - PAD * 2, 0);

  // El PanResponder se crea una sola vez, así que leemos los valores
  // que cambian a través de refs (si no, quedarían "congelados").
  const maxRef = useRef(0);
  const loadingRef = useRef(loading);
  const onConfirmRef = useRef(onConfirm);
  const confirmadoRef = useRef(false);
  maxRef.current = max;
  loadingRef.current = loading;
  onConfirmRef.current = onConfirm;

  const volverAlInicio = () => {
    confirmadoRef.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 6,
    }).start();
  };

  // Si la petición falla (loading vuelve a false), el círculo regresa al inicio
  useEffect(() => {
    if (!loading) volverAlInicio();
  }, [loading]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !loadingRef.current,
      onMoveShouldSetPanResponder: () => !loadingRef.current,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        if (confirmadoRef.current) return;
        translateX.setValue(Math.min(Math.max(0, g.dx), maxRef.current));
      },
      onPanResponderRelease: (_, g) => {
        if (confirmadoRef.current) return;
        const llegoAlFinal =
          maxRef.current > 0 && g.dx >= maxRef.current * UMBRAL;

        if (llegoAlFinal) {
          confirmadoRef.current = true;
          Animated.timing(translateX, {
            toValue: maxRef.current,
            duration: 80,
            useNativeDriver: true,
          }).start(() => onConfirmRef.current?.());
        } else {
          volverAlInicio();
        }
      },
      onPanResponderTerminate: () => {
        if (!confirmadoRef.current) volverAlInicio();
      },
    }),
  ).current;

  // El texto se va apagando a medida que el círculo avanza
  const opacidadTexto = translateX.interpolate({
    inputRange: [0, Math.max(max * 0.6, 1)],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View
      style={[styles.track, { backgroundColor: color + "26" }]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.Text
        style={[
          styles.label,
          { color, opacity: loading ? 1 : opacidadTexto },
        ]}
        numberOfLines={1}
      >
        {loading ? loadingText : text}
      </Animated.Text>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          { backgroundColor: color, transform: [{ translateX }] },
        ]}
      >
        {icon || <Text style={styles.thumbFallback}>›</Text>}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: THUMB + PAD * 2,
    borderRadius: radii.full,
    justifyContent: "center",
    overflow: "hidden",
  },
  label: {
    textAlign: "center", // centrado en toda la barra (el círculo queda por encima)
    fontSize: fontSizes.body1,
    fontFamily: "Poppins_700Bold",
  },
  thumb: {
    position: "absolute",
    left: PAD,
    top: PAD,
    width: THUMB,
    height: THUMB,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbFallback: {
    color: "#fff",
    fontSize: fontSizes.h2,
    fontFamily: "Poppins_700Bold",
  },
});