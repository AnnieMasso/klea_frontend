import { Alert } from 'react-native';

import { CURRENT_LOCATAIRE_ID, isLocataireBanni, isLocataireVerified } from '@/utils/biens-store';

export function ensureLocataireVerifie(): boolean {
  if (isLocataireBanni(CURRENT_LOCATAIRE_ID)) {
    Alert.alert('Compte suspendu', "Votre compte a ete suspendu par l'administrateur.");
    return false;
  }
  if (isLocataireVerified(CURRENT_LOCATAIRE_ID)) return true;
  Alert.alert(
    'Compte en attente de validation',
    "Votre compte doit d'abord etre verifie par l'administrateur avant d'effectuer cette action.",
  );
  return false;
}
