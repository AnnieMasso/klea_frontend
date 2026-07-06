import type { Bien, Condition, Contrat, Conversation, Message, Paiement, Sinistre } from '@/app/bailleur/interfaces';

export type OccupationStatut = 'en_location' | 'libre' | 'jamais_loue';

export type LocataireResume = {
  id: string;
  nomComplet: string;
  statut: 'actuel' | 'ancien';
  telephone: string;
  email: string;
  assuranceHabitationFichier?: {
    fileName: string;
    fileUrl: string;
    mimeType?: string;
  };
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

export type ConversationMessageLigne = Message & {
  auteurNom: string;
  auteurRole: 'bailleur' | 'locataire';
};

export type ConversationLigne = {
  id: string;
  bienId: string;
  bienTitre: string;
  contratId: string;
  locataireId: string;
  locataireNom: string;
  statutContrat: ContratStatutAffichage;
  lastMessage: string;
  lastMessageDate: string;
  messages: ConversationMessageLigne[];
};

export type BienDetail = Bien & {
  occupationStatut: OccupationStatut;
  jamaisLoue: boolean;
  locataireActuel: LocataireResume | null;
  anciensLocataires: LocataireResume[];
  paiements: Paiement[];
  departsPreavis: DepartPreavis[];
  sinistres: Sinistre[];
  demandesAnnulation: DemandeAnnulation[];
  contrats: ContratDetail[];
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

let biens: BienDetail[] = [
  {
    id: 'bien-1',
    titre: 'Appartement Bonapriso 3 pieces',
    type: 'Appartement',
    description: 'Appartement renove avec balcon et parking.',
    montant: 320000,
    modalitePaiement: 'Mensuel',
    nbChambres: 2,
    nbSalles: 2,
    surface: 95,
    adresse: 'Bonapriso, Rue Koloko',
    pays: 'Cameroun',
    ville: 'Douala',
    quartier: 'Cameroun',
    localisation: '4.051100, 9.707300',
    statut: 'loué',
    images: [
      { id: 'img-1', url: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800', type: 'photo' },
    ],
    usages: [
      { id: 'usage-1', nomUsage: 'Habitation' },
    ],
    bailleurId: 'bailleur-1',
    occupationStatut: 'en_location',
    jamaisLoue: false,
    locataireActuel: {
      id: 'loc-1',
      nomComplet: 'Brigitte Ndzi',
      statut: 'actuel',
      telephone: '+237 690112233',
      email: 'brigitte.ndzi@example.com',
      assuranceHabitationFichier: {
        fileName: 'Assurance_Brigitte_Ndzi_AXA_2026.pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        mimeType: 'application/pdf',
      },
    },
    anciensLocataires: [
      {
        id: 'loc-11',
        nomComplet: 'Jean Mvondo',
        statut: 'ancien',
        telephone: '+237 677000000',
        email: 'jean.mvondo@example.com',
        assuranceHabitationFichier: {
          fileName: 'Assurance_Jean_Mvondo_SAHAM_2025.pdf',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          mimeType: 'application/pdf',
        },
      },
    ],
    paiements: [
      { id: 'pay-1', contratId: 'ctr-1', montant: 320000, datePaiement: todayIso, modePaiement: 'Virement' },
      { id: 'pay-2', contratId: 'ctr-1', montant: 320000, datePaiement: '2026-06-03T10:00:00.000Z', modePaiement: 'Mobile Money' },
    ],
    departsPreavis: [
      {
        id: 'dep-1',
        locataire: 'Brigitte Ndzi',
        dateSignalement: '2026-06-30',
        datePrevue: '2026-08-01',
        statut: 'signale',
      },
    ],
    sinistres: [
      {
        id: 'sin-1',
        contratId: 'ctr-1',
        dateSinistre: '2026-06-12',
        description: 'Fuite d\'eau cuisine',
        photoSinistre1: 'maison.jpg',
        photoSinistre2: 'icon.png',
        statut: 'ouvert',
      },
    ],
    demandesAnnulation: [
      {
        id: 'ann-1',
        locataire: 'Brigitte Ndzi',
        date: '2026-06-28',
        motif: 'Mutation professionnelle',
        statut: 'en_attente',
      },
    ],
    contrats: [
      {
        id: 'ctr-1',
        locataire: 'Brigitte Ndzi',
        locataireId: 'loc-1',
        conversationId: 'conv-1',
        typeContrat: 'determine',
        etat: 'signe',
        dateSignature: '2026-01-01',
        montant: 320000,
        dureeMois: 12,
        dateDebut: '2026-01-01',
        conditions: [
          { id: 'cond-1', description: 'Caution: 2 mois' },
          { id: 'cond-2', description: 'Paiement avant le 5 du mois' },
        ],
        signe: true,
        statut: 'actif',
      },
    ],
  },
  {
    id: 'bien-2',
    titre: 'Studio Bastos centre',
    type: 'Studio',
    description: 'Studio meuble proche des commerces.',
    montant: 180000,
    modalitePaiement: 'Mensuel',
    nbChambres: 1,
    nbSalles: 1,
    surface: 45,
    adresse: 'Bastos, Immeuble Mfoundi',
    pays: 'Cameroun',
    ville: 'Yaounde',
    quartier: 'Cameroun',
    localisation: '3.891600, 11.515800',
    statut: 'disponible',
    images: [],
    usages: [{ id: 'usage-2', nomUsage: 'Habitation' }],
    bailleurId: 'bailleur-1',
    occupationStatut: 'libre',
    jamaisLoue: false,
    locataireActuel: null,
    anciensLocataires: [
      {
        id: 'loc-21',
        nomComplet: 'Estelle Fokou',
        statut: 'ancien',
        telephone: '+237 651223344',
        email: 'estelle.fokou@example.com',
        assuranceHabitationFichier: {
          fileName: 'Assurance_Estelle_Fokou_BGI_2025.pdf',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          mimeType: 'application/pdf',
        },
      },
    ],
    paiements: [],
    departsPreavis: [],
    sinistres: [],
    demandesAnnulation: [],
    contrats: [],
  },
  {
    id: 'bien-3',
    titre: 'Maison Bafoussam jardin',
    type: 'Maison',
    description: 'Maison familiale avec grand jardin.',
    montant: 500000,
    modalitePaiement: 'Mensuel',
    nbChambres: 4,
    nbSalles: 3,
    surface: 220,
    adresse: 'Bafoussam, Quartier Djeleng',
    pays: 'Cameroun',
    ville: 'Bafoussam',
    quartier: 'Cameroun',
    localisation: '5.476600, 10.417000',
    statut: 'disponible',
    images: [],
    usages: [{ id: 'usage-3', nomUsage: 'Habitation' }],
    bailleurId: 'bailleur-1',
    occupationStatut: 'jamais_loue',
    jamaisLoue: true,
    locataireActuel: null,
    anciensLocataires: [],
    paiements: [],
    departsPreavis: [],
    sinistres: [],
    demandesAnnulation: [],
    contrats: [],
  },
];

let conversations: Conversation[] = [
  {
    id: 'conv-1',
    sujet: 'Appartement Bonapriso 3 pieces',
    participants: ['bailleur-1', 'loc-1'],
    bienId: 'bien-1',
    contratId: 'ctr-1',
    locataireId: 'loc-1',
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        auteurId: 'bailleur-1',
        contenu: 'Bonjour Brigitte, je vous confirme que le contrat est actif.',
        date: '2026-06-01T09:00:00.000Z',
          type: 'text',
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        auteurId: 'loc-1',
        contenu: 'Bonjour, merci. Je voulais aussi vous signaler la fuite dans la cuisine.',
        date: '2026-06-12T08:40:00.000Z',
          type: 'text',
      },
      {
        id: 'msg-3',
        conversationId: 'conv-1',
        auteurId: 'bailleur-1',
        contenu: 'Bien recu. Le plombier passera demain matin.',
        date: '2026-06-12T10:15:00.000Z',
          type: 'text',
      },
    ],
  },
  {
    id: 'conv-2',
    sujet: 'Appartement Bonapriso 3 pieces',
    participants: ['bailleur-1', 'loc-2'],
    bienId: 'bien-1',
    contratId: 'ctr-1',
    locataireId: 'loc-1',
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        auteurId: 'bailleur-1',
        contenu: 'Bonjour Brigitte, je vous confirme que le contrat est actif.',
        date: '2026-06-01T09:00:00.000Z',
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        auteurId: 'loc-1',
        contenu: 'Bonjour, merci. Je voulais aussi vous signaler la fuite dans la cuisine.',
        date: '2026-06-12T08:40:00.000Z',
      },
      {
        id: 'msg-3',
        conversationId: 'conv-1',
        auteurId: 'bailleur-1',
        contenu: 'Bien recu. Le plombier passera demain matin.',
        date: '2026-06-12T10:15:00.000Z',
      },
    ],
  },
];

