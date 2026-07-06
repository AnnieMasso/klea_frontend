import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { ReauthGate } from '@/components/ui/reauth-gate';
import { KleaColors } from '@/constants/theme';
import { getAllContrats, getContratStatutAffichage, signContrat, subscribeBiens } from '@/utils/biens-store';

type DisplayMode = 'date' | 'bien' | 'locataire';

type ContratListItem = ReturnType<typeof getAllContrats>[number];

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

	const [items, setItems] = useState(() => getAllContrats());
	const [displayMode, setDisplayMode] = useState<DisplayMode>(initialMode);
	const [bienFilter, setBienFilter] = useState(initialBienId);

	useEffect(() => {
		setItems(getAllContrats());
		const unsubscribe = subscribeBiens(() => setItems(getAllContrats()));
		return unsubscribe;
	}, []);

	const onSign = (bienId: string, contratId: string) => {
		const ok = signContrat(bienId, contratId);
		if (ok) Alert.alert('Contrat signe', 'La signature du contrat a ete enregistree.');
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

						{filteredAndSorted.length === 0 ? (
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
									{!contract.signe ? <KleaButton title="Signer" variant="secondary" onPress={() => onSign(contract.bienId, contract.id)} /> : null}
									<KleaButton title="Voir le contrat de bail" variant="secondary" onPress={() => router.push(`/bailleur/contrat/${contract.id}?bienId=${contract.bienId}` as any)} />
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
