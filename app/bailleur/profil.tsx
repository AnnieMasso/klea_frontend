import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors } from '@/constants/theme';


const semantic = {
  success: '#0F7048',
  successBg: '#E5F4ED',
  warning: '#8A5A14',
  warningBg: '#FBF0DD',
  error: '#B23128',
  errorBg: '#FBE9E7',
  accentSoft: '#FBEFD7',
};

type BailleurProfile = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  statut: boolean; // true = compte vérifié par l'administrateur
  cniRecto: string;
  cniVerso: string;
  assuranceHabitation: string;
};

const initialProfile: BailleurProfile = {
  id: '',
  nom: 'Masso',
  prenom: 'Annie',
  email: 'anniemasso@example.com',
  statut: true,
  cniRecto: 'cni_recto.jpg',
  cniVerso: 'cni_verso.jpg',
  assuranceHabitation: 'assurance_habitation_2026.pdf',
};

type DocKey = 'cniRecto' | 'cniVerso';

export default function BailleurProfileScreen() {
  const [profile, setProfile] = useState<BailleurProfile>(initialProfile);
  const [form, setForm] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [DeleteConfirmMDP, setDeleteConfirmMDP] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const initials = `${profile.prenom.charAt(0)}${profile.nom.charAt(0)}`.toUpperCase();
  const canDelete = DeleteConfirmMDP !== '';

  const docLabels: Record<DocKey, string> = {
    cniRecto: 'CNI recto',
    cniVerso: 'CNI verso',
  };

  const updateField = (field: keyof BailleurProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const startEditing = () => {
    setForm(profile);
    setErrors({});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setForm(profile);
    setErrors({});
    setIsEditing(false);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.nom.trim()) nextErrors.nom = 'Le nom est requis.';
    if (!form.prenom.trim()) nextErrors.prenom = 'Le prénom est requis.';
    if (!form.email.trim()) nextErrors.email = 'L\u2019email est requis.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Email invalide.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveProfile = () => {
    if (!validate()) return;
    setProfile(form);
    setIsEditing(false);
    Alert.alert('Profil mis à jour', 'Vos informations ont été enregistrées avec succès.');
  };

  const pickPhotoDoc = async (field: DocKey) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Veuillez autoriser l\u2019accès à vos photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const name = result.assets[0].uri.split('/').pop() ?? 'document.jpg';
      setForm((prev) => ({ ...prev, [field]: name }));
      setProfile((prev) => ({ ...prev, [field]: name }));
    }
  };

  const pickFileDoc = async (field: DocKey) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]?.name) {
      setForm((prev) => ({ ...prev, [field]: result.assets![0].name }));
      setProfile((prev) => ({ ...prev, [field]: result.assets![0].name }));
    }
  };

  const validatePassword = () => {
    const nextErrors: Record<string, string> = {};
    if (!passwordForm.current.trim()) nextErrors.current = 'Mot de passe actuel requis.';
    if (!passwordForm.next.trim()) nextErrors.next = 'Nouveau mot de passe requis.';
    else if (passwordForm.next.length < 8) nextErrors.next = '8 caractères minimum.';
    if (passwordForm.confirm !== passwordForm.next) nextErrors.confirm = 'Les mots de passe ne correspondent pas.';
    setPasswordErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitPasswordChange = () => {
    if (!validatePassword()) return;
    setPasswordModalOpen(false);
    setPasswordForm({ current: '', next: '', confirm: '' });
    Alert.alert('Mot de passe modifié', 'Votre mot de passe a été mis à jour avec succès.');
  };

  const confirmDeleteAccount = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      router.replace('/login');
    }, 900);
  };

  const statusBadge = useMemo(
    () =>
      profile.statut
        ? { label: 'Compte vérifié', icon: 'shield-checkmark' as const, color: semantic.success, bg: semantic.successBg }
        : { label: 'Vérification en cours', icon: 'time-outline' as const, color: semantic.warning, bg: semantic.warningBg },
    [profile.statut],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={24} color={KleaColors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Mon profil</Text>
          {isEditing ? (
            <Pressable onPress={cancelEditing} hitSlop={10} style={styles.headerBtn}>
              <Text style={styles.headerCancelText}>Annuler</Text>
            </Pressable>
          ) : (
            <Pressable onPress={startEditing} hitSlop={10} style={styles.headerBtn}>
              <Ionicons name="pencil-outline" size={20} color={KleaColors.secondary} />
            </Pressable>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <Text style={styles.profileName}>
              {profile.prenom} {profile.nom}
            </Text>
            <View style={styles.roleRow}>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>Bailleur</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: statusBadge.bg }]}>
                <Ionicons name={statusBadge.icon} size={13} color={statusBadge.color} />
                <Text style={[styles.statusPillText, { color: statusBadge.color }]}>{statusBadge.label}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <KleaCard style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom</Text>
              {isEditing ? (
                <>
                  <TextInput
                    style={styles.input}
                    value={form.nom}
                    onChangeText={(v) => updateField('nom', v)}
                    placeholder="Nom"
                    placeholderTextColor={KleaColors.textMuted}
                  />
                  {errors.nom ? <Text style={styles.errorText}>{errors.nom}</Text> : null}
                </>
              ) : (
                <Text style={styles.valueText}>{profile.nom}</Text>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Prénom</Text>
              {isEditing ? (
                <>
                  <TextInput
                    style={styles.input}
                    value={form.prenom}
                    onChangeText={(v) => updateField('prenom', v)}
                    placeholder="Prénom"
                    placeholderTextColor={KleaColors.textMuted}
                  />
                  {errors.prenom ? <Text style={styles.errorText}>{errors.prenom}</Text> : null}
                </>
              ) : (
                <Text style={styles.valueText}>{profile.prenom}</Text>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              {isEditing ? (
                <>
                  <TextInput
                    style={styles.input}
                    value={form.email}
                    onChangeText={(v) => updateField('email', v)}
                    placeholder="nom@exemple.com"
                    placeholderTextColor={KleaColors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                </>
              ) : (
                <Text style={styles.valueText}>{profile.email}</Text>
              )}
            </View>
          </KleaCard>

          {isEditing && (
            <View style={styles.buttonRow}>
              <Pressable style={styles.secondaryButton} onPress={cancelEditing}>
                <Text style={styles.secondaryButtonText}>Annuler</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={saveProfile}>
                <Text style={styles.primaryButtonText}>Enregistrer</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.sectionTitle}>Carte nationale d'identité</Text>
          <KleaCard style={styles.card}>
            <DocRow
              label={docLabels.cniRecto}
              fileName={profile.cniRecto}
              onReplace={() => pickPhotoDoc('cniRecto')}
            />
            <View style={styles.divider} />
            <DocRow
              label={docLabels.cniVerso}
              fileName={profile.cniVerso}
              onReplace={() => pickPhotoDoc('cniVerso')}
            />
            <View style={styles.divider} />

          </KleaCard>

          <Text style={styles.sectionTitle}>Sécurité</Text>
          <KleaCard style={styles.card}>
            <Pressable style={styles.securityRow} onPress={() => setPasswordModalOpen(true)}>
              <View style={styles.securityIconCircle}>
                <Ionicons name="lock-closed-outline" size={18} color={KleaColors.secondary} />
              </View>
              <View style={styles.securityTextWrap}>
                <Text style={styles.securityTitle}>Mot de passe</Text>
                <Text style={styles.securitySubtitle}>••••••••</Text>
              </View>
              <Text style={styles.securityAction}>Modifier</Text>
            </Pressable>
          </KleaCard>

          <Text style={[styles.sectionTitle, styles.dangerSectionTitle]}>Suppresion de compte</Text>
          <View style={styles.dangerCard}>
            <View style={styles.dangerHeader}>
              <View style={styles.dangerIconCircle}>
                <Ionicons name="warning-outline" size={18} color={semantic.error} />
              </View>
              <Text style={styles.dangerTitle}>Supprimer mon compte</Text>
            </View>
            <Text style={styles.dangerText}>
              Cette action est définitive. Vos biens, contrats, conversations et l'historique de
              paiements liés à ce compte seront supprimés mais pouvont être récupérés.
            </Text>
            <Pressable style={styles.dangerButton} onPress={() => setDeleteModalOpen(true)}>
              <Text style={styles.dangerButtonText}>Supprimer mon compte</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={passwordModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Modifier le mot de passe</Text>
              <Pressable onPress={() => setPasswordModalOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={KleaColors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mot de passe actuel</Text>
              <TextInput
                style={styles.input}
                value={passwordForm.current}
                onChangeText={(v) => setPasswordForm((p) => ({ ...p, current: v }))}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={KleaColors.textMuted}
              />
              {passwordErrors.current ? <Text style={styles.errorText}>{passwordErrors.current}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <TextInput
                style={styles.input}
                value={passwordForm.next}
                onChangeText={(v) => setPasswordForm((p) => ({ ...p, next: v }))}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={KleaColors.textMuted}
              />
              {passwordErrors.next ? <Text style={styles.errorText}>{passwordErrors.next}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
              <TextInput
                style={styles.input}
                value={passwordForm.confirm}
                onChangeText={(v) => setPasswordForm((p) => ({ ...p, confirm: v }))}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={KleaColors.textMuted}
              />
              {passwordErrors.confirm ? <Text style={styles.errorText}>{passwordErrors.confirm}</Text> : null}
            </View>

            <Pressable style={styles.primaryButton} onPress={submitPasswordChange}>
              <Text style={styles.primaryButtonText}>Mettre à jour</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={deleteModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.dangerIconCircleLg}>
              <Ionicons name="warning-outline" size={28} color={semantic.error} />
            </View>
            <Text style={styles.deleteTitle}>Supprimer votre compte ?</Text>
            <Text style={styles.deleteText}>
              Cette action est <Text style={styles.deleteTextBold}>irréversible</Text>. Vous perdrez
              l'accès à vos biens, vos contrats en cours, vos conversations et votre historique de
              paiements.
            </Text>

            <Text style={styles.label}>
              Entrez votre mot de passe pour confirmer la suppression
            </Text>
            <TextInput
              style={styles.input}
              value={DeleteConfirmMDP}
              onChangeText={setDeleteConfirmMDP}
              placeholderTextColor={KleaColors.textMuted}
            />

            <View style={styles.buttonRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  setDeleteModalOpen(false);
                  setDeleteConfirmMDP('');
                }}
              >
                <Text style={styles.secondaryButtonText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.dangerButton, styles.dangerButtonInline, !canDelete && styles.dangerButtonDisabled]}
                onPress={confirmDeleteAccount}
                disabled={!canDelete || isDeleting}
              >
                <Text style={styles.dangerButtonText}>
                  {isDeleting ? 'Suppression…' : 'Supprimer définitivement'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DocRow({
  label,
  fileName,
  onReplace,
  isFile,
}: {
  label: string;
  fileName: string;
  onReplace: () => void;
  isFile?: boolean;
}) {
  const hasFile = Boolean(fileName);
  return (
    <View style={styles.docRow}>
      <View style={[styles.docIconCircle, hasFile ? styles.docIconCircleDone : styles.docIconCircleMissing]}>
        <Ionicons
          name={isFile ? 'document-outline' : 'image-outline'}
          size={18}
          color={hasFile ? semantic.success : semantic.warning}
        />
      </View>
      <View style={styles.docTextWrap}>
        <Text style={styles.docLabel}>{label}</Text>
        <Text style={styles.docStatus} numberOfLines={1}>
          {hasFile ? fileName : 'Document manquant'}
        </Text>
      </View>
      <Pressable onPress={onReplace} hitSlop={8}>
        <Text style={styles.docAction}>{hasFile ? 'Remplacer' : 'Ajouter'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: KleaColors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },

  // ---- Header ----
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: KleaColors.border,
    backgroundColor: KleaColors.surface,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: KleaColors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  headerCancelText: {
    color: KleaColors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },

  // ---- Avatar / identité ----
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: KleaColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitials: {
    color: KleaColors.background,
    fontSize: 28,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: KleaColors.primary,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rolePill: {
    backgroundColor: semantic.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: KleaColors.primary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  profileId: {
    fontSize: 12,
    color: KleaColors.textMuted,
    marginTop: 8,
  },

  // ---- Sections ----
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.3,
    color: KleaColors.textMuted,
    marginBottom: 10,
    marginTop: 4,
  },
  dangerSectionTitle: {
    color: semantic.error,
  },
  card: {
    backgroundColor: KleaColors.surface,
    borderWidth: 1,
    borderColor: KleaColors.border,
    padding: 16,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: KleaColors.border,
    marginVertical: 14,
  },

  // ---- Champs ----
  fieldGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: KleaColors.primary,
    marginBottom: 6,
  },
  valueText: {
    fontSize: 15,
    color: KleaColors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: KleaColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: KleaColors.background,
    color: KleaColors.primary,
    fontSize: 15,
    marginBottom: 4,
  },
  errorText: {
    color: semantic.error,
    fontSize: 12,
    marginTop: 2,
  },

  // ---- Boutons ----
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: KleaColors.secondary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: KleaColors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: KleaColors.surface,
    borderWidth: 1.5,
    borderColor: KleaColors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: KleaColors.primary,
    fontWeight: '700',
    fontSize: 15,
  },

  // ---- Documents ----
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  docIconCircleDone: {
    backgroundColor: semantic.successBg,
  },
  docIconCircleMissing: {
    backgroundColor: semantic.warningBg,
  },
  docTextWrap: {
    flex: 1,
  },
  docLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: KleaColors.primary,
  },
  docStatus: {
    fontSize: 12,
    color: KleaColors.textMuted,
    marginTop: 2,
  },
  docAction: {
    fontSize: 13,
    fontWeight: '700',
    color: KleaColors.secondary,
    flexShrink: 0,
  },

  // ---- Sécurité ----
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: semantic.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTextWrap: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: KleaColors.primary,
  },
  securitySubtitle: {
    fontSize: 13,
    color: KleaColors.textMuted,
    marginTop: 2,
  },
  securityAction: {
    fontSize: 13,
    fontWeight: '700',
    color: KleaColors.secondary,
  },

  // ---- Zone de danger ----
  dangerCard: {
    backgroundColor: semantic.errorBg,
    borderWidth: 1,
    borderColor: semantic.error,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  dangerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: KleaColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: semantic.error,
  },
  dangerText: {
    fontSize: 13,
    lineHeight: 19,
    color: KleaColors.primary,
    marginBottom: 16,
  },
  dangerButton: {
    backgroundColor: semantic.error,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  dangerButtonInline: {
    flex: 1,
  },
  dangerButtonDisabled: {
    opacity: 0.4,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // ---- Modales / bottom sheets ----
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: KleaColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: KleaColors.border,
    padding: 20,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: KleaColors.border,
    marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: KleaColors.primary,
  },

  // ---- Modale suppression ----
  dangerIconCircleLg: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: semantic.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: KleaColors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteText: {
    fontSize: 14,
    lineHeight: 20,
    color: KleaColors.textMuted,
    textAlign: 'center',
    marginBottom: 18,
  },
  deleteTextBold: {
    fontWeight: '700',
    color: KleaColors.primary,
  },
});