function notify() {
  listeners.forEach((listener) => listener());
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

export function addBien(payload: NewBienPayload): BienDetail {
  const id = `bien-${Date.now()}`;
  const newItem: BienDetail = {
    id,
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
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;

    const timestamp = Date.now();
    const contractId = `ctr-${timestamp}`;
    const locataireId = payload.locataireId ?? `loc-${timestamp}`;
    const conversationId = payload.conversationId ?? `conv-${timestamp}`;
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
  if (created) notify();
  return created;
}

export function signContrat(bienId: string, contratId: string): boolean {
  let changed = false;
  biens = biens.map((item) => {
    if (item.id !== bienId) return item;
    const contrats = item.contrats.map((contract) => {
      if (contract.id !== contratId) return contract;
      changed = true;
      return { ...contract, signe: true, etat: 'signe' as const };
    });
    return { ...item, contrats };
  });

  if (changed) notify();
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

function getAuteurNom(auteurId: string, conversation: Conversation, relatedBien: BienDetail | undefined): string {
  if (auteurId === 'bailleur-1') return 'Vous';
  if (relatedBien?.locataireActuel?.id === auteurId) return relatedBien.locataireActuel.nomComplet;
  const ancienLocataire = relatedBien?.anciensLocataires.find((tenant) => tenant.id === auteurId);
  if (ancienLocataire) return ancienLocataire.nomComplet;
  if (conversation.locataireId === auteurId) {
    const contract = relatedBien?.contrats.find((item) => item.conversationId === conversation.id);
    return contract?.locataire ?? 'Locataire';
  }
  return 'Participant';
}

export function getAllConversations(): ConversationLigne[] {
  return conversations
    .map((conversation) => {
      const relatedBien = conversation.bienId ? biens.find((item) => item.id === conversation.bienId) : undefined;
      const relatedContract = relatedBien?.contrats.find(
        (contract) => contract.id === conversation.contratId || contract.conversationId === conversation.id,
      );

      if (!relatedBien || !relatedContract || !conversation.locataireId) return null;

      const messages = [...conversation.messages]
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
        .map((message) => ({
          ...message,
          auteurNom: getAuteurNom(message.auteurId, conversation, relatedBien),
          auteurRole: message.auteurId === 'bailleur-1' ? 'bailleur' as const : 'locataire' as const,
        }));

      const lastMessage = messages[messages.length - 1];

      return {
        id: conversation.id,
        bienId: relatedBien.id,
        bienTitre: relatedBien.titre,
        contratId: relatedContract.id,
        locataireId: conversation.locataireId,
        locataireNom: relatedContract.locataire,
        statutContrat: getContratStatutAffichage(relatedContract),
        lastMessage: lastMessage?.contenu ?? 'Aucun message',
        lastMessageDate: lastMessage?.date ?? '',
        messages,
      };
    })
    .filter((item): item is ConversationLigne => item !== null)
    .sort((a, b) => Date.parse(b.lastMessageDate || '1970-01-01') - Date.parse(a.lastMessageDate || '1970-01-01'));
}

export function getConversationById(conversationId: string): ConversationLigne | null {
  return getAllConversations().find((conversation) => conversation.id === conversationId) ?? null;
}

export function sendMessageToConversation(conversationId: string, contenu: string): boolean {
  const trimmed = contenu.trim();
  if (!trimmed) return false;

  let sent = false;
  conversations = conversations.map((conversation) => {
    if (conversation.id !== conversationId) return conversation;

    sent = true;
    const nextMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      auteurId: 'bailleur-1',
      contenu: trimmed,
      date: new Date().toISOString(),
      type: 'text',
    };

    return {
      ...conversation,
      messages: [...conversation.messages, nextMessage],
    };
  });

  if (sent) notify();
  return sent;
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
        conditions: payload.conditions.map((condition, index) => ({ id: `cond-${contractId}-${index + 1}`, description: condition })),
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
