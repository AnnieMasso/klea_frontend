import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaHeader } from '@/components/ui/klea-header';
import { KleaInput } from '@/components/ui/klea-input';
import { KleaMapView, type MapCoordinates as Coordinates, type MapPressPayload as MapPressEvent, type MapRegion as Region } from '@/components/ui/klea-map-view';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { addBien } from '@/utils/biens-store';

type FormData = {
	titre: string;
	type: string;
	description: string;
	montant: string;
	modalitePaiement: string;
	surface: string;
	nbChambres: string;
	nbSalles: string;
	usages: string[];
	adresse: string;
	quartier: string;
	ville: string;
	lieu_dit: string;
	localisation: string;
	images: string[];
};

const steps = [
	'Informations',
	'Caracteristiques',
	'Localisation',
	'Validation',
] as const;

const usageOptions = ['Habitation', 'Professionel', 'Evènement'];

const defaultRegion: Region = {
	latitude: 5.3599517,
	longitude: -4.0082563,
	latitudeDelta: 0.015,
	longitudeDelta: 0.015,
};

const initialData: FormData = {
	titre: '',
	type: 'Appartement',
	description: '',
	montant: '',
	modalitePaiement: 'Mensuel',
	surface: '',
	nbChambres: '',
	nbSalles: '',
	usages: [],
	adresse: '',
	quartier: '',
	ville: '',
	lieu_dit: '',
	localisation: '',
	images: ['', '', ''],
};

