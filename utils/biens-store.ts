import type { Bien, Condition, Contrat, Conversation, Message, Paiement, Sinistre } from '@/utils/types/bailleur-interfaces';

const maisonPhoto = 'maison.jpg';
const iconPhoto = 'icon.png';
const faviconPhoto = 'favicon.png';

export const CURRENT_LOCATAIRE_ID = 'loc-1';
export const CURRENT_LOCATAIRE_NOM = 'Brigitte Ndzi';
export const CURRENT_BAILLEUR_ID = 'bailleur-1';
export const CURRENT_ADMIN_ID = 'admin-1';
export const CURRENT_ADMIN_NOM = 'Administrateur Klea';

export type OccupationStatut = 'en_location' | 'libre' | 'jamais_loue';

export type ValidationStatut = 'en_attente' | 'verifie';

export type LocataireResume = {
  id: string;
  nomComplet: string;
  statut: 'actuel' | 'ancien';
  telephone: string;
  email: string;
  cniRecto?: string;
  cniVerso?: string;
  assuranceHabitationFichier?: {
    fileName: string;
    fileUrl: string;
    mimeType?: string;
  };
};

export type BailleurAccount = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  statut: ValidationStatut;
  createdAt: string;
  cniRecto?: string;
  cniVerso?: string;
};

export type LocataireAccount = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  statut: ValidationStatut;
  createdAt: string;
  banni: boolean;
  cniRecto?: string;
  cniVerso?: string;
  assuranceHabitation?: string;
};

export type DemandeAnnulation = {
  id: string;
  locataire: string;
  date: string;
  motif: string;
  statut: 'en_attente' | 'acceptee' | 'refusee';
};

export type DepartPreavis = {
  id: string;
  locataire: string;
  dateSignalement: string;
  datePrevue: string;
  statut: 'signale' | 'confirme';
};

export type ContratDetail = {
  id: string;
  locataire: string;
  locataireId?: string;
  conversationId?: string;
  typeContrat: 'determine' | 'indetermine';
  etat: 'en_attente' | 'signe' | 'annule';
  dateSignature: string;
  montant: number;
  dureeMois: number;
  dateDebut: string;
  conditions: Condition[];
  signe: boolean;
  statut: 'actif' | 'termine' | 'annule';
};

export type ContratStatutAffichage = 'en cours' | 'expire' | 'fini';

