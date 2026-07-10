import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { LocataireScreenShell } from '@/components/ui/locataire-screen-shell';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { CURRENT_LOCATAIRE_ID, addPaiement, getAllPaiements, getContratsForLocataire, subscribeBiens } from '@/utils/biens-store';
import { ensureLocataireVerifie } from '@/hooks/use-locataire-guard';

const modesPaiement = ['Mobile Money', 'Orange Money'];

export default function LocatairePaiementsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contratId?: string }>();
  const [refreshTick, forceRefresh] = useState(0);
  const [selectedContratId, setSelectedContratId] = useState('');
  const [montant, setMontant] = useState('');
  const [modePaiement, setModePaiement] = useState(modesPaiement[0]);
  const [code, setCode] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeBiens(() => forceRefresh((value) => value + 1));
    return unsubscribe;
  }, []);

  const contratsSignes = useMemo(
    () => getContratsForLocataire(CURRENT_LOCATAIRE_ID).filter((contract) => contract.etat === 'signe'),
    [refreshTick],
  );

  useEffect(() => {
    if (selectedContratId) return;
    const preselected = typeof params.contratId === 'string' ? params.contratId : '';
    if (preselected && contratsSignes.some((contract) => contract.id === preselected)) {
      setSelectedContratId(preselected);
    } else if (contratsSignes[0]) {
      setSelectedContratId(contratsSignes[0].id);
    }
  }, [contratsSignes, params.contratId, selectedContratId]);

  const contratSelectionne = contratsSignes.find((contract) => contract.id === selectedContratId) ?? null;

  useEffect(() => {
    if (contratSelectionne) setMontant(String(contratSelectionne.montant));
  }, [contratSelectionne?.id]);

  const paiements = useMemo(
    () => getAllPaiements().filter((payment) => payment.contratId === contratSelectionne?.id),
    [contratSelectionne?.id, refreshTick],
  );

  const handlePayer = () => {
    if (!contratSelectionne) return;
    if (!ensureLocataireVerifie()) return;
    const parsedMontant = Number(montant.replace(/\D/g, ''));
    if (!parsedMontant) {
      Alert.alert('Montant invalide', 'Veuillez indiquer un montant valide.');
      return;
    }
    const ok = addPaiement(contratSelectionne.bienId, contratSelectionne.id, { montant: parsedMontant, modePaiement });
    if (ok) {
      Alert.alert('Paiement effectue', 'Votre paiement a ete enregistre avec succes.');
      setCode('');
    }
  };

  return (
    <LocataireScreenShell title="Mes paiements" subtitle="">
      {contratsSignes.length === 0 ? (
        <KleaCard>
          <Text style={styles.emptyText}>
            Aucun paiement possible pour le moment : vous devez d'abord signer le contrat proposé par le bailleur dans la messagerie.
          </Text>
        </KleaCard>
      ) : (
        <KleaCard style={styles.card}>
          <Text style={styles.title}>Effectuer un paiement</Text>

          <Text style={styles.label}>Contrat signe</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={selectedContratId} onValueChange={setSelectedContratId} style={styles.picker}>
              {contratsSignes.map((contract) => (
                <Picker.Item key={contract.id} label={contract.bienTitre} value={contract.id} />
              ))}
            </Picker>
          </View>

          <KleaInput
            label="Montant"
            keyboardType="numeric"
            value={montant}
            onChangeText={(value) => setMontant(value.replace(/\D/g, ''))}
          />

          <Text style={styles.label}>Mode de paiement</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={modePaiement} onValueChange={(value) => { setModePaiement(value); setCode(''); }} style={styles.picker}>
              {modesPaiement.map((mode) => (
                <Picker.Item key={mode} label={mode} value={mode} />
              ))}
            </Picker>
          </View>

          <KleaButton title="Payer" onPress={handlePayer} style={styles.actionButton} />
        </KleaCard>
      )}

      <Text style={styles.sectionTitle}>Historique des paiements</Text>
      {paiements.length === 0 ? (
        <KleaCard><Text style={styles.emptyText}>Aucun paiement enregistre pour ce contrat.</Text></KleaCard>
      ) : null}

      {paiements.map((payment) => (
        <KleaCard key={payment.id} style={styles.card}>
          <Text style={styles.line}>Montant: {payment.montant.toLocaleString('fr-FR')} FCFA</Text>
          <Text style={styles.line}>Date: {new Date(payment.datePaiement).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.line}>Mode: {payment.modePaiement}</Text>
          <KleaButton
            title="Voir le paiement"
            variant="secondary"
            onPress={() => router.push(`/locataire/facture/${payment.id}` as any)}
            style={styles.actionButton}
          />
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
    marginBottom: 10,
  },
  sectionTitle: {
    color: KleaColors.secondary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 4,
  },
  label: {
    color: KleaColors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  line: {
    color: KleaColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: KleaColors.border,
    borderRadius: KleaRadius.md,
    marginBottom: 14,
    overflow: 'hidden',
    backgroundColor: KleaColors.background,
  },
  picker: {
    color: KleaColors.primary,
    backgroundColor: KleaColors.background,
  },
  actionButton: {
    marginTop: 8,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
});
