import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaImageCarousel } from '@/components/ui/klea-image-carousel';
import { KleaMapView } from '@/components/ui/klea-map-view';
import { KleaColors } from '@/constants/theme';
import { getBienMapRegion, openBienDirections, parseBienCoordinates } from '@/utils/bien-location';
import {
    addBienImage,
    createAdminConversationForBien,
    getBienById,
    removeBien,
    removeBienImage,
    setBienValidationStatut,
    subscribeBiens,
    updateBienImage,
    type BienDetail,
} from '@/utils/biens-store';

export default function AdminBienDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const bienId = typeof params.id === 'string' ? params.id : '';

  const [bien, setBien] = useState<BienDetail | null>(() => (bienId ? getBienById(bienId) : null));
  const [previewImage, setPreviewImage] = useState<ImageSourcePropType | null>(null);

  useEffect(() => {
    if (!bienId) return;
    setBien(getBienById(bienId));
    const unsubscribe = subscribeBiens(() => setBien(getBienById(bienId)));
    return unsubscribe;
  }, [bienId]);

  const coordinates = parseBienCoordinates(bien?.localisation);
  const mapRegion = getBienMapRegion(coordinates);
  const canEditBien = bien?.occupationStatut !== 'en_location';

  const pickPhoto = async (): Promise<string | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Veuillez autoriser l'acces a vos photos.");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return result.assets[0].uri;
  };

  const handleAddImage = async () => {
    if (!bien || !canEditBien) return;
    const uri = await pickPhoto();
    if (uri) addBienImage(bien.id, uri);
  };

  const handleReplaceImage = async (imageId: string) => {
    if (!bien || !canEditBien) return;
    const uri = await pickPhoto();
    if (uri) updateBienImage(bien.id, imageId, uri);
  };

  const handleRemoveImage = (imageId: string) => {
    if (!bien || !canEditBien) return;
    removeBienImage(bien.id, imageId);
  };

  const handleOpenDirections = async () => {
    if (!coordinates || !bien) return;
    await openBienDirections(coordinates, bien.titre);
  };

  const handleDelete = () => {
    if (!bien) return;

    Alert.alert('Supprimer ce bien ?', 'Cette action est irreversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          const result = removeBien(bien.id);
          if (!result.ok) {
            Alert.alert('Impossible', result.message);
            return;
          }
          router.back();
        },
      },
    ]);
  };

  const handleValidate = () => {
    if (!bien) return;

    Alert.alert('Valider ce bien ?', 'Cette action est irreversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Valider',
        onPress: () => setBienValidationStatut(bien.id, 'verifie'),
      },
    ]);
  };

  const handleOpenConversation = () => {
    if (!bien?.locataireActuel) return;

    const conversationId = createAdminConversationForBien(
      bien.id,
      bien.locataireActuel.id,
      bien.locataireActuel.nomComplet,
      `Bonjour ${bien.locataireActuel.nomComplet}, je vous contacte au sujet du bien "${bien.titre}".`,
    );

    if (!conversationId) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la conversation pour ce bien.');
      return;
    }

    router.push(`/administrateur/conversation?conversationId=${conversationId}` as any);
  };

  if (!bien) {
    return (
      <AdminScreenShell title="Detail du bien" subtitle="Introuvable">
        <KleaCard>
          <Text style={styles.emptyText}>Le bien demande est introuvable.</Text>
        </KleaCard>
      </AdminScreenShell>
    );
  }

  return (
    <AdminScreenShell title={bien.titre} subtitle={bien.type}>
      <Modal visible={Boolean(previewImage)} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalCloseZone} onPress={() => setPreviewImage(null)}>
            <Text style={styles.modalCloseText}>Fermer</Text>
          </Pressable>
          {previewImage ? <Image source={previewImage} style={styles.modalImage} resizeMode="contain" /> : null}
        </View>
      </Modal>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Photos du bien</Text>
        <KleaImageCarousel images={bien.images} />

      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.line}>{bien.description}</Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <Text style={styles.statusLine}>Validation: {bien.validationStatut === 'verifie' ? 'Verifie' : 'En attente'}</Text>
        <Text style={styles.statusLine}>Occupation: {bien.locataireActuel ? 'Occupe' : 'Libre'}</Text>
        <Text style={styles.line}>Locataire actuel: {bien.locataireActuel?.nomComplet ?? '-'}</Text>
        <Text style={styles.line}>Montant: {bien.montant.toLocaleString('fr-FR')} FCFA / {bien.modalitePaiement.toLowerCase()}</Text>
        <Text style={styles.line}>Surface: {bien.surface} m2</Text>
        <Text style={styles.line}>Chambres: {bien.nbChambres}</Text>
        <Text style={styles.line}>Salles de bain: {bien.nbSalles}</Text>
        <Text style={styles.line}>Adresse: {bien.adresse}</Text>
        <Text style={styles.line}>Ville: {bien.ville ?? '-'}</Text>
        <Text style={styles.line}>Pays: {bien.pays ?? bien.quartier ?? '-'}</Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Localisation</Text>
        {mapRegion && coordinates ? (
          <>
            <KleaMapView
              style={styles.map}
              region={mapRegion}
              onRegionChangeComplete={() => {}}
              onPress={() => {}}
              selectedCoordinates={coordinates}
            />
            <Text style={styles.locationHint}>Consultez l'emplacement exact du bien et ouvrez un itineraire si vous voulez vous y rendre.</Text>
            <KleaButton title="Suivre l'itineraire" onPress={handleOpenDirections} style={styles.directionButton} />
          </>
        ) : (
          <Text style={styles.emptyText}>La localisation de ce bien n'est pas encore disponible.</Text>
        )}
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Usages</Text>
        {bien.usages.length === 0 ? <Text style={styles.emptyText}>Aucun usage renseigne.</Text> : null}
        {bien.usages.map((usage) => (
          <Text key={usage.id} style={styles.line}>• {usage.nomUsage}</Text>
        ))}
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Locataire actuel</Text>
        {bien.locataireActuel ? (
          <>
            <Text style={styles.line}>{bien.locataireActuel.nomComplet}</Text>
            <Text style={styles.line}>{bien.locataireActuel.email}</Text>
            <Text style={styles.line}>{bien.locataireActuel.telephone}</Text>
            <KleaButton
              title="Voir le profil du locataire"
              variant="secondary"
              onPress={() => router.push(`/administrateur/locataire/${bien.locataireActuel?.id}` as any)}
              style={styles.actionButton}
            />
            <KleaButton title="Converser avec le locataire" onPress={handleOpenConversation} style={styles.actionButton} />
          </>
        ) : (
          <Text style={styles.emptyText}>Aucun locataire n'occupe actuellement ce bien.</Text>
        )}
      </KleaCard>

      <KleaCard style={styles.card}>
        {bien.validationStatut === 'en_attente' ? (
          <KleaButton title="Valider le bien" onPress={handleValidate} style={styles.actionButton} />
        ) : null}
        {bien.occupationStatut === 'en_location' ? (
          <Text style={styles.restrictedText}>Ce bien est occupe par un locataire et ne peut pas etre supprime.</Text>
        ) : (
          <KleaButton title="Supprimer ce bien" variant="ghost" onPress={handleDelete} style={styles.actionButton} />
        )}
      </KleaCard>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 4,
  },
  sectionTitle: {
    color: KleaColors.secondary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
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
    marginBottom: 6,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
  actionButton: {
    marginTop: 8,
  },
  photoManageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  photoManageThumb: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  photoManageActions: {
    flex: 1,
    gap: 8,
  },
  photoManageButton: {
    marginTop: 0,
  },
  map: {
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  locationHint: {
    color: KleaColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  directionButton: {
    marginTop: 2,
  },
  restrictedText: {
    color: KleaColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 50, 47, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCloseZone: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalImage: {
    width: '100%',
    height: '70%',
    borderRadius: 18,
  },
});
