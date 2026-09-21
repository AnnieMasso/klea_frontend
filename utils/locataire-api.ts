import { getAuthToken } from './auth-session';
import { requireApiBaseUrl } from './api-config';
import { getPersistentNotificationsForRole, pushPersistentNotification } from './persistent-notifications';

type ApiUser = {
  id: number;
  role: 'administrateur' | 'bailleur' | 'locataire';
  statut: 'actif' | 'inactif';
  nom: string;
  prenom?: string | null;
  email: string;
  cni_recto?: string | null;
  cni_verso?: string | null;
  assurance_habitation?: string | null;
};

type ApiMessage = {
  id: number;
  conversation_id: number;
  sender_id?: number;
  contenu: string;
  created_at?: string;
  sender?: ApiUser;
};

type ApiCondition = {
  id: number;
  description?: string;
};

type ApiContrat = {
  id: number;
  conversation_id: number;
  type: string;
  etat?: string;
  date_signature?: string | null;
  montant_loyer: number;
  duree: number;
  paiements?: ApiPaiement[];
  conditions?: ApiCondition[];
};

type ApiConversation = {
  id: number;
  user_id: number;
  user?: ApiUser;
  bien_id: number;
  bien?: ApiBien;
  contrat?: ApiContrat | null;
  messages?: ApiMessage[];
};

type ApiSignalement = {
  id: number;
  plaignant_id: number;
  accuse_id: number;
  motif: string;
  preuve1?: string | null;
  preuve2?: string | null;
  created_at?: string;
};

type ApiDepart = {
  id: number;
  contrat_id: number;
  created_at?: string;
  date_depart_prevue: string;
  date_confirmation?: string | null;
  statut?: boolean;
};

type ApiSinistre = {
  id: number;
  contrat_id: number;
  date_sinistre: string;
  description: string;
  img1: string;
  img2?: string | null;
};

type ApiPaiement = {
  id: number;
  contrat_id: number;
  mode_paiement: string;
  montant_paiement: number;
  created_at?: string;
  contrat?: ApiContrat;
};

type Paginated<T> = {
  data: T[];
};

type HttpMethod = 'GET' | 'POST' | 'PATCH';

type ApiBien = {
  id: number;
  bailleur_id?: number;
  bailleur?: ApiUser;
  titre: string;
  type: string;
  description: string;
  montant: number;
  modalite_paiement?: string;
  superficie?: number;
  nb_chambres?: number;
  nb_douches?: number;
  adresse?: string;
  lieu_dit?: string;
  ville?: string;
  quartier?: string;
  pays?: string;
  latitude?: string;
  longitude?: string;
  validation_statut?: 'verifie' | 'en_attente';
  occupation_statut?: 'en_location' | 'libre';
  images?: Array<{ id: number; slug: string }>;
  usages?: Array<{ id: number; nom_usage: string }>;
};

export type LocataireBien = {
  id: string;
  bailleurId?: string;
  titre: string;
  type: string;
  description: string;
  montant: number;
  modalitePaiement: string;
  surface: number;
  nbChambres: number;
  nbSalles: number;
  adresse: string;
  ville: string;
  pays: string;
  localisation?: string;
  occupationStatut: 'en_location' | 'libre';
  validationStatut: 'verifie' | 'en_attente';
  images: Array<{ id: string; url: string; type: 'photo' }>;
  usages: Array<{ id: string; nomUsage: string }>;
};

export type LocataireConversationMessage = {
  id: string;
  auteurRole: 'locataire' | 'bailleur' | 'administrateur';
  auteurNom: string;
  contenu: string;
  date: string;
};

export type LocataireConversation = {
  id: string;
  bienId: string;
  bienTitre: string;
  bienPhoto?: string | null;
  statutContrat: string;
  contratId?: string;
  contratEtat?: 'en_attente' | 'signe' | 'annule' | 'resilie';
  messages: LocataireConversationMessage[];
  lastMessage: string;
  lastMessageDate: string;
};

export type LocataireContrat = {
  id: string;
  bienId: string;
  bienTitre: string;
  montant: number;
  dureeMois: number;
  etat: 'en_attente' | 'signe' | 'annule' | 'resilie';
  dateSignature: string;
  conditions: string[];
};

export type LocatairePaiement = {
  id: string;
  contratId: string;
  montant: number;
  modePaiement: string;
  datePaiement: string;
  bienTitre: string;
};

