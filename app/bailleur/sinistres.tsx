import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors } from '@/constants/theme';
import { getAllSignalements, subscribeBiens } from '@/utils/biens-store';

const sinistreAssets: Record<string, ImageSourcePropType> = {
	'maison.jpg': require('../../assets/images/maison.jpg'),
	'icon.png': require('../../assets/images/icon.png'),
	'favicon.png': require('../../assets/images/favicon.png'),
};

function getSinistreAsset(photoKey?: string): ImageSourcePropType | null {
	if (!photoKey) return null;
	return sinistreAssets[photoKey] ?? null;
}

export default function SignalementsScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ bienId?: string; mode?: string }>();
	const initialBienId = typeof params.bienId === 'string' ? params.bienId : '';
	const initialMode: 'date' | 'bien' | 'locataire' =
		params.mode === 'date' || params.mode === 'locataire' || params.mode === 'bien'
			? params.mode
			: initialBienId
				? 'bien'
				: 'date';

	const [items, setItems] = useState(() => getAllSignalements());
	const [displayMode, setDisplayMode] = useState<'date' | 'bien' | 'locataire'>(initialMode);
	const [bienFilter, setBienFilter] = useState(initialBienId);
	const [previewImage, setPreviewImage] = useState<ImageSourcePropType | null>(null);

	useEffect(() => {
		if (!initialBienId) return;
		setBienFilter(initialBienId);
		setDisplayMode('bien');
	}, [initialBienId]);

	const filteredAndSorted = useMemo(() => {
		const filtered = bienFilter ? items.filter((item) => item.bienId === bienFilter) : items;
		const clone = [...filtered];
		if (displayMode === 'date') {
			return clone.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
		}
		if (displayMode === 'bien') {
			return clone.sort((a, b) => a.bienTitre.localeCompare(b.bienTitre, 'fr', { sensitivity: 'base' }));
		}
		return clone.sort((a, b) => a.locataire.localeCompare(b.locataire, 'fr', { sensitivity: 'base' }));
	}, [items, bienFilter, displayMode]);

	useEffect(() => {
		setItems(getAllSignalements());
		const unsubscribe = subscribeBiens(() => setItems(getAllSignalements()));
		return unsubscribe;
	}, []);

	return (
		<BailleurScreenShell title="Sinistres" subtitle="Sinistres lies a vos biens">
			<Modal visible={Boolean(previewImage)} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
				<View style={styles.modalBackdrop}>
					<Pressable style={styles.modalCloseZone} onPress={() => setPreviewImage(null)}>
						<Text style={styles.modalCloseText}>Fermer</Text>
					</Pressable>
					{previewImage ? <Image source={previewImage} style={styles.modalImage} resizeMode="contain" /> : null}
				</View>
			</Modal>

			<KleaCard style={styles.card}>
				<Text style={styles.filterTitle}>Afficher les sinistres</Text>
				<View style={styles.filterRow}>
					<KleaButton title="Par date" variant={displayMode === 'date' ? 'primary' : 'secondary'} onPress={() => setDisplayMode('date')} style={styles.filterButton} />
					<KleaButton title="Par bien" variant={displayMode === 'bien' ? 'primary' : 'secondary'} onPress={() => setDisplayMode('bien')} style={styles.filterButton} />
					<KleaButton title="Par locataire" variant={displayMode === 'locataire' ? 'primary' : 'secondary'} onPress={() => setDisplayMode('locataire')} style={styles.filterButton} />
				</View>
			</KleaCard>

					{filteredAndSorted.length === 0 ? (
						<KleaCard>
							<Text style={styles.emptyText}>Aucun signalement.</Text>
						</KleaCard>
					) : null}

					{filteredAndSorted.map((item) => (
						<KleaCard key={item.id} style={styles.card}>
							<Text style={styles.title}>{item.bienTitre}</Text>
							<Text style={styles.line}>Date du sinistre: {item.date}</Text>
							<Text style={styles.line}>Locataire: {item.locataire}</Text>
							<Text style={styles.line}>Description: {item.description}</Text>
							<View style={styles.photoGrid}>
								<Pressable
									style={styles.photoFrame}
									onPress={() => {
										const source = getSinistreAsset(item.photoSinistre1);
										if (source) setPreviewImage(source);
									}}
								>
									{getSinistreAsset(item.photoSinistre1) ? (
										<Image source={getSinistreAsset(item.photoSinistre1)!} style={styles.photoThumb} resizeMode="cover" />
									) : (
										<Text style={styles.photoFallback}>Photo 1 indisponible</Text>
									)}
									<Text style={styles.photoCaption}>Photo 1</Text>
								</Pressable>
								<Pressable
									style={styles.photoFrame}
									onPress={() => {
										const source = getSinistreAsset(item.photoSinistre2);
										if (source) setPreviewImage(source);
									}}
								>
									{getSinistreAsset(item.photoSinistre2) ? (
										<Image source={getSinistreAsset(item.photoSinistre2)!} style={styles.photoThumb} resizeMode="cover" />
									) : (
										<Text style={styles.photoFallback}>Photo 2 optionnelle</Text>
									)}
									<Text style={styles.photoCaption}>Photo 2</Text>
								</Pressable>
							</View>
							<KleaButton title="Voir le bien concerné" variant="secondary" onPress={() => router.push(`/bailleur/detail/${item.bienId}` as any)} />
						</KleaCard>
					))}
		</BailleurScreenShell>
	);
}

const styles = StyleSheet.create({
	card: {
		marginBottom: 2,
	},
	title: {
		color: KleaColors.secondary,
		fontSize: 15,
		fontWeight: '700',
		marginBottom: 8,
	},
	line: {
		color: KleaColors.textMuted,
		fontSize: 13,
		lineHeight: 20,
	},
	filterTitle: {
		color: KleaColors.secondary,
		fontSize: 14,
		fontWeight: '700',
		marginBottom: 8,
	},
	filterRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 8,
	},
	filterButton: {
		paddingVertical: 9,
		paddingHorizontal: 10,
	},
	photoGrid: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 10,
		marginBottom: 10,
	},
	photoFrame: {
		flex: 1,
		borderWidth: 1,
		borderColor: KleaColors.border,
		borderRadius: 10,
		padding: 6,
		backgroundColor: '#F9F7F2',
		minHeight: 110,
	},
	photoThumb: {
		width: '100%',
		height: 70,
		borderRadius: 8,
		marginBottom: 6,
	},
	photoCaption: {
		color: KleaColors.secondary,
		fontSize: 12,
		fontWeight: '700',
	},
	photoFallback: {
		color: KleaColors.textMuted,
		fontSize: 12,
		height: 70,
		textAlignVertical: 'center',
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.7)',
		justifyContent: 'center',
		padding: 20,
	},
	modalCloseZone: {
		alignSelf: 'flex-end',
		marginBottom: 8,
		paddingVertical: 6,
		paddingHorizontal: 10,
		backgroundColor: '#FFFFFF',
		borderRadius: 8,
	},
	modalCloseText: {
		color: KleaColors.secondary,
		fontSize: 12,
		fontWeight: '700',
	},
	modalImage: {
		width: '100%',
		height: '82%',
		borderRadius: 12,
	},
	emptyText: {
		color: KleaColors.textMuted,
		fontSize: 13,
	},
});
