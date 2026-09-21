import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { ReauthGate } from '@/components/ui/reauth-gate';
import { KleaColors } from '@/constants/theme';
import { getAuthenticatedUser, getBailleurContratById, type BailleurContrat } from '@/utils/bailleur-api';
import { downloadContrat } from '@/utils/contrat-pdf';

export default function ContratSpecifiqueScreen() {
  const params = useLocalSearchParams<{ id?: string; bienId?: string }>();
  const contratId = typeof params.id === 'string' ? params.id : '';
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [contrat, setContrat] = useState<BailleurContrat | null>(null);
  const [loading, setLoading] = useState(true);
  const [myDisplayName, setMyDisplayName] = useState('Bailleur');

  useEffect(() => {
    if (!contratId) return;
    (async () => {
      try {
        setLoading(true);
        setContrat(await getBailleurContratById(contratId));
      } finally {
        setLoading(false);
      }
    })();
  }, [contratId]);

  useEffect(() => {
    let cancelled = false;

    getAuthenticatedUser()
      .then((user) => {
        if (cancelled) return;
        const fullName = [user.prenom ?? '', user.nom ?? ''].map((part) => part.trim()).filter(Boolean).join(' ');
        setMyDisplayName(fullName || user.email || 'Bailleur');
      })
      .catch(() => {
        if (!cancelled) setMyDisplayName('Bailleur');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleGeneratePdf = async () => {
    if (!contrat || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    try {
      await downloadContrat({
        id: contrat.id,
        bienTitre: contrat.bienTitre,
        typeBien: 'Bien immobilier',
        typeContrat: 'determine',
        etat: contrat.etat === 'resilie' ? 'annule' : contrat.etat,
        dateSignature: contrat.dateDebut,
        dureeMois: contrat.dureeMois,
        montant: contrat.montant,
        lieu: '-',
        conditions: [],
        bailleur: { nom: myDisplayName, telephone: '-', email: '-' },
        locataire: { nom: contrat.locataire, telephone: '-', email: '-' },
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de télécharger le contrat.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!contrat && !loading) {
    return (
      <ReauthGate reason="consulter ce contrat">
        <BailleurScreenShell title="Contrat de bail" subtitle="Introuvable">
          <KleaCard>
            <Text style={styles.emptyText}>Le contrat demandé est introuvable.</Text>
          </KleaCard>
        </BailleurScreenShell>
      </ReauthGate>
    );
  }

  return (
    <ReauthGate reason="consulter ce contrat">
    <BailleurScreenShell title="Contrat de bail" subtitle={contrat.bienTitre}>
      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Informations du contrat</Text>
        <Text style={styles.line}>Type de bien: Bien immobilier</Text>
        <Text style={styles.line}>Type de contrat: Contrat a duree determinee</Text>
        <Text style={styles.line}>Duree: {contrat.dureeMois} mois</Text>
        <Text style={styles.line}>Montant du loyer: {contrat.montant.toLocaleString('fr-FR')} FCFA</Text>
        <Text style={styles.line}>Lieu: -</Text>
        <Text style={styles.line}>Date de signature: {contrat.dateDebut}</Text>
        <Text style={styles.line}>Etat: {contrat.etat === 'en_attente' ? 'En attente' : contrat.etat === 'signe' ? 'Signe' : 'Annule'}</Text>
        <Text style={styles.statusLine}>Statut: {contrat.etat}</Text>
        <KleaButton
          title={isGeneratingPdf ? 'Generation du PDF...' : 'Télécharger le contrat'}
          variant="secondary"
          onPress={handleGeneratePdf}
          disabled={isGeneratingPdf}
          style={styles.pdfButton}
        />
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Bailleur</Text>
        <Text style={styles.line}>Bailleur</Text>
        <Text style={styles.line}>-</Text>
        <Text style={styles.line}>-</Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Locataire</Text>
        <Text style={styles.line}>{contrat.locataire}</Text>
        <Text style={styles.line}>-</Text>
        <Text style={styles.line}>-</Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Conditions</Text>
        <Text style={styles.emptyText}>Aucune condition detaillee retournee par l'API.</Text>
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
  statusLine: {
    color: KleaColors.secondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  pdfButton: {
    marginTop: 12,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
});