export type LocataireDepart = {
  id: string;
  contratId: string;
  bienId: string;
  bienTitre: string;
  dateSignalement: string;
  datePrevue: string;
  dateDepartPrevue: string;
  dateConfirmation?: string;
  statut: 'signale' | 'confirme';
};

export type LocataireSinistre = {
  id: string;
  contratId: string;
  bienId: string;
  bienTitre: string;
  dateSinistre: string;
  description: string;
  photoSinistre1: string;
  photoSinistre2?: string;
};

export type LocataireSignalement = {
  id: string;
  motif: string;
  preuve1?: string;
  preuve2?: string;
  date: string;
};

export type LocataireNotification = {
  id: string;
  type: 'payment' | 'contract' | 'conversation' | 'message' | 'bien' | 'compte' | 'avertissement';
  title: string;
  subtitle: string;
  date: string;
  actionHref?: string;
  bienId?: string;
};

export type ContratPdfData = {
  id: string;
  bienTitre: string;
  typeContrat: 'determine' | 'indetermine';
  etat: 'en_attente' | 'signe' | 'annule';
  dateSignature: string;
  dureeMois: number;
  montant: number;
  lieu: string;
  conditions: string[];
  bailleur: {
    nom: string;
    telephone: string;
    email: string;
  };
  locataire: {
    nom: string;
    telephone: string;
    email: string;
  };
};

export type FacturePdfData = {
  id: string;
  locataire: string;
  bienTitre: string;
  montant: number;
  datePaiement: string;
  dureeMois: number;
  modePaiement: string;
  bailleur?: string;
};

function getDisplayName(user?: ApiUser) {
  if (!user) return 'Locataire';
  const pieces = [user.prenom ?? '', user.nom ?? ''].map((part) => part.trim()).filter(Boolean);
  return pieces.join(' ') || user.email;
}

function toContractMessage(item: ApiConversation): LocataireConversationMessage | null {
  if (!item.contrat) return null;

  const bailleurName = getDisplayName(item.bien?.bailleur);
  const locataireName = getDisplayName(item.user);

  const normalizedEtat = normalizeContratEtat(item.contrat.etat);

  return {
    id: `contract-${item.contrat.id}`,
    auteurRole: 'bailleur',
    auteurNom: bailleurName,
    contenu: `Contrat etabli par ${bailleurName} pour ${locataireName}. Vous pouvez le consulter avant de le signer.`,
    date: item.contrat.date_signature ?? new Date().toISOString(),
  };
}

function normalizeContratEtat(value?: string): 'en_attente' | 'signe' | 'annule' | 'resilie' {
  const lower = (value ?? '').toLowerCase();
  if (lower === 'signe') return 'signe';
  if (lower === 'annule') return 'annule';
  if (lower === 'resilie') return 'resilie';
  if (lower === 'en attente' || lower === 'en_attente') return 'en_attente';
  return 'en_attente';
}

function contratEtatLabel(value?: string) {
  const normalized = normalizeContratEtat(value);
  if (normalized === 'signe') return 'Signe';
  if (normalized === 'annule') return 'Annule';
  if (normalized === 'resilie') return 'Resilie';
  return 'En attente';
}

function toLocataireConversationMessage(item: ApiMessage): LocataireConversationMessage {
  return {
    id: String(item.id),
    auteurRole: item.sender?.role ?? 'locataire',
    auteurNom: getDisplayName(item.sender),
    contenu: item.contenu,
    date: item.created_at ?? new Date().toISOString(),
  };
}

function mapConversationToContrat(conversation: ApiConversation): LocataireContrat | null {
  const contrat = conversation.contrat;
  if (!contrat) return null;

  const etat = normalizeContratEtat(contrat.etat);
  return {
    id: String(contrat.id),
    bienId: String(conversation.bien_id),
    bienTitre: conversation.bien?.titre ?? `Bien ${conversation.bien_id}`,
    montant: contrat.montant_loyer,
    dureeMois: contrat.duree,
    etat,
    dateSignature: contrat.date_signature ?? '-',
    conditions: (contrat.conditions ?? []).map((condition) => condition.description ?? '').filter(Boolean),
  };
}

