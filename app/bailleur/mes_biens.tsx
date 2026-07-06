import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaHeader } from '@/components/ui/klea-header';
import { KleaInput } from '@/components/ui/klea-input';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { getBiensByFilter, removeBien, subscribeBiens, updateBien, type BienDetail, type OccupationStatut } from '@/utils/biens-store';

type FilterValue = 'tous' | OccupationStatut;

type BottomAction = {
	title: string;
	icon: keyof typeof Ionicons.glyphMap;
	href: string;
};

const bottomActions: BottomAction[] = [
	{ title: 'Bord', icon: 'speedometer-outline', href: '/bailleur' },
	{ title: 'Biens', icon: 'home-outline', href: '/bailleur/mes_biens' },
	{ title: 'Messages', icon: 'chatbubble-ellipses-outline', href: '/bailleur/conversation' },
	{ title: 'Contrats', icon: 'document-text-outline', href: '/bailleur/contrats' },
	{ title: 'Profil', icon: 'person-outline', href: '/bailleur/profil' },
];

const filterOptions: Array<{ value: FilterValue; label: string }> = [
	{ value: 'tous', label: 'Tous' },
	{ value: 'en_location', label: 'En location' },
	{ value: 'libre', label: 'Libres' },
	{ value: 'jamais_loue', label: 'Jamais loue' },
];

const labelsByStatus: Record<OccupationStatut, string> = {
	en_location: 'En location',
	libre: 'Libre',
	jamais_loue: 'Jamais loue',
};

