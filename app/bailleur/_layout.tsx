import { Ionicons } from '@expo/vector-icons';
import { Slot } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KleaCard } from '@/components/ui/klea-card';
import { VerificationStatusBadge } from '@/components/ui/verification-status-badge';
import { KleaColors } from '@/constants/theme';
import { CURRENT_BAILLEUR_ID, isBailleurVerified } from '@/utils/biens-store';

export default function BailleurLayout() {
  const verified = isBailleurVerified(CURRENT_BAILLEUR_ID);

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
              Votre compte est actuellement non verifie. Un administrateur doit le valider avant que vous puissiez utiliser la plateforme bailleur.
            </Text>
          </KleaCard>
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
    justifyContent: 'center',
    paddingHorizontal: 20,
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
});