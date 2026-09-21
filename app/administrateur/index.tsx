import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors } from '@/constants/theme';
import { getAdminBiens, getAdminDashboard, getAdminMe } from '@/utils/admin-api';
import { buildUserDashboardPath } from '@/utils/user-route';

export function AdministrateurDashboardView() {
  const router = useRouter();
  const [stats, setStats] = useState({
    bailleurs: 0,
    locataires: 0,
    biens: 0,
    bailleursEnAttente: 0,
    locatairesEnAttente: 0,
    biensEnAttente: 0,
  });

  useEffect(() => {
    let mounted = true;

    Promise.all([getAdminDashboard(), getAdminBiens()])
      .then(([data, biens]) => {
        if (!mounted) return;
        // Le backend expose un total des utilisateurs en attente sans split par role.
        // On l'affiche de facon conservatrice sur les deux cartes comptes.
        setStats({
          bailleurs: data.bailleurs_count,
          locataires: data.locataires_count,
          biens: biens.length,
          bailleursEnAttente: data.pending_users_count,
          locatairesEnAttente: data.pending_users_count,
          biensEnAttente: data.pending_biens_count,
        });
      })
      .catch(() => {
        if (!mounted) return;
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminScreenShell title="Tableau de bord" subtitle="Validation des comptes et des biens">
      <KleaCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="briefcase-outline" size={20} color={KleaColors.secondary} />
          <Text style={styles.cardLabel}>Bailleurs sur la plateforme</Text>
        </View>
        <Text style={styles.cardValue}>{stats.bailleurs}</Text>
        <Text style={styles.subLine}>En attente: {stats.bailleursEnAttente}</Text>
        <Text style={styles.line} onPress={() => router.push('/administrateur/bailleurs' as any)}>
          Voir les bailleurs
        </Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="people-outline" size={20} color={KleaColors.secondary} />
          <Text style={styles.cardLabel}>Locataires sur la plateforme</Text>
        </View>
        <Text style={styles.cardValue}>{stats.locataires}</Text>
        <Text style={styles.subLine}>En attente: {stats.locatairesEnAttente}</Text>
        <Text style={styles.line} onPress={() => router.push('/administrateur/locataires' as any)}>
          Voir les locataires
        </Text>
      </KleaCard>

      <KleaCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="home-outline" size={20} color={KleaColors.secondary} />
          <Text style={styles.cardLabel}>Biens sur la plateforme</Text>
        </View>
        <Text style={styles.cardValue}>{stats.biens}</Text>
        <Text style={styles.subLine}>En attente: {stats.biensEnAttente}</Text>
        <Text style={styles.line} onPress={() => router.push('/administrateur/biens' as any)}>
          Voir les biens
        </Text>
      </KleaCard>
    </AdminScreenShell>
  );
}

export default function AdministrateurDashboard() {
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    getAdminMe()
      .then((user) => {
        if (!mounted) return;
        setTargetPath(buildUserDashboardPath(user));
      })
      .catch(() => {
        if (!mounted) return;
        setTargetPath('/administrateur');
      })
      .finally(() => {
        if (mounted) setChecked(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!checked) {
    return null;
  }

  if (targetPath && targetPath !== '/administrateur') {
    return <Redirect href={targetPath as any} />;
  }

  return <AdministrateurDashboardView />;
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
