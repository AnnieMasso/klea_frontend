import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { KleaColors, KleaRadius } from '@/constants/theme';
import {
    getAllBailleurAccounts,
    getAllLocataireAccounts,
    getAllSignalementsUtilisateur,
    sendAvertissementLocataire,
    setLocataireBanni,
    subscribeBiens,
} from '@/utils/biens-store';
import { resolveImageSource } from '@/utils/local-photos';

export default function AdminSignalementsScreen() {
  const router = useRouter();
  const [, forceRefresh] = useState(0);
  const [openFormId, setOpenFormId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = subscribeBiens(() => forceRefresh((value) => value + 1));
    return unsubscribe;
  }, []);

  const signalements = getAllSignalementsUtilisateur();
  const locataires = getAllLocataireAccounts();
  const bailleurs = getAllBailleurAccounts();

  const comptes = useMemo(
    () => ({
      locataires,
      bailleurs,
    }),
    [bailleurs, locataires],
  );

  const resolveCompte = (id?: string, roleHint?: 'locataire' | 'bailleur') => {
    if (!id) return null;

    if (roleHint === 'locataire') {
      const locataire = comptes.locataires.find((item) => item.id === id);
      return locataire ? { role: 'locataire' as const, id: locataire.id, nom: `${locataire.prenom} ${locataire.nom}`, email: locataire.email, banni: locataire.banni } : null;
    }

    if (roleHint === 'bailleur') {
      const bailleur = comptes.bailleurs.find((item) => item.id === id);
      return bailleur ? { role: 'bailleur' as const, id: bailleur.id, nom: `${bailleur.prenom} ${bailleur.nom}`, email: bailleur.email, banni: false } : null;
    }

    const locataire = comptes.locataires.find((item) => item.id === id);
    if (locataire) {
      return { role: 'locataire' as const, id: locataire.id, nom: `${locataire.prenom} ${locataire.nom}`, email: locataire.email, banni: locataire.banni };
    }

    const bailleur = comptes.bailleurs.find((item) => item.id === id);
    if (bailleur) {
      return { role: 'bailleur' as const, id: bailleur.id, nom: `${bailleur.prenom} ${bailleur.nom}`, email: bailleur.email, banni: false };
    }

    return null;
  };

  const handleAvertir = (auteurId: string) => {
    const message = (messages[auteurId] ?? '').trim();
    if (!message) {
      Alert.alert('Message requis', 'Veuillez saisir un message d\'avertissement.');
      return;
    }
    sendAvertissementLocataire(auteurId, message);
    setMessages((prev) => ({ ...prev, [auteurId]: '' }));
    setOpenFormId(null);
    Alert.alert('Avertissement envoye', 'Le locataire a ete notifie.');
  };

  return (
    <AdminScreenShell title="Signalements" subtitle="">
      {signalements.length === 0 ? (
        <KleaCard><Text style={styles.emptyText}>Aucun signalement enregistre.</Text></KleaCard>
      ) : null}

      {signalements.map((signalement) => {
        const auteur = resolveCompte(signalement.auteurId);
        const utilisateurSignale = resolveCompte(signalement.utilisateurSignaleId, signalement.utilisateurSignaleRole);

        return (
          <KleaCard key={signalement.id} style={styles.card}>
            <Text style={styles.title}>Signalement utilisateur</Text>
            <View style={styles.userBlock}>
              <Text style={styles.userBlockTitle}>Signaleur</Text>
              <Text style={styles.line}>{auteur ? auteur.nom : signalement.auteurId}</Text>
              {auteur?.email ? <Text style={styles.line}>{auteur.email}</Text> : null}
              {auteur ? <Text style={styles.line}>Role: {auteur.role}</Text> : null}
              {auteur ? (
                <KleaButton
                  title="Voir les details"
                  variant="secondary"
                  onPress={() => router.push((auteur.role === 'locataire' ? `/administrateur/locataire/${auteur.id}` : `/administrateur/bailleur/${auteur.id}`) as any)}
                  style={styles.actionButton}
                />
              ) : null}
            </View>

            <View style={styles.userBlock}>
              <Text style={styles.userBlockTitle}>Utilisateur signale</Text>
              <Text style={styles.line}>{utilisateurSignale ? utilisateurSignale.nom : signalement.utilisateurSignaleId ?? '-'}</Text>
              {utilisateurSignale?.email ? <Text style={styles.line}>{utilisateurSignale.email}</Text> : null}
              {utilisateurSignale ? <Text style={styles.line}>Role: {utilisateurSignale.role}</Text> : null}
              {utilisateurSignale ? (
                <KleaButton
                  title="Voir les details"
                  variant="secondary"
                  onPress={() => router.push((utilisateurSignale.role === 'locataire' ? `/administrateur/locataire/${utilisateurSignale.id}` : `/administrateur/bailleur/${utilisateurSignale.id}`) as any)}
                  style={styles.actionButton}
                />
              ) : null}
            </View>

            <Text style={styles.line}>{new Date(signalement.date).toLocaleString('fr-FR')}</Text>
            <Text style={styles.motif}>{signalement.motif}</Text>
            {auteur?.role === 'locataire' && auteur.banni ? <Text style={styles.banniLine}>Ce locataire est banni</Text> : null}

            {signalement.preuve1 || signalement.preuve2 ? (
              <View style={styles.preuvesRow}>
                {signalement.preuve1 ? (
                  <Image source={resolveImageSource(signalement.preuve1)} style={styles.preuveImage} resizeMode="cover" />
                ) : null}
                {signalement.preuve2 ? (
                  <Image source={resolveImageSource(signalement.preuve2)} style={styles.preuveImage} resizeMode="cover" />
                ) : null}
              </View>
            ) : null}

            {auteur?.role === 'locataire' ? (
              <>
                {auteur.banni ? (
                  <KleaButton
                    title="Debannir"
                    variant="secondary"
                    onPress={() => setLocataireBanni(auteur.id, false)}
                    style={styles.actionButton}
                  />
                ) : (
                  <KleaButton
                    title="Bannir l'auteur"
                    variant="ghost"
                    onPress={() => setLocataireBanni(auteur.id, true)}
                    style={styles.actionButton}
                  />
                )}

                {openFormId === signalement.id ? (
                  <View style={styles.formBlock}>
                    <KleaInput
                      placeholder="Message d'avertissement"
                      value={messages[auteur.id] ?? ''}
                      onChangeText={(text) => setMessages((prev) => ({ ...prev, [auteur.id]: text }))}
                      multiline
                    />
                    <KleaButton title="Envoyer l'avertissement" onPress={() => handleAvertir(auteur.id)} style={styles.actionButton} />
                  </View>
                ) : (
                  <KleaButton
                    title="Avertir"
                    variant="ghost"
                    onPress={() => setOpenFormId(signalement.id)}
                    style={styles.actionButton}
                  />
                )}
              </>
            ) : null}
          </KleaCard>
        );
      })}
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 4,
  },
  title: {
    color: KleaColors.secondary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  line: {
    color: KleaColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  motif: {
    color: KleaColors.primary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  userBlock: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KleaColors.border,
  },
  userBlockTitle: {
    color: KleaColors.secondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  banniLine: {
    color: '#B23128',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  preuvesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  preuveImage: {
    width: 100,
    height: 100,
    borderRadius: KleaRadius.md,
  },
  formBlock: {
    marginTop: 8,
  },
  actionButton: {
    marginTop: 8,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
});
