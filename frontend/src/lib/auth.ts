import { API_BASE } from './api';

const SESSION_KEYS = [
  'token',
  'user_token',
  'user_role',
  'user_name',
  'user_avatar',
  'user_id',
];

export function clearLocalSession() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

export async function logoutSession() {
  try {
    await fetch(`${API_BASE}/users/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    clearLocalSession();
  }
}