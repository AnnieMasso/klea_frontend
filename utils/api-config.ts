import Constants from 'expo-constants';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function ensureApiSuffix(value: string): string {
  const normalized = trimTrailingSlash(value);
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

function getHostFromExpo(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (!hostUri || typeof hostUri !== 'string') {
    return null;
  }

  const [host] = hostUri.split(':');
  return host || null;
}

function getHostFromWindow(): string | null {
  if (typeof window === 'undefined' || !window.location?.hostname) {
    return null;
  }

  return window.location.hostname;
}

export function getApiBaseUrl(): string | null {
  const windowHost = getHostFromWindow();
  if (windowHost) {
    if (windowHost === 'localhost' || windowHost === '127.0.0.1') {
      return 'http://localhost:8000/api';
    }

    const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (envUrl) {
      return ensureApiSuffix(envUrl);
    }

    return `http://${windowHost}:8000/api`;
  }

  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return ensureApiSuffix(envUrl);
  }

  const host = getHostFromExpo();
  if (!host) {
    return null;
  }

  return `http://${host}:8000/api`;
}

export function requireApiBaseUrl(): string {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new Error('Configuration API manquante. Definissez EXPO_PUBLIC_API_URL (ex: http://192.168.x.x:8000/api).');
  }

  return baseUrl;
}
