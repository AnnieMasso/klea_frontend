import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { VerificationStatusBadge } from '@/components/ui/verification-status-badge';
import { KleaColors, KleaRadius } from '@/constants/theme';
import {
    createAdminConversationForBien,
    deleteLocataireAccount,
    getAllLocataireAccounts,
    getBiens,
    getLocataireDeletionBlockReason,
    setLocataireBanni,
    setLocataireStatut,
    subscribeBiens,
} from '@/utils/biens-store';
import { resolveImageSource } from '@/utils/local-photos';

export default function AdminLocataireDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const locataireId = typeof params.id === 'string' ? params.id : '';
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeBiens(() => forceRefresh((value) => value + 1));
    return unsubscribe;
  }, []);

  const locataire = getAllLocataireAccounts().find((item) => item.id === locataireId) ?? null;
  const biensLoues = getBiens().filter((item) => item.locataireActuel?.id === locataireId);
  const deleteBlockReason = locataire ? getLocataireDeletionBlockReason(locataire.id) : 'Locataire introuvable.';
  const isVerified = locataire?.statut === 'verifie';

  const handleDelete = () => {
    Alert.alert(
      'Supprimer ce locataire ?',
      'Cette action est irreversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const result = deleteLocataireAccount(locataireId);
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

  if (!locataire) {
    return (
      <AdminScreenShell title="Locataire" subtitle="Introuvable">
        <KleaCard><Text style={styles.emptyText}>Ce locataire est introuvable.</Text></KleaCard>
      </AdminScreenShell>
    );
  }

  return (
    <AdminScreenShell title={`${locataire.prenom} ${locataire.nom}`} subtitle={locataire.email}>
      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <Text style={styles.line}>{locataire.prenom} {locataire.nom}</Text>
        <Text style={styles.line}>{locataire.email}</Text>
        <Text style={styles.line}>Biens loues: {biensLoues.length}</Text>
        <VerificationStatusBadge verified={isVerified} />
        {locataire.banni ? <Text style={styles.banniLine}>Compte banni</Text> : null}
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Biens actuellement loues ({biensLoues.length})</Text>
        {biensLoues.length === 0 ? <Text style={styles.emptyText}>Ce locataire n'occupe actuellement aucun bien.</Text> : null}
        {biensLoues.map((bien) => (
          <KleaCard key={bien.id} style={styles.rentedBienCard}>
            <Text style={styles.line}>{bien.titre}</Text>
            <Text style={styles.line}>{bien.type} - {bien.ville ?? '-'}</Text>
            <KleaButton
              title="Voir le bien"
              variant="secondary"
              onPress={() => router.push(`/administrateur/bien/${bien.id}` as any)}
              style={styles.actionButton}
            />
            <KleaButton
              title="Converser via ce bien"
              onPress={() => {
                const conversationId = createAdminConversationForBien(
                  bien.id,
                  locataire.id,
                  `${locataire.prenom} ${locataire.nom}`,
                  `Bonjour ${locataire.prenom}, je vous contacte au sujet du bien "${bien.titre}".`,
                );

                if (!conversationId) {
                  Alert.alert('Erreur', 'Impossible d\'ouvrir la conversation pour ce bien.');
                  return;
                }

                router.push(`/administrateur/conversation?conversationId=${conversationId}` as any);
              }}
              style={styles.actionButton}
            />
          </KleaCard>
        ))}
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>CNI recto</Text>
        {locataire.cniRecto ? (
          <Image source={resolveImageSource(locataire.cniRecto)} style={styles.cniImage} resizeMode="cover" />
        ) : (
          <Text style={styles.emptyText}>Aucune photo renseignee.</Text>
        )}
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>CNI verso</Text>
        {locataire.cniVerso ? (
          <Image source={resolveImageSource(locataire.cniVerso)} style={styles.cniImage} resizeMode="cover" />
        ) : (
          <Text style={styles.emptyText}>Aucune photo renseignee.</Text>
        )}
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Assurance habitation</Text>
        {locataire.assuranceHabitation ? (
          <Image source={resolveImageSource(locataire.assuranceHabitation)} style={styles.cniImage} resizeMode="cover" />
        ) : (
          <Text style={styles.emptyText}>Aucune assurance renseignee.</Text>
        )}
      </KleaCard>

      <KleaCard style={styles.card}>
        {!isVerified ? (
          <KleaButton title="Valider" onPress={() => setLocataireStatut(locataire.id, 'verifie')} style={styles.actionButton} />
        ) : null}
        {locataire.banni ? (
          <KleaButton title="Debannir" variant="secondary" onPress={() => setLocataireBanni(locataire.id, false)} style={styles.actionButton} />
        ) : (
          <KleaButton title="Bannir ce locataire" variant="ghost" onPress={() => setLocataireBanni(locataire.id, true)} style={styles.actionButton} />
        )}
        {!isVerified && !deleteBlockReason ? <KleaButton title="Supprimer ce locataire" variant="ghost" onPress={handleDelete} style={styles.actionButton} /> : null}
        {!isVerified && deleteBlockReason ? <Text style={styles.warningText}>{deleteBlockReason}</Text> : null}
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
  banniLine: {
    color: '#B23128',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  cniImage: {
    width: '100%',
    height: 180,
    borderRadius: KleaRadius.md,
  },
  actionButton: {
    marginTop: 8,
  },
  rentedBienCard: {
    marginTop: 8,
    marginBottom: 0,
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
