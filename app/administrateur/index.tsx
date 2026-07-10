import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors } from '@/constants/theme';
import { getAllBailleurAccounts, getAllLocataireAccounts, getBiens, subscribeBiens } from '@/utils/biens-store';

export default function AdministrateurDashboard() {
  const router = useRouter();
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeBiens(() => forceRefresh((value) => value + 1));
    return unsubscribe;
  }, []);

  const bailleurs = getAllBailleurAccounts();
  const locataires = getAllLocataireAccounts();
  const biens = getBiens();

  const bailleursEnAttente = bailleurs.filter((item) => item.statut === 'en_attente').length;
  const locatairesEnAttente = locataires.filter((item) => item.statut === 'en_attente').length;
  const biensEnAttente = biens.filter((item) => item.validationStatut === 'en_attente').length;

  return (
    <AdminScreenShell title="Tableau de bord" subtitle="Validation des comptes et des biens">
      <KleaCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="briefcase-outline" size={20} color={KleaColors.secondary} />
          <Text style={styles.cardLabel}>Bailleurs sur la plateforme</Text>
        </View>
        <Text style={styles.cardValue}>{bailleurs.length}</Text>
        <Text style={styles.subLine}>En attente: {bailleursEnAttente}</Text>
        <Text style={styles.line} onPress={() => router.push('/administrateur/bailleurs' as any)}>
          Voir les bailleurs
        </Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="people-outline" size={20} color={KleaColors.secondary} />
          <Text style={styles.cardLabel}>Locataires sur la plateforme</Text>
        </View>
        <Text style={styles.cardValue}>{locataires.length}</Text>
        <Text style={styles.subLine}>En attente: {locatairesEnAttente}</Text>
        <Text style={styles.line} onPress={() => router.push('/administrateur/locataires' as any)}>
          Voir les locataires
        </Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="home-outline" size={20} color={KleaColors.secondary} />
          <Text style={styles.cardLabel}>Biens sur la plateforme</Text>
        </View>
        <Text style={styles.cardValue}>{biens.length}</Text>
        <Text style={styles.subLine}>En attente: {biensEnAttente}</Text>
        <Text style={styles.line} onPress={() => router.push('/administrateur/biens' as any)}>
          Voir les biens
        </Text>
      </KleaCard>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardLabel: {
    color: KleaColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  cardValue: {
    color: KleaColors.primary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  subLine: {
    color: KleaColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  line: {
    color: KleaColors.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
});
