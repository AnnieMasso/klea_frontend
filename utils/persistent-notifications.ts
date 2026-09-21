type NotificationRole = 'bailleur' | 'locataire' | 'administrateur';

type PersistentNotification = {
  id: string;
  role: NotificationRole;
  type: 'payment' | 'contract' | 'conversation' | 'message' | 'bien' | 'compte' | 'avertissement';
  title: string;
  subtitle: string;
  date: string;
  actionHref?: string;
  bienId?: string;
};

const STORAGE_KEY = 'klea.notifications.persistent.v1';
let runtimeNotifications: PersistentNotification[] = [];

function getWebStorage(): Storage | null {
  if (typeof globalThis === 'undefined') return null;

  const maybeStorage = (globalThis as { localStorage?: Storage }).localStorage;
  if (!maybeStorage) return null;

  try {
    // Some environments expose localStorage but still block direct usage.
    const probeKey = `${STORAGE_KEY}.probe`;
    maybeStorage.getItem(probeKey);
    return maybeStorage;
  } catch {
    return null;
  }
}

function loadNotifications(): PersistentNotification[] {
  if (runtimeNotifications.length > 0) {
    return runtimeNotifications;
  }

  const storage = getWebStorage();
  if (storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        runtimeNotifications = JSON.parse(raw) as PersistentNotification[];
      }
    } catch {
      runtimeNotifications = [];
    }
  }

  return runtimeNotifications;
}

function saveNotifications(items: PersistentNotification[]) {
  runtimeNotifications = items;

  const storage = getWebStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore local storage write errors.
    }
  }
}

export function pushPersistentNotification(payload: Omit<PersistentNotification, 'id' | 'date'> & { id?: string; date?: string }) {
  const items = loadNotifications();

  const notification: PersistentNotification = {
    ...payload,
    id: payload.id ?? `persist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: payload.date ?? new Date().toISOString(),
  };

  saveNotifications([notification, ...items]);
}

export function getPersistentNotificationsForRole(role: NotificationRole) {
  return loadNotifications()
    .filter((item) => item.role === role)
    .sort((left, right) => Date.parse(right.date) - Date.parse(left.date));
}
