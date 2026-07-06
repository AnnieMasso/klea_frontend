import * as Print from 'expo-print';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

import type { PaiementLigne } from '@/utils/biens-store';

const BAILLEUR_NOM = 'Bailleur principal';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toFactureHtml(payment: PaiementLigne) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Helvetica, Arial, sans-serif; color: #1f2a37; padding: 24px; }
          h1 { font-size: 20px; margin: 0 0 16px; color: #0c3a2e; }
          p { margin: 6px 0; font-size: 13px; line-height: 1.5; }
          .block { border: 1px solid #d4d8dd; border-radius: 8px; padding: 12px 14px; margin-top: 12px; }
          .muted { color: #5a6676; }
          @page { margin: 20px; }
        </style>
      </head>
      <body>
        <h1>Facture de paiement</h1>
        <p class="muted">Reference: ${escapeHtml(payment.id)}</p>
        <div class="block">
          <p><strong>Locataire:</strong> ${escapeHtml(payment.locataire)}</p>
          <p><strong>Bailleur:</strong> ${escapeHtml(BAILLEUR_NOM)}</p>
          <p><strong>Montant paye:</strong> ${payment.montant.toLocaleString('fr-FR')} FCFA</p>
          <p><strong>Date de paiement:</strong> ${escapeHtml(new Date(payment.datePaiement).toLocaleDateString('fr-FR'))}</p>
          <p><strong>Nombre de mois payes:</strong> ${escapeHtml(String(payment.dureeMois))}</p>
        </div>
      </body>
    </html>
  `;
}

export async function downloadFacture(payment: PaiementLigne) {
  const html = toFactureHtml(payment);

  if (Platform.OS === 'web') {
    // expo-print ignore le html fourni sur le web et imprime la page courante ;
    // on isole donc la facture dans une fenetre dediee avant de lancer l'impression/enregistrement en PDF.
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    return;
  }

  const result = await Print.printToFileAsync({ html });
  const sharingAvailable = await Sharing.isAvailableAsync();

  if (sharingAvailable) {
    await Sharing.shareAsync(result.uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'Telecharger la facture',
    });
  } else {
    await Print.printAsync({ html });
  }
}