export type ContratSpecifique = {
  id: string;
  bienId: string;
  bienTitre: string;
  typeBien: string;
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

export type PaiementLigne = Paiement & {
  bienId: string;
  bienTitre: string;
  locataire: string;
  dureeMois: number;
};

export type SignalementLigne = {
  id: string;
  bienId: string;
  bienTitre: string;
  locataire: string;
  description: string;
  date: string;
  photoSinistre1: string;
  photoSinistre2?: string;
  statut: 'ouvert' | 'traite' | 'ferme';
};

export type DemandeAnnulationLigne = DemandeAnnulation & {
  bienId: string;
  bienTitre: string;
};

export type AncienLocataireLigne = LocataireResume & {
  bienId: string;
  bienTitre: string;
  dateReference: string;
};

export type AssuranceHabitationDetail = {
  locataireId: string;
  nomComplet: string;
  bienId: string;
  bienTitre: string;
  assuranceHabitationFichier: {
    fileName: string;
    fileUrl: string;
    mimeType?: string;
  } | null;
  telephone: string;
  email: string;
};

export type CniLocataireDetail = {
  locataireId: string;
  nomComplet: string;
  bienId: string;
  bienTitre: string;
  cniRecto: string | null;
  cniVerso: string | null;
  telephone: string;
  email: string;
};

export type ConversationMessageLigne = Message & {
  auteurNom: string;
  auteurRole: 'administrateur' | 'bailleur' | 'locataire';
};

export type ConversationLigne = {
  id: string;
  bienId: string;
  bienTitre: string;
  contratId: string | null;
  locataireId: string;
  locataireNom: string;
  statutContrat: ContratStatutAffichage | 'sans contrat';
  lastMessage: string;
  lastMessageDate: string;
  messages: ConversationMessageLigne[];
};

export type BienDetail = Bien & {
  createdAt: string;
  occupationStatut: OccupationStatut;
  jamaisLoue: boolean;
  validationStatut: ValidationStatut;
  locataireActuel: LocataireResume | null;
  anciensLocataires: LocataireResume[];
  paiements: Paiement[];
  departsPreavis: DepartPreavis[];
  sinistres: Sinistre[];
  demandesAnnulation: DemandeAnnulation[];
  contrats: ContratDetail[];
};

export type SignalementUtilisateur = {
  id: string;
  auteurId: string;
  utilisateurSignaleId?: string;
  utilisateurSignaleRole?: 'locataire' | 'bailleur';
  motif: string;
  preuve1?: string;
  preuve2?: string;
  date: string;
};

export type NotificationType = 'payment' | 'contract' | 'conversation' | 'message' | 'bien' | 'compte' | 'avertissement';

export type AppNotification = {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  subtitle: string;
  date: string;
  read: boolean;
  actionHref?: string;
  bienId?: string;
};

export type NewBienPayload = {
  titre: string;
  type: string;
  description: string;
  montant: number;
  modalitePaiement: string;
  surface: number;
  nbChambres: number;
  nbSalles: number;
  usages: string[];
  adresse: string;
  pays: string;
  ville: string;
  lieuDit: string;
  localisation?: string;
  images: string[];
};

type Listener = () => void;

const listeners = new Set<Listener>();

const todayIso = new Date().toISOString();

let biens: BienDetail[] = [];

let conversations: Conversation[] = [];

let signalementsUtilisateur: SignalementUtilisateur[] = [];
let appNotifications: AppNotification[] = [];

let bailleurAccounts: BailleurAccount[] = [];

let locataireAccounts: LocataireAccount[] = [];

function notify() {
  listeners.forEach((listener) => listener());
}

function pushNotification(payload: Omit<AppNotification, 'id' | 'date' | 'read'>) {
  appNotifications = [
    {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
      read: false,
      ...payload,
    },
    ...appNotifications,
  ];
  notify();
}

export function getNotificationsForRecipient(recipientId: string): AppNotification[] {
  return appNotifications
    .filter((item) => item.recipientId === recipientId)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function markNotificationRead(notificationId: string): boolean {
  let changed = false;
  appNotifications = appNotifications.map((item) => {
    if (item.id !== notificationId || item.read) return item;
    changed = true;
    return { ...item, read: true };
  });
  if (changed) notify();
  return changed;
}

export function markAllNotificationsRead(recipientId: string): boolean {
  let changed = false;
  appNotifications = appNotifications.map((item) => {
    if (item.recipientId !== recipientId || item.read) return item;
    changed = true;
    return { ...item, read: true };
  });
  if (changed) notify();
  return changed;
}

export function createBailleurAccount(payload: {
  nom: string;
  prenom: string;
  email: string;
  cniRecto?: string;
  cniVerso?: string;
}): BailleurAccount {
  const account: BailleurAccount = {
    id: `bailleur-${Date.now()}`,
    nom: payload.nom,
    prenom: payload.prenom,
    email: payload.email,
    statut: 'en_attente',
    createdAt: new Date().toISOString(),
    cniRecto: payload.cniRecto,
    cniVerso: payload.cniVerso,
  };
  bailleurAccounts = [account, ...bailleurAccounts];
  notify();
  return account;
}

export function createLocataireAccount(payload: {
  nom: string;
  prenom: string;
  email: string;
  cniRecto?: string;
  cniVerso?: string;
  assuranceHabitation?: string;
}): LocataireAccount {
  const account: LocataireAccount = {
    id: `loc-${Date.now()}`,
    nom: payload.nom,
    prenom: payload.prenom,
    email: payload.email,
    statut: 'en_attente',
    createdAt: new Date().toISOString(),
    banni: false,
    cniRecto: payload.cniRecto,
    cniVerso: payload.cniVerso,
    assuranceHabitation: payload.assuranceHabitation,
  };
  locataireAccounts = [account, ...locataireAccounts];
  notify();
  return account;
}

export function getBailleurDeletionBlockReason(bailleurId: string): string | null {
  const bailleur = bailleurAccounts.find((item) => item.id === bailleurId);
  if (!bailleur) return 'Bailleur introuvable.';
  if (bailleur.statut === 'verifie') return 'Suppression impossible: ce bailleur est deja verifie.';

  const hasTenantHistory = biens.some((item) =>
    item.bailleurId === bailleurId && (Boolean(item.locataireActuel) || item.anciensLocataires.length > 0 || item.contrats.length > 0),
  );

  if (hasTenantHistory) {
    return 'Suppression impossible: ce bailleur a deja eu au moins un locataire.';
  }

  return null;
}

export function deleteBailleurAccount(bailleurId: string): { ok: boolean; message: string } {
  const blockReason = getBailleurDeletionBlockReason(bailleurId);
  if (blockReason) return { ok: false, message: blockReason };

  const before = bailleurAccounts.length;
  bailleurAccounts = bailleurAccounts.filter((item) => item.id !== bailleurId);
  const changed = bailleurAccounts.length !== before;
  if (changed) notify();
  return { ok: changed, message: changed ? 'Bailleur supprime.' : 'Bailleur introuvable.' };
}

export function getLocataireDeletionBlockReason(locataireId: string): string | null {
  const locataire = locataireAccounts.find((item) => item.id === locataireId);
  if (!locataire) return 'Locataire introuvable.';
  if (locataire.statut === 'verifie') return 'Suppression impossible: ce locataire est deja verifie.';
  return null;
}

export function deleteLocataireAccount(locataireId: string): { ok: boolean; message: string } {
  const blockReason = getLocataireDeletionBlockReason(locataireId);
  if (blockReason) return { ok: false, message: blockReason };

  const before = locataireAccounts.length;
  locataireAccounts = locataireAccounts.filter((item) => item.id !== locataireId);
  const changed = locataireAccounts.length !== before;
  if (changed) notify();
  return { ok: changed, message: changed ? 'Locataire supprime.' : 'Locataire introuvable.' };
}

export function isLocataireBanni(locataireId: string): boolean {
  return locataireAccounts.find((item) => item.id === locataireId)?.banni ?? false;
}

export function setLocataireBanni(locataireId: string, banni: boolean): boolean {
  let changed = false;
  locataireAccounts = locataireAccounts.map((item) => {
    if (item.id !== locataireId) return item;
    changed = true;
    return { ...item, banni };
  });
  if (changed) {
    notify();
    pushNotification({
      recipientId: locataireId,
      type: 'compte',
      title: banni ? 'Compte suspendu' : 'Compte reactive',
      subtitle: banni
        ? "Votre compte a ete suspendu par l'administrateur suite a un signalement."
        : "Votre compte a ete reactive par l'administrateur.",
      actionHref: '/locataire/profil',
    });
  }
  return changed;
}

export function sendAvertissementLocataire(locataireId: string, message: string): boolean {
  const exists = locataireAccounts.some((item) => item.id === locataireId);
  if (!exists) return false;
  pushNotification({
    recipientId: locataireId,
    type: 'avertissement',
    title: 'Avertissement de l\'administrateur',
    subtitle: message,
    actionHref: '/locataire/profil',
  });
  return true;
}

export function getAllSignalementsUtilisateur(): SignalementUtilisateur[] {
  return [...signalementsUtilisateur].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function getAllBailleurAccounts(): BailleurAccount[] {
  return bailleurAccounts;
}

export function getAllLocataireAccounts(): LocataireAccount[] {
  return locataireAccounts;
}

export function isBailleurVerified(bailleurId: string): boolean {
  return bailleurAccounts.find((item) => item.id === bailleurId)?.statut === 'verifie';
}

export function isLocataireVerified(locataireId: string): boolean {
  return locataireAccounts.find((item) => item.id === locataireId)?.statut === 'verifie';
}

export function setBailleurStatut(bailleurId: string, statut: ValidationStatut): boolean {
  let changed = false;
  bailleurAccounts = bailleurAccounts.map((item) => {
    if (item.id !== bailleurId) return item;
    changed = true;
    return { ...item, statut };
  });
  if (changed) {
    notify();
    if (statut === 'verifie') {
      pushNotification({
        recipientId: bailleurId,
        type: 'compte',
        title: 'Compte valide',
        subtitle: 'Votre compte bailleur a ete valide par l\'administrateur.',
        actionHref: '/bailleur/profil',
      });
    }
  }
  return changed;
}

export function setLocataireStatut(locataireId: string, statut: ValidationStatut): boolean {
  let changed = false;
  locataireAccounts = locataireAccounts.map((item) => {
    if (item.id !== locataireId) return item;
    changed = true;
    return { ...item, statut };
  });
  if (changed) {
    notify();
    if (statut === 'verifie') {
      pushNotification({
        recipientId: locataireId,
        type: 'compte',
        title: 'Compte valide',
        subtitle: 'Votre compte locataire a ete valide par l\'administrateur.',
        actionHref: '/locataire/profil',
      });
    }
  }
  return changed;
}

export function setBienValidationStatut(bienId: string, statut: ValidationStatut): boolean {
  let changed = false;
  let bienTitre = '';
  let recipientId = '';
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;
    changed = true;
    bienTitre = item.titre;
    recipientId = item.bailleurId;
    return { ...item, validationStatut: statut };
  });
  if (changed) {
    notify();
    if (statut === 'verifie') {
      pushNotification({
        recipientId,
        type: 'bien',
        title: 'Bien valide',
        subtitle: `${bienTitre} a ete valide par l'administrateur.`,
        actionHref: '/bailleur/mes_biens',
        bienId,
      });
    }
  }
  return changed;
}

export function getCniLocataire(locataireId: string, bienId?: string): CniLocataireDetail | null {
  const sourceBien = bienId
    ? biens.find((item) => item.id === bienId)
    : biens.find((item) => item.locataireActuel?.id === locataireId || item.anciensLocataires.some((tenant) => tenant.id === locataireId));
  if (!sourceBien) return null;

  const tenant =
    sourceBien.locataireActuel?.id === locataireId
      ? sourceBien.locataireActuel
      : sourceBien.anciensLocataires.find((item) => item.id === locataireId);
  if (!tenant) return null;
  if (tenant.statut !== 'actuel') return null;

  return {
    locataireId: tenant.id,
    nomComplet: tenant.nomComplet,
    bienId: sourceBien.id,
    bienTitre: sourceBien.titre,
    cniRecto: tenant.cniRecto ?? null,
    cniVerso: tenant.cniVerso ?? null,
    telephone: tenant.telephone,
    email: tenant.email,
  };
}

export function addBienImage(bienId: string, url: string): boolean {
  let added = false;
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;
    if (item.images.length >= 3) return item;
    added = true;
    const image = { id: `img-${bienId}-${Date.now()}`, url, type: 'photo' as const };
    return { ...item, images: [...item.images, image] };
  });
  if (added) notify();
  return added;
}

