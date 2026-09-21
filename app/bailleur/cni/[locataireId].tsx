import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { getBailleurLocataires, type BailleurLocataire } from '@/utils/bailleur-api';
import { resolveImageSource } from '@/utils/local-photos';

export default function CniLocataireScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ locataireId?: string; bienId?: string }>();

  const locataireId = typeof params.locataireId === 'string' ? params.locataireId : '';
  const [locataire, setLocataire] = useState<BailleurLocataire | null>(null);

  useEffect(() => {
    if (!locataireId) return;
    (async () => {
      const list = await getBailleurLocataires();
      setLocataire(list.find((item) => item.id === locataireId) ?? null);
    })();
  }, [locataireId]);

  if (!locataire) {
    return (
      <BailleurScreenShell title="CNI du locataire" subtitle="Introuvable">
        <KleaCard>
          <Text style={styles.emptyText}>
            Aucune information CNI disponible pour ce locataire.
          </Text>
          <KleaButton title="Retour" variant="secondary" onPress={() => router.back()} />
        </KleaCard>
      </BailleurScreenShell>
    );
  }

  return (
    <BailleurScreenShell title="CNI du locataire" subtitle={locataire.nomComplet}>
      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Locataire</Text>
        <Text style={styles.line}>{locataire.nomComplet}</Text>
        <Text style={styles.line}>{locataire.telephone}</Text>
        <Text style={styles.line}>{locataire.email}</Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>CNI recto</Text>
        <Text style={styles.emptyText}>Le document CNI n'est pas expose par l'API actuelle.</Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>CNI verso</Text>
        <Text style={styles.emptyText}>Le document CNI n'est pas expose par l'API actuelle.</Text>
      </KleaCard>

      <KleaButton title="Retour" variant="secondary" onPress={() => router.back()} />
    </BailleurScreenShell>
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
  cniImage: {
    width: '100%',
    height: 180,
    borderRadius: KleaRadius.md,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
    marginBottom: 10,
  },
});
