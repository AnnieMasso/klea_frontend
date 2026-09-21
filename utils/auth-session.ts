let runtimeToken: string | null = null;
const STORAGE_KEY = 'klea.auth.token';

function getWebStorage(): Storage | null {
  if (typeof globalThis === 'undefined') return null;

  const maybeStorage = (globalThis as { localStorage?: Storage }).localStorage;
  if (!maybeStorage) return null;

  try {
    const probeKey = `${STORAGE_KEY}.probe`;
    maybeStorage.getItem(probeKey);
    return maybeStorage;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  runtimeToken = token?.trim() ? token : null;

  const storage = getWebStorage();
  if (storage) {
    if (runtimeToken) {
      storage.setItem(STORAGE_KEY, runtimeToken);
    } else {
      storage.removeItem(STORAGE_KEY);
    }
  }
}

export function getAuthToken(): string | null {
  if (runtimeToken) {
    return runtimeToken;
  }

  const storage = getWebStorage();
  if (storage) {
    const storedToken = storage.getItem(STORAGE_KEY);
    if (storedToken?.trim()) {
      runtimeToken = storedToken;
      return runtimeToken;
    }
  }

  const envToken = process.env.EXPO_PUBLIC_API_TOKEN;
  return envToken?.trim() ? envToken : null;
}

export function clearAuthToken() {
  runtimeToken = null;

  const storage = getWebStorage();
  if (storage) {
    storage.removeItem(STORAGE_KEY);
  }
}
