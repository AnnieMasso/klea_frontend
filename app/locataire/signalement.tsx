import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text } from 'react-native';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { LocataireScreenShell } from '@/components/ui/locataire-screen-shell';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { ensureLocataireVerifie } from '@/hooks/use-locataire-guard';
import { createLocataireSignalement, getLocataireSignalements, getLocataireVisibleBiens, type LocataireSignalement } from '@/utils/locataire-api';
import { resolveImageSource } from '@/utils/local-photos';

export default function LocataireSignalementScreen() {
  const [loading, setLoading] = useState(true);
  const [motif, setMotif] = useState('');
  const [preuve1, setPreuve1] = useState('');
  const [preuve2, setPreuve2] = useState('');
  const [signalementsEffectues, setSignalementsEffectues] = useState<LocataireSignalement[]>([]);
  const [defaultAccuseId, setDefaultAccuseId] = useState<string>('');

  const refresh = async () => {
    try {
      setLoading(true);
      const [signalements, conversations] = await Promise.all([
        getLocataireSignalements(),
        getLocataireVisibleBiens(),
      ]);
      setSignalementsEffectues(signalements.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)));
      const firstBien = conversations[0];
      if (firstBien?.bailleurId) {
        setDefaultAccuseId(firstBien.bailleurId);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const pickPreuve = async (setter: (uri: string) => void) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Veuillez autoriser l'acces a vos photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setter(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!(await ensureLocataireVerifie())) return;
    if (!motif.trim()) {
      Alert.alert('Motif requis', 'Veuillez decrire le motif de votre signalement.');
      return;
    }
    if (!defaultAccuseId) {
      Alert.alert('Accuse introuvable', 'Impossible de retrouver un bailleur lie a votre dossier.');
      return;
    }

    await createLocataireSignalement({
      accuseId: defaultAccuseId,
      motif: motif.trim(),
      preuve1Uri: preuve1 || undefined,
      preuve2Uri: preuve2 || undefined,
    });

    Alert.alert('Signalement envoye', 'Votre signalement a ete transmis.');
    setMotif('');
    setPreuve1('');
    setPreuve2('');
    await refresh();
  };

  return (
    <LocataireScreenShell title="Effectuer un signalement" subtitle="">
      <KleaCard style={styles.card}>
        <KleaInput
          label="Motif du signalement"
          value={motif}
          onChangeText={setMotif}
          multiline
          numberOfLines={4}
          placeholder="Decrivez le motif de votre signalement"
        />

        <Text style={styles.label}>Preuve 1 </Text>
        <Pressable style={styles.photoPicker} onPress={() => pickPreuve(setPreuve1)}>
          {preuve1 ? <Image source={{ uri: preuve1 }} style={styles.photoPreview} /> : (
            <>
              <Ionicons name="attach-outline" size={22} color={KleaColors.textMuted} />
              <Text style={styles.photoPickerText}>Ajouter une preuve</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.label}>Preuve 2</Text>
        <Pressable style={styles.photoPicker} onPress={() => pickPreuve(setPreuve2)}>
          {preuve2 ? <Image source={{ uri: preuve2 }} style={styles.photoPreview} /> : (
            <>
              <Ionicons name="attach-outline" size={22} color={KleaColors.textMuted} />
              <Text style={styles.photoPickerText}>Ajouter une preuve</Text>
            </>
          )}
        </Pressable>

        <KleaButton title="Envoyer" onPress={handleSubmit} style={styles.actionButton} />
      </KleaCard>

      <Text style={styles.sectionTitle}>Mes signalements effectues</Text>
      {loading ? (
        <KleaCard><Text style={styles.emptyText}>Chargement...</Text></KleaCard>
      ) : null}

      {!loading && signalementsEffectues.length === 0 ? (
        <KleaCard><Text style={styles.emptyText}>Aucun signalement effectue pour le moment.</Text></KleaCard>
      ) : null}

      {signalementsEffectues.map((signalement) => (
        <KleaCard key={signalement.id} style={styles.card}>
          <Text style={styles.line}>Date: {new Date(signalement.date).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.line}>{signalement.motif}</Text>
          {signalement.preuve1 || signalement.preuve2 ? (
            <Pressable style={styles.photoRow}>
              {signalement.preuve1 ? (
                <Image source={resolveImageSource(signalement.preuve1)} style={styles.thumb} resizeMode="cover" />
              ) : null}
              {signalement.preuve2 ? (
                <Image source={resolveImageSource(signalement.preuve2)} style={styles.thumb} resizeMode="cover" />
              ) : null}
            </Pressable>
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
  label: {
    color: KleaColors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  photoPicker: {
    borderWidth: 1,
    borderColor: KleaColors.border,
    borderStyle: 'dashed',
    borderRadius: KleaRadius.md,
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: '#F9F7F2',
  },
  photoPickerText: {
    color: KleaColors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  photoPreview: {
    width: '100%',
    height: 90,
    borderRadius: KleaRadius.md,
  },
  actionButton: {
    marginTop: 4,
  },
  sectionTitle: {
    color: KleaColors.secondary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 4,
  },
  line: {
    color: KleaColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  thumb: {
    flex: 1,
    height: 90,
    borderRadius: KleaRadius.md,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
});