export default function MesBiensScreen() {
	const router = useRouter();
	const [filter, setFilter] = useState<FilterValue>('tous');
	const [biens, setBiens] = useState<BienDetail[]>(() => getBiensByFilter('tous'));
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editDraft, setEditDraft] = useState({ titre: '', montant: '', type: '', adresse: '', ville: '' });
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		setBiens(getBiensByFilter(filter));
		const unsubscribe = subscribeBiens(() => setBiens(getBiensByFilter(filter)));
		return unsubscribe;
	}, [filter]);

	const stats = useMemo(() => {
		const all = getBiensByFilter('tous');
		return {
			total: all.length,
			enLocation: all.filter((item) => item.occupationStatut === 'en_location').length,
			libres: all.filter((item) => item.occupationStatut === 'libre').length,
			jamaisLoue: all.filter((item) => item.occupationStatut === 'jamais_loue').length,
		};
	}, [biens]);

	const startEdit = (item: BienDetail) => {
		if (item.occupationStatut === 'en_location') {
			Alert.alert('Modification impossible', 'Un bien en location ne peut pas etre modifie.');
			return;
		}
		setEditingId(item.id);
		setEditDraft({
			titre: item.titre,
			montant: String(item.montant),
			type: item.type,
			adresse: item.adresse,
			ville: item.ville ?? '',
		});
	};

	const saveEdit = (id: string) => {
		const ok = updateBien(id, {
			titre: editDraft.titre.trim(),
			type: editDraft.type.trim(),
			montant: Number(editDraft.montant.replace(/\D/g, '')) || 0,
			adresse: editDraft.adresse.trim(),
			ville: editDraft.ville.trim(),
		});
		if (ok) {
			setEditingId(null);
			Alert.alert('Mise a jour', 'Le bien a ete modifie.');
		}
	};

	const handleDelete = (id: string) => {
		const result = removeBien(id);
		if (!result.ok) {
			Alert.alert('Suppression impossible', result.message);
			return;
		}
		Alert.alert('Bien supprime', result.message);
	};

	return (
		<SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
			<View style={styles.container}>
				<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
					<KleaHeader
						title="Mes biens"
						subtitle=""
						right={
							<View style={styles.headerIcons}>
								<Link href="/bailleur/nouveaubien" asChild>
									<Pressable style={styles.iconButton}>
										<Ionicons name="add-circle-outline" size={26} color={KleaColors.secondary} />
									</Pressable>
								</Link>
								<Link href="/bailleur/notifications" asChild>
									<Pressable style={styles.iconButton}>
										<Ionicons name="notifications-outline" size={24} color={KleaColors.secondary} />
									</Pressable>
								</Link>
								<Link href="/bailleur/profil" asChild>
									<Pressable style={styles.profileIcon}>
										<Ionicons name="person-circle-outline" size={26} color={KleaColors.secondary} />
									</Pressable>
								</Link>
							</View>
						}
					/>

					<View style={styles.filtersWrap}>
						{filterOptions.map((option) => (
							<Pressable
								key={option.value}
								onPress={() => setFilter(option.value)}
								style={[styles.filterChip, filter === option.value ? styles.filterChipActive : null]}>
								<Text style={[styles.filterText, filter === option.value ? styles.filterTextActive : null]}>
									{option.label} ({option.value === 'tous' ? stats.total : option.value === 'en_location' ? stats.enLocation : option.value === 'libre' ? stats.libres : stats.jamaisLoue})
								</Text>
							</Pressable>
						))}
					</View>

					{biens.length === 0 ? (
						<KleaCard style={styles.emptyCard}>
							<Text style={styles.emptyText}>Aucun bien pour ce filtre.</Text>
						</KleaCard>
					) : null}

					{biens.map((item) => {
						const isEditing = editingId === item.id;
						const isLocked = item.occupationStatut === 'en_location';

						return (
							<KleaCard key={item.id} style={styles.bienCard}>


								{isEditing ? (
									<View>
										<KleaInput label="Titre" value={editDraft.titre} onChangeText={(value) => setEditDraft((prev) => ({ ...prev, titre: value }))} />
										<KleaInput label="Type" value={editDraft.type} onChangeText={(value) => setEditDraft((prev) => ({ ...prev, type: value }))} />
										<KleaInput label="Montant" keyboardType="numeric" value={editDraft.montant} onChangeText={(value) => setEditDraft((prev) => ({ ...prev, montant: value.replace(/\D/g, '') }))} />
										<KleaInput label="Adresse" value={editDraft.adresse} onChangeText={(value) => setEditDraft((prev) => ({ ...prev, adresse: value }))} />
										<KleaInput label="Ville" value={editDraft.ville} onChangeText={(value) => setEditDraft((prev) => ({ ...prev, ville: value }))} />

										<View style={styles.actionsRow}>
											<KleaButton title="Annuler" style={styles.visitButton} textStyle={styles.visitButtonText} onPress={() => setEditingId(null)} />
											<KleaButton title="Enregistrer" style={styles.visitButton} textStyle={styles.visitButtonText} onPress={() => saveEdit(item.id)} />
										</View>
									</View>
								) : (
									<View>
										<View style={styles.mediaBlock}>
											<View style={[styles.mediaStatusChip, isLocked ? styles.mediaStatusChipBusy : styles.mediaStatusChipFree]}>
												<Text style={styles.mediaStatusText}>{labelsByStatus[item.occupationStatut]}</Text>
											</View>
											<Ionicons name="image-outline" size={26} color={KleaColors.textMuted} />
											<Text style={styles.mediaHint}>photo du bien</Text>
										</View>

										<View style={styles.bienBody}>
											<Text style={styles.bienCardTitle}>{item.titre}</Text>
											<View style={styles.locationRow}>
												<Ionicons name="location-outline" size={14} color={KleaColors.textMuted} />
												<Text style={styles.locationText}>{item.ville ?? '-'}, {item.adresse}</Text>
											</View>
											<Text style={styles.priceText}>{item.montant.toLocaleString('fr-FR')} FCFA / mois</Text>

											<View style={styles.actionsRow}>
												<KleaButton
													title="Details"
													style={styles.visitButton}
													textStyle={styles.visitButtonText}
													onPress={() => router.push(`/bailleur/detail/${item.id}` as any)}
												/>
												<KleaButton
													title="Modifier"
													style={styles.visitButton}
													textStyle={styles.visitButtonText}
													onPress={() => startEdit(item)}
													disabled={isLocked}
												/>
												<KleaButton
													title={isLocked ? 'Suppression bloquee' : 'Supprimer'}
													style={styles.visitButton}
													textStyle={styles.visitButtonText}
													onPress={() => handleDelete(item.id)}
													disabled={isLocked}
												/>
											</View>
										</View>
									</View>
								)}
							</KleaCard>
						);
					})}
				</ScrollView>

				<View style={styles.bottomBar}>
					{bottomActions.map((action) => (
						<Link key={action.title} href={action.href as any} asChild>
							<Pressable style={styles.bottomAction}>
								<Ionicons name={action.icon} size={22} color={KleaColors.primary} />
							</Pressable>
						</Link>
					))}

					<Pressable style={styles.bottomAction} onPress={() => setMenuOpen(true)}>
						<Ionicons name="ellipsis-vertical" size={22} color={KleaColors.primary} />
					</Pressable>
				</View>

				<Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
					<View style={styles.modalOverlay}>
						<View style={styles.modalContent}>
							<Text style={styles.modalTitle}>Plus</Text>

							<Link href="/bailleur/signalements" asChild>
								<Pressable style={styles.modalItem} onPress={() => setMenuOpen(false)}>
									<Ionicons name="alert-circle-outline" size={20} color={KleaColors.primary} />
									<Text style={styles.modalItemText}>Signalement</Text>
								</Pressable>
							</Link>

							<Link href="/bailleur/depart" asChild>
								<Pressable style={styles.modalItem} onPress={() => setMenuOpen(false)}>
									<Ionicons name="log-out-outline" size={20} color={KleaColors.primary} />
									<Text style={styles.modalItemText}>Depart</Text>
								</Pressable>
							</Link>

							<Pressable style={styles.modalClose} onPress={() => setMenuOpen(false)}>
								<Text style={styles.modalCloseText}>Fermer</Text>
							</Pressable>
						</View>
					</View>
				</Modal>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: KleaColors.background,
	},
	container: {
		flex: 1,
	},
	content: {
		paddingTop: 18,
		paddingHorizontal: 20,
		paddingBottom: 128,
		gap: 12,
	},
	headerIcons: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconButton: {
		marginRight: 12,
		padding: 4,
	},
	profileIcon: {
		marginLeft: 2,
		padding: 2,
	},
	filtersWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 8,
	},
	filterChip: {
		borderWidth: 1,
		borderColor: '#D69735',
		backgroundColor: KleaColors.surface,
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	filterChipActive: {
		borderColor: '#BA7B1E',
		backgroundColor: '#EAF1EE',
	},
	filterText: {
		color: KleaColors.primary,
		fontSize: 12,
		fontWeight: '600',
	},
	filterTextActive: {
		color: KleaColors.primary,
	},
	emptyCard: {
		paddingVertical: 24,
	},
	emptyText: {
		textAlign: 'center',
		color: KleaColors.textMuted,
		fontSize: 14,
	},
	bienCard: {
		borderRadius: KleaRadius.xl,
		overflow: 'hidden',
	},
	bienTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
		gap: 10,
	},
	bienTitle: {
		flex: 1,
		color: KleaColors.primary,
		fontSize: 16,
		fontWeight: '700',
	},
	statusBadge: {
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderWidth: 1,
	},
	statusBusy: {
		borderColor: '#D8B086',
		backgroundColor: '#FDF1E2',
	},
	statusFree: {
		borderColor: '#A7CDBD',
		backgroundColor: '#EAF5EF',
	},
	statusText: {
		color: KleaColors.secondary,
		fontSize: 11,
		fontWeight: '700',
	},
	bienMeta: {
		color: KleaColors.textMuted,
		fontSize: 13,
		lineHeight: 20,
	},
	mediaBlock: {
		height: 138,
		backgroundColor: '#EFE9DE',
		borderRadius: KleaRadius.lg,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
		position: 'relative',
	},
	mediaStatusChip: {
		position: 'absolute',
		top: 10,
		left: 10,
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderWidth: 1,
	},
	mediaStatusChipBusy: {
		borderColor: '#D8B086',
		backgroundColor: '#FDF1E2',
	},
	mediaStatusChipFree: {
		borderColor: '#A7CDBD',
		backgroundColor: '#EAF5EF',
	},
	mediaStatusText: {
		color: KleaColors.secondary,
		fontSize: 11,
		fontWeight: '700',
	},
	mediaHint: {
		color: KleaColors.textMuted,
		fontSize: 12,
		marginTop: 6,
	},
	bienBody: {
		gap: 6,
	},
	bienCardTitle: {
		color: KleaColors.primary,
		fontSize: 17,
		fontWeight: '700',
	},
	locationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	locationText: {
		flex: 1,
		color: KleaColors.textMuted,
		fontSize: 13,
	},
	priceText: {
		color: KleaColors.primary,
		fontSize: 15,
		fontWeight: '700',
		marginTop: 2,
	},
	actionsRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 12,
		marginBottom: 6,
	},
	visitButton: {
		backgroundColor: KleaColors.accent,
		paddingVertical: 7,
		paddingHorizontal: 10,
		borderRadius: 999,
	},
	visitButtonText: {
		color: KleaColors.primary,
		fontSize: 12,
		fontWeight: '700',
	},
	bottomBar: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: KleaColors.surface,
		borderTopWidth: 1,
		borderTopColor: KleaColors.border,
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingVertical: 12,
		paddingBottom: 18,
	},
	bottomAction: {
		width: '16.6667%',
		alignItems: 'center',
		justifyContent: 'center',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(16,50,47,0.28)',
		justifyContent: 'center',
		paddingHorizontal: 28,
	},
	modalContent: {
		backgroundColor: KleaColors.surface,
		borderRadius: KleaRadius.xl,
		borderWidth: 1,
		borderColor: KleaColors.border,
		padding: 18,
	},
	modalTitle: {
		color: KleaColors.primary,
		fontSize: 18,
		fontWeight: '700',
		marginBottom: 12,
	},
	modalItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 10,
	},
	modalItemText: {
		color: KleaColors.primary,
		fontSize: 15,
		fontWeight: '600',
	},
	modalClose: {
		marginTop: 14,
		paddingVertical: 10,
		alignItems: 'center',
		borderRadius: KleaRadius.md,
		borderWidth: 1,
		borderColor: KleaColors.border,
	},
	modalCloseText: {
		color: KleaColors.primary,
		fontSize: 14,
		fontWeight: '700',
	},
});
