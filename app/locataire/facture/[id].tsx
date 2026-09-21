import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { LocataireScreenShell } from '@/components/ui/locataire-screen-shell';
import { KleaColors } from '@/constants/theme';
import { getLocatairePaiementById, type FacturePdfData } from '@/utils/locataire-api';
import { downloadFacture } from '@/utils/facture';

export default function LocatairePaiementDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const paiementId = typeof params.id === 'string' ? params.id : '';
  const [loading, setLoading] = useState(true);
  const [paiement, setPaiement] = useState<FacturePdfData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!paiementId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    getLocatairePaiementById(paiementId)
      .then((item) => {
        if (!mounted) return;
        setPaiement(item);
      })
      .catch((error) => {
        if (!mounted) return;
        Alert.alert('Erreur', error instanceof Error ? error.message : 'Chargement impossible.');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [paiementId]);

  const handleDownload = async () => {
    if (!paiement || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadFacture(paiement);
    } catch {
      Alert.alert('Erreur', 'Impossible de generer la facture pour le moment.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <LocataireScreenShell title="Detail du paiement" subtitle="Chargement...">
        <KleaCard>
          <Text style={styles.emptyText}>Chargement du paiement...</Text>
        </KleaCard>
      </LocataireScreenShell>
    );
  }

  if (!paiement) {
    return (
      <LocataireScreenShell title="Detail du paiement" subtitle="Introuvable">
        <KleaCard>
          <Text style={styles.emptyText}>Le paiement demande est introuvable.</Text>
        </KleaCard>
      </LocataireScreenShell>
    );
  }

  return (
    <LocataireScreenShell title="Detail du paiement" subtitle={paiement.bienTitre}>
      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Details du paiement</Text>
        <Text style={styles.line}>Locataire: {paiement.locataire}</Text>
        <Text style={styles.line}>Bailleur: {paiement.bailleur ?? 'Bailleur principal'}</Text>
        <Text style={styles.line}>Bien concerne: {paiement.bienTitre}</Text>
        <Text style={styles.line}>Montant paye: {paiement.montant.toLocaleString('fr-FR')} FCFA</Text>
        <Text style={styles.line}>Mode de paiement: {paiement.modePaiement}</Text>
        <Text style={styles.line}>Nombre de mois payes: {paiement.dureeMois}</Text>
        <Text style={styles.line}>Date de paiement: {new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}</Text>

        <KleaButton
          title="Voir le contrat concerne"
          variant="secondary"
          onPress={() => router.push('/locataire/contrat' as any)}
          style={styles.actionButton}
        />
        <KleaButton
          title={isDownloading ? 'Generation…' : 'Telecharger la facture'}
          onPress={handleDownload}
          disabled={isDownloading}
          style={styles.actionButton}
        />
      </KleaCard>
    </LocataireScreenShell>
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