function toLocataireConversation(item: ApiConversation): LocataireConversation {
  const sortedMessages = (item.messages ?? [])
    .slice()
    .sort((left, right) => Date.parse(left.created_at ?? '') - Date.parse(right.created_at ?? ''));
  const messages = sortedMessages.map(toLocataireConversationMessage);
  const contractMessage = toContractMessage(item);
  if (contractMessage) {
    messages.push(contractMessage);
  }
  messages.sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
  const latestMessage = messages[messages.length - 1] ?? null;
  const contratEtat = normalizeContratEtat(item.contrat?.etat);

  return {
    id: String(item.id),
    bienId: String(item.bien_id),
    bienTitre: item.bien?.titre ?? `Bien ${item.bien_id}`,
    bienPhoto: item.bien?.images?.[0]?.slug ?? null,
    statutContrat: item.contrat ? contratEtatLabel(item.contrat.etat) : 'Aucun contrat',
    contratId: item.contrat ? String(item.contrat.id) : undefined,
    contratEtat: item.contrat ? contratEtat : undefined,
    messages,
    lastMessage: latestMessage?.contenu ?? 'Conversation demarree.',
    lastMessageDate: latestMessage?.date ?? new Date().toISOString(),
  };
}

function toLocatairePaiement(item: ApiPaiement, conversationByContrat: Map<number, ApiConversation>): LocatairePaiement {
  const conversation = conversationByContrat.get(item.contrat_id);

  return {
    id: String(item.id),
    contratId: String(item.contrat_id),
    montant: item.montant_paiement,
    modePaiement: item.mode_paiement,
    datePaiement: item.created_at ?? new Date().toISOString(),
    bienTitre: conversation?.bien?.titre ?? `Bien ${conversation?.bien_id ?? '-'}`,
  };
}

function headers(withJsonBody = false): Record<string, string> {
  const result: Record<string, string> = { Accept: 'application/json' };
  if (withJsonBody) result['Content-Type'] = 'application/json';
  const token = getAuthToken();
  if (token) result.Authorization = `Bearer ${token}`;
  return result;
}

async function request<T>(path: string, method: HttpMethod = 'GET', body?: unknown): Promise<T> {
  const apiBaseUrl = requireApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: headers(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? 'Une erreur est survenue.');
  }

  return data as T;
}

function toLocataireBien(item: ApiBien): LocataireBien {
  const latitude = item.latitude?.trim();
  const longitude = item.longitude?.trim();

  return {
    id: String(item.id),
    bailleurId: item.bailleur_id ? String(item.bailleur_id) : undefined,
    titre: item.titre,
    type: item.type,
    description: item.description,
    montant: item.montant,
    modalitePaiement: item.modalite_paiement ?? 'Mensuel',
    surface: item.superficie ?? 0,
    nbChambres: item.nb_chambres ?? 0,
    nbSalles: item.nb_douches ?? 0,
    adresse: item.adresse ?? item.lieu_dit ?? '-',
    ville: item.ville ?? '-',
    pays: item.pays ?? item.quartier ?? '-',
    localisation: latitude && longitude ? `${latitude}, ${longitude}` : undefined,
    occupationStatut: item.occupation_statut ?? 'libre',
    validationStatut: item.validation_statut ?? 'en_attente',
    images: (item.images ?? []).map((image) => ({ id: String(image.id), url: image.slug, type: 'photo' as const })),
    usages: (item.usages ?? []).map((usage) => ({ id: String(usage.id), nomUsage: usage.nom_usage })),
  };
}

export function getLocataireAuthUser() {
  return request<ApiUser>('/auth/me');
}

export async function getLocataireVisibleBiens() {
  const payload = await request<Paginated<ApiBien>>('/biens?per_page=100');
  return payload.data.map(toLocataireBien);
}

export async function getLocataireBienById(id: string) {
  const payload = await request<ApiBien>(`/biens/${id}`);
  return toLocataireBien(payload);
}

export async function createLocataireConversationForBien(bienId: string, contenu: string) {
  const me = await getLocataireAuthUser();
  const existingConversations = await getLocataireConversations();
  const existingConversation = existingConversations.find((conversation) => conversation.bienId === String(bienId));

  if (existingConversation) {
    return existingConversation.id;
  }

  const conversation = await request<{ id: number }>('/conversations', 'POST', {
    bien_id: Number(bienId),
    user_id: me.id,
  });

  await request('/messages', 'POST', {
    conversation_id: conversation.id,
    sender_id: me.id,
    contenu,
  });

  pushPersistentNotification({
    role: 'bailleur',
    type: 'conversation',
    title: 'Nouvelle demande de conversation',
    subtitle: contenu,
    actionHref: '/bailleur/conversation',
    bienId: String(bienId),
  });

  return String(conversation.id);
}

