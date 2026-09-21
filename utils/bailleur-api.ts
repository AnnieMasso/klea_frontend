import { requireApiBaseUrl } from './api-config';
import { getAuthToken } from './auth-session';
import { getPersistentNotificationsForRole, pushPersistentNotification } from './persistent-notifications';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type ApiUser = {
  id: number;
  role: 'administrateur' | 'bailleur' | 'locataire';
  statut: 'actif' | 'inactif';
  nom: string;
  prenom?: string | null;
  email: string;
};

type ApiBien = {
  id: number;
  titre: string;
  type: string;
  montant: number;
  ville?: string | null;
  adresse?: string | null;
  statut: 'actif' | 'inactif';
  validation_statut?: 'verifie' | 'en_attente';
  occupation_statut?: 'en_location' | 'libre';
  images?: Array<{ id: number; slug: string }>;
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

type ApiMessage = {
  id: number;
  conversation_id: number;
  contenu: string;
  created_at?: string;
  sender?: ApiUser;
};

type ApiPaiement = {
  id: number;
  contrat_id: number;
  mode_paiement: string;
  montant_paiement: number;
  created_at?: string;
};

type ApiSinistre = {
  id: number;
  contrat_id: number;
  date_sinistre: string;
  description: string;
  img1: string;
  img2?: string | null;
};

type ApiDepart = {
  id: number;
  contrat_id: number;
  created_at?: string;
  date_depart_prevue: string;
  date_confirmation?: string | null;
  statut?: boolean;
};

export type BailleurBien = {
  id: string;
  titre: string;
  type: string;
  montant: number;
  ville: string;
  adresse: string;
  validationStatut: 'verifie' | 'en_attente';
  occupationStatut: 'en_location' | 'libre';
  image?: string | null;
  images: Array<{ id: string; url: string }>;
};

export type BailleurContrat = {
  id: string;
  conversationId: string;
  bienId: string;
  bienTitre: string;
  locataire: string;
  montant: number;
  dureeMois: number;
  dateDebut: string;
  signe: boolean;
  etat: 'en_attente' | 'signe' | 'annule' | 'resilie';
};

export type BailleurPaiement = {
  id: string;
  bienId: string;
  bienTitre: string;
  locataire: string;
  montant: number;
  datePaiement: string;
  modePaiement: string;
  dureeMois: number;
  bailleur?: string;
};

export type BailleurConversationMessage = {
  id: string;
  auteurRole: 'administrateur' | 'bailleur' | 'locataire';
  auteurNom: string;
  contenu: string;
  date: string;
};

export type BailleurConversation = {
  id: string;
  bienId: string;
  bienTitre: string;
  bienPhoto?: string | null;
  locataireId: string;
  locataireNom: string;
  participantRole: 'locataire' | 'bailleur' | 'administrateur';
  contratId?: string;
  contratEtat?: 'en_attente' | 'signe' | 'annule' | 'resilie';
  messages: BailleurConversationMessage[];
  lastMessage: string;
  lastMessageDate: string;
};

export type BailleurSinistre = {
  id: string;
  bienId: string;
  bienTitre: string;
  locataire: string;
  date: string;
  description: string;
  photoSinistre1: string;
  photoSinistre2?: string;
};

export type BailleurDepart = {
  id: string;
  bienId: string;
  bienTitre: string;
  locataire: string;
  dateSignalement: string;
  datePrevue: string;
  statut: 'signale' | 'confirme';
};

export type BailleurLocataire = {
  id: string;
  bienId: string;
  bienTitre: string;
  nomComplet: string;
  dateDebut: string;
  statut: 'actuel' | 'ancien';
  telephone: string;
  email: string;
};

export type BailleurAnnulation = {
  id: string;
  bienId: string;
  bienTitre: string;
  locataire: string;
  date: string;
  motif: string;
  statut: 'acceptee';
};

export type BailleurNotification = {
  id: string;
  type: 'payment' | 'contract' | 'conversation' | 'message' | 'bien' | 'compte' | 'avertissement';
  title: string;
  subtitle: string;
  date: string;
  actionHref?: string;
  bienId?: string;
};

export type BailleurDashboardMonthStat = {
  key: string;
  label: string;
  signalements: number;
  departs: number;
  paiements: number;
  messages: number;
};

export type BailleurDashboard = {
  occupancyRate: number;
  occupiedUnits: number;
  totalUnits: number;
  monthlyRevenue: number;
  alerts: number;
  actifs: number;
  contratsEnCours: number;
  sinistres: number;
  departs: number;
  paiements: number;
  conversations: number;
  monthStats: BailleurDashboardMonthStat[];
};

function toEtat(value?: string): 'en_attente' | 'signe' | 'annule' | 'resilie' {
  const lower = (value ?? '').toLowerCase();
  if (lower === 'signe') return 'signe';
  if (lower === 'annule') return 'annule';
  if (lower === 'resilie') return 'resilie';
  return 'en_attente';
}

function toDisplayName(user?: ApiUser): string {
  if (!user) return 'Locataire';
  const full = [user.prenom ?? '', user.nom ?? ''].map((part) => part.trim()).filter(Boolean).join(' ');
  return full || user.email;
}

function roleDisplayName(role: 'administrateur' | 'bailleur' | 'locataire') {
  if (role === 'administrateur') return 'Administrateur';
  if (role === 'bailleur') return 'Bailleur';
  return 'Locataire';
}

function toContractMessage(input: ApiConversation): BailleurConversationMessage | null {
  if (!input.contrat) return null;

  const userName = toDisplayName(input.user);
  const contractDate = input.contrat.date_signature ?? new Date().toISOString();

  return {
    id: `contract-${input.contrat.id}`,
    auteurRole: 'bailleur',
    auteurNom: 'Vous',
    contenu: `Contrat etabli pour ${userName}. Vous pouvez le consulter et le faire signer par le locataire.`,
    date: contractDate,
  };
}

function toBailleurConversation(input: ApiConversation): BailleurConversation {
  const sortedMessages = (input.messages ?? [])
    .slice()
    .sort((left, right) => Date.parse(left.created_at ?? '') - Date.parse(right.created_at ?? ''));

  const messages = [
    ...sortedMessages.map((message) => ({
      id: String(message.id),
      auteurRole: message.sender?.role ?? 'locataire',
      auteurNom: message.sender ? toDisplayName(message.sender) : roleDisplayName(message.sender?.role ?? 'locataire'),
      contenu: message.contenu,
      date: message.created_at ?? new Date().toISOString(),
    } satisfies BailleurConversationMessage)),
  ];

  const contractMessage = toContractMessage(input);
  if (contractMessage) {
    messages.push(contractMessage);
  }

  messages.sort((left, right) => Date.parse(left.date) - Date.parse(right.date));

  const lastMessage = messages[messages.length - 1];

  return {
    id: String(input.id),
    bienId: String(input.bien_id),
    bienTitre: input.bien?.titre ?? `Bien ${input.bien_id}`,
    bienPhoto: input.bien?.images?.[0]?.slug ?? null,
    locataireId: String(input.user_id),
    locataireNom: toDisplayName(input.user),
    participantRole: input.user?.role ?? 'locataire',
    contratId: input.contrat?.id ? String(input.contrat.id) : undefined,
    contratEtat: input.contrat?.etat ? toEtat(input.contrat.etat) : undefined,
    messages,
    lastMessage: lastMessage?.contenu ?? 'Conversation demarree.',
    lastMessageDate: lastMessage?.date ?? new Date().toISOString(),
  };
}

function getMonthKey(dateValue: string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'unknown';
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(monthKey: string): string {
  if (monthKey === 'unknown') {
    return 'Inconnu';
  }

  const [year, month] = monthKey.split('-').map((value) => Number(value));
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
    .format(date)
    .replace(/^./, (character) => character.toUpperCase());
}

function buildRecentMonthKeys(count = 3): string[] {
  const now = new Date();
  const keys: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }

  return keys;
}

function authHeaders(isJson = true): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function resolveMimeType(name: string) {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

async function appendImage(form: FormData, field: string, uri: string, index: number) {
  const rawName = uri.split('/').pop()?.split('?')[0] || `bien-image-${index + 1}.jpg`;
  const type = resolveMimeType(rawName);

  if (typeof window !== 'undefined') {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const file = new File([blob], rawName, { type: blob.type || type });
      form.append(field, file);
      return;
    } catch {
      // Fall back to the React Native multipart shape when the browser cannot read the URI directly.
    }
  }

  form.append(field, {
    uri,
    name: rawName,
    type,
  } as any);
}

async function sendMultipart<T>(path: string, form: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
  const apiBaseUrl = requireApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: authHeaders(false),
    body: form,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? 'Une erreur est survenue.');
  }

  return data as T;
}

