import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';

import { AdministrateurDashboardView } from '@/app/administrateur';
import { BailleurDashboardView } from '@/app/bailleur';
import { LocataireBiensScreenView } from '@/app/locataire';
import { getAdminMe } from '@/utils/admin-api';
import { getAuthenticatedUser } from '@/utils/bailleur-api';
import { getLocataireAuthUser } from '@/utils/locataire-api';
import { buildUserDashboardPath } from '@/utils/user-route';

type Role = 'administrateur' | 'bailleur' | 'locataire';
type User = {
  nom: string;
  prenom?: string | null;
  email: string;
  role: Role;
};

export default function UserDashboardAliasScreen() {
  const params = useLocalSearchParams<{ identity?: string }>();
  const identity = typeof params.identity === 'string' ? params.identity : '';
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.any([
      getAuthenticatedUser(),
      getLocataireAuthUser(),
      getAdminMe(),
    ])
      .then((result) => {
        if (!mounted) return;
        setUser(result as User);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const canonicalPath = useMemo(() => (user ? buildUserDashboardPath(user) : null), [user]);

  if (loading) {
    return <Text>Chargement...</Text>;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (canonicalPath && canonicalPath !== `/${identity}`) {
    return <Redirect href={canonicalPath as any} />;
  }

  if (user.role === 'administrateur') {
    return <AdministrateurDashboardView />;
  }

  if (user.role === 'bailleur') {
    return <BailleurDashboardView />;
  }

  return <LocataireBiensScreenView />;
}