export default function NouveauBienScreen() {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState(0);
	const [data, setData] = useState<FormData>(initialData);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [useMyPosition, setUseMyPosition] = useState(false);
	const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(null);
	const [mapRegion, setMapRegion] = useState<Region>(defaultRegion);

	const progress = useMemo(() => ((currentStep + 1) / steps.length) * 100, [currentStep]);

	const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
		setData((prev) => ({ ...prev, [key]: value }));
		setErrors((prev) => ({ ...prev, [key]: '' }));
	};

	const setNumericField = (key: 'montant' | 'surface' | 'nbChambres' | 'nbSalles', value: string) => {
		setField(key, value.replace(/\D/g, ''));
	};

	const setImageAt = (index: number, value: string) => {
		const next = [...data.images];
		next[index] = value;
		setField('images', next);
	};

	const applyCoordinates = async (coords: Coordinates) => {
		const [address] = await Location.reverseGeocodeAsync(coords);

		setSelectedCoordinates(coords);
		setMapRegion((prev: any) => ({
			...prev,
			latitude: coords.latitude,
			longitude: coords.longitude,
		}));
		setData((prev) => ({
			...prev,
			adresse: [address?.streetNumber, address?.street].filter(Boolean).join(' ').trim() || address?.name || prev.adresse,
			quartier: address?.country || prev.quartier,
			ville: address?.city || address?.subregion || prev.ville,
			lieu_dit: address?.district || address?.name || prev.lieu_dit,
			localisation: `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
		}));
		setErrors((prev) => ({ ...prev, localisation: '', adresse: '', ville: '', lieu_dit: '' }));
	};

	const pickImageAt = async (index: number) => {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (!permission.granted) {
			Alert.alert('Autorisation requise', 'Autorisez l\'acces a la galerie pour ajouter une image.');
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.8,
		});

		if (result.canceled || result.assets.length === 0) {
			return;
		}

		setImageAt(index, result.assets[0].uri);
	};

	const fillLocationFromDevice = async () => {
		const permission = await Location.requestForegroundPermissionsAsync();

		if (!permission.granted) {
			setUseMyPosition(false);
			setErrors((prev) => ({ ...prev, localisation: 'Autorisez la position' }));
			Alert.alert('Vous devez etre exactement à l endroit du bien que vous voulez mettre en location pour le localiser');
			return;
		}

		const servicesEnabled = await Location.hasServicesEnabledAsync();

		if (!servicesEnabled) {
			if (Platform.OS === 'android') {
				try {
					await Location.enableNetworkProviderAsync();
				} catch {
					setUseMyPosition(false);
					setErrors((prev) => ({ ...prev, localisation: 'Activez la localisation du telephone pour continuer.' }));
					Alert.alert('Localisation inactive', 'Activez la localisation du telephone pour utiliser votre position.');
					return;
				}
			} else {
				setUseMyPosition(false);
				setErrors((prev) => ({ ...prev, localisation: 'Activez la localisation du telephone pour continuer.' }));
				Alert.alert('Localisation inactive', 'Activez la localisation du telephone pour utiliser votre position.');
				return;
			}
		}

		try {
			const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
			const { latitude, longitude } = position.coords;
			await applyCoordinates({ latitude, longitude });
		} catch {
			setUseMyPosition(false);
			setErrors((prev) => ({ ...prev, localisation: 'Impossible de recuperer votre position actuelle.' }));
			Alert.alert('Position indisponible', 'Impossible de recuperer votre position pour le moment.');
		}
	};

	const handleMapPress = async (event: MapPressEvent) => {
		try {
			await applyCoordinates(event.nativeEvent.coordinate);
		} catch {
			setErrors((prev) => ({ ...prev, localisation: 'Impossible de recuperer les details de cette position.' }));
		}
	};

	const handleMapRegionChange = (_region: Region) => {
	};

	const toggleUseMyPosition = async () => {
		if (useMyPosition) {
			setUseMyPosition(false);
			setErrors((prev) => ({ ...prev, localisation: '' }));
			return;
		}

		setUseMyPosition(true);
		await fillLocationFromDevice();
	};

	const toggleUsage = (usage: string) => {
		if (data.usages.includes(usage)) {
			if (data.usages.length === 1) {
				setErrors((prev) => ({ ...prev, usages: 'Au moins un usage doit rester selectionne.' }));
				return;
			}

			setField(
				'usages',
				data.usages.filter((item) => item !== usage),
			);
			return;
		}
		setField('usages', [...data.usages, usage]);
	};

	const validateStep = (stepIndex: number) => {
		const nextErrors: Record<string, string> = {};

		if (stepIndex === 0) {
			if (!data.titre.trim()) nextErrors.titre = 'Le titre est obligatoire.';
			if (!data.description.trim()) nextErrors.description = 'La description est obligatoire.';
		}

		if (stepIndex === 1) {
			if (!data.montant.trim()) nextErrors.montant = 'Le montant est obligatoire.';
			if (!data.surface.trim()) nextErrors.surface = 'La surface est obligatoire.';
			if (!data.nbChambres.trim()) nextErrors.nbChambres = 'Le nombre de chambres est obligatoire.';
			if (!data.nbSalles.trim()) nextErrors.nbSalles = 'Le nombre de salles est obligatoire.';
			if (data.usages.length === 0) nextErrors.usages = 'Selectionnez au moins un usage.';
		}

		if (stepIndex === 2) {
			if (!data.adresse.trim()) nextErrors.adresse = 'L\'adresse est obligatoire.';
			if (!data.ville.trim()) nextErrors.ville = 'La ville est obligatoire.';
			if (!data.lieu_dit.trim()) nextErrors.lieu_dit = 'Le lieu dit est obligatoire.';
		}

		if (stepIndex === 3) {
			const hasOneImage = data.images.some((img) => img.trim().length > 0);
			if (!hasOneImage) nextErrors.images = 'Ajoutez au moins une image.';
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const onNext = () => {
		if (!validateStep(currentStep)) return;
		setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
	};

	const onPrevious = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 0));
	};

	const onSubmit = () => {
		if (!validateStep(currentStep)) return;

		addBien({
			titre: data.titre.trim(),
			type: data.type,
			description: data.description.trim(),
			montant: Number(data.montant || 0),
			modalitePaiement: data.modalitePaiement,
			surface: Number(data.surface || 0),
			nbChambres: Number(data.nbChambres || 0),
			nbSalles: Number(data.nbSalles || 0),
			usages: data.usages,
			adresse: data.adresse.trim(),
			pays: data.quartier.trim(),
			ville: data.ville.trim(),
			lieuDit: data.lieu_dit.trim(),
			localisation: data.localisation,
			images: data.images.filter((img) => img.trim().length > 0),
		});

		Alert.alert('Bien enregistre', 'Le bien a ete ajoute avec succes.');
		setData(initialData);
		setErrors({});
		setUseMyPosition(false);
		setCurrentStep(0);
		router.replace('/bailleur/mes_biens');
	};

	const selectedImages = data.images.filter((image) => image.trim().length > 0);

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
					<KleaHeader title="Ajouter un bien" subtitle="" />

					<KleaCard style={styles.stepperCard}>
						<View style={styles.stepperHeader}>
							<Text style={styles.stepTitle}>Etape {currentStep + 1}</Text>
						</View>
						<View style={styles.progressTrack}>
							<View style={[styles.progressFill, { width: `${progress}%` }]} />
						</View>
					</KleaCard>

					{currentStep === 0 ? (
						<KleaCard style={styles.formCard}>
							<Text style={styles.cardTitle}>Informations generales</Text>

							<KleaInput
								label="Titre"
								value={data.titre}
								onChangeText={(value) => setField('titre', value)}
								error={errors.titre}
								icon="home-outline"
							/>

							<Text style={styles.label}>Type de bien</Text>
							<View style={styles.pickerContainer}>
								<Picker selectedValue={data.type} onValueChange={(value) => setField('type', value)} style={styles.picker}>
									<Picker.Item label="Appartement" value="Appartement" />
									<Picker.Item label="Maison" value="Maison" />
									<Picker.Item label="Studio" value="Studio" />
									<Picker.Item label="Bureau" value="Bureau" />
									<Picker.Item label="Local commercial" value="Local commercial" />
								</Picker>
							</View>

							<KleaInput
								label="Description"
								placeholder="Decrivez le bien"
								multiline
								numberOfLines={4}
								value={data.description}
								onChangeText={(value) => setField('description', value)}
								error={errors.description}
								style={styles.textarea}
							/>
						</KleaCard>
					) : null}

					{currentStep === 1 ? (
						<KleaCard style={styles.formCard}>
							<Text style={styles.cardTitle}>Caracteristiques et tarification</Text>

							<KleaInput
								label="Montant"
								keyboardType="numeric"
								value={data.montant}
								onChangeText={(value) => setNumericField('montant', value)}
								error={errors.montant}
								icon="cash-outline"
							/>

							<Text style={styles.label}>Modalite de paiement</Text>
							<View style={styles.pickerContainer}>
								<Picker
									selectedValue={data.modalitePaiement}
									onValueChange={(value) => setField('modalitePaiement', value)}
									style={styles.picker}>
									<Picker.Item label="Mensuel" value="Mensuel" />
									<Picker.Item label="Trimestriel" value="Trimestriel" />
									<Picker.Item label="Semestriel" value="Semestriel" />
									<Picker.Item label="Annuel" value="Annuel" />
								</Picker>
							</View>

							<KleaInput
								label="Surface (m2)"
								keyboardType="numeric"
								value={data.surface}
								onChangeText={(value) => setNumericField('surface', value)}
								error={errors.surface}
								icon="resize-outline"
							/>

							<View style={styles.twoColumns}>
								<View style={styles.half}>
									<KleaInput
										label="Nombre de chambres"
										keyboardType="numeric"
										value={data.nbChambres}
										onChangeText={(value) => setNumericField('nbChambres', value)}
										error={errors.nbChambres}
									/>
								</View>
								<View style={styles.half}>
									<KleaInput
										label="Nombre de salles de bain"
										keyboardType="numeric"
										value={data.nbSalles}
										onChangeText={(value) => setNumericField('nbSalles', value)}
										error={errors.nbSalles}
									/>
								</View>
							</View>

							<Text style={styles.label}>Usages </Text>
							<Text style={styles.helperText}>Selectionnez au moins un usage pour ce bien.</Text>
							<View style={[styles.usageWrap, errors.usages ? styles.usageWrapError : null]}>
								{usageOptions.map((usage) => {
									const active = data.usages.includes(usage);
									return (
										<Pressable
											key={usage}
											onPress={() => toggleUsage(usage)}
											style={[styles.usageChip, active && styles.usageChipActive]}>
											<Text style={[styles.usageChipText, active && styles.usageChipTextActive]}>{usage}</Text>
										</Pressable>
									);
								})}
							</View>
							{errors.usages ? <Text style={styles.errorText}>{errors.usages}</Text> : null}
						</KleaCard>
					) : null}

					{currentStep === 2 ? (
						<KleaCard style={styles.formCard}>
							<Text style={styles.cardTitle}>Localisation</Text>

							<Pressable style={styles.locationToggle} onPress={toggleUseMyPosition}>
								<Ionicons
									name={useMyPosition ? 'checkbox' : 'square-outline'}
									size={22}
									color={useMyPosition ? KleaColors.secondary : KleaColors.textMuted}
								/>
								<View style={styles.locationToggleTextBlock}>
									<Text style={styles.locationToggleTitle}>Utiliser ma position</Text>
									<Text style={styles.locationToggleSubtitle}>
										Vous devez etre exactement à l'endroit du bien que vous voulez mettre en location pour le localiser
									</Text>
								</View>
							</Pressable>
							{errors.localisation ? <Text style={styles.errorText}>{errors.localisation}</Text> : null}

							<View style={styles.mapCard}>

								<KleaMapView
									key={`${mapRegion.latitude.toFixed(4)}-${mapRegion.longitude.toFixed(4)}`}
									style={styles.map}
									region={mapRegion}
									onRegionChangeComplete={handleMapRegionChange}
									onPress={handleMapPress}
									selectedCoordinates={selectedCoordinates}
								/>
							</View>

							<KleaInput
								label="Adresse"
								value={data.adresse}
								onChangeText={(value) => setField('adresse', value)}
								error={errors.adresse}
								icon="location-outline"
							/>

							<KleaInput
								label="Pays"
								value={data.quartier}
								onChangeText={(value) => setField('quartier', value)}
							/>

							<View style={styles.twoColumns}>
								<View style={styles.half}>
									<KleaInput
										label="Ville"
										value={data.ville}
										onChangeText={(value) => setField('ville', value)}
										error={errors.ville}
									/>
								</View>
								<View style={styles.half}>
									<KleaInput
										label="Lieu dit"
										value={data.lieu_dit}
										onChangeText={(value) => setField('lieu_dit', value)}
										error={errors.lieu_dit}
									/>
								</View>
							</View>
						</KleaCard>
					) : null}

					{currentStep === 3 ? (
						<KleaCard style={styles.formCard}>
							<Text style={styles.cardTitle}>Images et validation</Text>

							<Text style={styles.helperText}>Ajoutez jusqu'a 3 images depuis votre galerie.</Text>
							{data.images.map((imageUri, index) => (
								<View key={`image-slot-${index}`} style={styles.imageFieldCard}>
									<View style={styles.imageFieldHeader}>
										<Text style={styles.imageFieldTitle}>Image {index + 1}</Text>
										{imageUri ? (
											<Pressable onPress={() => setImageAt(index, '')}>
												<Text style={styles.removeText}>Retirer</Text>
											</Pressable>
										) : null}
									</View>
									{imageUri ? (
										<Image source={{ uri: imageUri }} style={styles.previewImage} />
									) : (
										<View style={styles.emptyPreview}>
											<Text style={styles.emptyPreviewText}>Aucune image selectionnee</Text>
										</View>
									)}
									<KleaButton
										title={imageUri ? 'Changer l\'image' : 'Choisir une image'}
										variant="secondary"
										onPress={() => pickImageAt(index)}
										icon="image-outline"
										fullWidth
									/>
								</View>
							))}
							{errors.images ? <Text style={styles.errorText}>{errors.images}</Text> : null}

							<View style={styles.summaryBox}>
								<Text style={styles.summaryTitle}>Récapitulatif</Text>
								<Text style={styles.summaryText}>Titre: {data.titre || '-'}</Text>
								<Text style={styles.summaryText}>Type: {data.type}</Text>
								<Text style={styles.summaryText}>Montant: {data.montant || '-'} FCFA</Text>
								<Text style={styles.summaryText}>Localisation: {data.ville || '-'}, {data.lieu_dit || '-'}</Text>
								<Text style={styles.summaryText}>Usages: {data.usages.length > 0 ? data.usages.join(', ') : '-'}</Text>
								<Text style={styles.summaryText}>Images ajoutees: {selectedImages.length}</Text>
							</View>
						</KleaCard>
					) : null}
				</ScrollView>

				<View style={styles.footerActions}>
					<KleaButton
						title="Precedent"
						variant="secondary"
						onPress={onPrevious}
						disabled={currentStep === 0}
						style={styles.actionButton}
					/>
					{currentStep < steps.length - 1 ? (
						<KleaButton
							title="Suivant"
							onPress={onNext}
							icon="arrow-forward-outline"
							iconPosition="right"
							style={styles.actionButton}
						/>
					) : (
						<KleaButton
							title="Enregistrer le bien"
							onPress={onSubmit}
							icon="checkmark-outline"
							iconPosition="right"
							style={styles.actionButton}
						/>
					)}
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: KleaColors.background,
		paddingTop: Platform.OS === 'android' ? 24 : 16,
	},
	container: {
		flex: 1,
	},
	content: {
		paddingTop: 52,
		paddingHorizontal: 20,
		paddingBottom: 210,
	},
	stepperCard: {
		marginBottom: 14,
	},
	stepperHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	stepTitle: {
		color: KleaColors.textMuted,
		fontSize: 13,
		fontWeight: '600',
	},
	stepLabel: {
		color: KleaColors.secondary,
		fontSize: 14,
		fontWeight: '700',
	},
	progressTrack: {
		height: 8,
		borderRadius: 999,
		overflow: 'hidden',
		backgroundColor: '#E8E4DA',
	},
	progressFill: {
		height: '100%',
		backgroundColor: KleaColors.accent,
	},
	formCard: {
		marginBottom: 14,
	},
	cardTitle: {
		color: KleaColors.secondary,
		fontSize: 16,
		fontWeight: '700',
		marginBottom: 12,
	},
	helperText: {
		color: KleaColors.textMuted,
		fontSize: 13,
		lineHeight: 20,
		marginBottom: 12,
	},
	label: {
		color: KleaColors.primary,
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 6,
	},
	locationToggle: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 10,
		padding: 14,
		borderWidth: 1,
		borderColor: KleaColors.border,
		borderRadius: KleaRadius.md,
		backgroundColor: KleaColors.surface,
		marginBottom: 12,
	},
	locationToggleTextBlock: {
		flex: 1,
	},
	locationToggleTitle: {
		color: KleaColors.primary,
		fontSize: 14,
		fontWeight: '700',
		marginBottom: 4,
	},
	locationToggleSubtitle: {
		color: KleaColors.textMuted,
		fontSize: 12,
		lineHeight: 18,
	},
	mapCard: {
		borderWidth: 1,
		borderColor: KleaColors.border,
		borderRadius: KleaRadius.md,
		backgroundColor: KleaColors.surface,
		padding: 12,
		marginBottom: 12,
	},
	mapHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 10,
		marginBottom: 8,
	},
	mapTitle: {
		flex: 1,
		color: KleaColors.primary,
		fontSize: 14,
		fontWeight: '700',
	},
	mapSubtitle: {
		color: KleaColors.textMuted,
		fontSize: 12,
		lineHeight: 18,
		marginBottom: 10,
	},
	map: {
		height: 220,
		borderRadius: KleaRadius.md,
		overflow: 'hidden',
	},
	pickerContainer: {
		borderWidth: 1,
		borderColor: KleaColors.border,
		borderRadius: KleaRadius.md,
		backgroundColor: KleaColors.background,
		marginBottom: 14,
		overflow: 'hidden',
	},
	picker: {
		color: KleaColors.primary,
		backgroundColor: KleaColors.background,
	},
	textarea: {
		minHeight: 110,
		textAlignVertical: 'top',
		paddingTop: 12,
	},
	twoColumns: {
		flexDirection: 'row',
		gap: 10,
	},
	half: {
		flex: 1,
	},
	usageWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 4,
		borderRadius: KleaRadius.md,
		padding: 4,
	},
	usageWrapError: {
		borderWidth: 1,
		borderColor: KleaColors.error,
	},
	usageChip: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: KleaColors.border,
		backgroundColor: KleaColors.surface,
	},
	usageChipActive: {
		borderColor: KleaColors.secondary,
		backgroundColor: '#EAF1EE',
	},
	usageChipText: {
		color: KleaColors.textMuted,
		fontSize: 13,
		fontWeight: '600',
	},
	usageChipTextActive: {
		color: KleaColors.secondary,
	},
	errorText: {
		color: KleaColors.error,
		fontSize: 12,
		marginTop: 2,
	},
	imageFieldCard: {
		borderWidth: 1,
		borderColor: KleaColors.border,
		borderRadius: KleaRadius.md,
		padding: 14,
		backgroundColor: '#F9F7F2',
		marginBottom: 12,
	},
	imageFieldHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 10,
	},
	imageFieldTitle: {
		color: KleaColors.primary,
		fontSize: 14,
		fontWeight: '600',
	},
	removeText: {
		color: KleaColors.error,
		fontSize: 13,
		fontWeight: '600',
	},
	previewImage: {
		width: '100%',
		height: 180,
		borderRadius: KleaRadius.md,
		marginBottom: 12,
	},
	emptyPreview: {
		height: 180,
		borderRadius: KleaRadius.md,
		borderWidth: 1,
		borderColor: KleaColors.border,
		borderStyle: 'dashed',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: KleaColors.surface,
		marginBottom: 12,
	},
	emptyPreviewText: {
		color: KleaColors.textMuted,
		fontSize: 13,
	},
	summaryBox: {
		marginTop: 6,
		padding: 14,
		borderRadius: KleaRadius.md,
		borderWidth: 1,
		borderColor: KleaColors.border,
		backgroundColor: '#F9F7F2',
	},
	summaryTitle: {
		color: KleaColors.secondary,
		fontSize: 14,
		fontWeight: '700',
		marginBottom: 8,
	},
	summaryText: {
		color: KleaColors.textMuted,
		fontSize: 13,
		lineHeight: 20,
	},
	footerActions: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		paddingHorizontal: 20,
		paddingTop: 18,
		paddingBottom: 44,
		borderTopWidth: 1,
		borderTopColor: KleaColors.border,
		backgroundColor: KleaColors.surface,
		flexDirection: 'row',
		gap: 10,
	},
	actionButton: {
		flex: 1,
	},
});