export async function getLocataireConversations() {
  const payload = await request<Paginated<ApiConversation>>('/conversations?per_page=100');
  return payload.data.map(toLocataireConversation);
}

export async function sendLocataireMessage(conversationId: string, contenu: string) {
  const me = await getLocataireAuthUser();
  const conversations = await getLocataireConversations();
  const targetConversation = conversations.find((conversation) => conversation.id === conversationId);

  await request('/messages', 'POST', {
    conversation_id: Number(conversationId),
    sender_id: me.id,
    contenu,
  });

  pushPersistentNotification({
    role: 'bailleur',
    type: 'message',
    title: 'Nouveau message du locataire',
    subtitle: contenu,
    actionHref: '/bailleur/conversation',
    bienId: targetConversation?.bienId,
  });
}

export async function getLocataireContrats() {
  const payload = await request<Paginated<ApiConversation>>('/conversations?per_page=100');
  return payload.data
    .map(mapConversationToContrat)
    .filter((item): item is LocataireContrat => item !== null)
    .sort((left, right) => Number(right.id) - Number(left.id));
}

export async function signLocataireContrat(contratId: string) {
  await request(`/contrats/${contratId}/signer`, 'PATCH');

  pushPersistentNotification({
    role: 'bailleur',
    type: 'contract',
    title: 'Contrat signe par le locataire',
    subtitle: 'Le contrat est maintenant signe et actif.',
    actionHref: '/bailleur/contrats',
  });
}

export async function cancelLocataireContrat(contratId: string) {
  await request(`/contrats/${contratId}/annuler`, 'PATCH', {});
}

export async function getLocatairePaiements() {
  const [paiementsPayload, conversationsPayload] = await Promise.all([
    request<Paginated<ApiPaiement>>('/paiements?per_page=100'),
    request<Paginated<ApiConversation>>('/conversations?per_page=100'),
  ]);

  const conversationByContrat = new Map<number, ApiConversation>();
  conversationsPayload.data.forEach((conversation) => {
    if (conversation.contrat?.id) {
      conversationByContrat.set(conversation.contrat.id, conversation);
    }
  });

  return paiementsPayload.data
    .map((paiement) => toLocatairePaiement(paiement, conversationByContrat))
    .sort((left, right) => Date.parse(right.datePaiement) - Date.parse(left.datePaiement));
}

function formAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function getLocataireDeparts() {
  const [departsPayload, conversationsPayload] = await Promise.all([
    request<Paginated<ApiDepart>>('/departs?per_page=100'),
    request<Paginated<ApiConversation>>('/conversations?per_page=100'),
  ]);

  const conversationByContrat = new Map<number, ApiConversation>();
  conversationsPayload.data.forEach((conversation) => {
    if (conversation.contrat?.id) {
      conversationByContrat.set(conversation.contrat.id, conversation);
    }
  });

  return departsPayload.data.map((depart) => {
    const conversation = conversationByContrat.get(depart.contrat_id);
    return {
      id: String(depart.id),
      contratId: String(depart.contrat_id),
      bienId: String(conversation?.bien_id ?? '-'),
      bienTitre: conversation?.bien?.titre ?? `Bien ${conversation?.bien_id ?? '-'}`,
      dateSignalement: depart.created_at ?? new Date().toISOString(),
      datePrevue: depart.date_depart_prevue,
      dateDepartPrevue: depart.date_depart_prevue,
      dateConfirmation: depart.date_confirmation ?? undefined,
      statut: depart.statut ? 'confirme' : 'signale',
    } satisfies LocataireDepart;
  });
}

export async function createLocataireDepart(contratId: string, dateDepartPrevue: string) {
  await request('/departs', 'POST', {
    contrat_id: Number(contratId),
    date_depart_prevue: dateDepartPrevue,
    statut: false,
  });
}

