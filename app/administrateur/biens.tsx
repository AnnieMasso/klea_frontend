import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors } from '@/constants/theme';
import { AdminBienRow, deleteAdminBien, getAdminBiens, validateAdminBien } from '@/utils/admin-api';

type StatusFilter = 'tous' | 'verifie' | 'non_verifie';
type DateSort = 'recent' | 'ancien';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminBiensScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminBienRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('tous');
  const [dateSort, setDateSort] = useState<DateSort>('recent');

  const showFeedback = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getAdminBiens();
      setRows(data);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de charger les biens.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBiens = useMemo(() => {
    const filtered = rows.filter(({ bien }) => {
      if (statusFilter === 'verifie') return bien.statut === 'actif';
      if (statusFilter === 'non_verifie') return bien.statut !== 'actif';
      return true;
    });

    return [...filtered].sort((left, right) => {
      const leftDate = Date.parse(left.bien.created_at);
      const rightDate = Date.parse(right.bien.created_at);
      return dateSort === 'recent' ? rightDate - leftDate : leftDate - rightDate;
    });
  }, [rows, dateSort, statusFilter]);

  const handleDelete = (id: number) => {
    if (busyId !== null) return;

    const confirmed = Platform.OS === 'web'
      ? window.confirm('Supprimer ce bien ? Cette action est irreversible.')
      : true;

    if (!confirmed) return;

    void (async () => {
      try {
        setBusyId(id);
        await deleteAdminBien(id);
        await load();
        showFeedback('Suppression reussie', 'Le bien a ete supprime.');
      } catch (error) {
        showFeedback('Impossible', error instanceof Error ? error.message : 'Suppression refusee.');
      } finally {
        setBusyId(null);
      }
    })();
  };

  const handleValidate = (id: number) => {
    if (busyId !== null) return;

    const confirmed = Platform.OS === 'web'
      ? window.confirm('Valider ce bien ? Cette action est irreversible.')
      : true;

    if (!confirmed) return;

    void (async () => {
      try {
        setBusyId(id);
        await validateAdminBien(id);
        await load();
        showFeedback('Validation reussie', 'Le bien a ete valide.');
      } catch (error) {
        showFeedback('Erreur', error instanceof Error ? error.message : 'Validation impossible.');
      } finally {
        setBusyId(null);
      }
    })();
  };

  return (
    <AdminScreenShell title="Biens" subtitle="">
      <KleaCard style={styles.filterCard}>
        <Text style={styles.filterTitle}>Filtres</Text>
        <View style={styles.filterRow}>
          <Pressable style={[styles.filterChip, statusFilter === 'tous' && styles.filterChipActive]} onPress={() => setStatusFilter('tous')}>
            <Text style={[styles.filterChipText, statusFilter === 'tous' && styles.filterChipTextActive]}>Tous</Text>
          </Pressable>
          <Pressable style={[styles.filterChip, statusFilter === 'verifie' && styles.filterChipActive]} onPress={() => setStatusFilter('verifie')}>
            <Text style={[styles.filterChipText, statusFilter === 'verifie' && styles.filterChipTextActive]}>Verifies</Text>
          </Pressable>
          <Pressable style={[styles.filterChip, statusFilter === 'non_verifie' && styles.filterChipActive]} onPress={() => setStatusFilter('non_verifie')}>
            <Text style={[styles.filterChipText, statusFilter === 'non_verifie' && styles.filterChipTextActive]}>Non verifies</Text>
          </Pressable>
        </View>
        <View style={styles.filterRow}>
          <Pressable style={[styles.filterChip, dateSort === 'recent' && styles.filterChipActive]} onPress={() => setDateSort('recent')}>
            <Text style={[styles.filterChipText, dateSort === 'recent' && styles.filterChipTextActive]}>Plus recents</Text>
          </Pressable>
          <Pressable style={[styles.filterChip, dateSort === 'ancien' && styles.filterChipActive]} onPress={() => setDateSort('ancien')}>
            <Text style={[styles.filterChipText, dateSort === 'ancien' && styles.filterChipTextActive]}>Plus anciens</Text>
          </Pressable>
        </View>
      </KleaCard>

      {loading ? <KleaCard><Text style={styles.emptyText}>Chargement...</Text></KleaCard> : null}
      {!loading && filteredBiens.length === 0 ? <KleaCard><Text style={styles.emptyText}>Aucun bien pour ces filtres.</Text></KleaCard> : null}

      {filteredBiens.map(({ bien, occupied_by, has_ever_been_rented }) => (
        <KleaCard key={bien.id} style={styles.card}>
          <Text style={styles.title}>{bien.titre}</Text>
          <Text style={styles.line}>{bien.type} - {bien.ville ?? '-'}</Text>
          <Text style={styles.line}>Cree le: {formatDate(bien.created_at)}</Text>
          <Text style={styles.line}>Occupation: {occupied_by ? 'Occupe' : 'Libre'}</Text>
          <Text style={styles.line}>Locataire actuel: {occupied_by ? `${occupied_by.prenom ?? ''} ${occupied_by.nom}`.trim() : '-'}</Text>
          <Text style={styles.statusLine}>Statut: {bien.statut === 'actif' ? 'Verifie' : 'En attente'}</Text>

          <KleaButton
            title="Voir"
            variant="secondary"
            onPress={() => router.push(`/administrateur/bien/${bien.id}` as any)}
            style={styles.actionButton}
          />
          {bien.statut === 'inactif' ? (
            <KleaButton title={busyId === bien.id ? 'Traitement...' : 'Valider le bien'} disabled={busyId === bien.id} onPress={() => handleValidate(bien.id)} style={styles.actionButton} />
          ) : null}
          {has_ever_been_rented ? (
            <Text style={styles.restrictedText}>Suppression indisponible: ce bien a deja ete loue.</Text>
          ) : (
            <KleaButton title="Supprimer" variant="ghost" disabled={busyId === bien.id} onPress={() => handleDelete(bien.id)} style={styles.actionButton} />
          )}
        </KleaCard>
      ))}
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  filterCard: {
    marginBottom: 4,
  },
  filterTitle: {
    color: KleaColors.secondary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KleaColors.border,
    backgroundColor: KleaColors.surface,
  },
  filterChipActive: {
    backgroundColor: KleaColors.secondary,
    borderColor: KleaColors.secondary,
  },
  filterChipText: {
    color: KleaColors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: KleaColors.surface,
  },
  card: {
    marginBottom: 4,
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
  actionButton: {
    marginTop: 8,
  },
  restrictedText: {
    color: KleaColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
});
