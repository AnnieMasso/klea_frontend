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

export function KleaMapView({ style }: KleaMapViewProps) {
	return (
		<View style={[styles.fallback, style]}>
			<Text style={styles.title}>Carte indisponible sur cette plateforme.</Text>
			<Text style={styles.subtitle}>Utilisez "Ma position" pour recuperer automatiquement la localisation.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	fallback: {
		borderWidth: 1,
		borderStyle: 'dashed',
		borderColor: '#D8D1C0',
		backgroundColor: '#F9F7F2',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 14,
	},
	title: {
		color: '#5E4B2B',
		fontSize: 14,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: 6,
	},
	subtitle: {
		color: '#6F6A5E',
		fontSize: 12,
		lineHeight: 18,
		textAlign: 'center',
	},
});
