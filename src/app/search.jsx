import { colors, fontSizes, fontWeights, moderateScale, radii, scale, spacing, verticalScale } from '@/constants/theme-houseloop';
import { View, Button, StyleSheet } from 'react-native';
import BottomNav from "@/components/ui/BottomNav";

export default function App() {
  return (
    // Aquí irá el contenido visual

    <View style={styles.contenedor}>
  <Button 
  title="Boton seccion buscar" 
  onPress={() => console.log('Botón presionado')} 
/>

      
      <BottomNav />
</View>

  );

}

//Estos son los estilos
const styles = StyleSheet.create({
  contenedor: {
    flex: 1,                  // Ocupa todo el espacio de la pantalla
    justifyContent: 'center', // Centra el botón verticalmente
    alignItems: 'center',  
    backgroundColor: '#DEDEDE',  // Centra el botón horizontalmente
  },
    bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: verticalScale(58),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(32),
    zIndex: 20,
  },
});
