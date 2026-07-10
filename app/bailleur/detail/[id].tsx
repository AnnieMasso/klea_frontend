import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaImageCarousel } from '@/components/ui/klea-image-carousel';
import { ReauthGate } from '@/components/ui/reauth-gate';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { useReauthConfirm } from '@/hooks/use-reauth-confirm';
import {
    addBienImage,
    confirmDepart,
    getBienById,
    getContratStatutAffichage,
    removeBienImage,
    subscribeBiens,
    updateBienImage,
    type BienDetail,
} from '@/utils/biens-store';
import { resolveImageSource } from '@/utils/local-photos';

const sinistreAssets: Record<string, ImageSourcePropType> = {
  'maison.jpg': require('../../../assets/images/maison.jpg'),
  'icon.png': require('../../../assets/images/icon.png'),
  'favicon.png': require('../../../assets/images/favicon.png'),
};

function getSinistreAsset(photoKey?: string): ImageSourcePropType | null {
  if (!photoKey) return null;
  return sinistreAssets[photoKey] ?? null;
}

const MAX_BIEN_IMAGES = 3;

export default function BienDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const bienId = typeof params.id === 'string' ? params.id : '';

  const [bien, setBien] = useState<BienDetail | null>(() => (bienId ? getBienById(bienId) : null));
  const [previewImage, setPreviewImage] = useState<ImageSourcePropType | null>(null);
  const { requestReauth, reauthModal } = useReauthConfirm();

  useEffect(() => {
    if (!bienId) return;
    setBien(getBienById(bienId));
    const unsubscribe = subscribeBiens(() => setBien(getBienById(bienId)));
    return unsubscribe;
  }, [bienId]);

  const paymentTotal = useMemo(
    () => (bien?.paiements ?? []).reduce((sum, payment) => sum + payment.montant, 0),
    [bien],
  );

  if (!bien) {
    return (
      <ReauthGate reason="consulter ce bien">
        <BailleurScreenShell title="Detail bien" subtitle="Bien introuvable">
            <KleaButton title="Retour" variant="secondary" onPress={() => router.back()} />
        </BailleurScreenShell>
      </ReauthGate>
    );
  }

  const handleConfirmDepart = async (departId: string) => {
    const identityConfirmed = await requestReauth('confirmer ce depart');
    if (!identityConfirmed) return;

    const ok = confirmDepart(bien.id, departId);
    if (ok) Alert.alert('Depart confirme', 'Le depart preavis a ete confirme.');
  };

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
    if (bien.images.length >= MAX_BIEN_IMAGES) {
      Alert.alert('Limite atteinte', `Vous ne pouvez pas ajouter plus de ${MAX_BIEN_IMAGES} images pour ce bien.`);
      return;
    }

    const uri = await pickPhoto();
    if (!uri) return;

    const ok = addBienImage(bien.id, uri);
    if (!ok) {
      Alert.alert('Limite atteinte', `Vous ne pouvez pas ajouter plus de ${MAX_BIEN_IMAGES} images pour ce bien.`);
    }
  };

  const handleReplaceImage = async (imageId: string) => {
    const uri = await pickPhoto();
    if (uri) updateBienImage(bien.id, imageId, uri);
  };

  const handleRemoveImage = (imageId: string) => {
    removeBienImage(bien.id, imageId);
  };

  return (
    <ReauthGate reason="consulter les details de ce bien, ses locataires et ses paiements">
    <BailleurScreenShell title="Detail du bien" subtitle={bien.titre}>
          {reauthModal}

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
            {bien.images.length > 0 ? <KleaImageCarousel images={bien.images} /> : null}
            <Text style={styles.restrictedText}>Images: {bien.images.length}/{MAX_BIEN_IMAGES}</Text>
            {bien.images.length === 0 ? <Text style={styles.emptyText}>Aucune photo ajoutee.</Text> : null}
            {bien.images.map((image) => (
              <View key={image.id} style={styles.photoManageRow}>
                <Image source={resolveImageSource(image.url)} style={styles.photoManageThumb} resizeMode="cover" />
                <View style={styles.photoManageActions}>
                  <KleaButton title="Remplacer" variant="secondary" onPress={() => handleReplaceImage(image.id)} style={styles.photoManageButton} />
                  <KleaButton title="Supprimer" variant="ghost" onPress={() => handleRemoveImage(image.id)} style={styles.photoManageButton} />
                </View>
              </View>
            ))}
            <KleaButton
              title={bien.images.length >= MAX_BIEN_IMAGES ? 'Maximum 3 images atteint' : 'Ajouter une photo'}
              onPress={handleAddImage}
              style={styles.inlineActionButton}
              disabled={bien.images.length >= MAX_BIEN_IMAGES}
            />
          </KleaCard>

          <KleaCard style={styles.card}>
            <Text style={styles.sectionTitle}>Informations du bien</Text>
            <Text style={styles.line}>Type: {bien.type}</Text>
            <Text style={styles.line}>Montant: {bien.montant.toLocaleString('fr-FR')} FCFA</Text>
            <Text style={styles.line}>Adresse: {bien.adresse}</Text>
            <Text style={styles.line}>Ville: {bien.ville ?? '-'}</Text>
            <Text style={styles.line}>Pays: {bien.pays ?? bien.quartier ?? '-'}</Text>
          </KleaCard>

          <KleaCard style={styles.card}>
            <Text style={styles.sectionTitle}>Locataire actuel</Text>
            {bien.locataireActuel ? (
              <View>
                <Text style={styles.line}>{bien.locataireActuel.nomComplet}</Text>
                <Text style={styles.statusLine}>Statut: {bien.locataireActuel.statut}</Text>
                <Text style={styles.line}>{bien.locataireActuel.telephone}</Text>
                <Text style={styles.line}>{bien.locataireActuel.email}</Text>
                <KleaButton
                  title="Voir son assurance habitation"
                  variant="secondary"
                  onPress={() => router.push(`/bailleur/assurance/${bien.locataireActuel?.id}?bienId=${bien.id}` as any)}
                  style={styles.inlineActionButton}
                />
                <KleaButton
                  title="Voir la CNI"
                  variant="secondary"
                  onPress={() => router.push(`/bailleur/cni/${bien.locataireActuel?.id}?bienId=${bien.id}` as any)}
                  style={styles.inlineActionButton}
                />
              </View>
            ) : (
              <Text style={styles.emptyText}>Aucun locataire en cours.</Text>
            )}
          </KleaCard>

          <KleaCard style={styles.card}>
            <Text style={styles.sectionTitle}>Paiements effectues</Text>
            <KleaButton
              title="Voir tous les paiements lies a ce bien"
              variant="secondary"
              onPress={() => router.push(`/bailleur/paiements?bienId=${bien.id}&mode=bien` as any)}
              style={styles.paymentListButton}
            />
            <Text style={styles.totalText}>Total recu: {paymentTotal.toLocaleString('fr-FR')} FCFA</Text>
            {bien.paiements.length === 0 ? <Text style={styles.emptyText}>Aucun paiement enregistre.</Text> : null}
            {bien.paiements.map((payment) => (
              <View key={payment.id} style={styles.itemBox}>
                <Text style={styles.line}>{new Date(payment.datePaiement).toLocaleDateString('fr-FR')}</Text>
                <Text style={styles.line}>{payment.modePaiement}</Text>
                <Text style={styles.line}>{payment.montant.toLocaleString('fr-FR')} FCFA</Text>
              </View>
            ))}
          </KleaCard>

          <KleaCard style={styles.card}>
            <Text style={styles.sectionTitle}>Anciens locataires</Text>
            <KleaButton
              title="Voir tous les anciens locataires lies a ce bien"
              variant="secondary"
              onPress={() => router.push(`/bailleur/mes_locataires?bienId=${bien.id}&mode=bien` as any)}
              style={styles.sectionListButton}
            />
            {bien.anciensLocataires.length === 0 ? <Text style={styles.emptyText}>Aucun ancien locataire.</Text> : null}
            {bien.anciensLocataires.map((tenant) => (
              <View key={tenant.id} style={styles.itemBox}>
                <Text style={styles.line}>{tenant.nomComplet}</Text>
                <Text style={styles.statusLine}>Statut: {tenant.statut}</Text>
                <Text style={styles.line}>{tenant.telephone}</Text>
                <Text style={styles.restrictedText}>Acces assurance indisponible pour un locataire ancien.</Text>
              </View>
            ))}
          </KleaCard>

          <KleaCard style={styles.card}>
            <Text style={styles.sectionTitle}>Departs de preavis signales</Text>
            <KleaButton
              title="Voir tous les departs lies a ce bien"
              variant="secondary"
              onPress={() => router.push(`/bailleur/depart?bienId=${bien.id}&mode=bien` as any)}
              style={styles.sectionListButton}
            />
            {bien.departsPreavis.length === 0 ? <Text style={styles.emptyText}>Aucun depart signale.</Text> : null}
            {bien.departsPreavis.map((departure) => (
              <View key={departure.id} style={styles.itemBox}>
                <Text style={styles.line}>Locataire: {departure.locataire}</Text>
                <Text style={styles.line}>Date prevue: {departure.datePrevue}</Text>
                <Text style={styles.line}>Statut: {departure.statut}</Text>
                {departure.statut === 'signale' ? (
                  <KleaButton title="Confirmer depart" variant="secondary" onPress={() => handleConfirmDepart(departure.id)} />
                ) : null}
              </View>
            ))}
          </KleaCard>

          <KleaCard style={styles.card}>
            <Text style={styles.sectionTitle}>Sinistres lies au bien</Text>
            <KleaButton
              title="Voir tous les sinistres lies a ce bien"
              variant="secondary"
              onPress={() => router.push(`/bailleur/signalements?bienId=${bien.id}&mode=bien` as any)}
              style={styles.sectionListButton}
            />
            {bien.sinistres.length === 0 ? <Text style={styles.emptyText}>Aucun sinistre.</Text> : null}
            {bien.sinistres.map((incident) => (
              <View key={incident.id} style={styles.itemBox}>
                <Text style={styles.line}>ID sinistre: {incident.id}</Text>
                <Text style={styles.line}>Date du sinistre: {incident.dateSinistre}</Text>
                <Text style={styles.line}>{incident.description}</Text>
                <View style={styles.photoGrid}>
                  <Pressable
                    style={styles.photoFrame}
                    onPress={() => {
                      const source = getSinistreAsset(incident.photoSinistre1);
                      if (source) setPreviewImage(source);
                    }}
                  >
                    {getSinistreAsset(incident.photoSinistre1) ? (
                      <Image source={getSinistreAsset(incident.photoSinistre1)!} style={styles.photoThumb} resizeMode="cover" />
                    ) : (
                      <Text style={styles.photoFallback}>Photo 1 indisponible</Text>
                    )}
                    <Text style={styles.photoCaption}>Photo 1</Text>
                  </Pressable>
                  <Pressable
                    style={styles.photoFrame}
                    onPress={() => {
                      const source = getSinistreAsset(incident.photoSinistre2);
                      if (source) setPreviewImage(source);
                    }}
                  >
                    {getSinistreAsset(incident.photoSinistre2) ? (
                      <Image source={getSinistreAsset(incident.photoSinistre2)!} style={styles.photoThumb} resizeMode="cover" />
                    ) : (
                      <Text style={styles.photoFallback}>Photo 2 optionnelle</Text>
                    )}
                    <Text style={styles.photoCaption}>Photo 2</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </KleaCard>

          <KleaCard style={styles.card}>
            <Text style={styles.sectionTitle}>Demandes d'annulation de contrat</Text>
            <KleaButton
              title="Voir toutes les demandes d'annulation liees a ce bien"
              variant="secondary"
              onPress={() => router.push(`/bailleur/annulations?bienId=${bien.id}&mode=bien` as any)}
              style={styles.sectionListButton}
            />
            {bien.demandesAnnulation.length === 0 ? <Text style={styles.emptyText}>Aucune demande d'annulation.</Text> : null}
            {bien.demandesAnnulation.map((request) => (
              <View key={request.id} style={styles.itemBox}>
                <Text style={styles.line}>{request.locataire}</Text>
                <Text style={styles.line}>{request.date}</Text>
                <Text style={styles.line}>{request.motif}</Text>
                <Text style={styles.line}>Statut: {request.statut}</Text>
              </View>
            ))}
          </KleaCard>

          <KleaCard style={styles.card}>
            <Text style={styles.sectionTitle}>Contrats lies a ce bien</Text>
            <KleaButton
              title="Voir tous les contrats lies a ce bien"
              variant="secondary"
              onPress={() => router.push(`/bailleur/contrats?bienId=${bien.id}&mode=bien` as any)}
              style={styles.contractListButton}
            />
            {bien.contrats.length === 0 ? <Text style={styles.emptyText}>Aucun contrat pour ce bien.</Text> : null}
            {bien.contrats.map((contract) => (
              <View key={contract.id} style={styles.itemBox}>
                <Text style={styles.line}>Locataire: {contract.locataire}</Text>
                <Text style={styles.line}>Duree: {contract.dureeMois} mois</Text>
                <Text style={styles.line}>Date signature: {contract.signe ? contract.dateDebut : '-'}</Text>
                <Text style={styles.statusLine}>Statut: {getContratStatutAffichage(contract)}</Text>
                <KleaButton
                  title="Voir le contrat de bail"
                  variant="secondary"
                  onPress={() => router.push(`/bailleur/contrat/${contract.id}?bienId=${bien.id}` as any)}
                />
              </View>
            ))}
          </KleaCard>
    </BailleurScreenShell>
    </ReauthGate>
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
  },
  totalText: {
    color: KleaColors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
  itemBox: {
    borderWidth: 1,
    borderColor: KleaColors.border,
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    backgroundColor: '#F9F7F2',
    gap: 2,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  photoFrame: {
    flex: 1,
    borderWidth: 1,
    borderColor: KleaColors.border,
    borderRadius: 10,
    padding: 6,
    backgroundColor: '#FFFFFF',
    minHeight: 108,
  },
  photoThumb: {
    width: '100%',
    height: 70,
    borderRadius: 8,
    marginBottom: 6,
  },
  photoCaption: {
    color: KleaColors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  photoFallback: {
    color: KleaColors.textMuted,
    fontSize: 12,
    height: 70,
    textAlignVertical: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCloseZone: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  modalCloseText: {
    color: KleaColors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalImage: {
    width: '100%',
    height: '82%',
    borderRadius: 12,
  },
  contractListButton: {
    marginBottom: 8,
  },
  paymentListButton: {
    marginBottom: 8,
  },
  sectionListButton: {
    marginBottom: 8,
  },
  inlineActionButton: {
    marginTop: 8,
  },
  restrictedText: {
    color: KleaColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  photoManageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  photoManageThumb: {
    width: 72,
    height: 72,
    borderRadius: KleaRadius.md,
  },
  photoManageActions: {
    flex: 1,
    gap: 6,
  },
  photoManageButton: {
    paddingVertical: 8,
  },
});
