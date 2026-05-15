import { apiClient, clearSession, getStoredUser, setSession } from './http.js';

export async function login({ username, password, role }) {
  const { data } = await apiClient.post('/api/users/login/', { username, password });
  const user = { username: data.username || username, role };
  setSession({ access: data.access, refresh: data.refresh, user });
  return { ...data, user };
}

export async function refreshToken(refresh) {
  const { data } = await apiClient.post('/api/token/refresh/', { refresh });
  setSession({ access: data.access });
  return data;
}

export function logout() {
  clearSession();
}

export function getCurrentUser() {
  return getStoredUser();
}
