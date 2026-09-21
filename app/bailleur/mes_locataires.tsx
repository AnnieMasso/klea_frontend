import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { ReauthGate } from '@/components/ui/reauth-gate';
import { KleaColors } from '@/constants/theme';
import { getBailleurLocataires, type BailleurLocataire } from '@/utils/bailleur-api';

type DisplayMode = 'date' | 'bien' | 'locataire';

export default function MesLocatairesScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ bienId?: string; mode?: string }>();
	const initialBienId = typeof params.bienId === 'string' ? params.bienId : '';
	const initialMode: DisplayMode =
		params.mode === 'date' || params.mode === 'locataire' || params.mode === 'bien'
			? params.mode
			: initialBienId
				? 'bien'
				: 'locataire';

	const [items, setItems] = useState<BailleurLocataire[]>([]);
	const [loading, setLoading] = useState(true);
	const [displayMode, setDisplayMode] = useState<DisplayMode>(initialMode);
	const [bienFilter, setBienFilter] = useState(initialBienId);

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setItems(await getBailleurLocataires());
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	useEffect(() => {
		if (!initialBienId) return;
		setBienFilter(initialBienId);
		setDisplayMode('bien');
	}, [initialBienId]);

	const filteredAndSorted = useMemo(() => {
		const filtered = bienFilter ? items.filter((item) => item.bienId === bienFilter) : items;
		const clone = [...filtered];
		if (displayMode === 'date') {
			return clone.sort((a, b) => new Date(b.dateDebut || '').getTime() - new Date(a.dateDebut || '').getTime());
		}
		if (displayMode === 'bien') {
			return clone.sort((a, b) => a.bienTitre.localeCompare(b.bienTitre, 'fr', { sensitivity: 'base' }));
		}
		return clone.sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, 'fr', { sensitivity: 'base' }));
	}, [items, bienFilter, displayMode]);

	return (
		<ReauthGate reason="voir les details de vos locataires">
			<BailleurScreenShell title="Locataires" subtitle="Historique des locataires">
				<KleaCard style={styles.card}>
					<Text style={styles.filterTitle}>Afficher tous les locataires</Text>
					<View style={styles.filterRow}>
						<KleaButton title="Par date" variant={displayMode === 'date' ? 'primary' : 'secondary'} onPress={() => setDisplayMode('date')} style={styles.filterButton} />
						<KleaButton title="Par bien" variant={displayMode === 'bien' ? 'primary' : 'secondary'} onPress={() => setDisplayMode('bien')} style={styles.filterButton} />
					</View>
				</KleaCard>

				{loading ? (
					<KleaCard><Text style={styles.emptyText}>Chargement...</Text></KleaCard>
				) : null}

				{!loading && filteredAndSorted.length === 0 ? (
					<KleaCard><Text style={styles.emptyText}>Aucun ancien locataire.</Text></KleaCard>
				) : null}

				{filteredAndSorted.map((item) => (
					<KleaCard key={item.id} style={styles.card}>
						<Text style={styles.title}>{item.bienTitre}</Text>
						<Text style={styles.line}>Locataire: {item.nomComplet}</Text>
						<Text style={styles.statusLine}>Statut: {item.statut}</Text>
						<Text style={styles.line}>Telephone: {item.telephone}</Text>
						<Text style={styles.line}>Email: {item.email}</Text>
						<View style={styles.actionsColumn}>
							<Text style={styles.restrictedText}>L'assurance habitation n'est pas exposée dans cet espace bailleur.</Text>
							<KleaButton
								title="Voir sa CNI"
								variant="secondary"
								onPress={() => router.push(`/bailleur/cni/${item.id}?bienId=${item.bienId}` as any)}
							/>
							<KleaButton title="Voir detail bien" variant="secondary" onPress={() => router.push(`/bailleur/detail/${item.bienId}` as any)} />
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
	actionsColumn: {
		marginTop: 8,
		gap: 10,
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
	emptyText: {
		color: KleaColors.textMuted,
		fontSize: 13,
	},
	restrictedText: {
		color: KleaColors.textMuted,
		fontSize: 12,
		lineHeight: 18,
	},
});
