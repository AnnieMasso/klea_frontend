import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { LocataireScreenShell } from '@/components/ui/locataire-screen-shell';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { ensureLocataireVerifie } from '@/hooks/use-locataire-guard';
import {
  createLocatairePaiement,
  getLocataireContrats,
  getLocatairePaiements,
  type LocataireContrat,
  type LocatairePaiement,
} from '@/utils/locataire-api';

const modesPaiement = ['Mobile Money', 'Orange Money'];

export default function LocatairePaiementsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contratId?: string }>();

  const [loading, setLoading] = useState(true);
  const [contratsSignes, setContratsSignes] = useState<LocataireContrat[]>([]);
  const [paiements, setPaiements] = useState<LocatairePaiement[]>([]);

  const [selectedContratId, setSelectedContratId] = useState('');
  const [montant, setMontant] = useState('');
  const [modePaiement, setModePaiement] = useState(modesPaiement[0]);

  const refresh = () => {
    setLoading(true);
    return Promise.all([getLocataireContrats(), getLocatairePaiements()])
      .then(([contrats, paiementsList]) => {
        setContratsSignes(contrats.filter((contract) => contract.etat === 'signe'));
        setPaiements(paiementsList);
      })
      .catch((error) => Alert.alert('Erreur', error instanceof Error ? error.message : 'Chargement impossible.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

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

  const paiementsContrat = useMemo(
    () => paiements.filter((payment) => payment.contratId === contratSelectionne?.id),
    [contratSelectionne?.id, paiements],
  );

  const handlePayer = async () => {
    if (!contratSelectionne) return;
    if (!(await ensureLocataireVerifie())) return;

    const parsedMontant = Number(montant.replace(/\D/g, ''));
    if (!parsedMontant) {
      Alert.alert('Montant invalide', 'Veuillez indiquer un montant valide.');
      return;
    }

    try {
      await createLocatairePaiement(contratSelectionne.id, parsedMontant, modePaiement);
      Alert.alert('Paiement effectue', 'Votre paiement a ete enregistre avec succes.');
      await refresh();
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Paiement impossible.');
    }
  };

  return (
    <LocataireScreenShell title="Mes paiements" subtitle="">
      {loading ? (
        <KleaCard>
          <Text style={styles.emptyText}>Chargement des paiements...</Text>
        </KleaCard>
      ) : null}

      {!loading && contratsSignes.length === 0 ? (
        <KleaCard>
          <Text style={styles.emptyText}>
            Aucun paiement possible pour le moment : vous devez d abord signer le contrat propose par le bailleur dans la messagerie.
          </Text>
        </KleaCard>
      ) : null}

      {!loading && contratsSignes.length > 0 ? (
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
            <Picker selectedValue={modePaiement} onValueChange={setModePaiement} style={styles.picker}>
              {modesPaiement.map((mode) => (
                <Picker.Item key={mode} label={mode} value={mode} />
              ))}
            </Picker>
          </View>

          <KleaButton title="Payer" onPress={handlePayer} style={styles.actionButton} />
        </KleaCard>
      ) : null}

      <Text style={styles.sectionTitle}>Historique des paiements</Text>
      {paiementsContrat.length === 0 ? (
        <KleaCard><Text style={styles.emptyText}>Aucun paiement enregistre pour ce contrat.</Text></KleaCard>
      ) : null}

      {paiementsContrat.map((payment) => (
        <KleaCard key={payment.id} style={styles.card}>
          <Text style={styles.line}>Bien: {payment.bienTitre}</Text>
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
