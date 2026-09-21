import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { ReauthGate } from '@/components/ui/reauth-gate';
import { KleaColors } from '@/constants/theme';
import { getBailleurPaiementById, type BailleurPaiement } from '@/utils/bailleur-api';
import { downloadFacture } from '@/utils/facture';

const BAILLEUR_NOM = 'Bailleur principal';

export default function PaiementDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const paiementId = typeof params.id === 'string' ? params.id : '';
  const [isDownloading, setIsDownloading] = useState(false);
  const [paiement, setPaiement] = useState<BailleurPaiement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paiementId) return;
    (async () => {
      try {
        setLoading(true);
        setPaiement(await getBailleurPaiementById(paiementId));
      } finally {
        setLoading(false);
      }
    })();
  }, [paiementId]);

  const handleDownload = async () => {
    if (!paiement || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadFacture(paiement);
    } catch {
      Alert.alert('Erreur', 'Impossible de génerer la facture pour le moment.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!paiement && !loading) {
    return (
      <ReauthGate reason="consulter cette facture">
        <BailleurScreenShell title="Detail du paiement" subtitle="Introuvable">
          <KleaCard>
            <Text style={styles.emptyText}>Le paiement demandé est introuvable.</Text>
          </KleaCard>
        </BailleurScreenShell>
      </ReauthGate>
    );
  }

  if (loading || !paiement) {
    return (
      <ReauthGate reason="consulter cette facture">
        <BailleurScreenShell title="Detail du paiement" subtitle="Chargement...">
          <KleaCard>
            <Text style={styles.emptyText}>Chargement du paiement...</Text>
          </KleaCard>
        </BailleurScreenShell>
      </ReauthGate>
    );
  }

  return (
    <ReauthGate reason="consulter cette facture">
      <BailleurScreenShell title="Détail du paiement" subtitle={paiement.bienTitre}>
        <KleaCard style={styles.card}>
          <Text style={styles.sectionTitle}>Details du paiement</Text>
          <Text style={styles.line}>Locataire: {paiement.locataire}</Text>
          <Text style={styles.line}>Bailleur: {paiement.bailleur ?? BAILLEUR_NOM}</Text>
          <Text style={styles.line}>Bien concerne: {paiement.bienTitre}</Text>
          <Text style={styles.line}>Montant paye: {paiement.montant.toLocaleString('fr-FR')} FCFA</Text>
          <Text style={styles.line}>Mode de paiement: {paiement.modePaiement}</Text>
          <Text style={styles.line}>Nombre de mois payes: {paiement.dureeMois}</Text>
          <Text style={styles.line}>Date de paiement: {new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}</Text>

          <KleaButton
            title="Voir le contrat concerné"
            variant="secondary"
            onPress={() => router.push(`/bailleur/contrats?bienId=${paiement.bienId}` as any)}
            style={styles.actionButton}
          />
          <KleaButton
            title={isDownloading ? 'Generation…' : 'Télécharger la facture'}
            onPress={handleDownload}
            disabled={isDownloading}
            style={styles.actionButton}
          />
        </KleaCard>
      </BailleurScreenShell>
    </ReauthGate>
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
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
  actionButton: {
    marginTop: 12,
  },
});
