import { Picker } from '@react-native-picker/picker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { LocataireScreenShell } from '@/components/ui/locataire-screen-shell';
import { KleaColors, KleaRadius } from '@/constants/theme';
import {
  CURRENT_LOCATAIRE_ID,
  CURRENT_LOCATAIRE_NOM,
  createDepartSignale,
  getBienById,
  getContratsForLocataire,
  subscribeBiens,
  type BienDetail,
} from '@/utils/biens-store';
import { ensureLocataireVerifie } from '@/hooks/use-locataire-guard';

export default function LocataireDepartScreen() {
  const [refreshTick, forceRefresh] = useState(0);
  const [selectedBienId, setSelectedBienId] = useState('');
  const [datePrevue, setDatePrevue] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeBiens(() => forceRefresh((value) => value + 1));
    return unsubscribe;
  }, []);

  const contratsSignes = useMemo(
    () => getContratsForLocataire(CURRENT_LOCATAIRE_ID).filter((contract) => contract.etat === 'signe'),
    [refreshTick],
  );

  const biensAvecContratSigne = useMemo(() => {
    const uniqueBienIds = Array.from(new Set(contratsSignes.map((contract) => contract.bienId)));
    return uniqueBienIds
      .map((id) => getBienById(id))
      .filter((bien): bien is BienDetail => Boolean(bien));
  }, [contratsSignes, refreshTick]);

  useEffect(() => {
    if (!selectedBienId && biensAvecContratSigne[0]) setSelectedBienId(biensAvecContratSigne[0].id);
  }, [biensAvecContratSigne, selectedBienId]);

  const bien = biensAvecContratSigne.find((item) => item.id === selectedBienId) ?? null;
  const existingDepart = bien?.departsPreavis.find((depart) => depart.locataire === CURRENT_LOCATAIRE_NOM) ?? null;

  const handleSignaler = () => {
    if (!bien) return;
    if (!ensureLocataireVerifie()) return;
    if (!datePrevue.trim()) {
      Alert.alert('Date requise', 'Veuillez indiquer la date de depart prevue (AAAA-MM-JJ).');
      return;
    }
    const ok = createDepartSignale(bien.id, CURRENT_LOCATAIRE_NOM, datePrevue.trim());
    if (ok) {
      Alert.alert('Depart signale', 'Votre depart a ete signale au bailleur.');
      setDatePrevue('');
    }
  };

  return (
    <LocataireScreenShell title="Signaler mon depart" subtitle="">
      {biensAvecContratSigne.length === 0 ? (
        <KleaCard><Text style={styles.emptyText}>Vous devez avoir signe un contrat pour signaler un depart.</Text></KleaCard>
      ) : (
        <KleaCard style={styles.card}>
          <Text style={styles.label}>Bien concerne</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={selectedBienId} onValueChange={setSelectedBienId} style={styles.picker}>
              {biensAvecContratSigne.map((item) => (
                <Picker.Item key={item.id} label={item.titre} value={item.id} />
              ))}
            </Picker>
          </View>

          {existingDepart ? (
            <View>
              <Text style={styles.title}>Depart deja signale</Text>
              <Text style={styles.line}>Date de signalement: {existingDepart.dateSignalement}</Text>
              <Text style={styles.line}>Date de depart prevue: {existingDepart.datePrevue}</Text>
              <Text style={styles.statusLine}>Statut: {existingDepart.statut === 'signale' ? 'En attente de confirmation' : 'Confirme'}</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.line}>Indiquez la date a laquelle vous prevoyez de quitter le logement.</Text>
              <KleaInput label="Date de depart prevue" value={datePrevue} onChangeText={setDatePrevue} placeholder="AAAA-MM-JJ" />
              <KleaButton title="Signaler le depart" onPress={handleSignaler} style={styles.actionButton} />
            </View>
          )}
        </KleaCard>
      )}
    </LocataireScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 4,
  },
  label: {
    color: KleaColors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
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
