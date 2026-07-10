import { Alert, Linking, Platform } from 'react-native';

import type { MapCoordinates, MapRegion } from '@/components/ui/klea-map-view';

export const defaultBienMapDelta = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export function parseBienCoordinates(localisation?: string): MapCoordinates | null {
  if (!localisation) return null;

  const [latitudeRaw, longitudeRaw] = localisation.split(',').map((value) => value.trim());
  const latitude = Number(latitudeRaw);
  const longitude = Number(longitudeRaw);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

export function getBienMapRegion(coordinates: MapCoordinates | null): MapRegion | null {
  if (!coordinates) return null;

  return {
    ...coordinates,
    ...defaultBienMapDelta,
  };
}

export async function openBienDirections(coordinates: MapCoordinates, label: string) {
  const destination = `${coordinates.latitude},${coordinates.longitude}`;
  const encodedLabel = encodeURIComponent(label);
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
  const nativeUrl = Platform.select({
    ios: `http://maps.apple.com/?daddr=${destination}&q=${encodedLabel}`,
    android: `geo:0,0?q=${destination}(${encodedLabel})`,
    default: webUrl,
  });

  try {
    if (nativeUrl && await Linking.canOpenURL(nativeUrl)) {
      await Linking.openURL(nativeUrl);
      return true;
    }

    await Linking.openURL(webUrl);
    return true;
  } catch {
    Alert.alert('Carte indisponible', 'Impossible d\'ouvrir l\'itineraire pour ce bien.');
    return false;
  }
}
