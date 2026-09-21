import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { KleaColors } from '@/constants/theme';
import { resolveImageSource } from '@/utils/local-photos';
import {
  cancelBailleurContrat,
  createBailleurContrat,
	getAuthenticatedUser,
  getBailleurContrats,
  getBailleurConversations,
	getMyBiens,
  sendBailleurMessage,
  type BailleurContrat,
  type BailleurConversation,
} from '@/utils/bailleur-api';

const profileImageSource = require('../../assets/images/icon.png');

function formatMessageDate(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  const ageInHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
  if (ageInHours >= 24) {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function ConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const requestedConversationId = typeof params.conversationId === 'string' ? params.conversationId : '';

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<BailleurConversation[]>([]);
  const [contracts, setContracts] = useState<BailleurContrat[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState(requestedConversationId);
  const [draft, setDraft] = useState('');

  const [showContractForm, setShowContractForm] = useState(false);
  const [contractType, setContractType] = useState<'determine' | 'indetermine'>('determine');
  const [contractDateSignature, setContractDateSignature] = useState(new Date().toISOString().slice(0, 10));
  const [contractMontant, setContractMontant] = useState('');
  const [contractDureeMois, setContractDureeMois] = useState('12');
	const [threadBienPhoto, setThreadBienPhoto] = useState<string | null>(null);
	const [myDisplayName, setMyDisplayName] = useState('Bailleur');

  const refresh = async () => {
    try {
      setLoading(true);
      const [conversationsData, contractsData] = await Promise.all([
        getBailleurConversations(),
        getBailleurContrats(),
      ]);
      setConversations(conversationsData);
      setContracts(contractsData);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!requestedConversationId) return;
    setSelectedConversationId(requestedConversationId);
  }, [requestedConversationId]);

	useEffect(() => {
		let cancelled = false;

		getAuthenticatedUser()
			.then((user) => {
				if (cancelled) return;
				const fullName = [user.prenom ?? '', user.nom ?? ''].map((part) => part.trim()).filter(Boolean).join(' ');
				setMyDisplayName(fullName || user.email || 'Bailleur');
			})
			.catch(() => {
				if (!cancelled) setMyDisplayName('Bailleur');
			});

		return () => {
			cancelled = true;
		};
	}, []);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const selectedContract = useMemo(
    () => contracts.find((item) => item.conversationId === selectedConversation?.id) ?? null,
    [contracts, selectedConversation?.id],
  );

	useEffect(() => {
		let cancelled = false;

		if (!selectedConversation) {
			setThreadBienPhoto(null);
			return undefined;
		}

		getMyBiens()
			.then((items) => {
				if (cancelled) return;
				const bien = items.find((item) => item.id === selectedConversation.bienId);
				setThreadBienPhoto(bien?.image ?? selectedConversation.bienPhoto ?? null);
			})
			.catch(() => {
				if (!cancelled) setThreadBienPhoto(selectedConversation.bienPhoto ?? null);
			});

		return () => {
			cancelled = true;
		};
	}, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!selectedConversation || !draft.trim()) return;
    await sendBailleurMessage(selectedConversation.id, draft.trim());
    setDraft('');
    await refresh();
  };

  const handleCreateContract = async () => {
    if (!selectedConversation) return;
		if (selectedConversation.participantRole !== 'locataire') {
			Alert.alert('Action non autorisee', 'Vous ne pouvez etablir un contrat que pour un locataire.');
			return;
		}
    if (selectedContract && selectedContract.etat === 'signe') {
      Alert.alert('Contrat deja signe', 'Un contrat signe existe deja pour cette conversation.');
      return;
    }

    const montant = Number(contractMontant.replace(/\D/g, ''));
    const duree = Number(contractDureeMois.replace(/\D/g, ''));

    if (!montant || !duree) {
      Alert.alert('Champs invalides', 'Montant et duree sont obligatoires.');
      return;
    }

    await createBailleurContrat({
      conversationId: selectedConversation.id,
      typeContrat: contractType,
      montant,
      dureeMois: duree,
      dateSignature: contractDateSignature,
    });

    setShowContractForm(false);
    await refresh();
    Alert.alert('Contrat cree', 'Le contrat a ete envoye au locataire.');
  };

  const handleCancelContract = async () => {
    if (!selectedContract) return;

		const confirmed = Platform.OS === 'web'
			? window.confirm('Confirmer l’annulation de ce contrat ? Il sera immédiatement marqué comme annulé.')
			: true;

		if (!confirmed) return;

    await cancelBailleurContrat(selectedContract.id);
    await refresh();
    Alert.alert('Contrat annule', 'Le contrat a ete annule.');
  };

  if (selectedConversation) {
    return (
			<BailleurScreenShell
				title="Messagerie"
				subtitle={selectedConversation.participantRole === 'locataire' ? selectedConversation.locataireNom : selectedConversation.participantRole === 'administrateur' ? 'Administrateur' : selectedConversation.locataireNom}
				scrollEnabled={false}
				contentStyle={styles.threadScreenContent}
			>
				<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.threadKeyboardAvoiding}>
					<KleaCard style={styles.threadCard}>
						<View style={styles.threadBody}>
							<ScrollView style={styles.threadScroll} contentContainerStyle={styles.threadScrollContent} showsVerticalScrollIndicator>
								<View style={styles.threadHeaderRow}>
									<Pressable onPress={() => setSelectedConversationId('')} style={styles.backButton}>
										<Ionicons name="arrow-back" size={22} color={KleaColors.primary} />
									</Pressable>
									<Image source={threadBienPhoto ? resolveImageSource(threadBienPhoto) : require('../../assets/images/icon.png')} style={styles.threadProfileImage} />
									<View style={styles.threadHeaderTextBlock}>
										<Pressable onPress={() => router.push(`/bailleur/detail/${selectedConversation.bienId}` as any)}>
											<Text style={styles.threadTitle}>{selectedConversation.bienTitre}</Text>
										</Pressable>
										<Text style={styles.metaLine}>{selectedConversation.participantRole === 'locataire' ? `Locataire: ${selectedConversation.locataireNom}` : selectedConversation.participantRole === 'administrateur' ? 'Interlocuteur: Administrateur' : `Interlocuteur: ${selectedConversation.locataireNom}`}</Text>
										<Text style={styles.metaLine}>Statut contrat: {selectedContract?.etat ?? 'aucun'}</Text>
									</View>
								</View>

								{selectedConversation.participantRole === 'locataire' ? (
									<KleaButton
										title={showContractForm ? 'Fermer le formulaire' : 'Etablir un contrat'}
										variant="secondary"
										onPress={() => setShowContractForm((value) => !value)}
										style={styles.contractButton}
									/>
								) : null}

								{selectedConversation.participantRole === 'locataire' && selectedContract?.etat === 'en_attente' ? (
									<KleaButton
										title="Editer le contrat avant signature"
										variant="secondary"
										onPress={() => router.push(`/bailleur/nouveau_contrat?conversationId=${selectedConversation.id}&contratId=${selectedContract.id}` as any)}
										style={styles.contractButton}
									/>
								) : null}

								{selectedConversation.participantRole === 'locataire' && selectedContract?.etat === 'en_attente' ? (
									<KleaButton title="Annuler le contrat en attente" variant="ghost" onPress={handleCancelContract} style={styles.contractButton} />
								) : null}

								{selectedConversation.participantRole === 'locataire' && showContractForm ? (
									<KleaCard style={styles.contractFormCard}>
										<View style={styles.formField}>
											<Text style={styles.formLabel}>Type de contrat</Text>
											<View style={styles.pickerWrap}>
												<Picker selectedValue={contractType} onValueChange={(value) => setContractType(value)} style={styles.picker}>
													<Picker.Item label="Contrat a duree determinee" value="determine" />
													<Picker.Item label="Contrat a duree indeterminee" value="indetermine" />
												</Picker>
											</View>
										</View>

										<KleaInput label="Date de signature" value={contractDateSignature} onChangeText={setContractDateSignature} placeholder="YYYY-MM-DD" />
										<KleaInput label="Montant du loyer" value={contractMontant} onChangeText={(value) => setContractMontant(value.replace(/\D/g, ''))} keyboardType="numeric" />
										<KleaInput label="Duree (mois)" value={contractDureeMois} onChangeText={(value) => setContractDureeMois(value.replace(/\D/g, ''))} keyboardType="numeric" />
										<KleaButton title="Envoyer le contrat" onPress={handleCreateContract} />
									</KleaCard>
								) : null}

								<View style={styles.messagesList}>
									{selectedConversation.messages.map((message) => {
										const mine = message.auteurRole === 'bailleur';
										const otherDisplayName = message.auteurRole === 'administrateur' ? 'Administrateur' : message.auteurNom;
										return (
											<View key={message.id} style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowOther]}>
												<View style={[styles.messageBubble, mine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
													<Text style={styles.messageAuthor}>{mine ? myDisplayName : otherDisplayName}</Text>
													<Text style={styles.messageContent}>{message.contenu}</Text>
													<Text style={styles.messageDate}>{formatMessageDate(message.date)}</Text>
												</View>
											</View>
										);
									})}
								</View>
							</ScrollView>

							<View style={styles.composerRow}>
								<KleaInput label="" value={draft} onChangeText={setDraft} placeholder="Ecrivez un message" multiline numberOfLines={1} style={styles.messageInput} />
								<KleaButton title="Envoyer" onPress={handleSendMessage} disabled={!draft.trim()} style={styles.sendButton} />
							</View>
						</View>
					</KleaCard>
				</KeyboardAvoidingView>
      </BailleurScreenShell>
    );
  }

  return (
    <BailleurScreenShell title="Messagerie" subtitle="">
      <KleaCard style={styles.card}>
        {loading ? <Text style={styles.emptyText}>Chargement...</Text> : null}
        {!loading && conversations.length === 0 ? <Text style={styles.emptyText}>Aucune conversation disponible.</Text> : null}
        {conversations.map((conversation) => (
          <Pressable key={conversation.id} style={styles.whatsappItem} onPress={() => setSelectedConversationId(conversation.id)}>
            <View style={styles.avatarCircle}>
              <Image source={profileImageSource} style={styles.avatarImage} />
            </View>
            <View style={styles.whatsappBody}>
              <View style={styles.whatsappHeaderRow}>
                <Text style={styles.conversationTitle}>{conversation.bienTitre}</Text>
                <Text style={styles.dateText}>{formatMessageDate(conversation.lastMessageDate)}</Text>
              </View>
              <Text style={styles.metaLine} numberOfLines={1}>{conversation.locataireNom}</Text>
              <Text style={styles.previewText} numberOfLines={1}>{conversation.lastMessage}</Text>
            </View>
          </Pressable>
        ))}
      </KleaCard>
    </BailleurScreenShell>
  );
}

