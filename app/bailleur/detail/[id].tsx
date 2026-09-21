import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaImageCarousel } from '@/components/ui/klea-image-carousel';
import { ReauthGate } from '@/components/ui/reauth-gate';
import { KleaColors } from '@/constants/theme';
import {
  addBienImage,
  getBailleurAnnulations,
  getBailleurContrats,
  getBailleurDeparts,
  getBailleurLocataires,
  getBailleurPaiements,
  getBailleurSinistres,
  getMyBiens,
  removeBienImage,
  replaceBienImage,
  type BailleurAnnulation,
  type BailleurBien,
  type BailleurContrat,
  type BailleurDepart,
  type BailleurLocataire,
  type BailleurPaiement,
  type BailleurSinistre,
} from '@/utils/bailleur-api';
import { resolveImageSource } from '@/utils/local-photos';
import * as ImagePicker from 'expo-image-picker';

type RelatedRecords = {
  lastContract: BailleurContrat | null;
  lastPayment: BailleurPaiement | null;
  lastLocataire: BailleurLocataire | null;
  lastDepart: BailleurDepart | null;
  lastSinistre: BailleurSinistre | null;
  lastAnnulation: BailleurAnnulation | null;
};

function parseDate(value: string) {
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
}

function pickLatest<T>(items: T[], selector: (item: T) => string) {
  return [...items].sort((left, right) => parseDate(selector(right)) - parseDate(selector(left)))[0] ?? null;
}

