import { useEffect, useState } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

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

export function KleaMapView({
	style,
	region,
	onRegionChangeComplete,
	onPress,
	selectedCoordinates,
}: KleaMapViewProps) {
	const [localRegion, setLocalRegion] = useState<MapRegion>(region);

	useEffect(() => {
		setLocalRegion(region);
	}, [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

	const handleRegionChangeComplete = (nextRegion: MapRegion) => {
		setLocalRegion(nextRegion);
		onRegionChangeComplete(nextRegion);
	};

	return (
		<MapView style={style} initialRegion={localRegion} onRegionChangeComplete={handleRegionChangeComplete} onPress={onPress}>
			{selectedCoordinates ? <Marker coordinate={selectedCoordinates} /> : null}
		</MapView>
	);
}