export function updateBienImage(bienId: string, imageId: string, url: string): boolean {
  let changed = false;
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;
    const images = item.images.map((image) => {
      if (image.id !== imageId) return image;
      changed = true;
      return { ...image, url };
    });
    return { ...item, images };
  });
  if (changed) notify();
  return changed;
}

export function removeBienImage(bienId: string, imageId: string): boolean {
  let changed = false;
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;
    const images = item.images.filter((image) => image.id !== imageId);
    changed = images.length !== item.images.length || changed;
    return { ...item, images };
  });
  if (changed) notify();
  return changed;
}

function normalizeBienStatus(occupation: OccupationStatut): Bien['statut'] {
  if (occupation === 'en_location') return 'loué';
  return 'disponible';
}

export function subscribeBiens(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getBiens(): BienDetail[] {
  return biens;
}

export function getBienById(id: string): BienDetail | null {
  return biens.find((item) => item.id === id) ?? null;
}

export function getBienForLocataire(locataireId: string): BienDetail | null {
  return biens.find((item) => item.locataireActuel?.id === locataireId) ?? null;
}

export function getContratsForLocataire(locataireId: string) {
  return biens.flatMap((item) =>
    item.contrats
      .filter((contract) => contract.locataireId === locataireId)
      .map((contract) => ({ ...contract, bienId: item.id, bienTitre: item.titre })),
  );
}

export function addBien(payload: NewBienPayload): BienDetail {
  const id = `bien-${Date.now()}`;
  const newItem: BienDetail = {
    id,
    createdAt: new Date().toISOString(),
    titre: payload.titre,
    type: payload.type,
    description: payload.description,
    montant: payload.montant,
    modalitePaiement: payload.modalitePaiement,
    nbChambres: payload.nbChambres,
    nbSalles: payload.nbSalles,
    surface: payload.surface,
    adresse: payload.adresse,
    pays: payload.pays,
    ville: payload.ville,
    quartier: payload.pays,
    localisation: payload.localisation,
    statut: 'disponible',
    images: payload.images.map((url, index) => ({ id: `img-${id}-${index + 1}`, url, type: 'photo' as const })),
    usages: payload.usages.map((label, index) => ({ id: `usage-${id}-${index + 1}`, nomUsage: label })),
    bailleurId: 'bailleur-1',
    occupationStatut: 'jamais_loue',
    jamaisLoue: true,
    validationStatut: 'en_attente',
    locataireActuel: null,
    anciensLocataires: [],
    paiements: [],
    departsPreavis: [],
    sinistres: [],
    demandesAnnulation: [],
    contrats: [],
  };

  biens = [newItem, ...biens];
  notify();
  pushNotification({
    recipientId: newItem.bailleurId,
    type: 'bien',
    title: 'Bien en attente de validation',
    subtitle: `${newItem.titre} est en attente de validation par l'administrateur.`,
    actionHref: '/bailleur/mes_biens',
    bienId: newItem.id,
  });
  return newItem;
}

export function updateBien(id: string, patch: Partial<Pick<BienDetail, 'titre' | 'type' | 'montant' | 'adresse' | 'ville'>>): boolean {
  let changed = false;
  biens = biens.map((item) => {
    if (item.id !== id) return item;
    changed = true;
    return { ...item, ...patch };
  });
  if (changed) notify();
  return changed;
}

export function removeBien(id: string): { ok: boolean; message: string } {
  const found = biens.find((item) => item.id === id);
  if (!found) return { ok: false, message: 'Bien introuvable.' };
  if (found.occupationStatut === 'en_location') {
    return { ok: false, message: 'Suppression impossible: ce bien est en location.' };
  }
  biens = biens.filter((item) => item.id !== id);
  notify();
  pushNotification({
    recipientId: found.bailleurId,
    type: 'bien',
    title: 'Bien supprime',
    subtitle: `${found.titre} a ete supprime par l'administrateur.`,
    actionHref: '/bailleur/mes_biens',
    bienId: found.id,
  });
  return { ok: true, message: 'Bien supprime.' };
}

export function getBiensByFilter(filter: 'tous' | OccupationStatut): BienDetail[] {
  if (filter === 'tous') return biens;
  return biens.filter((item) => item.occupationStatut === filter);
}

export function confirmDepart(bienId: string, departId: string): boolean {
  let updated = false;
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;
    const departsPreavis = item.departsPreavis.map((departure) => {
      if (departure.id !== departId) return departure;
      updated = true;
      return { ...departure, statut: 'confirme' as const };
    });
    return { ...item, departsPreavis };
  });
  if (updated) notify();
  return updated;
}