async function request<T>(path: string, method: Method, body?: unknown): Promise<T> {
  const apiBaseUrl = requireApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: authHeaders(true),
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? 'Une erreur est survenue.');
  }

  return data as T;
}

function toBailleurBien(item: ApiBien): BailleurBien {
  const images = (item.images ?? []).map((image) => ({ id: String(image.id), url: image.slug }));

  return {
    id: String(item.id),
    titre: item.titre,
    type: item.type,
    montant: item.montant,
    ville: item.ville ?? '-',
    adresse: item.adresse ?? '-',
    validationStatut: item.validation_statut ?? (item.statut === 'actif' ? 'verifie' : 'en_attente'),
    occupationStatut: item.occupation_statut ?? 'libre',
    image: images[0]?.url ?? null,
    images,
  };
}

export async function getAuthenticatedUser() {
  return request<ApiUser>('/auth/me', 'GET');
}

export async function getMyBiens() {
  const payload = await request<{ data: ApiBien[] }>('/biens?per_page=100', 'GET');
  return payload.data.map(toBailleurBien);
}

export async function updateMyBien(id: string, body: { titre: string; type: string; montant: number; adresse: string; ville: string }) {
  await request(`/biens/${id}`, 'PATCH', {
    titre: body.titre,
    type: body.type,
    montant: body.montant,
    lieu_dit: body.adresse,
    ville: body.ville,
  });
}

