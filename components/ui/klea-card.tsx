import type { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { KleaColors, KleaRadius, KleaShadow } from '@/constants/theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
};

export function KleaCard({ children, style, padding = 20 }: Props) {
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: KleaColors.surface,
    borderRadius: KleaRadius.xl,
    borderWidth: 1,
    borderColor: KleaColors.border,
    ...KleaShadow.card,
  },
});
