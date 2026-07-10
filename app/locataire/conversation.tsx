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
    CURRENT_LOCATAIRE_ID,
    getContratById,
    getConversationsForParticipant,
    sendMessageToConversation,
    signContrat,
    subscribeBiens,
    type ConversationLigne,
} from '@/utils/biens-store';

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

  const [conversations, setConversations] = useState<ConversationLigne[]>(() =>
    getConversationsForParticipant(CURRENT_LOCATAIRE_ID),
  );
  const [selectedConversationId, setSelectedConversationId] = useState(requestedConversationId);
  const [draft, setDraft] = useState('');

  const refresh = () => setConversations(getConversationsForParticipant(CURRENT_LOCATAIRE_ID));

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeBiens(refresh);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (selectedConversationId && !conversations.some((item) => item.id === selectedConversationId)) {
      setSelectedConversationId('');
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    if (!requestedConversationId) return;
    setSelectedConversationId(requestedConversationId);
  }, [requestedConversationId]);

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) ?? null;

  const handleSendMessage = () => {
    if (!selectedConversation) return;
    const ok = sendMessageToConversation(selectedConversation.id, draft, CURRENT_LOCATAIRE_ID);
    if (!ok) return;
    setDraft('');
  };

  const handleSignerContrat = (contratId: string, bienId: string) => {
    if (!ensureLocataireVerifie()) return;
    const ok = signContrat(bienId, contratId);
    if (ok) Alert.alert('Contrat signe', 'Vous avez signe le contrat avec succes.');
  };

  const handleOpenConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setDraft('');
  };

  const handleBackToList = () => {
    setSelectedConversationId('');
    setDraft('');
  };

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

          <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesColumn} showsVerticalScrollIndicator>
            {selectedConversation.messages.map((message) => {
              const isMine = message.auteurRole === 'locataire';
              const contract = message.type === 'contract' && message.contractId ? getContratById(message.contractId, selectedConversation.bienId) : null;
              const canSigner = Boolean(contract && contract.etat === 'en_attente');
              const canPayer = Boolean(contract && contract.etat === 'signe');
              return (
                <View key={message.id} style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
                  <View style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
                    <Text style={styles.messageAuthor}>{message.auteurNom}</Text>
                    {contract ? (
                      <View style={styles.contractMessageBody}>
                        <Text style={styles.messageContent}>{message.contenu}</Text>
                        <Text style={styles.contractMeta}>Type: {contract.typeContrat === 'indetermine' ? 'Contrat a duree indeterminee' : 'Contrat a duree determinee'}</Text>
                        <Text style={styles.contractMeta}>Etat: {contract.etat === 'en_attente' ? 'En attente' : contract.etat === 'signe' ? 'Signe' : 'Annule'}</Text>
                        <Text style={styles.contractMeta}>Loyer: {contract.montant.toLocaleString('fr-FR')} FCFA</Text>
                        {contract.conditions.length > 0 ? contract.conditions.map((condition, index) => (
                          <Text key={`${contract.id}-cond-${index}`} style={styles.contractCondition}>• {condition.description}</Text>
                        )) : null}
                        {canSigner ? (
                          <KleaButton
                            title="Signer le contrat"
                            onPress={() => handleSignerContrat(contract.id, selectedConversation.bienId)}
                            style={styles.contractActionButton}
                          />
                        ) : null}
                        {canPayer ? (
                          <KleaButton
                            title="Effectuer le paiement"
                            onPress={() => router.push(`/locataire/paiements?contratId=${contract.id}` as any)}
                            style={styles.contractActionButton}
                          />
                        ) : null}
                      </View>
                    ) : (
                      <>
                        <Text style={styles.messageContent}>{message.contenu}</Text>
                        <Text style={styles.messageDate}>{formatMessageDate(message.date)}</Text>
                      </>
                    )}
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
          <KleaButton title="Envoyer" onPress={handleSendMessage} disabled={!draft.trim()} />
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
  contractMessageBody: {
    gap: 6,
  },
  contractMeta: {
    color: KleaColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  contractCondition: {
    color: KleaColors.primary,
    fontSize: 12,
    lineHeight: 18,
  },
  contractActionButton: {
    marginTop: 6,
  },
  threadScreenContent: {
    flex: 1,
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
  },
  messageRowMine: {
    alignItems: 'flex-end',
  },
  messageRowOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    width: '88%',
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
