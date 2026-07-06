import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, View } from 'react-native';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaInput } from '@/components/ui/klea-input';
import { KleaColors, KleaRadius } from '@/constants/theme';

type Props = {
  visible: boolean;
  reason: string;
  checking: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: (password: string) => void;
};

export function ReauthModal({ visible, reason, checking, error, onCancel, onConfirm }: Props) {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (visible) setPassword('');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.title}>Confirmez votre identite</Text>
          <Text style={styles.subtitle}>Pour {reason}, veuillez ressaisir votre mot de passe.</Text>

          <KleaInput
            label="Mot de passe"
            icon="lock-closed-outline"
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
            error={error}
          />

          <View style={styles.actions}>
            <KleaButton title="Annuler" variant="secondary" onPress={onCancel} style={styles.actionButton} />
            <KleaButton
              title={checking ? 'Verification…' : 'Confirmer'}
              onPress={() => onConfirm(password)}
              disabled={checking}
              style={styles.actionButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16,50,47,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: KleaColors.surface,
    borderRadius: KleaRadius.xl,
    borderWidth: 1,
    borderColor: KleaColors.border,
    padding: 20,
  },
  title: {
    color: KleaColors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: KleaColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
  },
});
