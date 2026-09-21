import { useFocusEffect } from 'expo-router/react-navigation';
import { useRouter } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';

import { ReauthModal } from '@/components/ui/reauth-modal';
import { confirmIdentity } from '@/utils/auth-api';

type Props = {
  reason: string;
  children: ReactNode;
};

const REAUTH_CACHE_MS = 15 * 60 * 1000;

let lastSuccessfulReauthAt = 0;

function hasRecentReauth() {
  return Date.now() - lastSuccessfulReauthAt < REAUTH_CACHE_MS;
}

export function ReauthGate({ reason, children }: Props) {
  const router = useRouter();
  const [verified, setVerified] = useState(hasRecentReauth());
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setVerified(hasRecentReauth());
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
      lastSuccessfulReauthAt = Date.now();
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