const styles = StyleSheet.create({
	card: {
		marginBottom: 4,
	},
	threadCard: {
		marginBottom: 4,
		flex: 1,
		paddingBottom: 0,
	},
	threadBody: {
		flex: 1,
	},
	threadScroll: {
		flex: 1,
	},
	threadScrollContent: {
		paddingBottom: 12,
	},
	contractFormCard: {
		marginBottom: 10,
	},
	formField: {
		marginBottom: 8,
	},
	formLabel: {
		color: KleaColors.secondary,
		fontSize: 13,
		fontWeight: '700',
		marginBottom: 4,
	},
	pickerWrap: {
		borderWidth: 1,
		borderColor: KleaColors.border,
		borderRadius: 12,
		overflow: 'hidden',
	},
	picker: {
		height: 48,
		color: KleaColors.primary,
	},
	contractButton: {
		marginBottom: 8,
	},
	formHint: {
		color: KleaColors.textMuted,
		fontSize: 12,
		lineHeight: 18,
		marginBottom: 4,
	},
	formField: {
		gap: 6,
	},
	formLabel: {
		color: KleaColors.primary,
		fontSize: 14,
		fontWeight: '600',
	},
	pickerWrap: {
		borderWidth: 1,
		borderColor: KleaColors.border,
		borderRadius: 12,
		overflow: 'hidden',
		backgroundColor: KleaColors.background,
	},
	picker: {
		color: KleaColors.primary,
		backgroundColor: KleaColors.background,
	},
	readonlyInput: {
		opacity: 0.75,
	},
	conditionsHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
		marginTop: 4,
	},
	conditionRow: {
		gap: 6,
		paddingBottom: 4,
		borderBottomWidth: 1,
		borderBottomColor: KleaColors.border,
	},
	conditionActions: {
		alignItems: 'flex-start',
		marginTop: -4,
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
	contractActionRow: {
		flexDirection: 'row',
		gap: 8,
		flexWrap: 'wrap',
		marginTop: 4,
	},
	contractActionButton: {
		paddingVertical: 8,
	},
	threadScreenContent: {
		flex: 1,
		paddingBottom: 148,
	},
	threadKeyboardAvoiding: {
		flex: 1,
	},
	contractButton: {
		marginBottom: 10,
	},
	contractLockedText: {
		color: KleaColors.textMuted,
		fontSize: 12,
		lineHeight: 18,
		marginBottom: 10,
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
		textDecorationLine: 'underline',
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
	messagesList: {
		flex: 1,
		minHeight: 280,
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
		flex: 1,
		minHeight: 30,
		textAlignVertical: 'top',
	},
	composerRow: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 10,
		marginTop: 12,
	},
	sendButton: {
		minWidth: 96,
	},
});
