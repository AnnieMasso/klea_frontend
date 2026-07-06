import { StyleSheet, Text } from 'react-native';

import { KleaColors } from '@/constants/theme';

export function HelloWave() {
  return <Text style={styles.wave}>👋</Text>;
}

const styles = StyleSheet.create({
  wave: {
    fontSize: 28,
    lineHeight: 32,
    color: KleaColors.accent,
  },
});
