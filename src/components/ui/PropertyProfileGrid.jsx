// ============================================================
//   PROPERTY PROFILE GRID — Grid de propiedades del perfil
//   Layout, tamaño y padding tomados de PropertySearchGrid.
//   El degradado se mantiene como estaba (franja inferior sutil,
//   no cubre toda la imagen) y se conserva el botón de tres puntos.
// ============================================================
import { LinearGradient } from "expo-linear-gradient";
import { FlatList, Image, Pressable, StyleSheet, Text } from "react-native";
import { colors } from "@/constants/theme-houseloop";

type PropertyProfileGridProps = {
  propiedades: any[];
  router: any;
};

export default function PropertyProfileGrid({
  propiedades,
  router,
}: PropertyProfileGridProps) {
  // Solo mostramos propiedades que tengan imagen
  const propiedadesConImagen = propiedades.filter(
    (item) => item.media_url,
  );

  // Mostramos las más recientes primero
  const propiedadesOrdenadas = [...propiedadesConImagen].reverse();

  return (
    <FlatList
      data={propiedadesOrdenadas}
      keyExtractor={(item) => item.id_propiedad}
      numColumns={2}
      scrollEnabled={false}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.columnWrapper}
      ItemSeparatorComponent={() => null}
      renderItem={({ item }) => (
        <Pressable
          style={styles.gridItem}
          onPress={() =>
            router.push(`/detail?id=${item.id_propiedad}`)
          }
        >
          {/* Imagen */}
          <Image
            source={{ uri: item.media_url }}
            style={styles.gridImage}
            resizeMode="cover"
          />

          {/* Degradado inferior sutil */}
          <LinearGradient
           colors={[
                "rgba(0,0,0,0)",
                "rgba(0,0,0,0.10)",
                "rgba(0,0,0,0.30)",
                "rgba(0,0,0,0.55)",
                ]}

            locations={[0, 0.4, 0.75, 1]}
            style={styles.gridFade}
            pointerEvents="none"
          />

          {/* Tres puntos */}
          <Pressable
            style={styles.gridDotsBtn}
            hitSlop={8}
            onPress={() => {
              console.log(
                "Opciones de la propiedad",
                item.id_propiedad,
              );
            }}
          >
            <Text style={styles.gridDotsText}>⋮</Text>
          </Pressable>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    rowGap: 8,
    paddingHorizontal: 14,
  },

  columnWrapper: {
    gap: 8,
  },

  gridItem: {
    width: "48%",
    height: 240,
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.divider,
    borderRadius: 8,
  },

  gridImage: {
    width: "100%",
    height: 240,
  },

  gridFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 88,
  },

  gridDotsBtn: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  gridDotsText: {
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,32.0)",
  },
});