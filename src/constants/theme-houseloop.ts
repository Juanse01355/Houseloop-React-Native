// ============================================================
//   HOUSELOOP — TEMA GLOBAL
//   Equivalente de globals.css para React Native
// ============================================================

export const colors = {
  primary:           '#F36162',
  primaryHover:      '#F03E3F',
  primaryPressed:    '#F68283',
  primaryDisabled:   '#D3D8E1',
  secondaryHover:    'rgba(243, 97, 98, 0.16)',
  secondaryPressed:  'rgba(243, 97, 98, 0.40)',
  titles:            '#1C150F',
  typography:        '#A2A1A4',
  white:             '#FFFFFF',
  background:        '#FAFAFA',
  border:            '#E0E0E0',
  divider:           '#F0F0F0',
};

// ── Tema oscuro ──
export const darkColors = {
  titles:      '#FFFFFF',
  typography:  '#A2A1A4',
  white:       '#FFFFFF',
  background:  '#070707',
  border:      '#E0E0E0',
  divider:     '#F0F0F0',
};

export const fontSizes = {
  h1:       28,
  h2:       19,
  h3:       15,
  h4:       13,
  h5:       12,
  h6:       11,
  body1:    15,
  body2:    13,
  body3:    12,
  overline: 11,
};

export const fontWeights = {
  regular: '400',
  bold:    '700',
};

export const radii = {
  sm:   8,
  md:   12,
  lg:   20,
  full: 9999,
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const layout = {
  bottomNavH: 52,
  headerH:    60,
};

// ============================================================
//   ESCALA RESPONSIVA
//   Adapta los tamaños a cualquier pantalla
// ============================================================
import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base de diseño (iPhone 14 / Figma móvil estándar)
const BASE_WIDTH  = 390;
const BASE_HEIGHT = 844;

// Escala horizontal — para width, fontSize, padding horizontal
export const scale = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel((SCREEN_WIDTH / BASE_WIDTH) * size));

// Escala vertical — para height, padding vertical
export const verticalScale = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel((SCREEN_HEIGHT / BASE_HEIGHT) * size));

// Escala moderada — para fontSize (no escala tan agresivo)
export const moderateScale = (size: number, factor = 0.5): number =>
  size + (scale(size) - size) * factor;