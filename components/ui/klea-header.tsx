import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { KleaColors } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export function KleaHeader({ title, subtitle, right }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  texts: {
    flex: 1,
  },
  title: {
    color: KleaColors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: KleaColors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
});
