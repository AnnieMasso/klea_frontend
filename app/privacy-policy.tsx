import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const handleGoBackToRegister = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/register');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Politique de confidentialité</Text>
          <Text style={styles.text}>
            Klea collecte uniquement les informations nécessaires à la création et à la gestion de votre compte, ainsi qu’à l’amélioration de nos services.
          </Text>
          <Text style={styles.text}>
            Vos données sont utilisées pour valider votre inscription, sécuriser votre accès et vous fournir les services proposés par l’application.
          </Text>
          <Text style={styles.text}>
            Nous ne partageons pas vos informations personnelles avec des tiers, sauf si cela est nécessaire pour fournir un service demandé ou si la loi l’exige.
          </Text>
          <Text style={styles.text}>
            Vous pouvez à tout moment demander l’accès, la correction ou la suppression de vos données en nous contactant via l’application.
          </Text>

          <Pressable style={styles.button} onPress={handleGoBackToRegister}>
            <Text style={styles.buttonText}>Retour à l’inscription</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F4EE',
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E4DCCF',
  },
  title: {
    color: '#10322F',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  text: {
    color: '#4E6A63',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#E9A23B',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#10322F',
    fontWeight: '700',
  },
});