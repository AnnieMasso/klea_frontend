import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { KleaColors } from '@/constants/theme';
import { CURRENT_BAILLEUR_ID, annulerContratForBien, createContratForBien, getAllContrats, getBienById, getContratById, getConversationsForParticipant, sendMessageToConversation, subscribeBiens, updateContratForBien, type ConversationLigne } from '@/utils/biens-store';

const profileImageSource = require('../../assets/images/icon.png');

function formatMessageDate(value: string) {
	if (!value) return '-';
	const messageDate = new Date(value);
	const ageInHours = (Date.now() - messageDate.getTime()) / (1000 * 60 * 60);

	if (ageInHours >= 24) {
		return messageDate.toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	return messageDate.toLocaleTimeString('fr-FR', {
		hour: '2-digit',
		minute: '2-digit',
	});
}

export default function ConversationScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ conversationId?: string }>();
	const requestedConversationId = typeof params.conversationId === 'string' ? params.conversationId : '';
	const todayIso = new Date().toISOString().slice(0, 10);

	const [conversations, setConversations] = useState<ConversationLigne[]>(() => getConversationsForParticipant(CURRENT_BAILLEUR_ID));
	const [selectedConversationId, setSelectedConversationId] = useState(requestedConversationId);
	const [draft, setDraft] = useState('');
	const [showContractForm, setShowContractForm] = useState(false);
	const [editingContractId, setEditingContractId] = useState<string | null>(null);
	const [contractType, setContractType] = useState<'determine' | 'indetermine'>('determine');
	const [contractEtat, setContractEtat] = useState<'en_attente' | 'signe' | 'annule'>('en_attente');
	const [contractDateSignature, setContractDateSignature] = useState(todayIso);
	const [contractMontant, setContractMontant] = useState('');
	const [contractConditions, setContractConditions] = useState<string[]>(['']);
	const [contractDureeMois, setContractDureeMois] = useState('');

	useEffect(() => {
		setConversations(getConversationsForParticipant(CURRENT_BAILLEUR_ID));
		const unsubscribe = subscribeBiens(() => setConversations(getConversationsForParticipant(CURRENT_BAILLEUR_ID)));
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

	const selectedConversation = useMemo(
		() => conversations.find((item) => item.id === selectedConversationId) ?? null,
		[conversations, selectedConversationId],
	);
	const contractsForSelectedConversation = useMemo(
		() => getAllContrats().filter((contract) => contract.conversationId === selectedConversation?.id),
		[selectedConversation?.id, conversations],
	);
	const hasSignedContract = contractsForSelectedConversation.some((contract) => contract.etat === 'signe');
	const hasPendingContract = contractsForSelectedConversation.some((contract) => contract.etat === 'en_attente');
	const canEstablishContract = hasPendingContract || !hasSignedContract;

	useEffect(() => {
		if (!selectedConversation) {
			setShowContractForm(false);
			setEditingContractId(null);
			return;
		}

		const relatedBien = getBienById(selectedConversation.bienId);
		setEditingContractId(null);
		setContractType('determine');
		setContractEtat('en_attente');
		setContractDateSignature(todayIso);
		setContractMontant(String(relatedBien?.montant ?? ''));
		setContractDureeMois('');
		setContractConditions(['']);
		setShowContractForm(false);
	}, [selectedConversation, todayIso]);

	const resetContractForm = (contractId?: string | null) => {
		if (!selectedConversation) return;
		const relatedBien = getBienById(selectedConversation.bienId);
		const existingContract = contractId ? getContratById(contractId, selectedConversation.bienId) : null;
		const baseContract = existingContract ?? contractsForSelectedConversation.find((contract) => contract.etat === 'en_attente') ?? null;

		setEditingContractId(baseContract?.id ?? null);
		setContractType(baseContract?.typeContrat ?? 'determine');
		setContractEtat('en_attente');
		setContractDateSignature(baseContract?.dateSignature ?? todayIso);
		setContractMontant(String(baseContract?.montant ?? relatedBien?.montant ?? ''));
		setContractDureeMois(String(baseContract?.dureeMois ));
		setContractConditions(baseContract ? baseContract.conditions.map((condition) => condition.description) : ['']);
		setShowContractForm(true);
	};

	const handleSendMessage = () => {
		if (!selectedConversation) return;
		const ok = sendMessageToConversation(selectedConversation.id, draft);
		if (!ok) {
			// Alert.alert('Message vide', 'Renseignez un message avant l\'envoi.');
			return;
		}
		setDraft('');
	};

	const handleToggleContractForm = () => {
		if (showContractForm) {
			setShowContractForm(false);
			setEditingContractId(null);
			return;
		}

		resetContractForm();
	};

	const updateCondition = (index: number, value: string) => {
		setContractConditions((previous) => previous.map((item, currentIndex) => (currentIndex === index ? value : item)));
	};

	const addCondition = () => {
		setContractConditions((previous) => [...previous, '']);
	};

	const removeCondition = (index: number) => {
		setContractConditions((previous) => {
			if (previous.length === 1) return [''];
			return previous.filter((_, currentIndex) => currentIndex !== index);
		});
	};

	const handleCreateContract = () => {
		if (!selectedConversation) return;
		if (!editingContractId && !canEstablishContract) {
			Alert.alert('Contrat deja signe', 'Un contrat est deja signe pour cette conversation.');
			return;
		}
		const relatedBien = getBienById(selectedConversation.bienId);
		if (!relatedBien) {
			Alert.alert('Bien introuvable', 'Impossible de retrouver le bien lie a cette conversation.');
			return;
		}

		const parsedMontant = Number(contractMontant.replace(/\D/g, '')) || relatedBien.montant;
		const parsedDuree = Number(contractDureeMois.replace(/\D/g, '')) || 12;
		const cleanConditions = contractConditions.map((condition) => condition.trim()).filter(Boolean);

		if (cleanConditions.length === 0) {
			Alert.alert('Conditions requises', 'Ajoutez au moins une condition pour le contrat.');
			return;
		}

		const payload = {
			locataire: selectedConversation.locataireNom,
			locataireId: selectedConversation.locataireId,
			montant: parsedMontant,
			dureeMois: parsedDuree,
			conditions: cleanConditions,
			signerMaintenant: false,
			conversationId: selectedConversation.id,
			typeContrat: contractType,
			etat: contractEtat,
			dateSignature: contractDateSignature,
		};

		const ok = editingContractId
			? updateContratForBien(relatedBien.id, editingContractId, payload)
			: createContratForBien(relatedBien.id, payload);

		if (!ok) {
			Alert.alert('Erreur', 'Le contrat n\'a pas pu etre etabli.');
			return;
		}

		Alert.alert('Contrat etabli', editingContractId ? 'Le contrat a ete modifie et renvoye au locataire.' : 'Le contrat a ete cree et envoye au locataire pour signature.');
		setShowContractForm(false);
		setEditingContractId(null);
	};

	const handleEditContract = (contractId: string) => {
		resetContractForm(contractId);
	};

	const handleCancelContract = (contractId: string) => {
		if (!selectedConversation) return;
		const ok = annulerContratForBien(selectedConversation.bienId, contractId);
		if (!ok) {
			Alert.alert('Annulation impossible', 'Le contrat ne peut plus etre annule.');
			return;
		}
		if (editingContractId === contractId) {
			setShowContractForm(false);
			setEditingContractId(null);
		}
		Alert.alert('Contrat annule', 'Le contrat a ete annule avant la signature.');
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
			<BailleurScreenShell
				title="Messagerie"
				subtitle={selectedConversation.locataireNom}
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
							<Pressable onPress={() => router.push(`/bailleur/detail/${selectedConversation.bienId}` as any)}>
								<Text style={styles.threadTitle}>{selectedConversation.bienTitre}</Text>
							</Pressable>
							<Text style={styles.metaLine}>Statut du contrat: {selectedConversation.statutContrat}</Text>
						</View>
					</View>

					{canEstablishContract ? (
						<KleaButton
							title={showContractForm ? 'Annuler' : 'Etablir un contrat'}
							icon="document-text-outline"
							variant="secondary"
							onPress={handleToggleContractForm}
							style={styles.contractButton}
						/>
					) : (
						<Text style={styles.contractLockedText}>Un contrat est deja signe pour cette conversation.</Text>
					)}

					{showContractForm ? (
						<KleaCard style={styles.contractFormCard}>
							<ScrollView style={styles.contractFormScroll} contentContainerStyle={styles.contractFormContent} showsVerticalScrollIndicator>
								<Text style={styles.formTitle}>{editingContractId ? 'Modifier le contrat' : 'Formulaire de contrat'}</Text>
								<Text style={styles.formHint}>Renseignez les champs puis envoyez le contrat au locataire pour signature.</Text>

								<View style={styles.formField}>
									<Text style={styles.formLabel}>Type de contrat</Text>
									<View style={styles.pickerWrap}>
										<Picker selectedValue={contractType} onValueChange={(value) => setContractType(value)} style={styles.picker}>
											<Picker.Item label="Contrat à durée déterminée" value="determine" />
											<Picker.Item label="Contrat à durée indéterminée" value="indetermine" />
										</Picker>
									</View>
								</View>

								<KleaInput label="Date de signature" value={contractDateSignature} onChangeText={setContractDateSignature} placeholder="YYYY-MM-DD" />
								<KleaInput label="Montant du loyer" value={contractMontant} onChangeText={(value) => setContractMontant(value.replace(/\D/g, ''))} keyboardType="numeric" />
								<KleaInput label="Etat" value="En attente" editable={false} style={styles.readonlyInput} />
								<KleaInput label="Durée du contrat (mois)" value={contractDureeMois} onChangeText={(value) => setContractDureeMois(value.replace(/\D/g, ''))} keyboardType="numeric" />

								<View style={styles.conditionsHeader}>
									<Text style={styles.formLabel}>Conditions</Text>
									<KleaButton title="Ajouter une condition" icon="add-outline" variant="ghost" onPress={addCondition} />
								</View>

								{contractConditions.map((condition, index) => (
									<View key={`condition-${index}`} style={styles.conditionRow}>
										<KleaInput
											label={`Condition ${index + 1}`}
											value={condition}
											onChangeText={(value) => updateCondition(index, value)}
											placeholder="Ex: Paiement avant le 5"
										/>
										<View style={styles.conditionActions}>
											<KleaButton title="Supprimer" variant="ghost" onPress={() => removeCondition(index)} />
										</View>
									</View>
								))}

								<KleaButton title="Envoyer le contrat au locataire" icon="send-outline" onPress={handleCreateContract} />
							</ScrollView>
						</KleaCard>
					) : null}

					<ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesColumn} showsVerticalScrollIndicator>
						{selectedConversation.messages.map((message) => {
							const isMine = message.auteurRole === 'bailleur';
							const contract = message.type === 'contract' && message.contractId ? getContratById(message.contractId, selectedConversation.bienId) : null;
							const canManageContract = Boolean(contract && contract.etat === 'en_attente');
							return (
								<View key={message.id} style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
									<View style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
										<Text style={styles.messageAuthor}>{message.auteurNom}</Text>
										{contract ? (
											<View style={styles.contractMessageBody}>
												<Text style={styles.messageContent}>{message.contenu}</Text>
												<Text style={styles.contractMeta}>Type: {contract.typeContrat === 'indetermine' ? 'Contrat a duree indeterminee' : 'Contrat a duree determinee'}</Text>
												<Text style={styles.contractMeta}>Etat: {contract.etat === 'en_attente' ? 'En attente' : contract.etat === 'signe' ? 'Signe' : 'Annule'}</Text>
												<Text style={styles.contractMeta}>Date de signature: {contract.dateSignature}</Text>
												<Text style={styles.contractMeta}>Loyer: {contract.montant.toLocaleString('fr-FR')} FCFA</Text>
												{contract.conditions.length > 0 ? contract.conditions.map((condition, index) => (
													<Text key={`${contract.id}-cond-${index}`} style={styles.contractCondition}>• {condition.description}</Text>
												)) : null}
												{canManageContract ? (
													<View style={styles.contractActionRow}>
														<KleaButton title="Modifier" variant="secondary" onPress={() => handleEditContract(contract.id)} style={styles.contractActionButton} />
														<KleaButton title="Annuler" variant="ghost" onPress={() => handleCancelContract(contract.id)} style={styles.contractActionButton} />
													</View>
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
						placeholder="Ecrivez un message "
						multiline
						numberOfLines={1}
						style={styles.messageInput}
					/>
					<KleaButton title="Envoyer" onPress={handleSendMessage} disabled={!draft.trim()} />
				</KleaCard>
			</BailleurScreenShell>
		);
	}

	return (
		<BailleurScreenShell title="Messagerie" subtitle="">
			<KleaCard style={styles.card}>
				{conversations.length === 0 ? <Text style={styles.emptyText}>Aucune conversation disponible.</Text> : null}
				{conversations.map((conversation) => {
					return (
							<Pressable key={conversation.id} style={styles.whatsappItem} onPress={() => handleOpenConversation(conversation.id)}>
								<View style={styles.avatarCircle}>
									<Image source={profileImageSource} style={styles.avatarImage} />
								</View>
								<View style={styles.whatsappBody}>
									<View style={styles.whatsappHeaderRow}>
										<Pressable onPress={() => router.push(`/bailleur/detail/${conversation.bienId}` as any)}>
											<Text style={styles.conversationTitle}>{conversation.bienTitre}</Text>
										</Pressable>
										<Text style={styles.dateText}>{formatMessageDate(conversation.lastMessageDate)}</Text>
									</View>
									<Text style={styles.metaLine} numberOfLines={1}>{conversation.locataireNom}</Text>
									<Text style={styles.previewText} numberOfLines={1}>{conversation.lastMessage}</Text>
								</View>
							</Pressable>
					);
				})}
			</KleaCard>
		</BailleurScreenShell>
	);
}

const styles = StyleSheet.create({
	card: {
		marginBottom: 4,
	},
	sectionTitle: {
		color: KleaColors.secondary,
		fontSize: 16,
		fontWeight: '700',
		marginBottom: 8,
	},
	sectionHint: {
		color: KleaColors.textMuted,
		fontSize: 13,
		lineHeight: 19,
		marginBottom: 10,
	},
	threadCard: {
		marginBottom: 4,
		flex: 1,
	},
	contractFormCard: {
		marginBottom: 10,
	},
	contractFormScroll: {
		maxHeight: 300,
	},
	contractFormContent: {
		gap: 8,
	},
	formTitle: {
		color: KleaColors.secondary,
		fontSize: 16,
		fontWeight: '700',
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
