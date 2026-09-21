import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { VerificationStatusBadge } from '@/components/ui/verification-status-badge';
import { KleaColors } from '@/constants/theme';
import { AdminBailleurRow, deleteAdminUser, getAdminBailleurs, validateAdminUser } from '@/utils/admin-api';

type StatusFilter = 'tous' | 'verifie' | 'non_verifie';
type DateSort = 'recent' | 'ancien';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminBailleursScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminBailleurRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('tous');
  const [dateSort, setDateSort] = useState<DateSort>('recent');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getAdminBailleurs();
      setRows(data);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de charger les bailleurs.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBailleurs = useMemo(() => {
    const filtered = rows.filter(({ bailleur }) => {
      if (statusFilter === 'verifie') return bailleur.statut === 'actif';
      if (statusFilter === 'non_verifie') return bailleur.statut !== 'actif';
      return true;
    });

    return [...filtered].sort((left, right) => {
      const leftDate = Date.parse(left.bailleur.created_at);
      const rightDate = Date.parse(right.bailleur.created_at);
      return dateSort === 'recent' ? rightDate - leftDate : leftDate - rightDate;
    });
  }, [rows, dateSort, statusFilter]);

  const handleDelete = (id: number) => {
    Alert.alert('Supprimer ce bailleur ?', 'Cette action est irreversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminUser(id);
            await load();
          } catch (error) {
            Alert.alert('Impossible', error instanceof Error ? error.message : 'Suppression refusee.');
          }
        },
      },
    ]);
  };

  return (
    <AdminScreenShell title="Bailleurs" subtitle="">
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
      {!loading && filteredBailleurs.length === 0 ? <KleaCard><Text style={styles.emptyText}>Aucun bailleur pour ces filtres.</Text></KleaCard> : null}

      {filteredBailleurs.map(({ bailleur, biens, has_ever_had_tenant }) => {
        const nombreBiens = biens.length;
        const isVerified = bailleur.statut === 'actif';
        const deleteBlocked = has_ever_had_tenant;

        return (
          <KleaCard key={bailleur.id} style={styles.card}>
            <Text style={styles.title}>{bailleur.prenom ?? ''} {bailleur.nom}</Text>
            <Text style={styles.line}>{bailleur.email}</Text>
            <Text style={styles.line}>Biens publies: {nombreBiens}</Text>
            <Text style={styles.line}>Inscrit le: {formatDate(bailleur.created_at)}</Text>
            <VerificationStatusBadge verified={isVerified} />

            <KleaButton
              title="Voir"
              variant="secondary"
              onPress={() => router.push(`/administrateur/bailleur/${bailleur.id}` as any)}
              style={styles.actionButton}
            />
            {!isVerified ? (
              <KleaButton
                title="Valider"
                onPress={async () => {
                  try {
                    await validateAdminUser(bailleur.id);
                    await load();
                  } catch (error) {
                    Alert.alert('Erreur', error instanceof Error ? error.message : 'Validation impossible.');
                  }
                }}
                style={styles.actionButton}
              />
            ) : null}
            {!isVerified && !deleteBlocked ? (
              <KleaButton title="Supprimer" variant="ghost" onPress={() => handleDelete(bailleur.id)} style={styles.actionButton} />
            ) : null}
            {!isVerified && deleteBlocked ? (
              <Text style={styles.warningText}>Ce bailleur a deja eu au moins un locataire.</Text>
            ) : null}
          </KleaCard>
        );
      })}
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
  actionButton: {
    marginTop: 8,
  },
  warningText: {
    color: KleaColors.error,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
});
