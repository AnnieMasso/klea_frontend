import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { LocataireScreenShell } from '@/components/ui/locataire-screen-shell';
import { KleaColors, KleaRadius } from '@/constants/theme';
import {
  createLocataireDepart,
  getLocataireContrats,
  getLocataireDeparts,
  type LocataireContrat,
  type LocataireDepart,
} from '@/utils/locataire-api';
import { ensureLocataireVerifie } from '@/hooks/use-locataire-guard';

export default function LocataireDepartScreen() {
  const params = useLocalSearchParams<{ contratId?: string }>();
  const requestedContratId = typeof params.contratId === 'string' ? params.contratId : '';
  const [loading, setLoading] = useState(true);
  const [selectedBienId, setSelectedBienId] = useState('');
  const [datePrevue, setDatePrevue] = useState('');
  const [contratsSignes, setContratsSignes] = useState<LocataireContrat[]>([]);
  const [departs, setDeparts] = useState<LocataireDepart[]>([]);

  const refresh = async () => {
    try {
      setLoading(true);
      const [contratsData, departsData] = await Promise.all([
        getLocataireContrats(),
        getLocataireDeparts(),
      ]);
      setContratsSignes(contratsData.filter((contract) => contract.etat === 'signe'));
      setDeparts(departsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!requestedContratId) return;

    const matchingContract = contratsSignes.find((contract) => contract.id === requestedContratId);
    if (matchingContract) {
      setSelectedBienId(matchingContract.bienId);
    }
  }, [requestedContratId, contratsSignes]);

  const biensAvecContratSigne = useMemo(() => {
    const map = new Map<string, { id: string; titre: string }>();
    contratsSignes.forEach((contract) => {
      map.set(contract.bienId, { id: contract.bienId, titre: contract.bienTitre });
    });
    return Array.from(map.values());
  }, [contratsSignes]);

  useEffect(() => {
    if (!selectedBienId && biensAvecContratSigne[0]) setSelectedBienId(biensAvecContratSigne[0].id);
  }, [biensAvecContratSigne, selectedBienId]);

  const bien = biensAvecContratSigne.find((item) => item.id === selectedBienId) ?? null;
  const selectedContract = contratsSignes.find((item) => item.bienId === selectedBienId) ?? null;
  const existingDepart = selectedContract ? departs.find((item) => item.contratId === selectedContract.id) ?? null : null;

  const handleSignaler = async () => {
    if (!bien) return;
    if (!(await ensureLocataireVerifie())) return;
    if (!datePrevue.trim()) {
      Alert.alert('Date requise', 'Veuillez indiquer la date de depart prevue (AAAA-MM-JJ).');
      return;
    }
    if (!selectedContract) return;
    await createLocataireDepart(selectedContract.id, datePrevue.trim());
    Alert.alert('Depart signale', 'Votre depart a ete signale au bailleur.');
    setDatePrevue('');
    await refresh();
  };

  return (
    <LocataireScreenShell title="Signaler mon depart" subtitle="">
      {loading ? (
        <KleaCard><Text style={styles.emptyText}>Chargement...</Text></KleaCard>
      ) : null}

      {!loading && biensAvecContratSigne.length === 0 ? (
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
