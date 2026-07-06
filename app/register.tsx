import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import {
    getRegistrationDraft,
    initialRegistrationForm,
    resetRegistrationDraft,
    updateRegistrationDraft,
} from '../utils/registration-draft';

const roleOptions = [
  { label: 'Sélectionnez un rôle', value: '' },
  { label: 'Locataire', value: 'locataire' },
  { label: 'Bailleur', value: 'bailleur' },
];

const passwordRequirements = [
  { label: '8 caractères minimum', test: (value: string) => value.length >= 8 },
  { label: 'Une majuscule', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Une minuscule', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Un chiffre', test: (value: string) => /\d/.test(value) },
  { label: 'Un caractère spécial', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

const getPasswordStrength = (value: string) => {
  const metRequirements = passwordRequirements.filter((requirement) => requirement.test(value)).length;

  if (!value) {
    return { label: 'Très faible', color: '#C94D3C', score: 0 };
  }

  if (metRequirements <= 2) {
    return { label: 'Faible', color: '#C94D3C', score: 1 };
  }

  if (metRequirements <= 4) {
    return { label: 'Moyen', color: '#E9A23B', score: 2 };
  }

  return { label: 'Fort', color: '#2F8F5E', score: 3 };
};

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialRegistrationForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);

  const showStep2 = form.role !== 'admin';
  const showAssuranceField = form.role === 'locataire';
  const passwordStrength = getPasswordStrength(form.password);

  useEffect(() => {
    const draft = getRegistrationDraft();
    setStep(draft.step);
    setForm(draft.form);
  }, []);

  useEffect(() => {
    updateRegistrationDraft({ step, form });
  }, [step, form]);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateStep1 = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.nom.trim()) nextErrors.nom = 'Veuillez saisir votre nom.';
    if (!form.email.trim()) nextErrors.email = 'Veuillez saisir votre email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Email invalide.';
    if (!form.role) nextErrors.role = 'Veuillez sélectioner un role.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return false;
    return true;
  };

  const validateStep3 = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.password.trim()) {
      nextErrors.password = 'Veuillez saisir un mot de passe.';
    } else {
      const meetsRequirements = passwordRequirements.every((requirement) => requirement.test(form.password));
      if (!meetsRequirements) {
        nextErrors.password = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.';
      }
    }

    if (!form.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Veuillez confirmez votre mot de passe.';
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    }

    if (!form.privacyAccepted) {
      nextErrors.privacyAccepted = 'Vous devez accepter la politique de confidentialité.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return false;
    return true;
  };

  const pickImage = async (field: 'cniVerso' | 'cniRecto') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission requise', 'Veuillez autoriser l’accès à vos photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      updateField(field, result.assets[0].uri);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets?.[0]?.name) {
      updateField('assuranceHabitation', result.assets[0].name);
    }
  };

  const handleSubmit = () => {
    if (!validateStep3()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      resetRegistrationDraft();
      Alert.alert('Inscription réussie', 'Votre compte a été préparé avec succès.');
      if (form.role === 'bailleur') {
        router.replace('/bailleur');
      } else {
        router.replace('/login');
      }
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerCard}>
          <Image
            source={require('../assets/images/klea-logo-horizontal-color.svg')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.title}>Créer votre compte</Text>
          <Text style={styles.subtitle}>Inscription en 3 étapes simple et sécurisée.</Text>
        </View>

        <View style={styles.stepper}>
          {[1, 2, 3].map((item) => {
            const active = item <= step;
            const isCurrent = item === step;
            return (
              <View key={item} style={styles.stepItem}>
                <View style={[styles.stepCircle, active && styles.stepCircleActive, isCurrent && styles.stepCircleCurrent]}>
                  <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{item}</Text>
                </View>
                <Text style={styles.stepLabel}>{item === 1 ? 'Infos' : item === 2 ? 'Documents' : 'Sécurité'}</Text>
              </View>
            );
          })}
        </View>

        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Étape 1 · Informations principales</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  value={form.nom}
                  onChangeText={(value) => updateField('nom', value)}
                  placeholder="Entrez votre nom"
                  placeholderTextColor="#8A9C96"
                />
                <Ionicons name="person-outline" size={18} color="#8A9C96" style={styles.inputIcon} />
              </View>
              {errors.nom ? <Text style={styles.errorText}>{errors.nom}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prénom </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  value={form.prenom}
                  onChangeText={(value) => updateField('prenom', value)}
                  placeholder="Entrez votre prénom"
                  placeholderTextColor="#8A9C96"
                />
                <Ionicons name="person-outline" size={18} color="#8A9C96" style={styles.inputIcon} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  value={form.email}
                  onChangeText={(value) => updateField('email', value)}
                  placeholder="email@exemple.com"
                  placeholderTextColor="#8A9C96"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Ionicons name="mail-outline" size={18} color="#8A9C96" style={styles.inputIcon} />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rôle</Text>
              <Pressable style={styles.pickerWrapper} onPress={() => setShowRolePicker(true)}>
                <Text style={styles.pickerValue}>
                  {roleOptions.find((option) => option.value === form.role)?.label ?? 'Sélectionnez un rôle'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#10322F" />
              </Pressable>
              {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}

              <Modal transparent visible={showRolePicker} animationType="fade" onRequestClose={() => setShowRolePicker(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowRolePicker(false)}>
                  <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Choisir un rôle</Text>
                    {roleOptions
                      .filter((option) => option.value)
                      .map((option) => (
                        <Pressable
                          key={option.value}
                          style={styles.optionItem}
                          onPress={() => {
                            updateField('role', option.value);
                            setShowRolePicker(false);
                          }}
                        >
                          <Text style={styles.optionText}>{option.label}</Text>
                        </Pressable>
                      ))}
                  </View>
                </Pressable>
              </Modal>
            </View>

            <Pressable style={styles.primaryButton} onPress={() => { if (validateStep1()) setStep(showStep2 ? 2 : 3); }}>
              <Text style={styles.primaryButtonText}>Continuer</Text>
            </Pressable>

            <Link href="/login" asChild>
              <Pressable style={styles.secondaryLink}>
                <Text style={styles.secondaryLinkText}>J’ai déjà un compte</Text>
              </Pressable>
            </Link>
          </View>
        )}

        {step === 2 && showStep2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Étape 2 · Documents complémentaires</Text>
            <Text style={styles.helperText}>Veuillez fournir votre carte d'identité et une assurance habitation si vous en avez</Text>
            <View style={styles.uploadCard}>
              <Text style={styles.uploadTitle}>CNI recto</Text>
              <Pressable style={styles.uploadButton} onPress={() => pickImage('cniVerso')}>
                <Ionicons name="cloud-upload-outline" size={18} color="#10322F" />
                <Text style={styles.uploadButtonText}>Choisir une photo</Text>
              </Pressable>
              {form.cniVerso ? <Text style={styles.fileName}>Sélection : {form.cniVerso.split('/').pop()}</Text> : null}
            </View>

            <View style={styles.uploadCard}>
              <Text style={styles.uploadTitle}>CNI versorecto</Text>
              <Pressable style={styles.uploadButton} onPress={() => pickImage('cniRecto')}>
                <Ionicons name="cloud-upload-outline" size={18} color="#10322F" />
                <Text style={styles.uploadButtonText}>Choisir une photo</Text>
              </Pressable>
              {form.cniRecto ? <Text style={styles.fileName}>Sélection : {form.cniRecto.split('/').pop()}</Text> : null}
            </View>

            {showAssuranceField ? (
              <View style={styles.uploadCard}>
                <Text style={styles.uploadTitle}>Assurance habitation</Text>
                <Pressable style={styles.uploadButton} onPress={pickDocument}>
                  <Ionicons name="document-outline" size={18} color="#10322F" />
                  <Text style={styles.uploadButtonText}>Ajouter un fichier</Text>
                </Pressable>
                {form.assuranceHabitation ? <Text style={styles.fileName}>Sélection : {form.assuranceHabitation}</Text> : null}
              </View>
            ) : null}

            <View style={styles.buttonStack}>
              <Pressable style={styles.secondaryButton} onPress={() => setStep(1)}>
                <Text style={styles.secondaryButtonText}>Précédent</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={() => setStep(3)}>
                <Text style={styles.primaryButtonText}>Continuer</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Étape 3 · Sécurité</Text>
            <Text style={styles.helperText}>Définissez un mot de passe pour finaliser l’inscription.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  value={form.password}
                  onChangeText={(value) => updateField('password', value)}
                  placeholder="••••••••"
                  placeholderTextColor="#8A9C96"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Ionicons name="lock-closed-outline" size={18} color="#8A9C96" style={styles.inputIcon} />
              </View>
              <View style={styles.strengthCard}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthLabel}>Sécurité du mot de passe</Text>
                  <Text style={[styles.strengthValue, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
                </View>
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { width: `${(passwordStrength.score / 3) * 100}%`, backgroundColor: passwordStrength.color }]} />
                </View>
                {passwordRequirements.map((requirement) => {
                  const isMet = requirement.test(form.password);
                  return (
                    <View key={requirement.label} style={styles.requirementRow}>
                      <Ionicons name={isMet ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={isMet ? '#2F8F5E' : '#8A9C96'} />
                      <Text style={[styles.requirementText, isMet && styles.requirementTextMet]}>{requirement.label}</Text>
                    </View>
                  );
                })}
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  value={form.confirmPassword}
                  onChangeText={(value) => updateField('confirmPassword', value)}
                  placeholder="••••••••"
                  placeholderTextColor="#8A9C96"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Ionicons name="lock-closed-outline" size={18} color="#8A9C96" style={styles.inputIcon} />
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            <View style={styles.privacyBox}>
              <Pressable style={styles.privacyRow} onPress={() => updateField('privacyAccepted', !form.privacyAccepted)}>
                <View style={[styles.checkbox, form.privacyAccepted && styles.checkboxChecked]}>
                  {form.privacyAccepted ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                </View>
                <Text style={styles.privacyText}>J’accepte la </Text>
                <Link href="/privacy-policy" asChild>
                  <Pressable>
                    <Text style={styles.privacyLink}>politique de confidentialité</Text>
                  </Pressable>
                </Link>
              </Pressable>
              {errors.privacyAccepted ? <Text style={styles.errorText}>{errors.privacyAccepted}</Text> : null}
            </View>

            <View style={styles.buttonStack}>
              <Pressable style={styles.secondaryButton} onPress={() => setStep(2)}>
                <Text style={styles.secondaryButtonText}>Précédent</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={isSubmitting}>
                <Text style={styles.primaryButtonText}>{isSubmitting ? 'En cours…' : 'Créer mon compte'}</Text>
              </Pressable>
            </View>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F4EE',
    paddingTop: 12,
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E4DCCF',
    shadowColor: '#10322F',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  logo: {
    width: 130,
    height: 36,
    marginBottom: 12,
  },
  eyebrow: {
    color: '#E9A23B',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#10322F',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#4E6A63',
    fontSize: 15,
    lineHeight: 22,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DDE7E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#E9A23B',
  },
  stepCircleCurrent: {
    borderWidth: 2,
    borderColor: '#F6F2EA',
  },
  stepNumber: {
    color: '#10322F',
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    color: '#4E6A63',
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9E2D8',
    shadowColor: '#10322F',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTitle: {
    color: '#10322F',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  helperText: {
    color: '#4E6A63',
    fontSize: 13,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#10322F',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5E0DB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FCFBF8',
    color: '#10322F',
  },
  inputWithIcon: {
    paddingRight: 44,
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: 13,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#D5E0DB',
    borderRadius: 14,
    backgroundColor: '#FCFBF8',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerValue: {
    color: '#10322F',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 50, 47, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
  },
  modalTitle: {
    color: '#10322F',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  optionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E2D8',
  },
  optionText: {
    color: '#10322F',
    fontSize: 15,
  },
  errorText: {
    color: '#C94D3C',
    fontSize: 12,
    marginTop: 4,
  },
  strengthCard: {
    backgroundColor: '#F0F5F3',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#DCE8E3',
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    color: '#10322F',
    fontWeight: '600',
    fontSize: 13,
  },
  strengthValue: {
    fontWeight: '700',
    fontSize: 13,
  },
  strengthBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#DDE7E2',
    overflow: 'hidden',
    marginBottom: 8,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 999,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  requirementText: {
    color: '#4E6A63',
    fontSize: 12,
    marginLeft: 6,
  },
  requirementTextMet: {
    color: '#2F8F5E',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#E9A23B',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#10322F',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryLink: {
    marginTop: 12,
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: '#14463D',
    fontWeight: '600',
  },
  privacyBox: {
    marginTop: 4,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F7F4EE',
    borderWidth: 1,
    borderColor: '#E4DCCF',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#C4D4CE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#2F8F5E',
    borderColor: '#2F8F5E',
  },
  privacyText: {
    color: '#4E6A63',
    fontSize: 13,
  },
  privacyLink: {
    color: '#14463D',
    fontWeight: '700',
    fontSize: 13,
  },
  uploadCard: {
    backgroundColor: '#FCFBF8',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E0D3',
  },
  uploadTitle: {
    color: '#10322F',
    fontWeight: '700',
    marginBottom: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7F4EE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  uploadButtonText: {
    color: '#10322F',
    fontWeight: '600',
  },
  fileName: {
    color: '#4E6A63',
    fontSize: 12,
    marginTop: 8,
  },
  buttonStack: {
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: '#DDE7E2',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#10322F',
    fontWeight: '700',
  },
});