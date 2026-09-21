import { Link, Slot, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors } from '@/constants/theme';
import { getLocataireAuthUser } from '@/utils/locataire-api';

export default function LocataireLayout() {
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [verified, setVerified] = useState(true);

  useEffect(() => {
    let mounted = true;

    getLocataireAuthUser()
      .then((user) => {
        if (!mounted) return;
        if (user.role === 'locataire') {
          setVerified(user.statut === 'actif');
        }
      })
      .catch(() => {
        if (!mounted) return;
      })
      .finally(() => {
        if (!mounted) return;
        setChecked(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!checked || verified) {
    return <Slot />;
  }

  const canAccessBiensOnly = pathname === '/locataire' || pathname.startsWith('/locataire/biens') || pathname.startsWith('/locataire/bien/');

  if (canAccessBiensOnly) {
    return <Slot />;
  }

  return (
    <View style={styles.container}>
      <KleaCard style={styles.card}>
        <Text style={styles.title}>Compte locataire en attente de validation</Text>
        <Text style={styles.text}>
          Tant que votre compte n est pas valide par l administrateur, vous pouvez uniquement consulter les biens disponibles.
        </Text>
        <Link href="/locataire/biens" asChild>
          <KleaButton title="Consulter les biens" />
        </Link>
      </KleaCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KleaColors.background,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    gap: 12,
  },
  title: {
    color: KleaColors.primary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  text: {
    color: KleaColors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});
