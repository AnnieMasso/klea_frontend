import type { ImageSourcePropType } from 'react-native';

const localPhotos: Record<string, ImageSourcePropType> = {
  'maison.jpg': require('../assets/images/maison.jpg'),
  'icon.png': require('../assets/images/icon.png'),
  'favicon.png': require('../assets/images/favicon.png'),
};

export function resolveImageSource(value: string): ImageSourcePropType {
  return localPhotos[value] ?? { uri: value };
}
