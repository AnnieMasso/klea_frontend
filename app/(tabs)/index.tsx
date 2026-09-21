import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/maison.jpg')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
      />
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.logoBlock}>
              <Image
                source={require('@/assets/images/klea-icon-app.svg')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>

            <View style={styles.contentBlock}>
              <Text style={styles.title}>Votre expérience de location, simplifiée.</Text>
              <Text style={styles.subtitle}>
                Gérez vos logements, vos documents et vos démarches en toute confiance depuis un seul espace.
              </Text>

              <View style={styles.actions}>
                <Pressable style={styles.primaryButton} onPress={() => router.push('/register')}>
                  <Text style={styles.primaryButtonText}>Créer un compte</Text>
                </Pressable>

                <Pressable style={styles.secondaryButton} onPress={() => router.push('/login')}>
                  <Text style={styles.secondaryButtonText}>Se connecter</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Sécurisé</Text>
              <Text style={styles.infoText}>Vos documents et accès sont protégés au sein d’un espace fiable.</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Rapide</Text>
              <Text style={styles.infoText}>Accédez à vos démarches en quelques secondes, où que vous soyez.</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Clair</Text>
              <Text style={styles.infoText}>Une interface simple, moderne et pensée pour vous accompagner.</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10322F',
  },
  safeArea: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 50, 47, 0.72)',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  logoBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D3',
  },
  logo: {
    width: 220,
    height: 66,
  },
  contentBlock: {
    gap: 10,
    backgroundColor: '#F7F4EE',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E0D3',
  },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(228, 220, 207, 0.85)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
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
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
    lineHeight: 34,
  },
  subtitle: {
    color: '#4E6A63',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  actions: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#E9A23B',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#10322F',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#DDE7E2',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#10322F',
    fontWeight: '700',
    fontSize: 15,
  },
  infoGrid: {
    marginTop: 18,
    gap: 12,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(228, 220, 207, 0.85)',
  },
  infoTitle: {
    color: '#10322F',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    color: '#4E6A63',
    fontSize: 13,
    lineHeight: 20,
  },
});
