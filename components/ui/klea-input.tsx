import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { KleaColors, KleaRadius } from '@/constants/theme';

type Props = TextInputProps & {
  label?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  error?: string;
};

export const KleaInput = forwardRef<TextInput, Props>(function KleaInput(
  { label, icon, error, style, ...rest },
  ref,
) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.wrapper}>
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={KleaColors.textMuted}
          {...rest}
        />
        {icon ? <Ionicons name={icon} size={18} color={KleaColors.textMuted} style={styles.icon} /> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    color: KleaColors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  wrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: KleaColors.border,
    borderRadius: KleaRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: KleaColors.background,
    color: KleaColors.primary,
    paddingRight: 44,
  },
  icon: {
    position: 'absolute',
    right: 12,
    top: 13,
  },
  error: {
    color: KleaColors.error,
    fontSize: 12,
    marginTop: 4,
  },
});
