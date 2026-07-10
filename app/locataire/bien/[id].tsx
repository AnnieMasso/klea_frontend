import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaImageCarousel } from '@/components/ui/klea-image-carousel';
import { KleaMapView } from '@/components/ui/klea-map-view';
import { LocataireScreenShell } from '@/components/ui/locataire-screen-shell';
import { KleaColors } from '@/constants/theme';
import { ensureLocataireVerifie } from '@/hooks/use-locataire-guard';
import { getBienMapRegion, openBienDirections, parseBienCoordinates } from '@/utils/bien-location';
import {
    CURRENT_LOCATAIRE_ID,
    CURRENT_LOCATAIRE_NOM,
    createConversationForBien,
    getBienById,
    subscribeBiens,
    type BienDetail,
} from '@/utils/biens-store';

export default function LocataireBienDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const bienId = typeof params.id === 'string' ? params.id : '';

  const [bien, setBien] = useState<BienDetail | null>(() => (bienId ? getBienById(bienId) : null));

  useEffect(() => {
    if (!bienId) return;
    setBien(getBienById(bienId));
    const unsubscribe = subscribeBiens(() => setBien(getBienById(bienId)));
    return unsubscribe;
  }, [bienId]);

  const coordinates = parseBienCoordinates(bien?.localisation);
  const mapRegion = getBienMapRegion(coordinates);

  const handleSouscrire = () => {
    if (!bien) return;
    if (!ensureLocataireVerifie()) return;
    const conversationId = createConversationForBien(
      bien.id,
      CURRENT_LOCATAIRE_ID,
      CURRENT_LOCATAIRE_NOM,
      `Bonjour, je souhaite souscrire au bien "${bien.titre}".`,
    );

    if (!conversationId) {
      Alert.alert('Erreur', 'Impossible d\'envoyer votre demande pour le moment.');
      return;
    }

    Alert.alert('Demande envoyee', 'Votre demande de souscription a ete envoyee au bailleur.');
    router.push(`/locataire/conversation?conversationId=${conversationId}` as any);
  };

  const handleOpenDirections = async () => {
    if (!coordinates || !bien) return;
    await openBienDirections(coordinates, bien.titre);
  };

  if (!bien) {
    return (
      <LocataireScreenShell title="Detail du bien" subtitle="Introuvable" contentStyle={styles.safeAreaContent}>
        <KleaCard><Text style={styles.emptyText}>Le bien demande est introuvable.</Text></KleaCard>
      </LocataireScreenShell>
    );
  }

  return (
    <LocataireScreenShell title={bien.titre} subtitle={bien.type} contentStyle={styles.safeAreaContent}>
      <KleaImageCarousel images={bien.images} />

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.line}>{bien.description}</Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Informations</Text>
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
            <Text style={styles.locationHint}>Consultez l'emplacement du bien et ouvrez un itineraire si vous voulez vous y rendre.</Text>
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

      {bien.occupationStatut !== 'en_location' ? (
        <KleaButton title="Converser avec le propriétaire" onPress={handleSouscrire} style={styles.actionButton} />
      ) : (
        <Text style={styles.restrictedText}>Ce bien est deja en location.</Text>
      )}
    </LocataireScreenShell>
  );
}

const styles = StyleSheet.create({
  safeAreaContent: {
    paddingTop: 32,
    paddingBottom: 184,
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
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
  actionButton: {
    marginTop: 4,
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
    textAlign: 'center',
    marginTop: 8,
  },
});
