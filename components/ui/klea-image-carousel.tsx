import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { KleaColors, KleaRadius } from '@/constants/theme';
import { resolveImageSource } from '@/utils/local-photos';

type CarouselImage = {
  id: string;
  url: string;
};

type Props = {
  images: CarouselImage[];
  height?: number;
};

export function KleaImageCarousel({ images, height = 220 }: Props) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselWidth = width - 40;

  if (images.length === 0) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Ionicons name="image-outline" size={32} color={KleaColors.textMuted} />
        <Text style={styles.placeholderText}>Aucune photo disponible</Text>
      </View>
    );
  }

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / carouselWidth);
    if (index !== activeIndex) setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.scroll}
      >
        {images.map((image) => (
          <Image key={image.id} source={resolveImageSource(image.url)} style={[styles.image, { width: carouselWidth, height }]} resizeMode="cover" />
        ))}
      </ScrollView>

      {images.length > 1 ? (
        <View style={styles.dotsRow}>
          {images.map((image, index) => (
            <View key={image.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  scroll: {
    borderRadius: KleaRadius.lg,
  },
  image: {
    borderRadius: KleaRadius.lg,
  },
  placeholder: {
    borderRadius: KleaRadius.lg,
    backgroundColor: '#EFE9DE',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: {
    color: KleaColors.textMuted,
    fontSize: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KleaColors.border,
  },
  dotActive: {
    backgroundColor: KleaColors.accent,
    width: 16,
  },
});