export function createDepartSignale(bienId: string, locataireNom: string, datePrevue: string): boolean {
  let created = false;
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;
    created = true;
    const depart: DepartPreavis = {
      id: `dep-${Date.now()}`,
      locataire: locataireNom,
      dateSignalement: new Date().toISOString().slice(0, 10),
      datePrevue,
      statut: 'signale',
    };
    return { ...item, departsPreavis: [depart, ...item.departsPreavis] };
  });

  if (created) notify();
  return created;
}

export function confirmDemandeAnnulation(bienId: string, demandeId: string): boolean {
  let updated = false;

  biens = biens.map((item) => {
    if (item.id !== bienId) return item;

    const targetDemande = item.demandesAnnulation.find((request) => request.id === demandeId);
    if (!targetDemande || targetDemande.statut !== 'en_attente') return item;

    const demandesAnnulation = item.demandesAnnulation.map((request) =>
      request.id === demandeId ? { ...request, statut: 'acceptee' as const } : request,
    );

    let contractUpdated = false;
    const contrats = item.contrats.map((contract) => {
      if (contractUpdated) return contract;
      if (contract.locataire !== targetDemande.locataire) return contract;
      if (contract.statut === 'annule') return contract;
      contractUpdated = true;
      return { ...contract, statut: 'annule' as const };
    });

    updated = true;
    return {
      ...item,
      demandesAnnulation,
      contrats,
    };
  });

  if (updated) notify();
  return updated;
}

export function createDemandeAnnulation(bienId: string, locataireNom: string, motif: string): boolean {
  let created = false;
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;
    created = true;
    const demande: DemandeAnnulation = {
      id: `ann-${Date.now()}`,
      locataire: locataireNom,
      date: new Date().toISOString().slice(0, 10),
      motif,
      statut: 'en_attente',
    };
    return { ...item, demandesAnnulation: [demande, ...item.demandesAnnulation] };
  });

  if (created) notify();
  return created;
}

