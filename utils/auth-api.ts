const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export type ConfirmIdentityResult = {
  success: boolean;
  message?: string;
};

export async function confirmIdentity(password: string): Promise<ConfirmIdentityResult> {
  if (!password.trim()) {
    return { success: false, message: 'Veuillez saisir votre mot de passe.' };
  }

  if (!API_BASE_URL) {
    // Pas encore de backend configure (EXPO_PUBLIC_API_URL absent) : on laisse passer
    // pour garder le parcours testable, comme le fait deja l'ecran de connexion.
    return { success: true };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/confirm-identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return { success: false, message: data?.message ?? 'Mot de passe incorrect.' };
    }

    return { success: Boolean(data?.success), message: data?.message };
  } catch {
    return { success: false, message: 'Impossible de verifier votre identite. Verifiez votre connexion.' };
  }
}
