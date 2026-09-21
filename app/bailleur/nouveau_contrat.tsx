import { Picker } from '@react-native-picker/picker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { KleaColors, KleaRadius } from '@/constants/theme';
import {
  createBailleurContrat,
  getBailleurContratById,
  getBailleurConversations,
  getMyBiens,
  updateBailleurContrat,
  type BailleurBien,
  type BailleurConversation,
} from '@/utils/bailleur-api';

export default function NouveauContratScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string; contratId?: string }>();
  const requestedConversationId = typeof params.conversationId === 'string' ? params.conversationId : '';
  const requestedContratId = typeof params.contratId === 'string' ? params.contratId : '';
  const [biens, setBiens] = useState<BailleurBien[]>([]);
  const [conversations, setConversations] = useState<BailleurConversation[]>([]);
  const [bienId, setBienId] = useState('');
  const [montant, setMontant] = useState('');
  const [dureeMois, setDureeMois] = useState('12');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [myBiens, allConversations] = await Promise.all([getMyBiens(), getBailleurConversations()]);
        const locataireConversations = allConversations.filter((item) => item.participantRole === 'locataire');
        setBiens(myBiens);
        setConversations(locataireConversations);
        const requestedConversation = locataireConversations.find((item) => item.id === requestedConversationId);
        setBienId(requestedConversation?.bienId ?? myBiens[0]?.id ?? '');
      } finally {
        setLoading(false);
      }
    })();
  }, [requestedConversationId]);

  useEffect(() => {
    if (!requestedContratId) return;

    let cancelled = false;

    getBailleurContratById(requestedContratId)
      .then((contract) => {
        if (!contract || cancelled) return;
        setMontant(String(contract.montant));
        setDureeMois(String(contract.dureeMois));
      })
      .catch(() => {
        if (!cancelled) {
          Alert.alert('Erreur', 'Impossible de charger le contrat a editer.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestedContratId]);

  const selectedBien = useMemo(() => biens.find((item) => item.id === bienId), [biens, bienId]);
  const selectedConversation = useMemo(
    () => requestedConversationId
      ? conversations.find((item) => item.id === requestedConversationId) ?? conversations.find((item) => item.bienId === bienId)
      : conversations.find((item) => item.bienId === bienId),
    [conversations, bienId, requestedConversationId],
  );

  const onSubmit = async () => {
    if (!selectedBien) {
      Alert.alert('Bien manquant', 'Selectionnez un bien.');
      return;
    }

    if (!selectedConversation?.id) {
      Alert.alert('Conversation requise', 'Aucune conversation locataire active pour ce bien.');
      return;
    }

    if (selectedConversation.participantRole !== 'locataire') {
      Alert.alert('Action non autorisee', 'Vous ne pouvez creer ou modifier un contrat que pour un locataire.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        typeContrat: 'determine' as const,
        montant: Number(montant.replace(/\D/g, '')) || selectedBien.montant,
        dureeMois: Number(dureeMois.replace(/\D/g, '')) || 12,
      };

      if (requestedContratId) {
        await updateBailleurContrat({
          contratId: requestedContratId,
          ...payload,
        });
        Alert.alert('Contrat modifie', 'Le contrat a ete mis a jour avant signature.');
      } else {
        await createBailleurContrat({
          conversationId: selectedConversation.id,
          ...payload,
        });
        Alert.alert('Contrat cree', 'Le contrat a ete cree via l\'API.');
      }

      setMontant('');
      setDureeMois('12');
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : requestedContratId ? 'Impossible de modifier le contrat.' : 'Impossible de creer le contrat.';
      Alert.alert('Erreur', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BailleurScreenShell title={requestedContratId ? 'Editer le contrat' : 'Nouveau contrat'} subtitle={requestedContratId ? 'Modifier le contrat avant signature du locataire' : 'Creer un contrat depuis vos donnees API'}>
      <KleaCard>
        <Text style={styles.label}>Bien concerne</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={bienId} onValueChange={(value) => setBienId(String(value))} style={styles.picker}>
            {biens.map((item) => (
              <Picker.Item key={item.id} label={item.titre} value={item.id} />
            ))}
          </Picker>
        </View>

        <KleaInput
          label="Montant"
          keyboardType="numeric"
          value={montant}
          onChangeText={(value) => setMontant(value.replace(/\D/g, ''))}
        />
        <KleaInput
          label="Duree du contrat (mois)"
          keyboardType="numeric"
          value={dureeMois}
          onChangeText={(value) => setDureeMois(value.replace(/\D/g, ''))}
        />

        <KleaButton
          title={loading ? 'Chargement...' : submitting ? (requestedContratId ? 'Mise a jour...' : 'Creation...') : (requestedContratId ? 'Enregistrer les modifications' : 'Creer le contrat')}
          onPress={onSubmit}
          icon="create-outline"
          iconPosition="right"
          disabled={loading || submitting}
        />
      </KleaCard>
    </BailleurScreenShell>
  );
}

const styles = StyleSheet.create({
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
});