export function createContratForBien(
  bienId: string,
  payload: {
    locataire: string;
    locataireId?: string;
    montant: number;
    dureeMois: number;
    conditions: string[];
    signerMaintenant?: boolean;
    conversationId?: string;
    typeContrat?: 'determine' | 'indetermine';
    etat?: 'en_attente' | 'signe' | 'annule';
    dateSignature?: string;
  },
): boolean {
  let created = false;
  let createdConversation: Conversation | null = null;
  let notifiedLocataireId = '';
  let notifiedBienTitre = '';
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;

    const timestamp = Date.now();
    const contractId = `ctr-${timestamp}`;
    const locataireId = payload.locataireId ?? `loc-${timestamp}`;
    const conversationId = payload.conversationId ?? `conv-${timestamp}`;
    notifiedLocataireId = locataireId;
    notifiedBienTitre = item.titre;
    const contrat: ContratDetail = {
      id: contractId,
      locataire: payload.locataire,
      locataireId,
      conversationId,
      typeContrat: payload.typeContrat ?? 'determine',
      etat: payload.etat ?? (payload.signerMaintenant ? 'signe' : 'en_attente'),
      dateSignature: payload.dateSignature ?? new Date().toISOString().slice(0, 10),
      montant: payload.montant,
      dureeMois: payload.dureeMois,
      dateDebut: new Date().toISOString().slice(0, 10),
      conditions: payload.conditions.map((condition, index) => ({ id: `cond-${contractId}-${index + 1}`, description: condition })),
      signe: Boolean(payload.signerMaintenant),
      statut: 'actif',
    };

    if (!payload.conversationId) {
      createdConversation = {
        id: conversationId,
        sujet: item.titre,
        participants: ['bailleur-1', locataireId],
        bienId: item.id,
        contratId: contractId,
        locataireId,
        messages: [
          {
            id: `msg-${timestamp}`,
            conversationId,
            auteurId: 'bailleur-1',
            contenu: `Bonjour ${payload.locataire}, cette conversation est liee a votre contrat pour ${item.titre}.`,
            date: new Date().toISOString(),
            type: 'text',
          },
        ],
      };
    } else {
      conversations = conversations.map((conversation) => {
        if (conversation.id !== payload.conversationId) return conversation;
        return {
          ...conversation,
          contratId: contractId,
          locataireId,
          messages: [
            ...conversation.messages,
            {
              id: `msg-${timestamp}`,
              conversationId,
              auteurId: 'bailleur-1',
              contenu: `Un nouveau contrat a ete etabli pour ${item.titre}. Il vous est transmis pour signature.`,
              date: new Date().toISOString(),
              type: 'contract',
              contractId,
            },
          ],
        };
      });
    }

    created = true;
    return {
      ...item,
      occupationStatut: 'en_location',
      jamaisLoue: false,
      statut: normalizeBienStatus('en_location'),
      locataireActuel: {
        id: locataireId,
        nomComplet: payload.locataire,
        statut: 'actuel',
        telephone: '-',
        email: '-',
        assuranceHabitationFichier: {
          fileName: 'assurance_non_renseignee.pdf',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          mimeType: 'application/pdf',
        },
      },
      contrats: [contrat, ...item.contrats],
    };
  });

  if (createdConversation) {
    conversations = [createdConversation, ...conversations];
  }
  if (created) {
    notify();
    pushNotification({
      recipientId: notifiedLocataireId,
      type: 'message',
      title: 'Nouveau message',
      subtitle: `Le bailleur vous a transmis un contrat pour ${notifiedBienTitre}`,
      actionHref: '/locataire/conversation',
      bienId,
    });
  }
  return created;
}

export function signContrat(bienId: string, contratId: string): boolean {
  let changed = false;
  let bienTitre = '';
  let locataireNom = '';
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;
    const contrats = item.contrats.map((contract) => {
      if (contract.id !== contratId) return contract;
      changed = true;
      bienTitre = item.titre;
      locataireNom = contract.locataire;
      return { ...contract, signe: true, etat: 'signe' as const };
    });
    return { ...item, contrats };
  });

  if (changed) {
    notify();
    pushNotification({
      recipientId: 'bailleur-1',
      type: 'contract',
      title: 'Contrat signe',
      subtitle: `${locataireNom} a signe le contrat pour ${bienTitre}`,
      actionHref: '/bailleur/contrats',
      bienId,
    });
  }
  return changed;
}

export function getAllSignalements(): SignalementLigne[] {
  return biens.flatMap((item) =>
    item.sinistres.map((sinistre) => {
      const relatedContract = item.contrats.find((contract) => contract.id === sinistre.contratId);
      return {
        id: sinistre.id,
        bienId: item.id,
        bienTitre: item.titre,
        locataire: relatedContract?.locataire ?? item.locataireActuel?.nomComplet ?? '-',
        description: sinistre.description,
        date: sinistre.dateSinistre,
        photoSinistre1: sinistre.photoSinistre1,
        photoSinistre2: sinistre.photoSinistre2,
        statut: sinistre.statut ?? 'ouvert',
      };
    }),
  );
}

export function addSinistre(
  bienId: string,
  contratId: string,
  payload: { description: string; photoSinistre1: string; photoSinistre2?: string },
): boolean {
  let added = false;
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;
    added = true;
    const sinistre: Sinistre = {
      id: `sin-${Date.now()}`,
      contratId,
      dateSinistre: new Date().toISOString().slice(0, 10),
      description: payload.description,
      photoSinistre1: payload.photoSinistre1,
      photoSinistre2: payload.photoSinistre2,
      statut: 'ouvert',
    };
    return { ...item, sinistres: [sinistre, ...item.sinistres] };
  });

  if (added) notify();
  return added;
}

export function createSignalementUtilisateur(
  auteurId: string,
  utilisateurSignaleId: string,
  utilisateurSignaleRole: 'locataire' | 'bailleur',
  motif: string,
  preuve1?: string,
  preuve2?: string,
): boolean {
  signalementsUtilisateur = [
    {
      id: `sig-${Date.now()}`,
      auteurId,
      utilisateurSignaleId,
      utilisateurSignaleRole,
      motif,
      preuve1,
      preuve2,
      date: new Date().toISOString(),
    },
    ...signalementsUtilisateur,
  ];
  notify();
  return true;
}

