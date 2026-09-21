import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { ReauthGate } from '@/components/ui/reauth-gate';
import { KleaColors } from '@/constants/theme';
import { getAuthenticatedUser, getBailleurContratById, getBailleurContrats, signBailleurContrat, type BailleurContrat } from '@/utils/bailleur-api';
import { downloadContrat } from '@/utils/contrat-pdf';

type DisplayMode = 'date' | 'bien' | 'locataire';

type ContratListItem = BailleurContrat;

function getContratStatutAffichage(contract: ContratListItem) {
	if (contract.etat === 'signe') return 'en cours';
	if (contract.etat === 'annule' || contract.etat === 'resilie') return 'fini';
	return 'en cours';
}

function parseDate(value: string) {
	const ts = Date.parse(value);
	return Number.isNaN(ts) ? 0 : ts;
}

function sortByMode(items: ContratListItem[], mode: DisplayMode) {
	const clone = [...items];
	if (mode === 'date') {
		return clone.sort((a, b) => parseDate(b.dateDebut) - parseDate(a.dateDebut));
	}
	if (mode === 'bien') {
		return clone.sort((a, b) => {
			const first = a.bienTitre.localeCompare(b.bienTitre, 'fr', { sensitivity: 'base' });
			if (first !== 0) return first;
			return parseDate(b.dateDebut) - parseDate(a.dateDebut);
		});
	}
	return clone.sort((a, b) => {
		const first = a.locataire.localeCompare(b.locataire, 'fr', { sensitivity: 'base' });
		if (first !== 0) return first;
		return parseDate(b.dateDebut) - parseDate(a.dateDebut);
	});
}

