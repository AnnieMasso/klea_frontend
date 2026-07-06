import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors } from '@/constants/theme';
import { confirmDemandeAnnulation, getAllDemandesAnnulation, subscribeBiens } from '@/utils/biens-store';

type DisplayMode = 'date' | 'bien' | 'locataire';

export default function AnnulationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bienId?: string; mode?: string }>();
  const initialBienId = typeof params.bienId === 'string' ? params.bienId : '';
  const initialMode: DisplayMode =
    params.mode === 'date' || params.mode === 'locataire' || params.mode === 'bien'
      ? params.mode
      : initialBienId
        ? 'bien'
        : 'date';

  const [items, setItems] = useState(() => getAllDemandesAnnulation());
  const [displayMode, setDisplayMode] = useState<DisplayMode>(initialMode);
  const [bienFilter, setBienFilter] = useState(initialBienId);

  useEffect(() => {
    setItems(getAllDemandesAnnulation());
    const unsubscribe = subscribeBiens(() => setItems(getAllDemandesAnnulation()));
    return unsubscribe;
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
      return clone.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    }
    if (displayMode === 'bien') {
      return clone.sort((a, b) => a.bienTitre.localeCompare(b.bienTitre, 'fr', { sensitivity: 'base' }));
    }
    return clone.sort((a, b) => a.locataire.localeCompare(b.locataire, 'fr', { sensitivity: 'base' }));
  }, [items, bienFilter, displayMode]);

  const handleConfirmDemande = (bienId: string, demandeId: string) => {
    const ok = confirmDemandeAnnulation(bienId, demandeId);
    if (!ok) {
      Alert.alert('Erreur', 'Impossible de confirmer cette demande d\'annulation.');
      return;
    }
    Alert.alert('Confirmation reussie', 'La demande d\'annulation a ete acceptee.');
  };

  return (
    <BailleurScreenShell title="Annulations" subtitle="Annulation de contrat">
      <KleaCard style={styles.card}>
        <Text style={styles.filterTitle}>Afficher les demandes</Text>
        <View style={styles.filterRow}>
          <KleaButton title="Par date" variant={displayMode === 'date' ? 'primary' : 'secondary'} onPress={() => setDisplayMode('date')} style={styles.filterButton} />
          <KleaButton title="Par bien" variant={displayMode === 'bien' ? 'primary' : 'secondary'} onPress={() => setDisplayMode('bien')} style={styles.filterButton} />
          <KleaButton title="Par locataire" variant={displayMode === 'locataire' ? 'primary' : 'secondary'} onPress={() => setDisplayMode('locataire')} style={styles.filterButton} />
        </View>
      </KleaCard>

      {filteredAndSorted.length === 0 ? (
        <KleaCard><Text style={styles.emptyText}>Aucune demande d'annulation.</Text></KleaCard>
      ) : null}

      {filteredAndSorted.map((item) => (
        <KleaCard key={item.id} style={styles.card}>
          <Text style={styles.title}>{item.bienTitre}</Text>
          <Text style={styles.line}>Locataire: {item.locataire}</Text>
          <Text style={styles.line}>Date: {item.date}</Text>
          <Text style={styles.line}>Motif: {item.motif}</Text>
          <Text style={styles.line}>Statut: {item.statut}</Text>
          {item.statut === 'en_attente' ? (
            <KleaButton
              title="Confirmer la demande"
              variant="secondary"
              onPress={() => handleConfirmDemande(item.bienId, item.id)}
              style={styles.actionButton}
            />
          ) : null}
          <KleaButton title="Voir detail bien" variant="secondary" onPress={() => router.push(`/bailleur/detail/${item.bienId}` as any)} />
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
  actionButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
});