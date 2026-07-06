export type AuthRole = 'administrateur' | 'bailleur' | 'locataire';

export interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  role: AuthRole;
}

export interface Bailleur extends Utilisateur {
  statut: boolean;
  telephone: string;
  adresse: string;
  type: string;
  assuranceHabitation?: string;
  biens?: Bien[];
}

export interface Administrateur extends Utilisateur {
  statut: boolean;
}

export interface Locataire extends Utilisateur {
  statut: boolean;
  telephone: string;
  adresse: string;
  type: string;
  assuranceHabitation?: string;
}

export interface Bien {
  id: string;
  titre: string;
  type: string;
  description: string;
  montant: number;
  modalitePaiement: string;
  nbChambres: number;
  nbSalles: number;
  surface: number;
  adresse: string;
  pays?: string;
  quartier?: string;
  ville?: string;
  localisation?: string;
  statut: 'disponible' | 'loué' | 'en_validation' | 'archivé';
  images: Image[];
  usages: Usage[];
  bailleurId: string;
}

export interface Image {
  id: string;
  url: string;
  type: 'photo' | 'plan' | 'document' | 'autre';
}

export interface Usage {
  id: string;
  nomUsage: string;
  description?: string;
}

export interface Conversation {
  id: string;
  sujet?: string;
  participants: string[];
  messages: Message[];
  bienId?: string;
  contratId?: string;
  locataireId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  auteurId: string;
  contenu: string;
  date: string;
  type?: 'text' | 'contract';
  contractId?: string;
}

export interface Signalement {
  id: string;
  auteurId: string;
  bienId?: string;
  motif: string;
  preuves?: string[];
  statut: 'ouvert' | 'en_cours' | 'ferme';
  date: string;
}

export interface Condition {
  id: string;
  description: string;
}

export interface Contrat {
  id: string;
  bienId: string;
  bailleurId: string;
  locataireId: string;
  conversationId?: string;
  typeContrat?: 'determine' | 'indetermine';
  dateSignature: string;
  dateDebut: string;
  dateAnnulation?: string;
  dateResiliation?: string;
  montant: number;
  etat: 'en_attente' | 'actif' | 'annule' | 'resilie';
  conditions: Condition[];
}

export interface Paiement {
  id: string;
  contratId: string;
  montant: number;
  datePaiement: string;
  modePaiement: string;
}

export interface Depart {
  id: string;
  contratId: string;
  dateDepart: string;
  dateDepartPrev: string;
  dateConfirmation?: string;
  statut: 'prevu' | 'confirme' | 'signale';
}

export interface Sinistre {
  id: string;
  contratId: string;
  dateSinistre: string;
  description: string;
  photoSinistre1: string;
  photoSinistre2?: string;
  statut?: 'ouvert' | 'traite' | 'ferme';
}

export interface Authentification {
  email: string;
  motDePasse: string;
}