export async function getLocataireSinistres() {
  const [sinistresPayload, conversationsPayload] = await Promise.all([
    request<Paginated<ApiSinistre>>('/sinistres?per_page=100'),
    request<Paginated<ApiConversation>>('/conversations?per_page=100'),
  ]);

  const conversationByContrat = new Map<number, ApiConversation>();
  conversationsPayload.data.forEach((conversation) => {
    if (conversation.contrat?.id) {
      conversationByContrat.set(conversation.contrat.id, conversation);
    }
  });

  return sinistresPayload.data.map((sinistre) => {
    const conversation = conversationByContrat.get(sinistre.contrat_id);
    return {
      id: String(sinistre.id),
      contratId: String(sinistre.contrat_id),
      bienId: String(conversation?.bien_id ?? '-'),
      bienTitre: conversation?.bien?.titre ?? `Bien ${conversation?.bien_id ?? '-'}`,
      dateSinistre: sinistre.date_sinistre,
      description: sinistre.description,
      photoSinistre1: sinistre.img1,
      photoSinistre2: sinistre.img2 ?? undefined,
    } satisfies LocataireSinistre;
  });
}

export async function createLocataireSinistre(payload: {
  contratId: string;
  dateSinistre: string;
  description: string;
  photo1Uri: string;
  photo2Uri?: string;
}) {
  const apiBaseUrl = requireApiBaseUrl();
  const form = new FormData();
  form.append('contrat_id', payload.contratId);
  form.append('date_sinistre', payload.dateSinistre);
  form.append('description', payload.description);

  form.append('img1', {
    uri: payload.photo1Uri,
    name: 'sinistre-1.jpg',
    type: 'image/jpeg',
  } as any);

  if (payload.photo2Uri) {
    form.append('img2', {
      uri: payload.photo2Uri,
      name: 'sinistre-2.jpg',
      type: 'image/jpeg',
    } as any);
  }

  const response = await fetch(`${apiBaseUrl}/sinistres`, {
    method: 'POST',
    headers: formAuthHeaders(),
    body: form,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? 'Declaration du sinistre impossible.');
  }
}

export async function getLocataireSignalements() {
  const me = await getLocataireAuthUser();
  const payload = await request<Paginated<ApiSignalement>>('/signalements?per_page=100');

  return payload.data
    .filter((item) => item.plaignant_id === me.id)
    .map((item) => ({
      id: String(item.id),
      motif: item.motif,
      preuve1: item.preuve1 ?? undefined,
      preuve2: item.preuve2 ?? undefined,
      date: item.created_at ?? new Date().toISOString(),
    } satisfies LocataireSignalement));
}

export async function createLocataireSignalement(payload: {
  accuseId: string;
  motif: string;
  preuve1Uri?: string;
  preuve2Uri?: string;
}) {
  const apiBaseUrl = requireApiBaseUrl();
  const me = await getLocataireAuthUser();
  const form = new FormData();

  form.append('plaignant_id', String(me.id));
  form.append('accuse_id', payload.accuseId);
  form.append('motif', payload.motif);

  if (payload.preuve1Uri) {
    form.append('preuve1_file', {
      uri: payload.preuve1Uri,
      name: 'preuve-1.jpg',
      type: 'image/jpeg',
    } as any);
  }

  if (payload.preuve2Uri) {
    form.append('preuve2_file', {
      uri: payload.preuve2Uri,
      name: 'preuve-2.jpg',
      type: 'image/jpeg',
    } as any);
  }

  const response = await fetch(`${apiBaseUrl}/signalements`, {
    method: 'POST',
    headers: formAuthHeaders(),
    body: form,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? 'Signalement impossible.');
  }
}

