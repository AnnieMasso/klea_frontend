import * as Print from 'expo-print';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

import type { ContratSpecifique } from '@/utils/biens-store';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toPdfHtml(contrat: ContratSpecifique) {
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
        <div class="block">
          <h2>Informations du contrat</h2>
          <p><strong>Bien:</strong> ${escapeHtml(contrat.bienTitre)}</p>
          <p><strong>Type:</strong> ${escapeHtml(contrat.typeBien)}</p>
          <p><strong>Type de contrat:</strong> ${escapeHtml(contrat.typeContrat === 'indetermine' ? 'Contrat a duree indeterminee' : 'Contrat a duree determinee')}</p>
          <p><strong>Duree:</strong> ${escapeHtml(String(contrat.dureeMois))} mois</p>
          <p><strong>Montant du loyer:</strong> ${contrat.montant.toLocaleString('fr-FR')} FCFA</p>
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
}

export async function downloadContrat(contrat: ContratSpecifique) {
  const html = toPdfHtml(contrat);

  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
    return;
  }

  const result = await Print.printToFileAsync({ html });
  const sharingAvailable = await Sharing.isAvailableAsync();

  if (sharingAvailable) {
    await Sharing.shareAsync(result.uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'Contrat de bail (PDF)',
    });
  } else {
    await Print.printAsync({ html });
  }
}