export default function ContratsScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ bienId?: string; mode?: string }>();
	const initialBienId = typeof params.bienId === 'string' ? params.bienId : '';
	const initialMode: DisplayMode =
		params.mode === 'date' || params.mode === 'locataire' || params.mode === 'bien'
			? params.mode
			: initialBienId
				? 'bien'
				: 'date';

	const [items, setItems] = useState<ContratListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [displayMode, setDisplayMode] = useState<DisplayMode>(initialMode);
	const [bienFilter, setBienFilter] = useState(initialBienId);
	const [downloadingId, setDownloadingId] = useState<string | null>(null);
	const [myDisplayName, setMyDisplayName] = useState('Bailleur');

	const loadContracts = async () => {
		try {
			setLoading(true);
			const data = await getBailleurContrats();
			setItems(data);
		} catch (error) {
			Alert.alert('Erreur', error instanceof Error ? error.message : 'Chargement impossible.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadContracts();
	}, []);

	useEffect(() => {
		let cancelled = false;

		getAuthenticatedUser()
			.then((user) => {
				if (cancelled) return;
				const fullName = [user.prenom ?? '', user.nom ?? ''].map((part) => part.trim()).filter(Boolean).join(' ');
				setMyDisplayName(fullName || user.email || 'Bailleur');
			})
			.catch(() => {
				if (!cancelled) setMyDisplayName('Bailleur');
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const onSign = async (contratId: string) => {
		try {
			await signBailleurContrat(contratId);
			Alert.alert('Contrat signe', 'La signature du contrat a ete enregistree.');
			await loadContracts();
		} catch (error) {
			Alert.alert('Erreur', error instanceof Error ? error.message : 'Signature impossible.');
		}
	};

	const onDownload = async (contratId: string) => {
		if (downloadingId === contratId) return;

		setDownloadingId(contratId);
		try {
			const contract = await getBailleurContratById(contratId);
			if (!contract) {
				Alert.alert('Erreur', 'Contrat introuvable.');
				return;
			}

			await downloadContrat({
				id: contract.id,
				bienTitre: contract.bienTitre,
				typeBien: 'Bien immobilier',
				typeContrat: 'determine',
				etat: contract.etat === 'resilie' ? 'annule' : contract.etat,
				dateSignature: contract.dateDebut,
				dureeMois: contract.dureeMois,
				montant: contract.montant,
				lieu: '-',
				conditions: [],
				bailleur: { nom: myDisplayName, telephone: '-', email: '-' },
				locataire: { nom: contract.locataire, telephone: '-', email: '-' },
			});
		} catch (error) {
			Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de telecharger le contrat.');
		} finally {
			setDownloadingId(null);
		}
	};

	useEffect(() => {
		if (!initialBienId) return;
		setBienFilter(initialBienId);
		setDisplayMode('bien');
	}, [initialBienId]);

	const filteredAndSorted = useMemo(() => {
		const filtered = bienFilter ? items.filter((item) => item.bienId === bienFilter) : items;
		return sortByMode(filtered, displayMode);
	}, [items, bienFilter, displayMode]);

	return (
		<ReauthGate reason="consulter vos contrats">
			<BailleurScreenShell title="Contrats" subtitle="">
				<KleaCard style={styles.card}>
					<Text style={styles.filterTitle}>Afficher les contrats</Text>
					<View style={styles.filterRow}>
						<KleaButton title="Par date" variant={displayMode === 'date' ? 'primary' : 'secondary'} onPress={() => setDisplayMode('date')} style={styles.filterButton} />
						<KleaButton title="Par bien" variant={displayMode === 'bien' ? 'primary' : 'secondary'} onPress={() => setDisplayMode('bien')} style={styles.filterButton} />
						<KleaButton title="Par locataire" variant={displayMode === 'locataire' ? 'primary' : 'secondary'} onPress={() => setDisplayMode('locataire')} style={styles.filterButton} />
					</View>

				</KleaCard>

						{loading ? (
							<KleaCard><Text style={styles.emptyText}>Chargement...</Text></KleaCard>
						) : null}

						{!loading && filteredAndSorted.length === 0 ? (
							<KleaCard><Text style={styles.emptyText}>Aucun contrat disponible.</Text></KleaCard>
						) : null}

						{filteredAndSorted.map((contract) => (
							<KleaCard key={contract.id} style={styles.card}>
								<Text style={styles.title}>{contract.bienTitre}</Text>
								<Text style={styles.line}>Locataire: {contract.locataire}</Text>
								<Text style={styles.line}>Montant: {contract.montant.toLocaleString('fr-FR')} FCFA</Text>
								<Text style={styles.line}>Duree: {contract.dureeMois} mois</Text>
								<Text style={styles.line}>Date de signature: {contract.dateDebut}</Text>
								<Text style={styles.statusLine}>Statut: {getContratStatutAffichage(contract)}</Text>

								<View style={styles.actions}>
									{contract.etat === 'en_attente' ? <KleaButton title="Signer" variant="secondary" onPress={() => onSign(contract.id)} /> : null}
									{contract.etat === 'en_attente' ? <KleaButton title="Editer avant signature" variant="secondary" onPress={() => router.push(`/bailleur/nouveau_contrat?conversationId=${contract.conversationId}&contratId=${contract.id}` as any)} /> : null}
									<KleaButton title="Voir le contrat de bail" variant="secondary" onPress={() => router.push(`/bailleur/contrat/${contract.id}?bienId=${contract.bienId}` as any)} />
									<KleaButton title={downloadingId === contract.id ? 'Generation...' : 'Télécharger'} variant="secondary" onPress={() => onDownload(contract.id)} disabled={downloadingId === contract.id} />
									<KleaButton title="Voir les details du bien associé" onPress={() => router.push(`/bailleur/detail/${contract.bienId}` as any)} />
								</View>
							</KleaCard>
						))}
			</BailleurScreenShell>
		</ReauthGate>
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
	statusLine: {
		color: KleaColors.secondary,
		fontSize: 13,
		fontWeight: '700',
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
	actions: {
		gap: 8,
		marginTop: 10,
	},
	emptyText: {
		color: KleaColors.textMuted,
		fontSize: 13,
	},
});