export async function getLocataireNotifications() {
  const [contrats, paiements, conversations, biens] = await Promise.all([
    getLocataireContrats(),
    getLocatairePaiements(),
    getLocataireConversations(),
    getLocataireVisibleBiens(),
  ]);

  const notifications: LocataireNotification[] = [];

  contrats.forEach((contrat) => {
    notifications.push({
      id: `contract-${contrat.id}`,
      type: 'contract',
      title: `Contrat ${contrat.etat === 'signe' ? 'signe' : 'mis a jour'}`,
      subtitle: `${contrat.bienTitre} - ${contrat.montant.toLocaleString('fr-FR')} FCFA`,
      date: contrat.dateSignature === '-' ? new Date().toISOString() : contrat.dateSignature,
      actionHref: '/locataire/contrat',
      bienId: contrat.bienId,
    });
  });

  paiements.forEach((paiement) => {
    notifications.push({
      id: `payment-${paiement.id}`,
      type: 'payment',
      title: 'Paiement enregistre',
      subtitle: `${paiement.bienTitre} - ${paiement.montant.toLocaleString('fr-FR')} FCFA`,
      date: paiement.datePaiement,
      actionHref: '/locataire/paiements',
    });
  });

  conversations.forEach((conversation) => {
    notifications.push({
      id: `conversation-${conversation.id}`,
      type: 'message',
      title: `Nouveau message - ${conversation.bienTitre}`,
      subtitle: conversation.lastMessage,
      date: conversation.lastMessageDate,
      actionHref: '/locataire/conversation',
      bienId: conversation.bienId,
    });
  });

  biens.forEach((bien) => {
    notifications.push({
      id: `bien-${bien.id}`,
      type: 'bien',
      title: `Mise a jour du bien ${bien.titre}`,
      subtitle: `Localisation: ${bien.adresse}, ${bien.ville}`,
      date: new Date().toISOString(),
      actionHref: `/locataire/bien/${bien.id}`,
      bienId: bien.id,
    });
  });

  const persistentNotifications = getPersistentNotificationsForRole('locataire');
  return [...persistentNotifications, ...notifications].sort((left, right) => Date.parse(right.date) - Date.parse(left.date));
}

export async function createLocatairePaiement(contratId: string, montant: number, modePaiement: string) {
  await request('/paiements', 'POST', {
    contrat_id: Number(contratId),
    mode_paiement: modePaiement,
    montant_paiement: montant,
  });

  pushPersistentNotification({
    role: 'bailleur',
    type: 'payment',
    title: 'Paiement recu',
    subtitle: `${montant.toLocaleString('fr-FR')} FCFA via ${modePaiement}`,
    actionHref: '/bailleur/paiements',
  });
}

export async function getLocatairePaiementById(id: string) {
  const [paiement, conversationsPayload, me] = await Promise.all([
    request<ApiPaiement>(`/paiements/${id}`),
    request<Paginated<ApiConversation>>('/conversations?per_page=100'),
    getLocataireAuthUser(),
  ]);

  const conversation = conversationsPayload.data.find((item) => item.contrat?.id === paiement.contrat_id);
  const contrat = conversation?.contrat;

  return {
    id: String(paiement.id),
    locataire: getDisplayName(me),
    bienTitre: conversation?.bien?.titre ?? `Bien ${conversation?.bien_id ?? '-'}`,
    montant: paiement.montant_paiement,
    datePaiement: paiement.created_at ?? new Date().toISOString(),
    dureeMois: contrat?.duree ?? 1,
    modePaiement: paiement.mode_paiement,
    bailleur: getDisplayName(conversation?.bien?.bailleur),
  } satisfies FacturePdfData;
}

export async function getLocataireContratForPdf(contratId: string) {
  const [conversationsPayload, me] = await Promise.all([
    request<Paginated<ApiConversation>>('/conversations?per_page=100'),
    getLocataireAuthUser(),
  ]);

  const conversation = conversationsPayload.data.find((item) => String(item.contrat?.id) === contratId);
  const contrat = conversation?.contrat;

  if (!conversation || !contrat) {
    throw new Error('Contrat introuvable.');
  }

  const normalizedEtat = normalizeContratEtat(contrat.etat);

  return {
    id: String(contrat.id),
    bienTitre: conversation.bien?.titre ?? `Bien ${conversation.bien_id}`,
    typeContrat: contrat.type?.toLowerCase().includes('indet') ? 'indetermine' : 'determine',
    etat: normalizedEtat === 'resilie' ? 'annule' : normalizedEtat,
    dateSignature: contrat.date_signature ?? '-',
    dureeMois: contrat.duree,
    montant: contrat.montant_loyer,
    lieu: conversation.bien?.adresse ?? conversation.bien?.ville ?? '-',
    conditions: (contrat.conditions ?? []).map((condition) => condition.description ?? '').filter(Boolean),
    bailleur: {
      nom: getDisplayName(conversation.bien?.bailleur),
      telephone: '-',
      email: conversation.bien?.bailleur?.email ?? '-',
    },
    locataire: {
      nom: getDisplayName(me),
      telephone: '-',
      email: me.email,
    },
  } satisfies ContratPdfData;
}