export function getSignalementsForAuteur(auteurId: string): SignalementUtilisateur[] {
  return signalementsUtilisateur
    .filter((item) => item.auteurId === auteurId)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function getAllDepartsSignales() {
  return biens.flatMap((item) =>
    item.departsPreavis.map((departure) => ({
      ...departure,
      bienId: item.id,
      bienTitre: item.titre,
    })),
  );
}

export function getAllDemandesAnnulation(): DemandeAnnulationLigne[] {
  return biens.flatMap((item) =>
    item.demandesAnnulation.map((request) => ({
      ...request,
      bienId: item.id,
      bienTitre: item.titre,
    })),
  );
}

const knownLocataireNoms: Record<string, string> = {
  'loc-1': 'Brigitte Ndzi',
};

function resolveLocataireNom(locataireId: string, relatedBien: BienDetail | undefined, relatedContract: ContratDetail | undefined): string {
  if (relatedContract) return relatedContract.locataire;
  if (relatedBien?.locataireActuel?.id === locataireId) return relatedBien.locataireActuel.nomComplet;
  const ancienLocataire = relatedBien?.anciensLocataires.find((tenant) => tenant.id === locataireId);
  if (ancienLocataire) return ancienLocataire.nomComplet;
  return knownLocataireNoms[locataireId] ?? 'Locataire';
}

function getAuteurNom(auteurId: string, conversation: Conversation, relatedBien: BienDetail | undefined): string {
  if (auteurId === CURRENT_BAILLEUR_ID) return 'Bailleur';
  if (auteurId === CURRENT_ADMIN_ID) return CURRENT_ADMIN_NOM;
  if (conversation.locataireId === auteurId) {
    const contract = relatedBien?.contrats.find((item) => item.conversationId === conversation.id);
    return resolveLocataireNom(auteurId, relatedBien, contract);
  }
  return 'Participant';
}

function getAuteurRole(auteurId: string): ConversationMessageLigne['auteurRole'] {
  if (auteurId === CURRENT_BAILLEUR_ID) return 'bailleur';
  if (auteurId === CURRENT_ADMIN_ID) return 'administrateur';
  return 'locataire';
}

export function getAllConversations(): ConversationLigne[] {
  return conversations
    .map((conversation) => {
      const relatedBien = conversation.bienId ? biens.find((item) => item.id === conversation.bienId) : undefined;
      const relatedContract = relatedBien?.contrats.find(
        (contract) => contract.id === conversation.contratId || contract.conversationId === conversation.id,
      );

      if (!relatedBien || !conversation.locataireId) return null;

      const messages = [...conversation.messages]
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
        .map((message) => ({
          ...message,
          auteurNom: getAuteurNom(message.auteurId, conversation, relatedBien),
          auteurRole: getAuteurRole(message.auteurId),
        }));

      const lastMessage = messages[messages.length - 1];

      return {
        id: conversation.id,
        bienId: relatedBien.id,
        bienTitre: relatedBien.titre,
        contratId: relatedContract?.id ?? null,
        locataireId: conversation.locataireId,
        locataireNom: resolveLocataireNom(conversation.locataireId, relatedBien, relatedContract),
        statutContrat: relatedContract ? getContratStatutAffichage(relatedContract) : 'sans contrat',
        lastMessage: lastMessage?.contenu ?? 'Aucun message',
        lastMessageDate: lastMessage?.date ?? '',
        messages,
      };
    })
    .filter((item): item is ConversationLigne => item !== null)
    .sort((a, b) => Date.parse(b.lastMessageDate || '1970-01-01') - Date.parse(a.lastMessageDate || '1970-01-01'));
}

export function getConversationsForParticipant(participantId: string): ConversationLigne[] {
  const allowedConversationIds = new Set(
    conversations
      .filter((conversation) => conversation.participants.includes(participantId))
      .map((conversation) => conversation.id),
  );

  return getAllConversations().filter((conversation) => allowedConversationIds.has(conversation.id));
}

export function getConversationById(conversationId: string): ConversationLigne | null {
  return getAllConversations().find((conversation) => conversation.id === conversationId) ?? null;
}

function getConversationActionHref(participantId: string): string {
  if (participantId === CURRENT_BAILLEUR_ID) return '/bailleur/conversation';
  if (participantId === CURRENT_ADMIN_ID) return '/administrateur/conversation';
  return '/locataire/conversation';
}

export function sendMessageToConversation(conversationId: string, contenu: string, auteurId: string = 'bailleur-1'): boolean {
  const trimmed = contenu.trim();
  if (!trimmed) return false;

  let sent = false;
  let recipientId = '';
  let bienTitre = '';
  let notifiedBienId = '';
  conversations = conversations.map((conversation) => {
    if (conversation.id !== conversationId) return conversation;

    sent = true;
    recipientId = conversation.participants.find((participant) => participant !== auteurId) ?? '';
    bienTitre = conversation.sujet ?? '';
    notifiedBienId = conversation.bienId ?? '';
    const nextMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      auteurId,
      contenu: trimmed,
      date: new Date().toISOString(),
      type: 'text',
    };

    return {
      ...conversation,
      messages: [...conversation.messages, nextMessage],
    };
  });

  if (sent) {
    notify();
    if (recipientId) {
      pushNotification({
        recipientId,
        type: 'message',
        title: 'Nouveau message',
        subtitle: `${bienTitre}: ${trimmed}`.slice(0, 120),
        actionHref: getConversationActionHref(recipientId),
        bienId: notifiedBienId || undefined,
      });
    }
  }
  return sent;
}

