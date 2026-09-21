import { useMemo } from 'react';
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

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

function buildOpenStreetMapUrl(region: MapRegion, selectedCoordinates: MapCoordinates | null): string {
	const halfLongitude = Math.max(region.longitudeDelta, 0.001) / 2;
	const halfLatitude = Math.max(region.latitudeDelta, 0.001) / 2;
	const left = region.longitude - halfLongitude;
	const right = region.longitude + halfLongitude;
	const top = region.latitude + halfLatitude;
	const bottom = region.latitude - halfLatitude;

	const bbox = `${left},${bottom},${right},${top}`;
	const marker = selectedCoordinates
		? `&marker=${selectedCoordinates.latitude},${selectedCoordinates.longitude}`
		: '';

	return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik${marker}`;
}

export function KleaMapView({ style, region, selectedCoordinates }: KleaMapViewProps) {
	const mapUrl = useMemo(() => buildOpenStreetMapUrl(region, selectedCoordinates), [region, selectedCoordinates]);

	return (
		<View style={[styles.fallback, style]}>
			<iframe title="Klea map" src={mapUrl} style={styles.webMapFrame} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
			<Text style={styles.subtitle}>Carte OpenStreetMap.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	fallback: {
		borderWidth: 1,
		borderStyle: 'solid',
		borderColor: '#D8D1C0',
		backgroundColor: '#FFFFFF',
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 0,
	},
	webMapFrame: {
		width: '100%',
		height: '100%',
		border: 'none',
	},
	subtitle: {
		color: '#6F6A5E',
		fontSize: 12,
		lineHeight: 18,
		textAlign: 'center',
		position: 'absolute',
		left: 10,
		bottom: 8,
		backgroundColor: 'rgba(255,255,255,0.9)',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 6,
	},
});
