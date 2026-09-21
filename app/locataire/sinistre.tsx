import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { LocataireScreenShell } from '@/components/ui/locataire-screen-shell';
import { KleaColors, KleaRadius } from '@/constants/theme';
import {
  createLocataireSinistre,
  getLocataireContrats,
  getLocataireSinistres,
  type LocataireContrat,
  type LocataireSinistre,
} from '@/utils/locataire-api';
import { resolveImageSource } from '@/utils/local-photos';
import { ensureLocataireVerifie } from '@/hooks/use-locataire-guard';

export default function LocataireSinistreScreen() {
  const [loading, setLoading] = useState(true);
  const [selectedContratId, setSelectedContratId] = useState('');
  const [description, setDescription] = useState('');
  const [photo1, setPhoto1] = useState('');
  const [photo2, setPhoto2] = useState('');
  const [contratsSignes, setContratsSignes] = useState<LocataireContrat[]>([]);
  const [sinistresDeclares, setSinistresDeclares] = useState<LocataireSinistre[]>([]);

  const refresh = async () => {
    try {
      setLoading(true);
      const [contratsData, sinistresData] = await Promise.all([
        getLocataireContrats(),
        getLocataireSinistres(),
      ]);
      setContratsSignes(contratsData.filter((contract) => contract.etat === 'signe'));
      setSinistresDeclares(sinistresData.sort((a, b) => Date.parse(b.dateSinistre) - Date.parse(a.dateSinistre)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!selectedContratId && contratsSignes[0]) setSelectedContratId(contratsSignes[0].id);
  }, [contratsSignes, selectedContratId]);

  const contratSelectionne = contratsSignes.find((contract) => contract.id === selectedContratId) ?? null;

  const pickPhoto = async (setter: (uri: string) => void) => {
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
    if (!contratSelectionne) return;
    if (!(await ensureLocataireVerifie())) return;
    if (!description.trim()) {
      Alert.alert( 'Veuillez decrire le sinistre.');
      return;
    }
    if (!photo1) {
      Alert.alert('Photo requise', 'Veuillez ajouter au moins une photo du sinistre.');
      return;
    }
    await createLocataireSinistre({
      contratId: contratSelectionne.id,
      dateSinistre: new Date().toISOString().slice(0, 10),
      description: description.trim(),
      photo1Uri: photo1,
      photo2Uri: photo2 || undefined,
    });

    Alert.alert('Sinistre déclaré', 'Votre déclaration a ete envoyée au bailleur.');
    setDescription('');
    setPhoto1('');
    setPhoto2('');
    await refresh();
  };

  return (
    <LocataireScreenShell title="Declarer un sinistre" subtitle="">
      {loading ? (
        <KleaCard><Text style={styles.emptyText}>Chargement...</Text></KleaCard>
      ) : null}

      {!loading && contratsSignes.length === 0 ? (
        <KleaCard><Text style={styles.emptyText}>Vous devez avoir signe un contrat pour declarer un sinistre.</Text></KleaCard>
      ) : (
        <KleaCard style={styles.card}>
          <Text style={styles.label}>Bien concerne</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={selectedContratId} onValueChange={setSelectedContratId} style={styles.picker}>
              {contratsSignes.map((contract) => (
                <Picker.Item key={contract.id} label={contract.bienTitre} value={contract.id} />
              ))}
            </Picker>
          </View>

          <KleaInput
            label="Description du sinistre"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Decrivez le probleme rencontré"
          />

          <Text style={styles.label}>Photo 1</Text>
          <Pressable style={styles.photoPicker} onPress={() => pickPhoto(setPhoto1)}>
            {photo1 ? <Image source={{ uri: photo1 }} style={styles.photoPreview} /> : (
              <>
                <Ionicons name="camera-outline" size={22} color={KleaColors.textMuted} />
                <Text style={styles.photoPickerText}>Ajouter une photo</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.label}>Photo 2</Text>
          <Pressable style={styles.photoPicker} onPress={() => pickPhoto(setPhoto2)}>
            {photo2 ? <Image source={{ uri: photo2 }} style={styles.photoPreview} /> : (
              <>
                <Ionicons name="camera-outline" size={22} color={KleaColors.textMuted} />
                <Text style={styles.photoPickerText}>Ajouter une photo</Text>
              </>
            )}
          </Pressable>

          <KleaButton title="Envoyer" onPress={handleSubmit} style={styles.actionButton} />
        </KleaCard>
      )}

      <Text style={styles.sectionTitle}>Mes sinistres declares</Text>
      {sinistresDeclares.length === 0 ? (
        <KleaCard><Text style={styles.emptyText}>Aucun sinistre declare pour le moment.</Text></KleaCard>
      ) : null}

      {sinistresDeclares.map((sinistre) => (
        <KleaCard key={sinistre.id} style={styles.card}>
          <Text style={styles.title}>{sinistre.bienTitre}</Text>
          <Text style={styles.line}>Date: {sinistre.dateSinistre}</Text>
          <Text style={styles.line}>{sinistre.description}</Text>
          <View style={styles.photoRow}>
            <Image source={resolveImageSource(sinistre.photoSinistre1)} style={styles.thumb} resizeMode="cover" />
            {sinistre.photoSinistre2 ? (
              <Image source={resolveImageSource(sinistre.photoSinistre2)} style={styles.thumb} resizeMode="cover" />
            ) : null}
          </View>
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
  photoPicker: {
    borderWidth: 1,
    borderColor: KleaColors.border,
    borderStyle: 'dashed',
    borderRadius: KleaRadius.md,
    minHeight: 110,
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
    height: 110,
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
