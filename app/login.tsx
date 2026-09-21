import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loginUser } from '../utils/auth-api';
import { buildUserDashboardPath } from '../utils/user-route';

export default function LoginScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showFeedback = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.email.trim()) {
      nextErrors.email = 'Veuillez saisir votre email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Email invalide.';
    }

    if (!form.password.trim()) {
      nextErrors.password = 'Veuillez saisir le mot de passe.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const result = await loginUser({
        email: form.email,
        motDePasse: form.password,
      });

      // showFeedback('Connexion réussie', 'Bienvenue dans votre espace Klea.');
      router.replace(buildUserDashboardPath(result.user) as any);
    } catch (error) {
      showFeedback('Erreur', error instanceof Error ? error.message : 'Il s\' produit une erreur lors de la connexion à votre espace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerCard}>
            <Image
              source={require('../assets/images/klea-icon-app.svg')}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>Accédez à votre espace Klea en toute simplicité.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Saisissez vos identifiants pour continuer.</Text>

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
                  autoCorrect={false}
                />
                <Ionicons name="mail-outline" size={18} color="#8A9C96" style={styles.inputIcon} />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

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
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={isSubmitting}>
              <Text style={styles.primaryButtonText}>{isSubmitting ? 'Connexion…' : 'Se connecter'}</Text>
            </Pressable>

            <Link href="/register" asChild>
              <Pressable style={styles.secondaryLink}>
                <Text style={styles.secondaryLinkText}>Créer un compte</Text>
              </Pressable>
            </Link>
          </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
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
    width: 140,
    height: 40,
    marginBottom: 12,
    alignSelf: 'center',
  },
  title: {
    color: '#10322F',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#4E6A63',
    fontSize: 15,
    lineHeight: 22,
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
    marginBottom: 30,
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
  errorText: {
    color: '#C94D3C',
    fontSize: 12,
    marginTop: 4,
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
});