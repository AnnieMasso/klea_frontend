import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { LocataireScreenShell } from '@/components/ui/locataire-screen-shell';
import { KleaColors } from '@/constants/theme';
import { ensureLocataireVerifie } from '@/hooks/use-locataire-guard';
import {
  getLocataireAuthUser,
    getLocataireConversations,
    sendLocataireMessage,
    signLocataireContrat,
    type LocataireConversation,
} from '@/utils/locataire-api';

const profileImageSource = require('../../assets/images/icon.png');

function formatMessageDate(value: string) {
  if (!value) return '-';
  const messageDate = new Date(value);
  const ageInHours = (Date.now() - messageDate.getTime()) / (1000 * 60 * 60);

  if (ageInHours >= 24) {
    return messageDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  return messageDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function LocataireConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const requestedConversationId = typeof params.conversationId === 'string' ? params.conversationId : '';

  const [conversations, setConversations] = useState<LocataireConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(requestedConversationId);
  const [draft, setDraft] = useState('');
  const [myDisplayName, setMyDisplayName] = useState('Locataire');

  const refresh = () => {
    setLoading(true);
    return getLocataireConversations()
      .then((items) => setConversations(items))
      .catch((error) => Alert.alert('Erreur', error instanceof Error ? error.message : 'Chargement impossible.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    let cancelled = false;

    getLocataireAuthUser()
      .then((user) => {
        if (cancelled) return;
        const fullName = [user.prenom ?? '', user.nom ?? ''].map((part) => part.trim()).filter(Boolean).join(' ');
        setMyDisplayName(fullName || user.email || 'Locataire');
      })
      .catch(() => {
        if (!cancelled) setMyDisplayName('Locataire');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (selectedConversationId && !conversations.some((item) => item.id === selectedConversationId)) {
      setSelectedConversationId('');
    }
  }, [loading, conversations, selectedConversationId]);

  useEffect(() => {
    if (loading || !requestedConversationId) return;
    if (conversations.some((item) => item.id === requestedConversationId)) {
      setSelectedConversationId(requestedConversationId);
    }
  }, [loading, requestedConversationId, conversations]);

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) ?? null;

  const handleSendMessage = async () => {
    if (!selectedConversation) return;
    const message = draft.trim();
    if (!message || sending) return;

    setSending(true);
    try {
      await sendLocataireMessage(selectedConversation.id, message);
      setDraft('');
      await refresh();
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Envoi impossible.');
    } finally {
      setSending(false);
    }
  };

  const handleSignerContrat = async (contratId: string) => {
    if (!(await ensureLocataireVerifie())) return;

    try {
      await signLocataireContrat(contratId);
      Alert.alert('Contrat signe', 'Vous avez signe le contrat avec succes.');
      await refresh();
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Signature impossible.');
    }
  };

  const handleOpenConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setDraft('');
  };

  const handleBackToList = () => {
    setSelectedConversationId('');
    setDraft('');
  };

  if (loading && conversations.length === 0) {
    return (
      <LocataireScreenShell title="Messagerie" subtitle="">
        <KleaCard style={styles.card}>
          <Text style={styles.emptyText}>Chargement des conversations...</Text>
        </KleaCard>
      </LocataireScreenShell>
    );
  }

  if (selectedConversation) {
    return (
      <LocataireScreenShell
        title="Messagerie"
        subtitle={selectedConversation.bienTitre}
        scrollEnabled={false}
        contentStyle={styles.threadScreenContent}
      >
        <KleaCard style={styles.threadCard}>
          <View style={styles.threadHeaderRow}>
            <Pressable onPress={handleBackToList} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={KleaColors.primary} />
            </Pressable>
            <Image source={profileImageSource} style={styles.threadProfileImage} />
            <View style={styles.threadHeaderTextBlock}>
              <Pressable onPress={() => router.push(`/locataire/bien/${selectedConversation.bienId}` as any)}>
                <Text style={styles.threadTitle}>{selectedConversation.bienTitre}</Text>
              </Pressable>
              <Text style={styles.metaLine}>Statut du contrat: {selectedConversation.statutContrat}</Text>
            </View>
          </View>

          {selectedConversation.contratId ? (
            <View style={styles.contractPanel}>
              <KleaButton
                title="Consulter le contrat"
                variant="secondary"
                onPress={() => router.push(`/locataire/contrat?contratId=${selectedConversation.contratId}` as any)}
                style={styles.contractActionButton}
              />
              {selectedConversation.contratEtat === 'en_attente' ? (
                <KleaButton
                  title="Signer le contrat"
                  onPress={() => handleSignerContrat(selectedConversation.contratId!)}
                  style={styles.contractActionButton}
                />
              ) : null}
              {selectedConversation.contratEtat === 'signe' ? (
                <KleaButton
                  title="Effectuer le paiement"
                  onPress={() => router.push(`/locataire/paiements?contratId=${selectedConversation.contratId}` as any)}
                  style={styles.contractActionButton}
                />
              ) : null}
            </View>
          ) : null}

          <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesColumn} showsVerticalScrollIndicator>
            {selectedConversation.messages.map((message) => {
              const isMine = message.auteurRole === 'locataire';
              return (
                <View key={message.id} style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
                  <View style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
                    <Text style={styles.messageAuthor}>{isMine ? myDisplayName : message.auteurNom}</Text>
                    <Text style={styles.messageContent}>{message.contenu}</Text>
                    <Text style={styles.messageDate}>{formatMessageDate(message.date)}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <KleaInput
            label=""
            value={draft}
            onChangeText={setDraft}
            placeholder="Ecrivez un message"
            multiline
            numberOfLines={1}
            style={styles.messageInput}
          />
          <KleaButton title={sending ? 'Envoi...' : 'Envoyer'} onPress={handleSendMessage} disabled={!draft.trim() || sending} />
        </KleaCard>
      </LocataireScreenShell>
    );
  }

  return (
    <LocataireScreenShell title="Messagerie" subtitle="">
      <KleaCard style={styles.card}>
        {conversations.length === 0 ? <Text style={styles.emptyText}>Aucune conversation disponible.</Text> : null}
        {conversations.map((conversation) => (
          <Pressable key={conversation.id} style={styles.whatsappItem} onPress={() => handleOpenConversation(conversation.id)}>
            <View style={styles.avatarCircle}>
              <Image source={profileImageSource} style={styles.avatarImage} />
            </View>
            <View style={styles.whatsappBody}>
              <View style={styles.whatsappHeaderRow}>
                <Text style={styles.conversationTitle}>{conversation.bienTitre}</Text>
                <Text style={styles.dateText}>{formatMessageDate(conversation.lastMessageDate)}</Text>
              </View>
              <Text style={styles.previewText} numberOfLines={1}>{conversation.lastMessage}</Text>
            </View>
          </Pressable>
        ))}
      </KleaCard>
    </LocataireScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 4,
  },
  threadCard: {
    marginBottom: 4,
    flex: 1,
  },
  threadScreenContent: {
    flex: 1,
  },
  contractActionButton: {
    marginTop: 2,
  },
  contractPanel: {
    backgroundColor: '#F6FAF7',
    borderWidth: 1,
    borderColor: KleaColors.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
  whatsappItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: KleaColors.border,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: KleaColors.border,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  whatsappBody: {
    flex: 1,
    gap: 2,
  },
  whatsappHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  conversationTitle: {
    color: KleaColors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  metaLine: {
    color: KleaColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  previewText: {
    color: KleaColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  dateText: {
    color: KleaColors.textMuted,
    fontSize: 11,
  },
  threadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  threadHeaderTextBlock: {
    flex: 1,
  },
  threadProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: KleaColors.border,
  },
  backButton: {
    paddingTop: 2,
    paddingHorizontal: 0,
    paddingVertical: 4,
    paddingRight: 6,
  },
  threadTitle: {
    color: KleaColors.primary,
    fontSize: 18,
    fontWeight: '700',
    textDecorationLine: 'underline',
    marginBottom: 8,
  },
  messagesColumn: {
    marginTop: 12,
    marginBottom: 14,
    gap: 10,
    flexGrow: 1,
  },
  messagesScroll: {
    flex: 1,
    minHeight: 180,
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '88%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  messageBubbleMine: {
    backgroundColor: '#E9F0DC',
    borderColor: '#D3DFC0',
  },
  messageBubbleOther: {
    backgroundColor: '#FFFFFF',
    borderColor: KleaColors.border,
  },
  messageAuthor: {
    color: KleaColors.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageContent: {
    color: KleaColors.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  messageDate: {
    color: KleaColors.textMuted,
    fontSize: 11,
    marginTop: 8,
  },
  messageInput: {
    minHeight: 30,
    textAlignVertical: 'top',
  },
});
