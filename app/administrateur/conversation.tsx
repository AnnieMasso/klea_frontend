import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { KleaColors } from '@/constants/theme';
import {
    CURRENT_ADMIN_ID,
    getConversationsForParticipant,
    sendMessageToConversation,
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

export default function AdminConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const requestedConversationId = typeof params.conversationId === 'string' ? params.conversationId : '';

  const [conversations, setConversations] = useState<ConversationLigne[]>(() => getConversationsForParticipant(CURRENT_ADMIN_ID));
  const [selectedConversationId, setSelectedConversationId] = useState(requestedConversationId);
  const [draft, setDraft] = useState('');

  const refresh = () => setConversations(getConversationsForParticipant(CURRENT_ADMIN_ID));

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
    const ok = sendMessageToConversation(selectedConversation.id, draft, CURRENT_ADMIN_ID);
    if (!ok) return;
    setDraft('');
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
      <AdminScreenShell title="Messagerie" subtitle={selectedConversation.bienTitre} contentStyle={styles.threadScreenContent}>
        <KleaCard style={styles.threadCard}>
          <View style={styles.threadHeaderRow}>
            <Pressable onPress={handleBackToList} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={KleaColors.primary} />
            </Pressable>
            <Image source={profileImageSource} style={styles.threadProfileImage} />
            <View style={styles.threadHeaderTextBlock}>
              <Pressable onPress={() => router.push(`/administrateur/bien/${selectedConversation.bienId}` as any)}>
                <Text style={styles.threadTitle}>{selectedConversation.bienTitre}</Text>
              </Pressable>
              <Text style={styles.metaLine}>Locataire: {selectedConversation.locataireNom}</Text>
            </View>
          </View>

          <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesColumn} showsVerticalScrollIndicator>
            {selectedConversation.messages.map((message) => {
              const isMine = message.auteurRole === 'administrateur';
              return (
                <View key={message.id} style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
                  <View style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
                    <Text style={styles.messageAuthor}>{message.auteurNom}</Text>
                    <Text style={[styles.messageContent, isMine ? styles.messageContentMine : styles.messageContentOther]}>{message.contenu}</Text>
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
          <KleaButton title="Envoyer" onPress={handleSendMessage} disabled={!draft.trim()} />
        </KleaCard>
      </AdminScreenShell>
    );
  }

  return (
    <AdminScreenShell title="Messagerie" subtitle="Echanges avec les locataires">
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
              <Text style={styles.metaLine}>Locataire: {conversation.locataireNom}</Text>
              <Text style={styles.previewText} numberOfLines={1}>{conversation.lastMessage}</Text>
            </View>
          </Pressable>
        ))}
      </KleaCard>
    </AdminScreenShell>
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
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  previewText: {
    color: KleaColors.textMuted,
    fontSize: 12,
  },
  dateText: {
    color: KleaColors.textMuted,
    fontSize: 11,
  },
  metaLine: {
    color: KleaColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  threadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5EFE4',
  },
  threadProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  threadHeaderTextBlock: {
    flex: 1,
    gap: 2,
  },
  threadTitle: {
    color: KleaColors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesColumn: {
    paddingBottom: 12,
    gap: 10,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  messageBubbleMine: {
    backgroundColor: KleaColors.primary,
  },
  messageBubbleOther: {
    backgroundColor: '#F5EFE4',
  },
  messageAuthor: {
    color: KleaColors.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  messageContent: {
    fontSize: 13,
    lineHeight: 20,
  },
  messageContentMine: {
    color: KleaColors.surface,
  },
  messageContentOther: {
    color: KleaColors.primary,
  },
  messageDate: {
    color: KleaColors.textMuted,
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  messageInput: {
    marginTop: 12,
    marginBottom: 10,
  },
});
