import { getAuthToken, setAuthToken } from './auth-session';
import { requireApiBaseUrl } from './api-config';

export type ConfirmIdentityResult = {
  success: boolean;
  message?: string;
};

export type RegisterPayload = {
  nom: string;
  prenom?: string;
  email: string;
  role: 'bailleur' | 'locataire' | 'administrateur';
  motDePasse: string;
  cniRectoUri?: string;
  cniVersoUri?: string;
  assuranceHabitationUri?: string;
};

export type RegisterResult = {
  user: {
    id: number;
    nom: string;
    prenom?: string | null;
    email: string;
    role: 'bailleur' | 'locataire' | 'administrateur';
    statut: 'actif' | 'inactif';
  };
  token: string;
};

export type LoginPayload = {
  email: string;
  motDePasse: string;
};

export type LoginResult = RegisterResult;

const AUTH_REQUEST_TIMEOUT_MS = 15000;

function resolveMimeType(name: string) {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  if (lowerName.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}

async function fetchWithTimeout(input: string, init: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Connexion à l’API expirée. Vérifiez EXPO_PUBLIC_API_URL et que le téléphone peut joindre le backend Laravel.');
    }

    throw new Error('API inaccessible. Vérifiez EXPO_PUBLIC_API_URL, le réseau Wi-Fi commun, et que Laravel tourne sur 0.0.0.0:8000.');
  } finally {
    clearTimeout(timeoutId);
  }
}

async function appendFile(form: FormData, field: string, uri?: string) {
  if (!uri) {
    return;
  }

  const rawName = uri.split('/').pop()?.split('?')[0] || `${field}.jpg`;
  const type = resolveMimeType(rawName);

  if (typeof window !== 'undefined') {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const file = new File([blob], rawName, { type: blob.type || type });
      form.append(field, file);
      return;
    } catch {
      // Fall back to React Native style payload when blob conversion is not possible.
    }
  }

  form.append(field, { uri, name: rawName, type } as any);
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResult> {
  const apiBaseUrl = requireApiBaseUrl();

  const form = new FormData();
  form.append('nom', payload.nom.trim());
  if (payload.prenom?.trim()) {
    form.append('prenom', payload.prenom.trim());
  }
  form.append('email', payload.email.trim());
  form.append('role', payload.role);
  form.append('mot_de_passe', payload.motDePasse);

  await appendFile(form, 'cni_recto', payload.cniRectoUri);
  await appendFile(form, 'cni_verso', payload.cniVersoUri);
  await appendFile(form, 'assurance_habitation', payload.assuranceHabitationUri);

  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchWithTimeout(`${apiBaseUrl}/auth/register`, {
    method: 'POST',
    headers,
    body: form,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const validationErrors = data?.errors as Record<string, string[] | undefined> | undefined;
    const firstValidationMessage = validationErrors
      ? Object.values(validationErrors).find((messages) => Array.isArray(messages) && messages.length > 0)?.[0]
      : undefined;

    throw new Error(firstValidationMessage ?? data?.message ?? 'Inscription impossible.');
  }

  const result = data as RegisterResult;
  if (result.token) {
    setAuthToken(result.token);
  }

  return result;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResult> {
  const apiBaseUrl = requireApiBaseUrl();

  const response = await fetchWithTimeout(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email: payload.email.trim(),
      mot_de_passe: payload.motDePasse,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? 'Connexion impossible.');
  }

  const result = data as LoginResult;
  if (result.token) {
    setAuthToken(result.token);
  }

  return result;
}

export async function confirmIdentity(password: string): Promise<ConfirmIdentityResult> {
  if (!password.trim()) {
    return { success: false, message: 'Veuillez saisir votre mot de passe.' };
  }

  const apiBaseUrl = requireApiBaseUrl();

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetchWithTimeout(`${apiBaseUrl}/auth/confirm-identity`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ password }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return { success: false, message: data?.message ?? 'Mot de passe incorrect.' };
    }

    return { success: Boolean(data?.success), message: data?.message };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Impossible de verifier votre identite. Verifiez votre connexion.' };
  }
}
