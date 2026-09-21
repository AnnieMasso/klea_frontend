import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors } from '@/constants/theme';
import { useReauthConfirm } from '@/hooks/use-reauth-confirm';
import { confirmBailleurDepart, getBailleurDeparts, type BailleurDepart } from '@/utils/bailleur-api';

export default function DepartScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ bienId?: string; mode?: string }>();
	const initialBienId = typeof params.bienId === 'string' ? params.bienId : '';
	const initialMode: 'date' | 'bien' | 'locataire' =
		params.mode === 'date' || params.mode === 'locataire' || params.mode === 'bien'
			? params.mode
			: initialBienId
				? 'bien'
				: 'date';

	const [departs, setDeparts] = useState<BailleurDepart[]>([]);
	const [loading, setLoading] = useState(true);
	const [displayMode, setDisplayMode] = useState<'date' | 'bien' | 'locataire'>(initialMode);
	const [bienFilter, setBienFilter] = useState(initialBienId);
	const { requestReauth, reauthModal } = useReauthConfirm();

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setDeparts(await getBailleurDeparts());
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const onConfirm = async (departId: string) => {
		const identityConfirmed = await requestReauth('confirmer ce depart');
		if (!identityConfirmed) return;

		await confirmBailleurDepart(departId);
		setDeparts(await getBailleurDeparts());
		Alert.alert('Depart confirme', 'Le depart signale a ete confirme.');
	};

	useEffect(() => {
		if (!initialBienId) return;
		setBienFilter(initialBienId);
		setDisplayMode('bien');
	}, [initialBienId]);

	const filteredAndSorted = useMemo(() => {
		const filtered = bienFilter ? departs.filter((item) => item.bienId === bienFilter) : departs;
		const clone = [...filtered];
		if (displayMode === 'date') {
			return clone.sort((a, b) => Date.parse(b.dateSignalement) - Date.parse(a.dateSignalement));
		}
		if (displayMode === 'bien') {
			return clone.sort((a, b) => a.bienTitre.localeCompare(b.bienTitre, 'fr', { sensitivity: 'base' }));
		}
		return clone.sort((a, b) => a.locataire.localeCompare(b.locataire, 'fr', { sensitivity: 'base' }));
	}, [departs, bienFilter, displayMode]);

	return (
		<>
			{reauthModal}
			<BailleurScreenShell title="Departs" subtitle="">
				<KleaCard style={styles.card}>
					<Text style={styles.filterTitle}>Afficher les departs</Text>
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
							<KleaCard><Text style={styles.emptyText}>Aucun depart signale.</Text></KleaCard>
						) : null}

						{filteredAndSorted.map((departure) => (
							<KleaCard key={departure.id} style={styles.card}>
								<Text style={styles.title}>{departure.bienTitre}</Text>
								<Text style={styles.line}>Locataire: {departure.locataire}</Text>
								<Text style={styles.line}>Date de signalement: {departure.dateSignalement}</Text>
								<Text style={styles.line}>Date de depart prevue: {departure.datePrevue}</Text>
								<Text style={styles.line}>Statut: {departure.statut}</Text>

								<View style={styles.actionsColumn}>
									{departure.statut === 'signale' ? <KleaButton title="Confirmer le depart" onPress={() => onConfirm(departure.id)} /> : <KleaButton title="Depart confirme" variant="secondary" disabled onPress={() => {}} />}
									<KleaButton title="Voir detail bien" variant="secondary" onPress={() => router.push(`/bailleur/detail/${departure.bienId}` as any)} />
								</View>
							</KleaCard>
						))}
			</BailleurScreenShell>
		</>
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
		marginBottom: 2,
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
	actionsColumn: {
		marginTop: 8,
		gap: 10,
	},
	emptyText: {
		color: KleaColors.textMuted,
		fontSize: 13,
	},
});
