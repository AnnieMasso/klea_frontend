import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { ReauthGate } from '@/components/ui/reauth-gate';
import { KleaColors } from '@/constants/theme';
import { getAllContrats, getContratSpecifiqueById, getContratStatutAffichage } from '@/utils/biens-store';
import { downloadContrat } from '@/utils/contrat-pdf';

export default function ContratSpecifiqueScreen() {
  const params = useLocalSearchParams<{ id?: string; bienId?: string }>();
  const contratId = typeof params.id === 'string' ? params.id : '';
  const bienId = typeof params.bienId === 'string' ? params.bienId : undefined;
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const contrat = contratId ? getContratSpecifiqueById(contratId, bienId) : null;
  const contratBrut = contratId ? getAllContrats().find((item) => item.id === contratId && (!bienId || item.bienId === bienId)) : null;

  const handleGeneratePdf = async () => {
    if (!contrat || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    try {
      await downloadContrat(contrat);
    } catch {
      Alert.alert('Erreur', 'Impossible de télécharger le contrat.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!contrat) {
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
        <Text style={styles.line}>Type de bien: {contrat.typeBien}</Text>
        <Text style={styles.line}>Type de contrat: {contrat.typeContrat === 'indetermine' ? 'Contrat a duree indeterminee' : 'Contrat a duree determinee'}</Text>
        <Text style={styles.line}>Duree: {contrat.dureeMois} mois</Text>
        <Text style={styles.line}>Montant du loyer: {contrat.montant.toLocaleString('fr-FR')} FCFA</Text>
        <Text style={styles.line}>Lieu: {contrat.lieu}</Text>
        <Text style={styles.line}>Date de signature: {contrat.dateSignature}</Text>
        <Text style={styles.line}>Etat: {contrat.etat === 'en_attente' ? 'En attente' : contrat.etat === 'signe' ? 'Signe' : 'Annule'}</Text>
        <Text style={styles.statusLine}>Statut: {contratBrut ? getContratStatutAffichage(contratBrut) : 'en cours'}</Text>
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
        <Text style={styles.line}>{contrat.bailleur.nom}</Text>
        <Text style={styles.line}>{contrat.bailleur.telephone}</Text>
        <Text style={styles.line}>{contrat.bailleur.email}</Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Locataire</Text>
        <Text style={styles.line}>{contrat.locataire.nom}</Text>
        <Text style={styles.line}>{contrat.locataire.telephone}</Text>
        <Text style={styles.line}>{contrat.locataire.email}</Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Conditions</Text>
        {contrat.conditions.length === 0 ? <Text style={styles.emptyText}>Aucune condition.</Text> : null}
        {contrat.conditions.map((condition, index) => (
          <Text key={`${contrat.id}-cond-${index}`} style={styles.line}>• {condition}</Text>
        ))}
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
