import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors } from '@/constants/theme';
import { getBailleurLocataires, type BailleurLocataire } from '@/utils/bailleur-api';

export default function AssuranceHabitationScreen() {
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
      <BailleurScreenShell title="Assurance habitation" subtitle="Introuvable">
        <KleaCard>
          <Text style={styles.emptyText}>Aucune information d'assurance habitation trouvee.</Text>
          <KleaButton title="Retour" variant="secondary" onPress={() => router.back()} />
        </KleaCard>
      </BailleurScreenShell>
    );
  }

  return (
    <BailleurScreenShell title="Assurance habitation" subtitle={locataire.nomComplet}>
      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Locataire</Text>
        <Text style={styles.line}>{locataire.nomComplet}</Text>
        <Text style={styles.line}>{locataire.telephone}</Text>
        <Text style={styles.line}>{locataire.email}</Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Fichier d'assurance habitation</Text>
        <Text style={styles.emptyText}>L'assurance habitation n'est pas consultable dans l'espace bailleur.</Text>
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
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
    marginBottom: 10,
  },
  openButton: {
    marginTop: 8,
  },
});