export async function deleteMyBien(id: string) {
  await request(`/biens/${id}`, 'DELETE');
}

export async function getBailleurContrats() {
  const payload = await request<{ data: ApiConversation[] }>('/conversations?per_page=100', 'GET');

  return payload.data
    .filter((conversation) => conversation.contrat)
    .map((conversation) => {
      const contrat = conversation.contrat as ApiContrat;
      return {
        id: String(contrat.id),
        conversationId: String(conversation.id),
        bienId: String(conversation.bien_id),
        bienTitre: conversation.bien?.titre ?? `Bien ${conversation.bien_id}`,
        locataire: toDisplayName(conversation.user),
        montant: contrat.montant_loyer,
        dureeMois: contrat.duree,
        dateDebut: contrat.date_signature ?? '-',
        signe: toEtat(contrat.etat) === 'signe',
        etat: toEtat(contrat.etat),
      } satisfies BailleurContrat;
    })
    .sort((left, right) => Number(right.id) - Number(left.id));
}

export async function signBailleurContrat(contratId: string) {
  await request(`/contrats/${contratId}/signer`, 'PATCH');
}

export async function getBailleurPaiements() {
  const [paiementsPayload, conversationsPayload, me] = await Promise.all([
    request<{ data: ApiPaiement[] }>('/paiements?per_page=100', 'GET'),
    request<{ data: ApiConversation[] }>('/conversations?per_page=100', 'GET'),
    getAuthenticatedUser(),
  ]);

  const conversationByContrat = new Map<number, ApiConversation>();
  conversationsPayload.data.forEach((conversation) => {
    if (conversation.contrat?.id) {
      conversationByContrat.set(conversation.contrat.id, conversation);
    }
  });

  return paiementsPayload.data
    .map((paiement) => {
      const conversation = conversationByContrat.get(paiement.contrat_id);
      return {
        id: String(paiement.id),
        bienId: String(conversation?.bien_id ?? '-'),
        bienTitre: conversation?.bien?.titre ?? `Bien ${conversation?.bien_id ?? '-'}`,
        locataire: toDisplayName(conversation?.user),
        montant: paiement.montant_paiement,
        datePaiement: paiement.created_at ?? new Date().toISOString(),
        modePaiement: paiement.mode_paiement,
        dureeMois: conversation?.contrat?.duree ?? 1,
        bailleur: toDisplayName(me),
      } satisfies BailleurPaiement;
    })
    .sort((left, right) => Date.parse(right.datePaiement) - Date.parse(left.datePaiement));
}

export async function getBailleurPaiementById(id: string) {
  const payments = await getBailleurPaiements();
  return payments.find((item) => item.id === id) ?? null;
}

export async function getBailleurConversations() {
  const payload = await request<{ data: ApiConversation[] }>('/conversations?per_page=100', 'GET');
  return payload.data.map(toBailleurConversation);
}

