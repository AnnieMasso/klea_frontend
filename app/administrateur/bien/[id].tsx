import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaMapView } from '@/components/ui/klea-map-view';
import { KleaColors } from '@/constants/theme';
import { getBienMapRegion, openBienDirections } from '@/utils/bien-location';
import { createAdminConversationForBien, deleteAdminBien, getAdminBiens, validateAdminBien } from '@/utils/admin-api';
import { resolveImageSource } from '@/utils/local-photos';

function parseCoordinate(value?: string | null): number | null {
  if (!value) return null;

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function AdminBienDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const bienId = Number(typeof params.id === 'string' ? params.id : '0');

  const [row, setRow] = useState<Awaited<ReturnType<typeof getAdminBiens>>[number] | null>(null);
  const [busy, setBusy] = useState(false);
  const [conversationBusy, setConversationBusy] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(Platform.OS !== 'web');
  const [locationRequestBusy, setLocationRequestBusy] = useState(false);
  const latitude = parseCoordinate(row?.bien.latitude);
  const longitude = parseCoordinate(row?.bien.longitude);
  const coordinates = latitude !== null && longitude !== null ? { latitude, longitude } : null;
  const mapRegion = getBienMapRegion(coordinates);

  const showFeedback = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  const refresh = async () => {
    try {
      const list = await getAdminBiens();
      setRow(list.find((item) => item.bien.id === bienId) ?? null);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de charger ce bien.');
      setRow(null);
    }
  };

  useEffect(() => {
    if (!bienId) return;
    void refresh();
  }, [bienId]);

  const handleOpenBailleurConversation = async () => {
    if (!row?.bien.bailleur?.id || conversationBusy) {
      return;
    }

    try {
      setConversationBusy(true);
      const conversationId = await createAdminConversationForBien(row.bien.id, row.bien.bailleur.id);
      router.push(`/administrateur/conversation?conversationId=${conversationId}` as any);
    } catch (error) {
      showFeedback('Erreur', error instanceof Error ? error.message : 'Impossible d\'ouvrir la conversation avec le bailleur.');
    } finally {
      setConversationBusy(false);
    }
  };

  const handleOpenDirections = async () => {
    if (!coordinates || !row) return;
    await openBienDirections(coordinates, row.bien.titre);
  };

  const handleEnableLocation = async () => {
    if (Platform.OS !== 'web') {
      setLocationEnabled(true);
      return;
    }

    if (locationRequestBusy) return;

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showFeedback('Localisation indisponible', 'Votre navigateur ne permet pas l acces a la localisation.');
      return;
    }

    setLocationRequestBusy(true);

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationEnabled(true);
        setLocationRequestBusy(false);
      },
      () => {
        setLocationRequestBusy(false);
        showFeedback('Localisation refusee', 'Activez la geolocalisation du navigateur pour afficher la carte sur PC.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleDelete = () => {
    if (!row) return;

    if (busy) return;

    const confirmed = Platform.OS === 'web'
      ? window.confirm('Supprimer ce bien ? Cette action est irreversible.')
      : true;

    if (!confirmed) return;

    void (async () => {
      try {
        setBusy(true);
        await deleteAdminBien(row.bien.id);
        showFeedback('Suppression reussie', 'Le bien a ete supprime.');
        router.back();
      } catch (error) {
        showFeedback('Erreur', error instanceof Error ? error.message : 'Suppression impossible.');
      } finally {
        setBusy(false);
      }
    })();
  };

  if (!row) {
    return (
      <AdminScreenShell title="Detail du bien" subtitle="Introuvable">
        <KleaCard>
          <Text style={styles.emptyText}>Le bien demande est introuvable.</Text>
        </KleaCard>
      </AdminScreenShell>
    );
  }

  return (
    <AdminScreenShell title={row.bien.titre} subtitle={row.bien.type}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <KleaCard style={styles.card}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <Text style={styles.line}>Statut: {row.bien.statut}</Text>
          <Text style={styles.line}>Ville: {row.bien.ville ?? '-'}</Text>
          <Text style={styles.line}>Quartier: {row.bien.quartier ?? '-'}</Text>
          <Text style={styles.line}>Lieu dit: {row.bien.lieu_dit ?? '-'}</Text>
          <Text style={styles.line}>Montant: {row.bien.montant ? `${row.bien.montant.toLocaleString('fr-FR')} FCFA` : '-'}</Text>
          <Text style={styles.line}>Bailleur: {row.bien.bailleur ? `${row.bien.bailleur.prenom ?? ''} ${row.bien.bailleur.nom}`.trim() || row.bien.bailleur.email : '-'}</Text>
          <Text style={styles.line}>Occupe par: {row.occupied_by ? `${row.occupied_by.prenom ?? ''} ${row.occupied_by.nom}`.trim() : 'Aucun locataire'}</Text>
          <Text style={styles.line}>Deja loue: {row.has_ever_been_rented ? 'Oui' : 'Non'}</Text>
          {row.bien.description ? <Text style={styles.description}>{row.bien.description}</Text> : null}
        </KleaCard>

        <KleaCard style={styles.card}>
          <Text style={styles.sectionTitle}>Localisation</Text>
          {Platform.OS === 'web' ? (
            <KleaButton
              title={locationEnabled ? 'Localisation activee' : locationRequestBusy ? 'Activation...' : 'Activer ma localisation'}
              variant="secondary"
              onPress={handleEnableLocation}
              disabled={locationRequestBusy || locationEnabled}
              style={styles.enableLocationButton}
            />
          ) : null}
          <Text style={styles.line}>Coordonnees: {row.bien.latitude && row.bien.longitude ? `${row.bien.latitude}, ${row.bien.longitude}` : 'Non renseignee'}</Text>
          <Text style={styles.line}>Adresse: {[row.bien.quartier, row.bien.ville, row.bien.lieu_dit].filter(Boolean).join(', ') || '-'}</Text>
          {mapRegion && coordinates && locationEnabled ? (
            <>
              <KleaMapView
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={() => {}}
                onPress={() => {}}
                selectedCoordinates={coordinates}
              />
              <Text style={styles.locationHint}>La carte ci-dessous permet a l'administrateur de verifier l'emplacement reel du bien.</Text>
              <KleaButton title="Ouvrir l'itineraire" variant="secondary" onPress={handleOpenDirections} style={styles.directionButton} />
            </>
          ) : mapRegion && coordinates && Platform.OS === 'web' ? (
            <Text style={styles.line}>Activez votre localisation pour afficher la carte sur PC.</Text>
          ) : (
            <Text style={styles.line}>Carte indisponible: coordonnées non renseignées.</Text>
          )}
        </KleaCard>

        <KleaCard style={styles.card}>
          <Text style={styles.sectionTitle}>Photos du bien</Text>
          {row.bien.images?.length ? (
            <View style={styles.gallery}>
              {row.bien.images.map((image) => (
                <View key={image.id} style={styles.photoCard}>
                  <Image source={resolveImageSource(image.slug)} style={styles.photo} resizeMode="cover" />
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.line}>Aucune photo fournie.</Text>
          )}
        </KleaCard>

        <KleaCard style={styles.card}>
          <KleaButton
            title={conversationBusy ? 'Ouverture...' : 'Converser avec le bailleur'}
            variant="secondary"
            disabled={conversationBusy || !row.bien.bailleur?.id}
            onPress={handleOpenBailleurConversation}
            style={styles.actionButton}
          />
          <KleaButton
            title={busy ? 'Traitement...' : 'Valider le bien'}
            disabled={busy}
            onPress={async () => {
              try {
                setBusy(true);
                await validateAdminBien(row.bien.id);
                await refresh();
                showFeedback('Validation reussie', 'Le bien a ete valide.');
              } catch (error) {
                showFeedback('Erreur', error instanceof Error ? error.message : 'Validation impossible.');
              } finally {
                setBusy(false);
              }
            }}
            style={styles.actionButton}
          />
          <KleaButton title="Supprimer ce bien" variant="ghost" disabled={busy} onPress={handleDelete} style={styles.actionButton} />
        </KleaCard>
      </ScrollView>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 12,
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
  description: {
    color: KleaColors.primary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  mapCard: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: KleaColors.border,
    backgroundColor: KleaColors.surface,
  },
  map: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
  },
  locationHint: {
    color: KleaColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 10,
  },
  directionButton: {
    marginTop: 2,
  },
  enableLocationButton: {
    marginBottom: 10,
  },
  gallery: {
    gap: 10,
  },
  photoCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: KleaColors.border,
    backgroundColor: KleaColors.surface,
  },
  photo: {
    width: '100%',
    height: 180,
  },
  actionButton: {
    marginTop: 8,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
});
