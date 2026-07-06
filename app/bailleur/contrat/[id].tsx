import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors } from '@/constants/theme';
import { getAllContrats, getContratSpecifiqueById, getContratStatutAffichage } from '@/utils/biens-store';

export default function ContratSpecifiqueScreen() {
  const params = useLocalSearchParams<{ id?: string; bienId?: string }>();
  const contratId = typeof params.id === 'string' ? params.id : '';
  const bienId = typeof params.bienId === 'string' ? params.bienId : undefined;
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const contrat = contratId ? getContratSpecifiqueById(contratId, bienId) : null;
  const contratBrut = contratId ? getAllContrats().find((item) => item.id === contratId && (!bienId || item.bienId === bienId)) : null;

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const toPdfHtml = () => {
    if (!contrat) return '<html><body><p>Contrat introuvable.</p></body></html>';
    const conditions =
      contrat.conditions.length === 0
        ? '<li>Aucune condition specifique.</li>'
        : contrat.conditions.map((condition) => `<li>${escapeHtml(condition)}</li>`).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: Helvetica, Arial, sans-serif; color: #1f2a37; padding: 24px; }
            h1 { font-size: 20px; margin: 0 0 16px; color: #0c3a2e; }
            h2 { font-size: 15px; margin: 18px 0 8px; color: #0c3a2e; }
            p { margin: 4px 0; font-size: 12px; line-height: 1.45; }
            ul { margin: 8px 0 0 18px; padding: 0; }
            li { margin-bottom: 6px; font-size: 12px; }
            .block { border: 1px solid #d4d8dd; border-radius: 8px; padding: 10px 12px; margin-top: 10px; }
            .muted { color: #5a6676; }
            @page { margin: 20px; }
          </style>
        </head>
        <body>
          <h1>Contrat de bail</h1>
          <p class="muted">Reference: ${escapeHtml(contrat.id)}</p>
          <div class="block">
            <h2>Informations du contrat</h2>
            <p><strong>Bien:</strong> ${escapeHtml(contrat.bienTitre)}</p>
            <p><strong>Type:</strong> ${escapeHtml(contrat.typeBien)}</p>
            <p><strong>Type de contrat:</strong> ${escapeHtml(contrat.typeContrat === 'indetermine' ? 'Contrat a duree indeterminee' : 'Contrat a duree determinee')}</p>
            <p><strong>Duree:</strong> ${escapeHtml(String(contrat.dureeMois))} mois</p>
            <p><strong>Lieu:</strong> ${escapeHtml(contrat.lieu)}</p>
            <p><strong>Date de signature:</strong> ${escapeHtml(contrat.dateSignature)}</p>
            <p><strong>Etat:</strong> ${escapeHtml(contrat.etat === 'en_attente' ? 'En attente' : contrat.etat === 'signe' ? 'Signe' : 'Annule')}</p>
          </div>
          <div class="block">
            <h2>Bailleur</h2>
            <p>${escapeHtml(contrat.bailleur.nom)}</p>
            <p>${escapeHtml(contrat.bailleur.telephone)}</p>
            <p>${escapeHtml(contrat.bailleur.email)}</p>
          </div>
          <div class="block">
            <h2>Locataire</h2>
            <p>${escapeHtml(contrat.locataire.nom)}</p>
            <p>${escapeHtml(contrat.locataire.telephone)}</p>
            <p>${escapeHtml(contrat.locataire.email)}</p>
          </div>
          <div class="block">
            <h2>Conditions</h2>
            <ul>${conditions}</ul>
          </div>
        </body>
      </html>
    `;
  };

  const handleGeneratePdf = async () => {
    if (!contrat || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    try {
      const html = toPdfHtml();
      const result = await Print.printToFileAsync({ html });
      const sharingAvailable = await Sharing.isAvailableAsync();

      if (sharingAvailable && Platform.OS !== 'web') {
        await Sharing.shareAsync(result.uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Contrat de bail (PDF)',
        });
      } else {
        await Print.printAsync({ html });
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de generer le PDF pour le moment.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!contrat) {
    return (
      <BailleurScreenShell title="Contrat de bail" subtitle="Introuvable">
        <KleaCard>
          <Text style={styles.emptyText}>Le contrat demande est introuvable.</Text>
        </KleaCard>
      </BailleurScreenShell>
    );
  }

  return (
    <BailleurScreenShell title="Contrat de bail" subtitle={contrat.bienTitre}>
      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Informations du contrat</Text>
        <Text style={styles.line}>Type de bien: {contrat.typeBien}</Text>
        <Text style={styles.line}>Type de contrat: {contrat.typeContrat === 'indetermine' ? 'Contrat a duree indeterminee' : 'Contrat a duree determinee'}</Text>
        <Text style={styles.line}>Duree: {contrat.dureeMois} mois</Text>
        <Text style={styles.line}>Lieu: {contrat.lieu}</Text>
        <Text style={styles.line}>Date de signature: {contrat.dateSignature}</Text>
        <Text style={styles.line}>Etat: {contrat.etat === 'en_attente' ? 'En attente' : contrat.etat === 'signe' ? 'Signe' : 'Annule'}</Text>
        <Text style={styles.statusLine}>Statut: {contratBrut ? getContratStatutAffichage(contratBrut) : 'en cours'}</Text>
        <KleaButton
          title={isGeneratingPdf ? 'Generation du PDF...' : 'Generer le PDF du contrat'}
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