export async function getBailleurContratById(id: string) {
  const contracts = await getBailleurContrats();
  return contracts.find((item) => item.id === id) ?? null;
}

export async function sendBailleurMessage(conversationId: string, contenu: string) {
  const me = await getAuthenticatedUser();
  const conversations = await getBailleurConversations();
  const targetConversation = conversations.find((conversation) => conversation.id === conversationId);

  await request('/messages', 'POST', {
    conversation_id: Number(conversationId),
    sender_id: me.id,
    contenu,
  });

  if (targetConversation?.participantRole === 'locataire') {
    pushPersistentNotification({
      role: 'locataire',
      type: 'message',
      title: 'Nouveau message du bailleur',
      subtitle: contenu,
      actionHref: '/locataire/conversation',
      bienId: targetConversation.bienId,
    });
  }
}

export async function createBailleurContrat(payload: {
  conversationId: string;
  typeContrat: 'determine' | 'indetermine';
  montant: number;
  dureeMois: number;
  dateSignature?: string;
}) {
  await request('/contrats', 'POST', {
    conversation_id: Number(payload.conversationId),
    type: payload.typeContrat,
    etat: 'en attente',
    montant_loyer: payload.montant,
    duree: payload.dureeMois,
    date_signature: payload.dateSignature,
  });

  const conversations = await getBailleurConversations();
  const targetConversation = conversations.find((conversation) => conversation.id === payload.conversationId);

  if (targetConversation?.participantRole === 'locataire') {
    pushPersistentNotification({
      role: 'locataire',
      type: 'contract',
      title: 'Contrat disponible pour signature',
      subtitle: `${targetConversation.bienTitre} - ${payload.montant.toLocaleString('fr-FR')} FCFA`,
      actionHref: '/locataire/contrat',
      bienId: targetConversation.bienId,
    });
  }
}

export async function updateBailleurContrat(payload: {
  contratId: string;
  typeContrat?: 'determine' | 'indetermine';
  montant?: number;
  dureeMois?: number;
  dateSignature?: string;
}) {
  await request(`/contrats/${payload.contratId}`, 'PATCH', {
    ...(payload.typeContrat ? { type: payload.typeContrat } : {}),
    ...(payload.montant !== undefined ? { montant_loyer: payload.montant } : {}),
    ...(payload.dureeMois !== undefined ? { duree: payload.dureeMois } : {}),
    ...(payload.dateSignature ? { date_signature: payload.dateSignature } : {}),
  });

  pushPersistentNotification({
    role: 'locataire',
    type: 'contract',
    title: 'Contrat mis a jour avant signature',
    subtitle: 'Le bailleur a mis a jour les conditions de votre contrat.',
    actionHref: '/locataire/contrat',
  });
}

export async function cancelBailleurContrat(contratId: string) {
  await request(`/contrats/${contratId}/annuler`, 'PATCH', {});

  pushPersistentNotification({
    role: 'locataire',
    type: 'avertissement',
    title: 'Contrat annule',
    subtitle: 'Le bailleur a annule le contrat en attente.',
    actionHref: '/locataire/contrat',
  });
}

export async function getBailleurSinistres() {
  const [sinistresPayload, conversationsPayload] = await Promise.all([
    request<{ data: ApiSinistre[] }>('/sinistres?per_page=100', 'GET'),
    request<{ data: ApiConversation[] }>('/conversations?per_page=100', 'GET'),
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
      bienId: String(conversation?.bien_id ?? '-'),
      bienTitre: conversation?.bien?.titre ?? `Bien ${conversation?.bien_id ?? '-'}`,
      locataire: toDisplayName(conversation?.user),
      date: sinistre.date_sinistre,
      description: sinistre.description,
      photoSinistre1: sinistre.img1,
      photoSinistre2: sinistre.img2 ?? undefined,
    } satisfies BailleurSinistre;
  });
}

