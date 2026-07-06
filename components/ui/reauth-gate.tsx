import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';

import { ReauthModal } from '@/components/ui/reauth-modal';
import { confirmIdentity } from '@/utils/auth-api';

type Props = {
  reason: string;
  children: ReactNode;
};

export function ReauthGate({ reason, children }: Props) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setVerified(false);
      setError('');
      setChecking(false);
    }, []),
  );

  const handleCancel = () => {
    setError('');
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/bailleur');
    }
  };

  const handleConfirm = async (password: string) => {
    setChecking(true);
    setError('');
    const result = await confirmIdentity(password);
    setChecking(false);
    if (result.success) {
      setVerified(true);
    } else {
      setError(result.message ?? 'Mot de passe incorrect.');
    }
  };

  if (verified) {
    return <>{children}</>;
  }

  return (
    <ReauthModal
      visible
      reason={reason}
      checking={checking}
      error={error}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );
}