function createConversationForParticipant(options: {
  bienId: string;
  initiatorId: string;
  locataireId: string;
  participants: string[];
  message: string;
  notificationRecipientId: string;
  notificationTitle: string;
  notificationSubtitle: string;
  notificationActionHref: string;
}): string | null {
  const bien = biens.find((item) => item.id === options.bienId);
  if (!bien) return null;

  const existing = conversations.find(
    (conversation) =>
      conversation.bienId === options.bienId
      && conversation.locataireId === options.locataireId
      && conversation.participants.length === options.participants.length
      && options.participants.every((participant) => conversation.participants.includes(participant)),
  );

  if (existing) {
    sendMessageToConversation(existing.id, options.message, options.initiatorId);
    return existing.id;
  }

  const conversationId = `conv-${Date.now()}`;
  const conversation: Conversation = {
    id: conversationId,
    sujet: bien.titre,
    participants: options.participants,
    bienId: options.bienId,
    locataireId: options.locataireId,
    messages: [
      {
        id: `msg-${Date.now()}`,
        conversationId,
        auteurId: options.initiatorId,
        contenu: options.message,
        date: new Date().toISOString(),
        type: 'text',
      },
    ],
  };

  conversations = [conversation, ...conversations];
  notify();
  pushNotification({
    recipientId: options.notificationRecipientId,
    type: 'conversation',
    title: options.notificationTitle,
    subtitle: options.notificationSubtitle,
    actionHref: options.notificationActionHref,
    bienId: options.bienId,
  });
  return conversationId;
}

export function createConversationForBien(bienId: string, locataireId: string, locataireNom: string, message: string): string | null {
  const bien = biens.find((item) => item.id === bienId);
  if (!bien) return null;

  return createConversationForParticipant({
    bienId,
    initiatorId: locataireId,
    locataireId,
    participants: [CURRENT_BAILLEUR_ID, locataireId],
    message,
    notificationRecipientId: CURRENT_BAILLEUR_ID,
    notificationTitle: 'Nouvelle demande de souscription',
    notificationSubtitle: `${locataireNom} souhaite souscrire au bien "${bien.titre}"`,
    notificationActionHref: '/bailleur/conversation',
  });
}

export function createAdminConversationForBien(bienId: string, locataireId: string, locataireNom: string, message: string): string | null {
  const bien = biens.find((item) => item.id === bienId);
  if (!bien) return null;

  return createConversationForParticipant({
    bienId,
    initiatorId: CURRENT_ADMIN_ID,
    locataireId,
    participants: [CURRENT_ADMIN_ID, locataireId],
    message,
    notificationRecipientId: locataireId,
    notificationTitle: 'Nouveau message de l\'administrateur',
    notificationSubtitle: `${CURRENT_ADMIN_NOM} souhaite echanger avec vous sur le bien "${bien.titre}"`,
    notificationActionHref: '/locataire/conversation',
  });
}

export function getAllAnciensLocataires(): AncienLocataireLigne[] {
  return biens.flatMap((item) =>
    item.anciensLocataires.map((tenant) => {
      const relatedDepart = item.departsPreavis.find((departure) => departure.locataire === tenant.nomComplet);
      return {
        ...tenant,
        bienId: item.id,
        bienTitre: item.titre,
        dateReference: relatedDepart?.datePrevue ?? '',
      };
    }),
  );
}

export function getAllContrats() {
  return biens.flatMap((item) =>
    item.contrats.map((contract) => ({
      ...contract,
      bienId: item.id,
      bienTitre: item.titre,
    })),
  );
}

export function getAllPaiements(): PaiementLigne[] {
  return biens.flatMap((item) =>
    item.paiements.map((payment) => {
      const relatedContract = item.contrats.find((contract) => contract.id === payment.contratId);
      return {
        ...payment,
        bienId: item.id,
        bienTitre: item.titre,
        locataire: relatedContract?.locataire ?? item.locataireActuel?.nomComplet ?? '-',
        dureeMois: relatedContract?.dureeMois ?? 0,
      };
    }),
  );
}

export function getPaiementById(paiementId: string): PaiementLigne | null {
  return getAllPaiements().find((payment) => payment.id === paiementId) ?? null;
}

export function addPaiement(bienId: string, contratId: string, payload: { montant: number; modePaiement: string }): boolean {
  let added = false;
  let bienTitre = '';
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;
    added = true;
    bienTitre = item.titre;
    const paiement: Paiement = {
      id: `pay-${Date.now()}`,
      contratId,
      montant: payload.montant,
      datePaiement: new Date().toISOString(),
      modePaiement: payload.modePaiement,
    };
    return { ...item, paiements: [paiement, ...item.paiements] };
  });

  if (added) {
    notify();
    pushNotification({
      recipientId: 'bailleur-1',
      type: 'payment',
      title: 'Loyer paye',
      subtitle: `${bienTitre} - ${payload.montant.toLocaleString('fr-FR')} FCFA via ${payload.modePaiement}`,
      actionHref: '/bailleur/paiements',
      bienId,
    });
  }
  return added;
}

