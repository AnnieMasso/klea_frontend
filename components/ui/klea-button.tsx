import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, PressableProps, StyleSheet, Text, ViewStyle } from 'react-native';

import { KleaColors, KleaRadius } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = PressableProps & {
  title: string;
  variant?: Variant;
  fullWidth?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  iconPosition?: 'left' | 'right';
  style?: ViewStyle | ViewStyle[];
  textStyle?: object;
  children?: ReactNode;
};

export function KleaButton({
  title,
  variant = 'primary',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <Pressable
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
      {...rest}
    >
      {icon && iconPosition === 'left' ? <Ionicons name={icon} size={18} color={variant === 'primary' ? KleaColors.primary : KleaColors.primary} /> : null}
      {children ?? <Text style={[styles.text, variant === 'secondary' && styles.secondaryText, variant === 'ghost' && styles.ghostText, disabled && styles.disabledText, textStyle]}>{title}</Text>}
      {icon && iconPosition === 'right' ? <Ionicons name={icon} size={18} color={variant === 'primary' ? KleaColors.primary : KleaColors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: KleaRadius.md,
  },
  primary: {
    backgroundColor: KleaColors.accent,
  },
  secondary: {
    backgroundColor: KleaColors.surface,
    borderWidth: 1,
    borderColor: KleaColors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: KleaColors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryText: {
    color: KleaColors.primary,
  },
  ghostText: {
    color: KleaColors.primary,
    fontWeight: '600',
  },
  disabledText: {
    color: KleaColors.textMuted,
  },
});