export async function getBailleurDeparts() {
  const [departsPayload, conversationsPayload] = await Promise.all([
    request<{ data: ApiDepart[] }>('/departs?per_page=100', 'GET'),
    request<{ data: ApiConversation[] }>('/conversations?per_page=100', 'GET'),
  ]);

  const conversationByContrat = new Map<number, ApiConversation>();
  conversationsPayload.data.forEach((conversation) => {
    if (conversation.contrat?.id) {
      conversationByContrat.set(conversation.contrat.id, conversation);
    }
  });

  return departsPayload.data.map((departure) => {
    const conversation = conversationByContrat.get(departure.contrat_id);
    return {
      id: String(departure.id),
      bienId: String(conversation?.bien_id ?? '-'),
      bienTitre: conversation?.bien?.titre ?? `Bien ${conversation?.bien_id ?? '-'}`,
      locataire: toDisplayName(conversation?.user),
      dateSignalement: departure.created_at ?? new Date().toISOString(),
      datePrevue: departure.date_depart_prevue,
      statut: departure.statut ? 'confirme' : 'signale',
    } satisfies BailleurDepart;
  });
}

export async function confirmBailleurDepart(departId: string) {
  await request(`/departs/${departId}/confirmer`, 'PATCH', {});
}

export async function getBailleurLocataires() {
  const [conversations, contracts] = await Promise.all([getBailleurConversations(), getBailleurContrats()]);
  const contractByConversationId = new Map<string, BailleurContrat>();
  contracts.forEach((contract) => {
    contractByConversationId.set(contract.conversationId, contract);
  });
  const byLocataire = new Map<string, BailleurLocataire>();

  conversations.forEach((conversation) => {
    const contract = contractByConversationId.get(conversation.id);
    byLocataire.set(conversation.locataireId, {
      id: conversation.locataireId,
      bienId: conversation.bienId,
      bienTitre: conversation.bienTitre,
      nomComplet: conversation.locataireNom,
      dateDebut: contract?.dateDebut ?? conversation.lastMessageDate,
      statut: contract?.etat === 'signe' ? 'actuel' : 'ancien',
      telephone: '-',
      email: '-',
    });
  });

  return Array.from(byLocataire.values());
}

export async function getBailleurAnnulations() {
  const contracts = await getBailleurContrats();

  return contracts
    .filter((contract) => contract.etat === 'annule')
    .map((contract) => ({
      id: contract.id,
      bienId: contract.bienId,
      bienTitre: contract.bienTitre,
      locataire: contract.locataire,
      date: contract.dateDebut,
      motif: 'Annulation demandee',
      statut: 'acceptee',
    } satisfies BailleurAnnulation));
}

export async function getBailleurNotifications() {
  const [contracts, payments, conversations, sinistres, departs] = await Promise.all([
    getBailleurContrats(),
    getBailleurPaiements(),
    getBailleurConversations(),
    getBailleurSinistres(),
    getBailleurDeparts(),
  ]);

  const notifications: BailleurNotification[] = [];

  contracts.forEach((contract) => {
    notifications.push({
      id: `contract-${contract.id}`,
      type: 'contract',
      title: `Contrat ${contract.etat}`,
      subtitle: `${contract.bienTitre} - ${contract.locataire}`,
      date: contract.dateDebut === '-' ? new Date().toISOString() : contract.dateDebut,
      actionHref: '/bailleur/contrats',
      bienId: contract.bienId,
    });
  });

  payments.forEach((payment) => {
    notifications.push({
      id: `payment-${payment.id}`,
      type: 'payment',
      title: 'Paiement recu',
      subtitle: `${payment.bienTitre} - ${payment.montant.toLocaleString('fr-FR')} FCFA`,
      date: payment.datePaiement,
      actionHref: '/bailleur/paiements',
      bienId: payment.bienId,
    });
  });

  conversations.forEach((conversation) => {
    notifications.push({
      id: `message-${conversation.id}`,
      type: 'message',
      title: `Nouveau message - ${conversation.locataireNom}`,
      subtitle: conversation.lastMessage,
      date: conversation.lastMessageDate,
      actionHref: '/bailleur/conversation',
      bienId: conversation.bienId,
    });
  });

  sinistres.forEach((sinistre) => {
    notifications.push({
      id: `sinistre-${sinistre.id}`,
      type: 'avertissement',
      title: `Sinistre signale - ${sinistre.bienTitre}`,
      subtitle: sinistre.description,
      date: sinistre.date,
      actionHref: '/bailleur/sinistres',
      bienId: sinistre.bienId,
    });
  });

  departs.forEach((departure) => {
    notifications.push({
      id: `depart-${departure.id}`,
      type: 'bien',
      title: `Depart ${departure.statut}`,
      subtitle: `${departure.locataire} - ${departure.bienTitre}`,
      date: departure.dateSignalement,
      actionHref: '/bailleur/depart',
      bienId: departure.bienId,
    });
  });

  const persistentNotifications = getPersistentNotificationsForRole('bailleur');
  return [...persistentNotifications, ...notifications].sort((left, right) => Date.parse(right.date) - Date.parse(left.date));
}