export default function BienDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const bienId = typeof params.id === 'string' ? params.id : '';

  const [bien, setBien] = useState<BailleurBien | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [related, setRelated] = useState<RelatedRecords>({
    lastContract: null,
    lastPayment: null,
    lastLocataire: null,
    lastDepart: null,
    lastSinistre: null,
    lastAnnulation: null,
  });

  useEffect(() => {
    if (!bienId) return;

    (async () => {
      try {
        setLoading(true);
        const [biens, contracts, payments, locataires, departs, sinistres, annulations] = await Promise.all([
          getMyBiens(),
          getBailleurContrats(),
          getBailleurPaiements(),
          getBailleurLocataires(),
          getBailleurDeparts(),
          getBailleurSinistres(),
          getBailleurAnnulations(),
        ]);

        setBien(biens.find((item) => item.id === bienId) ?? null);
        setRelated({
          lastContract: pickLatest(contracts.filter((item) => item.bienId === bienId), (item) => item.dateDebut),
          lastPayment: pickLatest(payments.filter((item) => item.bienId === bienId), (item) => item.datePaiement),
          lastLocataire: pickLatest(locataires.filter((item) => item.bienId === bienId), (item) => item.dateDebut),
          lastDepart: pickLatest(departs.filter((item) => item.bienId === bienId), (item) => item.dateSignalement),
          lastSinistre: pickLatest(sinistres.filter((item) => item.bienId === bienId), (item) => item.date),
          lastAnnulation: pickLatest(annulations.filter((item) => item.bienId === bienId), (item) => item.date),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [bienId]);

  const subtitle = useMemo(() => {
    if (loading) return 'Chargement...';
    return bien?.type ?? 'Bien introuvable';
  }, [bien, loading]);

  const carouselImages = useMemo(() => {
    if (!bien) return [];
    if (bien.images.length > 0) return bien.images;
    return bien.image ? [{ id: 'primary', url: bien.image }] : [];
  }, [bien]);

  const showFeedback = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  const refresh = async () => {
    const biens = await getMyBiens();
    setBien(biens.find((item) => item.id === bienId) ?? null);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showFeedback('Permission requise', 'Autorisez l’accès à votre galerie pour modifier les photos.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return null;
    }

    return result.assets[0].uri;
  };

  const handleAddPhoto = async () => {
    if (!bien || busy) return;

    const uri = await pickImage();
    if (!uri) return;

    try {
      setBusy(true);
      await addBienImage(bien.id, uri);
      await refresh();
      showFeedback('Photo ajoutée', 'La photo a été enregistrée avec succès.');
    } catch (error) {
      showFeedback('Erreur', error instanceof Error ? error.message : 'Ajout impossible.');
    } finally {
      setBusy(false);
    }
  };

  const handleReplacePhoto = async (imageId: string) => {
    if (!bien || busy) return;

    const uri = await pickImage();
    if (!uri) return;

    try {
      setBusy(true);
      setEditingImageId(imageId);
      await replaceBienImage(imageId, uri);
      await refresh();
      showFeedback('Photo remplacée', 'La photo du bien a été mise à jour.');
    } catch (error) {
      showFeedback('Erreur', error instanceof Error ? error.message : 'Modification impossible.');
    } finally {
      setBusy(false);
      setEditingImageId(null);
    }
  };

  const handleRemovePhoto = async (imageId: string) => {
    if (!bien || busy) return;

    const confirmed = Platform.OS === 'web'
      ? window.confirm('Supprimer cette photo du bien ?')
      : true;

    if (!confirmed) return;

    try {
      setBusy(true);
      setEditingImageId(imageId);
      await removeBienImage(imageId);
      await refresh();
      showFeedback('Photo supprimée', 'La photo a été retirée du bien.');
    } catch (error) {
      showFeedback('Erreur', error instanceof Error ? error.message : 'Suppression impossible.');
    } finally {
      setBusy(false);
      setEditingImageId(null);
    }
  };

  if (!loading && !bien) {
    return (
      <ReauthGate reason="consulter ce bien">
        <BailleurScreenShell title="Detail bien" subtitle="Bien introuvable">
          <KleaButton title="Retour" variant="secondary" onPress={() => router.back()} />
        </BailleurScreenShell>
      </ReauthGate>
    );
  }

  return (
    <ReauthGate reason="consulter les details de ce bien">
      <BailleurScreenShell title="Detail du bien" subtitle={subtitle}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <KleaCard style={styles.heroCard} padding={16}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroBadge}>{bien?.validationStatut === 'verifie' ? 'Bien validé' : 'En attente'}</Text>
                <Text style={styles.heroTitle}>{bien?.titre ?? '-'}</Text>
                <Text style={styles.heroSubtitle}>{bien?.type ?? '-'} · {bien?.ville ?? '-'}</Text>
              </View>
              <View style={styles.pricePill}>
                <Text style={styles.priceLabel}>Loyer</Text>
                <Text style={styles.priceValue}>{(bien?.montant ?? 0).toLocaleString('fr-FR')} FCFA</Text>
              </View>
            </View>
            <KleaImageCarousel images={carouselImages} height={250} />
          </KleaCard>

          <KleaCard style={styles.card}>
            <Text style={styles.sectionTitle}>Photos du bien</Text>
            {carouselImages.length > 0 ? (
              <View style={styles.photoGrid}>
                {carouselImages.map((image) => (
                  <View key={image.id} style={styles.photoTile}>
                    <Image source={resolveImageSource(image.url)} style={styles.photoImage} resizeMode="cover" />
                    <View style={styles.photoActions}>
                      <KleaButton title={editingImageId === image.id ? '...' : 'Remplacer'} variant="secondary" onPress={() => handleReplacePhoto(image.id)} disabled={busy} style={styles.photoButton} />
                      <KleaButton title="Supprimer" variant="ghost" onPress={() => handleRemovePhoto(image.id)} disabled={busy} style={styles.photoButton} />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Aucune photo fournie.</Text>
            )}
            <KleaButton title={busy ? 'Traitement...' : 'Ajouter une photo'} onPress={handleAddPhoto} disabled={busy} style={styles.actionButton} />
          </KleaCard>

          <KleaCard style={styles.card}>
            <Text style={styles.sectionTitle}>Informations</Text>
            <Text style={styles.line}>Type: {bien?.type ?? '-'}</Text>
            <Text style={styles.line}>Adresse: {bien?.adresse ?? '-'}</Text>
            <Text style={styles.line}>Ville: {bien?.ville ?? '-'}</Text>
            <Text style={styles.line}>Validation: {bien?.validationStatut ?? '-'}</Text>
            <Text style={styles.line}>Occupation: {bien?.occupationStatut ?? '-'}</Text>
            {bien?.image ? <Text style={styles.line}>Photo principale: sélectionnée automatiquement dans le carrousel</Text> : null}
          </KleaCard>

          <KleaCard style={styles.card}>
            <Text style={styles.sectionTitle}>Dernières activités</Text>

            <ActivityRow
              label="Dernier contrat"
              title={related.lastContract ? related.lastContract.bienTitre : 'Aucun contrat'}
              subtitle={related.lastContract ? `${related.lastContract.locataire} · ${related.lastContract.dateDebut}` : 'Aucun contrat enregistré.'}
              actionLabel={related.lastContract ? 'Ouvrir le dernier' : undefined}
              onPress={related.lastContract ? () => router.push(`/bailleur/contrat/${related.lastContract!.id}?bienId=${related.lastContract!.bienId}` as any) : undefined}
            />

            <ActivityRow
              label="Dernier paiement"
              title={related.lastPayment ? `${related.lastPayment.montant.toLocaleString('fr-FR')} FCFA` : 'Aucun paiement'}
              subtitle={related.lastPayment ? `${related.lastPayment.locataire} · ${related.lastPayment.datePaiement}` : 'Aucun paiement enregistré.'}
              actionLabel={related.lastPayment ? 'Ouvrir le dernier' : undefined}
              onPress={related.lastPayment ? () => router.push(`/bailleur/facture/${related.lastPayment!.id}` as any) : undefined}
            />

            <ActivityRow
              label="Dernier locataire"
              title={related.lastLocataire ? related.lastLocataire.nomComplet : 'Aucun locataire'}
              subtitle={related.lastLocataire ? `${related.lastLocataire.statut} · ${related.lastLocataire.dateDebut}` : 'Aucun locataire enregistré.'}
              actionLabel={related.lastLocataire ? 'Voir la CNI' : undefined}
              onPress={related.lastLocataire ? () => router.push(`/bailleur/cni/${related.lastLocataire!.id}?bienId=${related.lastLocataire!.bienId}` as any) : undefined}
            />

            <ActivityRow
              label="Dernier départ"
              title={related.lastDepart ? related.lastDepart.locataire : 'Aucun départ'}
              subtitle={related.lastDepart ? related.lastDepart.dateSignalement : 'Aucun départ signalé.'}
              actionLabel={related.lastDepart ? 'Voir la liste' : undefined}
              onPress={related.lastDepart ? () => router.push(`/bailleur/depart?bienId=${bienId}&mode=bien` as any) : undefined}
            />

            <ActivityRow
              label="Dernier sinistre"
              title={related.lastSinistre ? related.lastSinistre.locataire : 'Aucun sinistre'}
              subtitle={related.lastSinistre ? related.lastSinistre.date : 'Aucun sinistre signalé.'}
              actionLabel={related.lastSinistre ? 'Voir la liste' : undefined}
              onPress={related.lastSinistre ? () => router.push(`/bailleur/sinistres?bienId=${bienId}&mode=bien` as any) : undefined}
            />

            <ActivityRow
              label="Dernière annulation"
              title={related.lastAnnulation ? related.lastAnnulation.locataire : 'Aucune annulation'}
              subtitle={related.lastAnnulation ? related.lastAnnulation.date : 'Aucune annulation enregistrée.'}
              actionLabel={related.lastAnnulation ? 'Voir la liste' : undefined}
              onPress={related.lastAnnulation ? () => router.push(`/bailleur/annulations?bienId=${bienId}&mode=bien` as any) : undefined}
            />
          </KleaCard>
        </ScrollView>
      </BailleurScreenShell>
    </ReauthGate>
  );
}

function ActivityRow({ label, title, subtitle, actionLabel, onPress }: { label: string; title: string; subtitle: string; actionLabel?: string; onPress?: () => void }) {
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityText}>
        <Text style={styles.activityLabel}>{label}</Text>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activitySubtitle}>{subtitle}</Text>
      </View>
      {actionLabel && onPress ? <KleaButton title={actionLabel} variant="secondary" onPress={onPress} style={styles.activityButton} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 18,
  },
  heroCard: {
    marginBottom: 4,
    overflow: 'hidden',
    backgroundColor: '#F8F5EE',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  heroTextBlock: {
    flex: 1,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    color: KleaColors.secondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    color: KleaColors.primary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: KleaColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  pricePill: {
    minWidth: 120,
    backgroundColor: KleaColors.surface,
    borderWidth: 1,
    borderColor: KleaColors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  priceLabel: {
    color: KleaColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  priceValue: {
    color: KleaColors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
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
  activityRow: {
    borderTopWidth: 1,
    borderTopColor: KleaColors.border,
    paddingTop: 14,
    marginTop: 14,
    gap: 10,
  },
  activityText: {
    gap: 3,
  },
  activityLabel: {
    color: KleaColors.secondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activityTitle: {
    color: KleaColors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  activitySubtitle: {
    color: KleaColors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  activityButton: {
    alignSelf: 'flex-start',
  },
  photoGrid: {
    gap: 12,
  },
  photoTile: {
    borderWidth: 1,
    borderColor: KleaColors.border,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: KleaColors.surface,
  },
  photoImage: {
    width: '100%',
    height: 180,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    flexWrap: 'wrap',
  },
  photoButton: {
    paddingVertical: 8,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
  actionButton: {
    marginTop: 8,
  },
});
