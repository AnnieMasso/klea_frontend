import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { VerificationStatusBadge } from '@/components/ui/verification-status-badge';
import { KleaColors } from '@/constants/theme';
import { deleteLocataireAccount, getAllLocataireAccounts, getBiens, getLocataireDeletionBlockReason, setLocataireBanni, setLocataireStatut, subscribeBiens } from '@/utils/biens-store';

type StatusFilter = 'tous' | 'verifie' | 'non_verifie';
type DateSort = 'recent' | 'ancien';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminLocatairesScreen() {
  const router = useRouter();
  const [, forceRefresh] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('tous');
  const [dateSort, setDateSort] = useState<DateSort>('recent');

  useEffect(() => {
    const unsubscribe = subscribeBiens(() => forceRefresh((value) => value + 1));
    return unsubscribe;
  }, []);

  const locataires = getAllLocataireAccounts();
  const filteredLocataires = useMemo(() => {
    const filtered = locataires.filter((locataire) => {
      if (statusFilter === 'verifie') return locataire.statut === 'verifie';
      if (statusFilter === 'non_verifie') return locataire.statut !== 'verifie';
      return true;
    });

    return [...filtered].sort((left, right) => {
      const leftDate = Date.parse(left.createdAt);
      const rightDate = Date.parse(right.createdAt);
      return dateSort === 'recent' ? rightDate - leftDate : leftDate - rightDate;
    });
  }, [dateSort, locataires, statusFilter]);

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer ce locataire ?', 'Cette action est irreversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          const result = deleteLocataireAccount(id);
          if (!result.ok) Alert.alert('Impossible', result.message);
        },
      },
    ]);
  };

  return (
    <AdminScreenShell title="Locataires" subtitle="">
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

      {filteredLocataires.length === 0 ? <KleaCard><Text style={styles.emptyText}>Aucun locataire pour ces filtres.</Text></KleaCard> : null}

      {filteredLocataires.map((locataire) => (
        (() => {
          const biensLoues = getBiens().filter((bien) => bien.locataireActuel?.id === locataire.id).length;
          const isVerified = locataire.statut === 'verifie';
          const deleteBlockReason = getLocataireDeletionBlockReason(locataire.id);
          return (
        <KleaCard key={locataire.id} style={styles.card}>
          <Text style={styles.title}>{locataire.prenom} {locataire.nom}</Text>
          <Text style={styles.line}>{locataire.email}</Text>
          <Text style={styles.line}>Biens loues: {biensLoues}</Text>
          <Text style={styles.line}>Inscrit le: {formatDate(locataire.createdAt)}</Text>
          <VerificationStatusBadge verified={isVerified} />
          {locataire.banni ? <Text style={styles.banniLine}>Compte banni</Text> : null}

          <KleaButton
            title="Voir le detail"
            variant="secondary"
            onPress={() => router.push(`/administrateur/locataire/${locataire.id}` as any)}
            style={styles.actionButton}
          />
          {!isVerified ? (
            <KleaButton title="Valider" onPress={() => setLocataireStatut(locataire.id, 'verifie')} style={styles.actionButton} />
          ) : null}
          {!isVerified && !deleteBlockReason ? <KleaButton title="Supprimer" variant="ghost" onPress={() => handleDelete(locataire.id)} style={styles.actionButton} /> : null}
          {!isVerified && deleteBlockReason ? <Text style={styles.warningText}>{deleteBlockReason}</Text> : null}
        </KleaCard>
          );
        })()
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
  banniLine: {
    color: '#B23128',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
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
