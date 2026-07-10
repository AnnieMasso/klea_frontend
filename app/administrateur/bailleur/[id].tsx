import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { VerificationStatusBadge } from '@/components/ui/verification-status-badge';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { deleteBailleurAccount, getAllBailleurAccounts, getBailleurDeletionBlockReason, getBiens, setBailleurStatut, subscribeBiens } from '@/utils/biens-store';
import { resolveImageSource } from '@/utils/local-photos';

export default function AdminBailleurDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const bailleurId = typeof params.id === 'string' ? params.id : '';
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeBiens(() => forceRefresh((value) => value + 1));
    return unsubscribe;
  }, []);

  const bailleur = getAllBailleurAccounts().find((item) => item.id === bailleurId) ?? null;
  const biens = getBiens().filter((item) => item.bailleurId === bailleurId);
  const deleteBlockReason = bailleur ? getBailleurDeletionBlockReason(bailleur.id) : 'Bailleur introuvable.';
  const isVerified = bailleur?.statut === 'verifie';

  const handleDelete = () => {
    if (!bailleur) return;

    Alert.alert(
      'Supprimer ce bailleur ?',
      'Cette action est irreversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const result = deleteBailleurAccount(bailleurId);
            if (!result.ok) {
              Alert.alert('Impossible', result.message);
              return;
            }
            router.back();
          },
        },
      ],
    );
  };

  if (!bailleur) {
    return (
      <AdminScreenShell title="Bailleur" subtitle="Introuvable">
        <KleaCard><Text style={styles.emptyText}>Ce bailleur est introuvable.</Text></KleaCard>
      </AdminScreenShell>
    );
  }

  return (
    <AdminScreenShell title={`${bailleur.prenom} ${bailleur.nom}`} subtitle={bailleur.email}>
      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <Text style={styles.line}>{bailleur.prenom} {bailleur.nom}</Text>
        <Text style={styles.line}>{bailleur.email}</Text>
        <Text style={styles.line}>Nombre de biens: {biens.length}</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Statut:</Text>
          <VerificationStatusBadge verified={isVerified} />
        </View>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>CNI recto</Text>
        {bailleur.cniRecto ? (
          <Image source={resolveImageSource(bailleur.cniRecto)} style={styles.cniImage} resizeMode="cover" />
        ) : (
          <Text style={styles.emptyText}>Aucune photo renseignee.</Text>
        )}
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>CNI verso</Text>
        {bailleur.cniVerso ? (
          <Image source={resolveImageSource(bailleur.cniVerso)} style={styles.cniImage} resizeMode="cover" />
        ) : (
          <Text style={styles.emptyText}>Aucune photo renseignee.</Text>
        )}
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Biens ({biens.length})</Text>
        {biens.length === 0 ? <Text style={styles.emptyText}>Aucun bien pour ce bailleur.</Text> : null}
        {biens.map((bien) => (
          <View key={bien.id} style={styles.bienRow}>
            {bien.images[0] ? (
              <Image source={resolveImageSource(bien.images[0].url)} style={styles.bienThumb} resizeMode="cover" />
            ) : (
              <View style={styles.bienThumbPlaceholder} />
            )}
            <View style={styles.bienInfo}>
              <Text style={styles.line}>{bien.titre}</Text>
              <Text style={styles.statusLine}>Statut du bien: {bien.validationStatut === 'verifie' ? 'Verifie' : 'En attente'}</Text>
            </View>
            <KleaButton
              title="Voir"
              variant="secondary"
              onPress={() => router.push(`/administrateur/bien/${bien.id}` as any)}
            />
          </View>
        ))}
      </KleaCard>

      <KleaCard style={styles.card}>
        {!isVerified ? <KleaButton title="Valider" onPress={() => setBailleurStatut(bailleur.id, 'verifie')} style={styles.actionButton} /> : null}
        {!isVerified && !deleteBlockReason ? (
          <KleaButton title="Supprimer ce bailleur" variant="ghost" onPress={handleDelete} style={styles.actionButton} />
        ) : null}
        {!isVerified && deleteBlockReason ? (
          <View style={styles.warningRow}>
            <Ionicons name="alert-circle-outline" size={18} color={KleaColors.error} />
            <Text style={styles.warningText}>{deleteBlockReason}</Text>
          </View>
        ) : null}
      </KleaCard>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 4,
  },
  sectionTitle: {
    color: KleaColors.secondary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusLabel: {
    color: KleaColors.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  cniImage: {
    width: '100%',
    height: 180,
    borderRadius: KleaRadius.md,
  },
  bienRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  bienThumb: {
    width: 56,
    height: 56,
    borderRadius: KleaRadius.md,
  },
  bienThumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: KleaRadius.md,
    backgroundColor: '#EFE9DE',
  },
  bienInfo: {
    flex: 1,
    gap: 2,
  },
  actionButton: {
    marginTop: 8,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
  },
  warningText: {
    flex: 1,
    color: KleaColors.error,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
});
