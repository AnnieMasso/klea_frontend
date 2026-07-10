import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors } from '@/constants/theme';
import { getBiens, removeBien, setBienValidationStatut, subscribeBiens } from '@/utils/biens-store';

type StatusFilter = 'tous' | 'verifie' | 'non_verifie';
type DateSort = 'recent' | 'ancien';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminBiensScreen() {
  const router = useRouter();
  const [, forceRefresh] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('tous');
  const [dateSort, setDateSort] = useState<DateSort>('recent');

  useEffect(() => {
    const unsubscribe = subscribeBiens(() => forceRefresh((value) => value + 1));
    return unsubscribe;
  }, []);

  const biens = getBiens();
  const filteredBiens = useMemo(() => {
    const filtered = biens.filter((bien) => {
      if (statusFilter === 'verifie') return bien.validationStatut === 'verifie';
      if (statusFilter === 'non_verifie') return bien.validationStatut !== 'verifie';
      return true;
    });

    return [...filtered].sort((left, right) => {
      const leftDate = Date.parse(left.createdAt);
      const rightDate = Date.parse(right.createdAt);
      return dateSort === 'recent' ? rightDate - leftDate : leftDate - rightDate;
    });
  }, [biens, dateSort, statusFilter]);

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer ce bien ?', 'Cette action est irreversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          const result = removeBien(id);
          if (!result.ok) Alert.alert('Impossible', result.message);
        },
      },
    ]);
  };

  const handleValidate = (id: string) => {
    Alert.alert('Valider ce bien ?', 'Cette action est irreversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Valider',
        onPress: () => setBienValidationStatut(id, 'verifie'),
      },
    ]);
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

      {filteredBiens.length === 0 ? <KleaCard><Text style={styles.emptyText}>Aucun bien pour ces filtres.</Text></KleaCard> : null}

      {filteredBiens.map((bien) => (
        <KleaCard key={bien.id} style={styles.card}>
          <Text style={styles.title}>{bien.titre}</Text>
          <Text style={styles.line}>{bien.type} - {bien.ville ?? '-'}</Text>
          <Text style={styles.line}>Cree le: {formatDate(bien.createdAt)}</Text>
          <Text style={styles.line}>Occupation: {bien.locataireActuel ? 'Occupe' : 'Libre'}</Text>
          <Text style={styles.line}>Locataire actuel: {bien.locataireActuel?.nomComplet ?? '-'}</Text>
          <Text style={styles.statusLine}>Statut: {bien.validationStatut === 'verifie' ? 'Verifie' : 'En attente'}</Text>

          <KleaButton
            title="Voir"
            variant="secondary"
            onPress={() => router.push(`/administrateur/bien/${bien.id}` as any)}
            style={styles.actionButton}
          />
          {bien.validationStatut === 'en_attente' ? (
            <KleaButton title="Valider le bien" onPress={() => handleValidate(bien.id)} style={styles.actionButton} />
          ) : null}
          {bien.occupationStatut === 'en_location' ? (
            <Text style={styles.restrictedText}>Suppression indisponible: ce bien est deja occupe.</Text>
          ) : (
            <KleaButton title="Supprimer" variant="ghost" onPress={() => handleDelete(bien.id)} style={styles.actionButton} />
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
