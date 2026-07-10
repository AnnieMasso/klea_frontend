import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { LocataireScreenShell } from '@/components/ui/locataire-screen-shell';
import { KleaColors } from '@/constants/theme';
import {
  CURRENT_LOCATAIRE_ID,
  CURRENT_LOCATAIRE_NOM,
  createDemandeAnnulation,
  getContratSpecifiqueById,
  getContratStatutAffichage,
  getContratsForLocataire,
  signContrat,
  subscribeBiens,
} from '@/utils/biens-store';
import { downloadContrat } from '@/utils/contrat-pdf';
import { ensureLocataireVerifie } from '@/hooks/use-locataire-guard';

export default function LocataireContratScreen() {
  const [refreshTick, forceRefresh] = useState(0);
  const [annulationTargetId, setAnnulationTargetId] = useState<string | null>(null);
  const [motif, setMotif] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeBiens(() => forceRefresh((value) => value + 1));
    return unsubscribe;
  }, []);

  const contrats = useMemo(() => getContratsForLocataire(CURRENT_LOCATAIRE_ID), [refreshTick]);

  const handleSigner = (bienId: string, contratId: string) => {
    if (!ensureLocataireVerifie()) return;
    const ok = signContrat(bienId, contratId);
    if (ok) Alert.alert('Contrat signe', 'Vous avez signe le contrat avec succes.');
  };

  const handleDemandeAnnulation = (bienId: string) => {
    if (!ensureLocataireVerifie()) return;
    if (!motif.trim()) {
      Alert.alert('Motif requis', 'Veuillez indiquer le motif de votre demande.');
      return;
    }
    const ok = createDemandeAnnulation(bienId, CURRENT_LOCATAIRE_NOM, motif.trim());
    if (ok) {
      Alert.alert('Demande envoyee', 'Votre demande d\'annulation a ete transmise au bailleur.');
      setAnnulationTargetId(null);
      setMotif('');
    }
  };

  const handleDownload = async (bienId: string, contratId: string) => {
    const contrat = getContratSpecifiqueById(contratId, bienId);
    if (!contrat) return;
    setDownloadingId(contratId);
    try {
      await downloadContrat(contrat);
    } catch {
      Alert.alert('Erreur', 'Impossible de telecharger le contrat.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <LocataireScreenShell title="Mon contrat" subtitle="">
      {contrats.length === 0 ? (
        <KleaCard><Text style={styles.emptyText}>Vous n'avez aucun contrat pour le moment.</Text></KleaCard>
      ) : null}

      {contrats.map((contrat) => (
        <KleaCard key={contrat.id} style={styles.card}>
          <Text style={styles.title}>{contrat.bienTitre}</Text>
          <Text style={styles.line}>Montant: {contrat.montant.toLocaleString('fr-FR')} FCFA</Text>
          <Text style={styles.line}>Duree: {contrat.dureeMois} mois</Text>
          <Text style={styles.line}>Etat: {contrat.etat === 'en_attente' ? 'En attente de signature' : contrat.etat === 'signe' ? 'Signe' : 'Annule'}</Text>
          <Text style={styles.statusLine}>Statut: {getContratStatutAffichage(contrat)}</Text>

          {contrat.etat === 'en_attente' ? (
            <KleaButton title="Signer le contrat" onPress={() => handleSigner(contrat.bienId, contrat.id)} style={styles.actionButton} />
          ) : null}

          {contrat.etat === 'signe' ? (
            <KleaButton
              title={downloadingId === contrat.id ? 'Generation…' : 'Telecharger le contrat'}
              variant="secondary"
              onPress={() => handleDownload(contrat.bienId, contrat.id)}
              disabled={downloadingId === contrat.id}
              style={styles.actionButton}
            />
          ) : null}

          {contrat.etat !== 'annule' ? (
            annulationTargetId === contrat.id ? (
              <>
                <KleaInput label="Motif de la demande" value={motif} onChangeText={setMotif} multiline numberOfLines={3} placeholder="Ex: mutation professionnelle" />
                <KleaButton title="Envoyer la demande" onPress={() => handleDemandeAnnulation(contrat.bienId)} style={styles.actionButton} />
                <KleaButton title="Annuler" variant="ghost" onPress={() => { setAnnulationTargetId(null); setMotif(''); }} style={styles.actionButton} />
              </>
            ) : (
              <KleaButton
                title="Demander l'annulation"
                variant="ghost"
                onPress={() => { setAnnulationTargetId(contrat.id); setMotif(''); }}
                style={styles.actionButton}
              />
            )
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
  statusLine: {
    color: KleaColors.secondary,
    fontSize: 13,
    fontWeight: '700',
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
