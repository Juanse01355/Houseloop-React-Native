import BottomNav from '@/components/ui/BottomNav';
import { colors, fontSizes, fontWeights, moderateScale, radii, scale, spacing, verticalScale } from '@/constants/theme-houseloop';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions, Pressable, StatusBar, StyleSheet,
  Text, TouchableOpacity, useWindowDimensions, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Íconos SVG
import IconChevronRight from '../../assets/icons/icon-chevron-right.svg';
import IconFavorite from '../../assets/icons/icon-favorite.svg';
import IconPlay from '../../assets/icons/icon-play.svg';
import IconShare from '../../assets/icons/icon-share.svg';

// URL base del backend
const API_URL = 'http://localhost:3000';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeFilter, setActiveFilter] = useState('ventas');
  const [propiedades, setPropiedades] = useState([]);
  const videoRef = useRef(null);

  const player = useVideoPlayer(
    require('../../assets/videos/prueba.mp4'),
    (p) => {
      p.loop = true;
      p.play();
    }
  );

  // ── Cargar propiedades del feed desde el backend ──
  const cargarFeed = async () => {
    try {
      const response = await fetch(`${API_URL}/propiedades/feed`);
      const data = await response.json();
      setPropiedades(data);
      console.log('Propiedades:', data);
    } catch (error) {
      console.error('Error cargando el feed:', error);
    }
  };

  useEffect(() => {
    cargarFeed();
  }, []);

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
          colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
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
            <View style={styles.avatar} />
            <View>
              <Text style={styles.username}>
                {propiedades[0]?.propietario || 'Andres Gomez'}
              </Text>
              <Text style={styles.userRole}>Propietario</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/detail')}
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
        <TouchableOpacity onPress={() => setActiveFilter('ventas')}>
          <Text style={[styles.filterBtn, activeFilter === 'ventas' && styles.filterBtnActive]}>
            Ventas
          </Text>
        </TouchableOpacity>
        <View style={styles.filterDivider} />
        <TouchableOpacity onPress={() => setActiveFilter('alquiler')}>
          <Text style={[styles.filterBtn, activeFilter === 'alquiler' && styles.filterBtnActive]}>
            Alquiler
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <BottomNav />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(3),
    backgroundColor: 'rgba(255,255,255,0.35)',
    zIndex: 30,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  filters: {
    position: 'absolute',
    top: spacing.lg,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  filterBtn: {
    fontSize: moderateScale(fontSizes.h3),
    fontWeight: fontWeights.bold,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Poppins_700Bold',
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
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    zIndex: 10,
  },
  actions: {
    position: 'absolute',
    right: spacing.md,
    bottom: verticalScale(80),
    zIndex: 10,
    alignItems: 'center',
    gap: scale(20),
  },
  action: {
    alignItems: 'center',
    gap: 2,
  },
  actionBtn: {
    padding: scale(4),
  },
  info: {
    position: 'absolute',
    bottom: verticalScale(80),
    left: spacing.md,
    zIndex: 10,
    gap: scale(12),
  },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: radii.full,
    backgroundColor: colors.typography,
  },
  username: {
    fontSize: moderateScale(fontSizes.h4),
    fontWeight: fontWeights.bold,
    color: colors.white,
    fontFamily: 'Poppins_700Bold',
  },
  userRole: {
    fontSize: moderateScale(fontSizes.body3),
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Poppins_400Regular',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    alignSelf: 'flex-start',
  },
  detailBtnPressed: {
    backgroundColor: colors.primaryHover,
  },
  detailCircle: {
    width: scale(18),
    height: scale(18),
    borderRadius: radii.full,
    backgroundColor: '#F8A0A1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBtnText: {
    fontSize: moderateScale(fontSizes.h4),
    fontWeight: fontWeights.bold,
    color: colors.white,
    fontFamily: 'Poppins_700Bold',
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