export async function getBailleurDashboard(): Promise<BailleurDashboard> {
  const [biens, contracts, payments, conversations, sinistres, departs, notifications] = await Promise.all([
    getMyBiens(),
    getBailleurContrats(),
    getBailleurPaiements(),
    getBailleurConversations(),
    getBailleurSinistres(),
    getBailleurDeparts(),
    getBailleurNotifications(),
  ]);

  const totalUnits = biens.length;
  const occupiedUnits = biens.filter((item) => item.occupationStatut === 'en_location').length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  const monthlyRevenue = payments.reduce((total, payment) => total + payment.montant, 0);
  const actifs = biens.filter((item) => item.validationStatut === 'verifie').length;
  const contratsEnCours = contracts.filter((contract) => contract.etat === 'signe' || contract.etat === 'en_attente').length;

  const monthKeys = buildRecentMonthKeys(3);
  const messagesByMonth = new Map<string, number>();
  conversations.forEach((conversation) => {
    conversation.messages.forEach((message) => {
      const key = getMonthKey(message.date);
      messagesByMonth.set(key, (messagesByMonth.get(key) ?? 0) + 1);
    });
  });

  const monthStats = monthKeys.map((key) => ({
    key,
    label: formatMonthLabel(key),
    signalements: sinistres.filter((sinistre) => getMonthKey(sinistre.date) === key).length,
    departs: departs.filter((departure) => getMonthKey(departure.dateSignalement) === key).length,
    paiements: payments.filter((payment) => getMonthKey(payment.datePaiement) === key).length,
    messages: messagesByMonth.get(key) ?? 0,
  } satisfies BailleurDashboardMonthStat));

  return {
    occupancyRate,
    occupiedUnits,
    totalUnits,
    monthlyRevenue,
    alerts: notifications.length,
    actifs,
    contratsEnCours,
    sinistres: sinistres.length,
    departs: departs.length,
    paiements: payments.length,
    conversations: conversations.length,
    monthStats,
  };
}

export async function createMyBien(payload: {
  titre: string;
  type: string;
  description: string;
  montant: number;
  modalitePaiement: string;
  surface: number;
  nbChambres: number;
  nbSalles: number;
  usages: string[];
  ville: string;
  quartier: string;
  lieuDit: string;
  latitude?: string;
  longitude?: string;
  images: string[];
}) {
  const apiBaseUrl = requireApiBaseUrl();

  const form = new FormData();
  form.append('titre', payload.titre);
  form.append('type', payload.type);
  form.append('description', payload.description);
  form.append('montant', String(payload.montant));
  form.append('modalitePaiement', payload.modalitePaiement);
  form.append('surface', String(payload.surface));
  form.append('nb_chambres', String(payload.nbChambres));
  form.append('nbSalles', String(payload.nbSalles));
  form.append('ammeublement', '0');
  form.append('ville', payload.ville);
  form.append('quartier', payload.quartier);
  form.append('lieuDit', payload.lieuDit);

  if (payload.latitude?.trim()) {
    form.append('latitude', payload.latitude.trim());
  }

  if (payload.longitude?.trim()) {
    form.append('longitude', payload.longitude.trim());
  }

  payload.usages.forEach((usage) => form.append('usages[]', usage));

  for (const [index, uri] of payload.images.slice(0, 3).entries()) {
    await appendImage(form, 'images[]', uri, index);
  }

  const headers = authHeaders(false);

  const response = await fetch(`${apiBaseUrl}/biens`, {
    method: 'POST',
    headers,
    body: form,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? 'Creation du bien impossible.');
  }

  return data;
}

export async function addBienImage(bienId: string, uri: string) {
  const form = new FormData();
  form.append('bien_id', bienId);
  await appendImage(form, 'fichier', uri, 0);
  return sendMultipart('/images', form, 'POST');
}

export async function replaceBienImage(imageId: string, uri: string) {
  const form = new FormData();
  await appendImage(form, 'fichier', uri, 0);
  return sendMultipart(`/images/${imageId}`, form, 'PUT');
}

export async function removeBienImage(imageId: string) {
  await request(`/images/${imageId}`, 'DELETE');
}
