import { useCallback, useRef, useState } from 'react';

import { ReauthModal } from '@/components/ui/reauth-modal';
import { confirmIdentity } from '@/utils/auth-api';

export function useReauthConfirm() {
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const requestReauth = useCallback((actionReason: string) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setReason(actionReason);
      setError('');
      setChecking(false);
      setVisible(true);
    });
  }, []);

  const settle = (confirmed: boolean) => {
    setVisible(false);
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
  };

  const handleCancel = () => settle(false);

  const handleConfirm = async (password: string) => {
    setChecking(true);
    setError('');
    const result = await confirmIdentity(password);
    setChecking(false);
    if (result.success) {
      settle(true);
    } else {
      setError(result.message ?? 'Mot de passe incorrect.');
    }
  };

  const reauthModal = (
    <ReauthModal
      visible={visible}
      reason={reason}
      checking={checking}
      error={error}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );

  return { requestReauth, reauthModal };
}
