import { Ionicons } from '@expo/vector-icons';
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KleaCard } from '@/components/ui/klea-card';
import { VerificationStatusBadge } from '@/components/ui/verification-status-badge';
import { KleaColors } from '@/constants/theme';
import { getAuthenticatedUser } from '@/utils/bailleur-api';

export default function BailleurLayout() {
  const [verified, setVerified] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    getAuthenticatedUser()
      .then((user) => {
        if (!mounted) return;
        if (user.role === 'bailleur') {
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

  if (!checked) {
    return <Slot />;
  }

  if (!verified) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <KleaCard style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="shield-outline" size={28} color={KleaColors.error} />
            </View>
            <Text style={styles.title}>Compte bailleur en attente de validation</Text>
            <VerificationStatusBadge verified={false} />
            <Text style={styles.text}>
              Votre compte est en attente de validation. Vous pouvez ajouter et consulter vos biens, mais les autres actions restent bloquees jusqu a validation administrateur.
            </Text>
          </KleaCard>
          <View style={styles.slotWrap}>
            <Slot />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: KleaColors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDEEEE',
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
  slotWrap: {
    flex: 1,
    marginTop: 12,
  },
});