export function getAssuranceHabitationLocataire(locataireId: string, bienId?: string): AssuranceHabitationDetail | null {
  const sourceBien = bienId
    ? biens.find((item) => item.id === bienId)
    : biens.find((item) => item.locataireActuel?.id === locataireId || item.anciensLocataires.some((tenant) => tenant.id === locataireId));
  if (!sourceBien) return null;

  const tenant =
    sourceBien.locataireActuel?.id === locataireId
      ? sourceBien.locataireActuel
      : sourceBien.anciensLocataires.find((item) => item.id === locataireId);
  if (!tenant) return null;
  if (tenant.statut !== 'actuel') return null;

  return {
    locataireId: tenant.id,
    nomComplet: tenant.nomComplet,
    bienId: sourceBien.id,
    bienTitre: sourceBien.titre,
    assuranceHabitationFichier: tenant.assuranceHabitationFichier ?? null,
    telephone: tenant.telephone,
    email: tenant.email,
  };
}

function addMonths(baseDate: Date, months: number): Date {
  const next = new Date(baseDate);
  next.setMonth(next.getMonth() + Math.max(0, months));
  return next;
}

export function getContratStatutAffichage(
  contract: Pick<ContratDetail, 'dateDebut' | 'dureeMois' | 'statut'>,
): ContratStatutAffichage {
  if (contract.statut === 'termine' || contract.statut === 'annule') return 'fini';

  const start = new Date(contract.dateDebut);
  if (Number.isNaN(start.getTime())) return 'en cours';

  const end = addMonths(start, contract.dureeMois);
  if (Date.now() > end.getTime()) return 'expire';
  return 'en cours';
}

export function getContratSpecifiqueById(contratId: string, bienId?: string): ContratSpecifique | null {
  const sourceBien = bienId ? biens.find((item) => item.id === bienId) : biens.find((item) => item.contrats.some((contract) => contract.id === contratId));
  if (!sourceBien) return null;

  const sourceContrat = sourceBien.contrats.find((contract) => contract.id === contratId);
  if (!sourceContrat) return null;

  return {
    id: sourceContrat.id,
    bienId: sourceBien.id,
    bienTitre: sourceBien.titre,
    typeBien: sourceBien.type,
    typeContrat: sourceContrat.typeContrat,
    etat: sourceContrat.etat,
    dateSignature: sourceContrat.dateSignature,
    dureeMois: sourceContrat.dureeMois,
    montant: sourceContrat.montant,
    lieu: `${sourceBien.adresse}, ${sourceBien.ville ?? '-'}, ${sourceBien.pays ?? sourceBien.quartier ?? '-'}`,
    conditions: sourceContrat.conditions.map((condition) => condition.description),
    bailleur: {
      nom: 'Bailleur principal',
      telephone: '+237 699000000',
      email: 'bailleur@klea.cm',
    },
    locataire: {
      nom: sourceContrat.locataire,
      telephone: sourceBien.locataireActuel?.telephone ?? '-',
      email: sourceBien.locataireActuel?.email ?? '-',
    },
  };
}

export function getContratById(contratId: string, bienId?: string): ContratDetail | null {
  const sourceBien = bienId ? biens.find((item) => item.id === bienId) : biens.find((item) => item.contrats.some((contract) => contract.id === contratId));
  if (!sourceBien) return null;

  return sourceBien.contrats.find((contract) => contract.id === contratId) ?? null;
}

export function updateContratForBien(
  bienId: string,
  contratId: string,
  payload: {
    locataire: string;
    locataireId?: string;
    montant: number;
    dureeMois: number;
    conditions: string[];
    typeContrat: 'determine' | 'indetermine';
    dateSignature: string;
  },
): boolean {
  let updated = false;
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;

    const contrats = item.contrats.map((contract) => {
      if (contract.id !== contratId) return contract;
      if (contract.etat !== 'en_attente') return contract;
      updated = true;
      return {
        ...contract,
        locataire: payload.locataire,
        locataireId: payload.locataireId ?? contract.locataireId,
        montant: payload.montant,
        dureeMois: payload.dureeMois,
        conditions: payload.conditions.map((condition, index) => ({ id: `cond-${contratId}-${index + 1}`, description: condition })),
        typeContrat: payload.typeContrat,
        dateSignature: payload.dateSignature,
        signe: false,
        etat: 'en_attente' as const,
      };
    });

    return { ...item, contrats };
  });

  if (updated) notify();
  return updated;
}

export function annulerContratForBien(bienId: string, contratId: string): boolean {
  let updated = false;
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;

    const contrats = item.contrats.map((contract) => {
      if (contract.id !== contratId) return contract;
      if (contract.etat !== 'en_attente') return contract;
      updated = true;
      return {
        ...contract,
        etat: 'annule' as const,
        statut: 'annule' as const,
      };
    });

    return { ...item, contrats };
  });

  if (updated) {
    conversations = conversations.map((conversation) => {
      if (conversation.bienId !== bienId || conversation.contratId !== contratId) return conversation;
      return {
        ...conversation,
        messages: [
          ...conversation.messages,
          {
            id: `msg-${Date.now()}`,
            conversationId: conversation.id,
            auteurId: 'bailleur-1',
            contenu: 'Le contrat a ete annule avant signature.',
            date: new Date().toISOString(),
            type: 'text',
          },
        ],
      };
    });
    notify();
  }

  return updated;
}

export function toContratInterface(contrat: ContratDetail, bienId: string): Contrat {
  return {
    id: contrat.id,
    bienId,
    bailleurId: 'bailleur-1',
    locataireId: contrat.locataire,
    conversationId: contrat.conversationId,
    typeContrat: contrat.typeContrat,
    dateSignature: contrat.dateSignature,
    dateDebut: contrat.dateDebut,
    montant: contrat.montant,
    etat: contrat.etat === 'en_attente' ? 'en_attente' : contrat.statut === 'annule' ? 'annule' : contrat.statut === 'termine' ? 'resilie' : 'actif',
    conditions: contrat.conditions,
  };
}

