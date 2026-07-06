import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors } from '@/constants/theme';
import { getAssuranceHabitationLocataire } from '@/utils/biens-store';

export default function AssuranceHabitationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ locataireId?: string; bienId?: string }>();

  const locataireId = typeof params.locataireId === 'string' ? params.locataireId : '';
  const bienId = typeof params.bienId === 'string' ? params.bienId : undefined;
  const assurance = locataireId ? getAssuranceHabitationLocataire(locataireId, bienId) : null;

  if (!assurance) {
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
    <BailleurScreenShell title="Assurance habitation" subtitle={assurance.nomComplet}>
      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Locataire</Text>
        <Text style={styles.line}>{assurance.nomComplet}</Text>
        <Text style={styles.line}>{assurance.telephone}</Text>
        <Text style={styles.line}>{assurance.email}</Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Fichier d'assurance habitation</Text>
        <Text style={styles.line}>Nom du fichier: {assurance.assuranceHabitationFichier?.fileName ?? 'Non renseigne'}</Text>
        <Text style={styles.line}>Type: {assurance.assuranceHabitationFichier?.mimeType ?? '-'}</Text>
        {assurance.assuranceHabitationFichier ? (
          <KleaButton
            title="Ouvrir le fichier"
            variant="secondary"
            onPress={() => Linking.openURL(assurance.assuranceHabitationFichier?.fileUrl || '')}
            style={styles.openButton}
          />
        ) : (
          <Text style={styles.emptyText}>Aucun fichier joint.</Text>
        )}
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
