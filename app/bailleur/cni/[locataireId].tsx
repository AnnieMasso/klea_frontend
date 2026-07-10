import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, StyleSheet, Text } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { getCniLocataire } from '@/utils/biens-store';
import { resolveImageSource } from '@/utils/local-photos';

export default function CniLocataireScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ locataireId?: string; bienId?: string }>();

  const locataireId = typeof params.locataireId === 'string' ? params.locataireId : '';
  const bienId = typeof params.bienId === 'string' ? params.bienId : undefined;
  const cni = locataireId ? getCniLocataire(locataireId, bienId) : null;

  if (!cni) {
    return (
      <BailleurScreenShell title="CNI du locataire" subtitle="Introuvable">
        <KleaCard>
          <Text style={styles.emptyText}>
            Aucune CNI disponible : ce document n'est consultable que pour votre locataire actuel.
          </Text>
          <KleaButton title="Retour" variant="secondary" onPress={() => router.back()} />
        </KleaCard>
      </BailleurScreenShell>
    );
  }

  return (
    <BailleurScreenShell title="CNI du locataire" subtitle={cni.nomComplet}>
      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Locataire</Text>
        <Text style={styles.line}>{cni.nomComplet}</Text>
        <Text style={styles.line}>{cni.telephone}</Text>
        <Text style={styles.line}>{cni.email}</Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>CNI recto</Text>
        {cni.cniRecto ? (
          <Image source={resolveImageSource(cni.cniRecto)} style={styles.cniImage} resizeMode="cover" />
        ) : (
          <Text style={styles.emptyText}>Aucune photo renseignee.</Text>
        )}
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>CNI verso</Text>
        {cni.cniVerso ? (
          <Image source={resolveImageSource(cni.cniVerso)} style={styles.cniImage} resizeMode="cover" />
        ) : (
          <Text style={styles.emptyText}>Aucune photo renseignee.</Text>
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
