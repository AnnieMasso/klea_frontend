import { getAuthToken } from './auth-session';
import { requireApiBaseUrl } from './api-config';

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type UserRole = 'administrateur' | 'bailleur' | 'locataire';
type UserStatus = 'actif' | 'inactif';
type BienStatus = 'actif' | 'inactif';

export type AdminUser = {
  id: number;
  nom: string;
  prenom?: string | null;
  email: string;
  role: UserRole;
  statut: UserStatus;
  created_at: string;
  cni_recto?: string | null;
  cni_verso?: string | null;
  assurance_habitation?: string | null;
};

export type AdminBien = {
  id: number;
  titre: string;
  type: string;
  description?: string | null;
  montant?: number;
  ville?: string | null;
  quartier?: string | null;
  lieu_dit?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  statut: BienStatus;
  created_at: string;
  bailleur?: AdminUser | null;
  images?: Array<{ id: number; slug: string }>;
  usages?: Array<{ id: number; nom_usage: string }>;
};

export type AdminBailleurRow = {
  bailleur: AdminUser;
  biens: AdminBien[];
  has_ever_had_tenant: boolean;
};

export type AdminLocataireRow = {
  locataire: AdminUser;
  occupied_bien?: AdminBien | null;
  has_ever_rented: boolean;
};

export type AdminBienRow = {
  bien: AdminBien;
  has_ever_been_rented: boolean;
  occupied_by?: AdminUser | null;
};

export type AdminSignalement = {
  id: number;
  plaignant_id: number;
  accuse_id: number;
  motif: string;
  preuve1?: string | null;
  preuve2?: string | null;
  created_at?: string;
};

export type AdminDashboard = {
  pending_users_count: number;
  pending_biens_count: number;
  bailleurs_count: number;
  locataires_count: number;
};

type ApiMessage = {
  id: number;
  conversation_id: number;
  contenu: string;
  created_at?: string;
  sender?: AdminUser;
};

type ApiConversation = {
  id: number;
  bien_id: number;
  user_id?: number;
  bien?: AdminBien;
  user?: AdminUser;
  messages?: ApiMessage[];
};

export type AdminConversationMessage = {
  id: string;
  auteurRole: 'administrateur' | 'bailleur' | 'locataire';
  auteurNom: string;
  contenu: string;
  date: string;
};

export type AdminConversation = {
  id: string;
  bienId: string;
  bienTitre: string;
  participantUserId: string;
  participantNom: string;
  participantRole: 'administrateur' | 'bailleur' | 'locataire';
  locataireNom: string;
  lastMessage: string;
  lastMessageDate: string;
  messages: AdminConversationMessage[];
};

function toUserName(user?: AdminUser): string {
  if (!user) return 'Utilisateur';
  const full = [user.prenom ?? '', user.nom ?? ''].map((item) => item.trim()).filter(Boolean).join(' ');
  return full || user.email;
}

function toAdminConversation(input: ApiConversation): AdminConversation {
  const sortedMessages = (input.messages ?? [])
    .slice()
    .sort((left, right) => Date.parse(left.created_at ?? '') - Date.parse(right.created_at ?? ''));

  const messages = sortedMessages.map((message) => ({
    id: String(message.id),
    auteurRole: message.sender?.role ?? 'locataire',
    auteurNom: toUserName(message.sender),
    contenu: message.contenu,
    date: message.created_at ?? new Date().toISOString(),
  } satisfies AdminConversationMessage));

  const lastMessage = messages[messages.length - 1];

  return {
    id: String(input.id),
    bienId: String(input.bien_id),
    bienTitre: input.bien?.titre ?? `Bien ${input.bien_id}`,
    participantUserId: String(input.user_id ?? input.user?.id ?? ''),
    participantNom: toUserName(input.user),
    participantRole: input.user?.role ?? 'locataire',
    locataireNom: toUserName(input.user),
    lastMessage: lastMessage?.contenu ?? 'Conversation demarree.',
    lastMessageDate: lastMessage?.date ?? new Date().toISOString(),
    messages,
  };
}

async function request<T>(path: string, method: RequestMethod, body?: unknown): Promise<T> {
  const apiBaseUrl = requireApiBaseUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? 'Une erreur est survenue.');
  }

  return data as T;
}

export function getAdminDashboard() {
  return request<AdminDashboard>('/admin/dashboard', 'GET');
}

export function getAdminMe() {
  return request<AdminUser>('/auth/me', 'GET');
}

export async function getAdminConversations() {
  const payload = await request<{ data: ApiConversation[] }>('/conversations?per_page=100', 'GET');
  return payload.data.map(toAdminConversation);
}

export async function sendAdminMessage(conversationId: string, contenu: string) {
  const me = await getAdminMe();
  await request('/messages', 'POST', {
    conversation_id: Number(conversationId),
    sender_id: me.id,
    contenu,
  });
}

export async function createAdminConversationForBien(bienId: number | string, participantUserId: number | string) {
  const normalizedBienId = String(bienId);
  const normalizedParticipantUserId = String(participantUserId);
  const conversations = await getAdminConversations();
  const existingConversation = conversations.find(
    (conversation) => conversation.bienId === normalizedBienId && conversation.participantUserId === normalizedParticipantUserId,
  );

  if (existingConversation) {
    return existingConversation.id;
  }

  const createdConversation = await request<{ id: number }>('/conversations', 'POST', {
    bien_id: Number(bienId),
    user_id: Number(participantUserId),
  });

  return String(createdConversation.id);
}

export function getAdminBailleurs() {
  return request<AdminBailleurRow[]>('/admin/bailleurs', 'GET');
}

export function getAdminLocataires() {
  return request<AdminLocataireRow[]>('/admin/locataires', 'GET');
}

export function getAdminBiens() {
  return request<AdminBienRow[]>('/admin/biens', 'GET');
}

export async function getAdminSignalements() {
  const payload = await request<{ data: AdminSignalement[] }>('/signalements?per_page=100', 'GET');
  return payload.data;
}

export function validateAdminUser(id: number) {
  return request<{ message: string }>(`/admin/users/${id}/valider`, 'PATCH');
}

export function deleteAdminUser(id: number) {
  return request<{ message: string }>(`/admin/users/${id}`, 'DELETE');
}

export function validateAdminBien(id: number) {
  return request<{ message: string }>(`/admin/biens/${id}/valider`, 'PATCH');
}

export function deleteAdminBien(id: number) {
  return request<{ message: string }>(`/admin/biens/${id}`, 'DELETE');
}
