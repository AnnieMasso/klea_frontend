import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { ReauthGate } from '@/components/ui/reauth-gate';
import { KleaColors } from '@/constants/theme';
import { getBailleurPaiements, type BailleurPaiement } from '@/utils/bailleur-api';
import { downloadFacture } from '@/utils/facture';

type DisplayMode = 'date' | 'bien' | 'locataire';
type PaiementListItem = BailleurPaiement;

function parseDate(value: string) {
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
}

function sortByMode(items: PaiementListItem[], mode: DisplayMode) {
  const clone = [...items];
  if (mode === 'date') {
    return clone.sort((a, b) => parseDate(b.datePaiement) - parseDate(a.datePaiement));
  }
  if (mode === 'bien') {
    return clone.sort((a, b) => {
      const first = a.bienTitre.localeCompare(b.bienTitre, 'fr', { sensitivity: 'base' });
      if (first !== 0) return first;
      return parseDate(b.datePaiement) - parseDate(a.datePaiement);
    });
  }
  return clone.sort((a, b) => {
    const first = a.locataire.localeCompare(b.locataire, 'fr', { sensitivity: 'base' });
    if (first !== 0) return first;
    return parseDate(b.datePaiement) - parseDate(a.datePaiement);
  });
}

export default function PaiementsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bienId?: string; mode?: string }>();
  const initialBienId = typeof params.bienId === 'string' ? params.bienId : '';
  const initialMode: DisplayMode =
    params.mode === 'date' || params.mode === 'locataire' || params.mode === 'bien'
      ? params.mode
      : initialBienId
        ? 'bien'
        : 'date';

  const [items, setItems] = useState<PaiementListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(initialMode);
  const [bienFilter, setBienFilter] = useState(initialBienId);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadPaiements = async () => {
    try {
      setLoading(true);
      const data = await getBailleurPaiements();
      setItems(data);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaiements();
  }, []);

  useEffect(() => {
    if (!initialBienId) return;
    setBienFilter(initialBienId);
    setDisplayMode('bien');
  }, [initialBienId]);

  const filteredAndSorted = useMemo(() => {
    const filtered = bienFilter ? items.filter((item) => item.bienId === bienFilter) : items;
    return sortByMode(filtered, displayMode);
  }, [items, bienFilter, displayMode]);

  const handleDownload = async (payment: BailleurPaiement) => {
    if (downloadingId === payment.id) return;

    setDownloadingId(payment.id);
    try {
      await downloadFacture({
        id: payment.id,
        locataire: payment.locataire,
        bienTitre: payment.bienTitre,
        montant: payment.montant,
        datePaiement: payment.datePaiement,
        dureeMois: payment.dureeMois,
        modePaiement: payment.modePaiement,
        bailleur: payment.bailleur,
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de telecharger la facture.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <ReauthGate reason="voir tous les paiements">
      <BailleurScreenShell title="Paiements" subtitle="">
        <KleaCard style={styles.card}>
          <Text style={styles.filterTitle}>Afficher les paiements</Text>
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
          <KleaCard><Text style={styles.emptyText}>Aucun paiement disponible.</Text></KleaCard>
        ) : null}

        {filteredAndSorted.map((payment) => (
          <KleaCard key={payment.id} style={styles.card}>
            <Text style={styles.title}>{payment.bienTitre}</Text>
            <Text style={styles.line}>Locataire: {payment.locataire}</Text>
            <Text style={styles.line}>Montant: {payment.montant.toLocaleString('fr-FR')} FCFA</Text>
            <Text style={styles.line}>Date paiement: {new Date(payment.datePaiement).toLocaleDateString('fr-FR')}</Text>
            <Text style={styles.line}>Mode: {payment.modePaiement}</Text>

            <View style={styles.actions}>
              <KleaButton
                title="Voir le paiement"
                variant="secondary"
                onPress={() => router.push(`/bailleur/facture/${payment.id}` as any)}
              />
              <KleaButton
                title={downloadingId === payment.id ? 'Generation...' : 'Télécharger la facture'}
                variant="secondary"
                onPress={() => handleDownload(payment)}
                disabled={downloadingId === payment.id}
              />
              <KleaButton title="Voir les détails du bien" onPress={() => router.push(`/bailleur/detail/${payment.bienId}` as any)} />
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
