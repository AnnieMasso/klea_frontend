import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { LocataireScreenShell } from '@/components/ui/locataire-screen-shell';
import { KleaColors } from '@/constants/theme';
import { ensureLocataireVerifie } from '@/hooks/use-locataire-guard';
import {
  getLocataireContratForPdf,
  getLocataireContrats,
  signLocataireContrat,
  type LocataireContrat,
} from '@/utils/locataire-api';
import { downloadContrat } from '@/utils/contrat-pdf';

function etatLabel(etat: LocataireContrat['etat']) {
  if (etat === 'signe') return 'Signe';
  if (etat === 'annule') return 'Annule';
  if (etat === 'resilie') return 'Resilie';
  return 'En attente de signature';
}

export default function LocataireContratScreen() {
  const params = useLocalSearchParams<{ contratId?: string }>();
  const requestedContratId = typeof params.contratId === 'string' ? params.contratId : '';
  const [contrats, setContrats] = useState<LocataireContrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    return getLocataireContrats()
      .then((items) => setContrats(items))
      .catch((error) => Alert.alert('Erreur', error instanceof Error ? error.message : 'Chargement impossible.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const visibleContrats = useMemo(() => {
    if (!requestedContratId) return contrats;
    const selected = contrats.find((contrat) => contrat.id === requestedContratId);
    return selected ? [selected] : contrats;
  }, [contrats, requestedContratId]);

  const handleSigner = async (contratId: string) => {
    if (!(await ensureLocataireVerifie())) return;

    try {
      await signLocataireContrat(contratId);
      Alert.alert('Contrat signe', 'Vous avez signe le contrat avec succes.');
      await refresh();
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Signature impossible.');
    }
  };

  const handleDownload = async (contratId: string) => {
    setDownloadingId(contratId);
    try {
      const contrat = await getLocataireContratForPdf(contratId);
      await downloadContrat(contrat);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de telecharger le contrat.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <LocataireScreenShell title="Mon contrat" subtitle="">
      {loading ? (
        <KleaCard><Text style={styles.emptyText}>Chargement des contrats...</Text></KleaCard>
      ) : null}

      {!loading && visibleContrats.length === 0 ? (
        <KleaCard><Text style={styles.emptyText}>Vous n avez aucun contrat pour le moment.</Text></KleaCard>
      ) : null}

      {visibleContrats.map((contrat) => (
        <KleaCard key={contrat.id} style={styles.card}>
          <Text style={styles.title}>{contrat.bienTitre}</Text>
          <Text style={styles.line}>Montant: {contrat.montant.toLocaleString('fr-FR')} FCFA</Text>
          <Text style={styles.line}>Duree: {contrat.dureeMois} mois</Text>
          <Text style={styles.line}>Etat: {etatLabel(contrat.etat)}</Text>

          {contrat.etat === 'en_attente' ? (
            <>
              <KleaButton
                title={downloadingId === contrat.id ? 'Generation...' : 'Consulter le contrat'}
                variant="secondary"
                onPress={() => handleDownload(contrat.id)}
                disabled={downloadingId === contrat.id}
                style={styles.actionButton}
              />
              <KleaButton title="Signer le contrat" onPress={() => handleSigner(contrat.id)} style={styles.actionButton} />
            </>
          ) : null}

          {contrat.etat !== 'en_attente' ? (
            <KleaButton
              title={downloadingId === contrat.id ? 'Generation...' : 'Telecharger le contrat'}
              variant="secondary"
              onPress={() => handleDownload(contrat.id)}
              disabled={downloadingId === contrat.id}
              style={styles.actionButton}
            />
          ) : null}

          {contrat.etat === 'signe' ? (
            <KleaButton
              title="Signaler le départ"
              variant="ghost"
              onPress={() => router.push(`/locataire/depart?contratId=${contrat.id}` as any)}
              style={styles.actionButton}
            />
          ) : null}
        </KleaCard>
      ))}
    </LocataireScreenShell>
  );
}

const styles = StyleSheet.create({
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
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
});
