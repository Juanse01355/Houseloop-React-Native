// ============================================================
//   PROPERTY SEARCH GRID — Grid de propiedades del módulo Buscar
//   Mismo estilo visual que PropertyProfileGrid (sin bordes
//   redondeados), degradado cubriendo toda la imagen.
//   El único estado vacío "diseñado" es el del avatar del
//   publicador (lo resuelve el propio componente Avatar).
//   Si no hay media_url, se evita pasarle uri: null a <Image>
//   (rompe el render en web) mostrando un View vacío en su lugar.
// ============================================================
import { LinearGradient } from "expo-linear-gradient";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSizes, fontWeights } from "@/constants/theme-houseloop";
import Avatar from "@/components/ui/Avatar";

type PropertySearchGridProps = {
  propiedades: any[];
  router: any;
};

export default function PropertySearchGrid({
  propiedades,
  router,
}: PropertySearchGridProps) {
  return (
    <FlatList
      data={propiedades}
      keyExtractor={(item) => item.id_propiedad}
      numColumns={2}
      scrollEnabled={false}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.columnWrapper}
      ItemSeparatorComponent={() => null}
      renderItem={({ item }) => (
        <Pressable
          style={styles.gridItem}
          onPress={() => router.push(`/detail?id=${item.id_propiedad}`)}
        >
          {/* Imagen de la propiedad, o View vacío si no hay media_url */}
          {item.media_url ? (
            <Image
              source={{ uri: item.media_url }}
              style={styles.gridImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.gridImage} />
          )}

          {/* Degradado sobre toda la imagen */}
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

          {/* Avatar (con su propio estado vacío) + nombre de quien publicó */}
          <View style={styles.userRow}>
            <Avatar uri={item.foto_perfil_url} size="xxs" />
            <Text style={styles.userName} numberOfLines={1}>
              {item.propietario}
            </Text>
          </View>
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
    top: 0,
    bottom: 0,
  },

  userRow: {
    position: "absolute",
    left: 10,
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 2,
  },

  userName: {
    fontSize: fontSizes.overline,
    fontWeight: fontWeights.regular,
    color: colors.white,
    fontFamily: "Poppins_700Bold",
    flexShrink: 1,
  },
});