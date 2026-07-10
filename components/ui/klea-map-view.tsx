import { Platform, type StyleProp, type ViewStyle } from 'react-native';

export type MapCoordinates = {
  latitude: number;
  longitude: number;
};

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapPressPayload = {
  nativeEvent: {
    coordinate: MapCoordinates;
  };
};

type KleaMapViewProps = {
  style?: StyleProp<ViewStyle>;
  region: MapRegion;
  onRegionChangeComplete: (region: MapRegion) => void;
  onPress: (event: MapPressPayload) => void;
  selectedCoordinates: MapCoordinates | null;
};

const PlatformMapView = Platform.OS === 'web'
  ? require('./klea-map-view.web').KleaMapView
  : require('./klea-map-view.native').KleaMapView;

export function KleaMapView(props: KleaMapViewProps) {
  return <PlatformMapView {...props} />;
}
