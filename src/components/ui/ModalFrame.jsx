// ============================================================
//   MODAL FRAME — Contenedor para el contenido de un <Modal>
//
//   En web, el <Modal> de React Native se dibuja fuera de la app
//   (en el <body>), así que ignora el contenedor centrado de
//   _layout.tsx. Este marco repite el mismo ancho máximo para que
//   modales y hojas inferiores queden dentro de la "columna de
//   celular". En celular no cambia nada.
//
//   Se usa DENTRO del overlay oscuro del modal:
//     <View style={overlay}>
//       <ModalFrame style={{ justifyContent: 'flex-end' }}>
//         ...contenido...
//       </ModalFrame>
//     </View>
// ============================================================
import { Platform, StyleSheet, View } from 'react-native';

// Debe ser el mismo valor de MAX_ANCHO_WEB en _layout.tsx
const MAX_ANCHO_WEB = 430;

export default function ModalFrame({ children, style }) {
  return (
    <View style={[styles.frame, Platform.OS === 'web' && styles.frameWeb, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    width: '100%',
    // "box-none": el marco no atrapa toques, solo su contenido.
    // Así tocar el fondo oscuro (para cerrar) sigue funcionando.
    pointerEvents: 'box-none',
  },
  frameWeb: {
    maxWidth: MAX_ANCHO_WEB,
    alignSelf: 'center',
  },
});