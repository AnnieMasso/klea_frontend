import type { LoginResult, RegisterResult } from '@/utils/auth-api';

type AuthUser = LoginResult['user'] | RegisterResult['user'];

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'utilisateur';
}

export function buildUserDashboardPath(user: AuthUser) {
  const fullName = [user.prenom ?? '', user.nom ?? ''].map((part) => part.trim()).filter(Boolean).join('-');
  return `/${slugify(fullName || user.email || user.role)}`;
}
