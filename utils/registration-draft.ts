export type RegistrationFormData = {
  nom: string;
  prenom: string;
  email: string;
  role: string;
  cniVerso: string;
  cniRecto: string;
  assuranceHabitation: string;
  password: string;
  confirmPassword: string;
  privacyAccepted: boolean;
};

export type RegistrationDraft = {
  step: number;
  form: RegistrationFormData;
};

export const initialRegistrationForm: RegistrationFormData = {
  nom: '',
  prenom: '',
  email: '',
  role: '',
  cniVerso: '',
  cniRecto: '',
  assuranceHabitation: '',
  password: '',
  confirmPassword: '',
  privacyAccepted: false,
};

const initialDraft: RegistrationDraft = {
  step: 1,
  form: initialRegistrationForm,
};

let draftState: RegistrationDraft = {
  ...initialDraft,
  form: { ...initialRegistrationForm },
};

export const getRegistrationDraft = (): RegistrationDraft => draftState;

export const updateRegistrationDraft = (updates: Partial<RegistrationDraft>) => {
  draftState = {
    ...draftState,
    ...updates,
    form: {
      ...draftState.form,
      ...(updates.form ?? {}),
    },
  };
};

export const resetRegistrationDraft = () => {
  draftState = {
    ...initialDraft,
    form: { ...initialRegistrationForm },
  };
};
