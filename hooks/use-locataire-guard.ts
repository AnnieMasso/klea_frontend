import { Alert } from 'react-native';

import { getLocataireAuthUser } from '@/utils/locataire-api';

export async function ensureLocataireVerifie(): Promise<boolean> {
  try {
    const user = await getLocataireAuthUser();

    if (user.role !== 'locataire') {
      Alert.alert('Accès refusé', 'Cette action est réservée aux locataires.');
      return false;
    }

    if (user.statut === 'actif') {
      return true;
    }

    Alert.alert(
      'Compte en attente de validation',
      "Votre compte doit d'abord être vérifié par l'administrateur avant d'effectuer cette action.",
    );
    return false;
  } catch (error) {
    Alert.alert('Erreur', error instanceof Error ? error.message : 'Vérification impossible.');
    return false;
  }
}
