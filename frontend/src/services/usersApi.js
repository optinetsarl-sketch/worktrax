import { apiClient } from './http.js';

export async function fetchUsers() {
  const { data } = await apiClient.get('/api/users/');
  return data;
}

export async function createUser(payload) {
  const { data } = await apiClient.post('/api/users/', payload);
  return data;
}

export async function fetchRoles() {
  const { data } = await apiClient.get('/api/users/roles/');
  return data;
}

export async function createRole(payload) {
  const { data } = await apiClient.post('/api/users/roles/', payload);
  return data;
}
