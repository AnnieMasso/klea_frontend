import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { KleaColors } from '@/constants/theme';

type Props = {
  verified: boolean;
};

export function VerificationStatusBadge({ verified }: Props) {
  return (
    <View style={[styles.badge, verified ? styles.badgeVerified : styles.badgeUnverified]}>
      <Ionicons
        name={verified ? 'checkmark-circle' : 'close-circle'}
        size={16}
        color={verified ? KleaColors.success : KleaColors.error}
      />
      <Text style={[styles.label, verified ? styles.labelVerified : styles.labelUnverified]}>
        {verified ? 'Verifie' : 'Non verifie'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeVerified: {
    backgroundColor: '#EEF8F2',
    borderColor: '#B9DEC8',
  },
  badgeUnverified: {
    backgroundColor: '#FDEEEE',
    borderColor: '#F2B8B1',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  labelVerified: {
    color: KleaColors.success,
  },
  labelUnverified: {
    color: KleaColors.error,
  },
});