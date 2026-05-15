import { apiClient } from './http.js';

export async function fetchTypeWorkers() {
  const { data } = await apiClient.get('/api/worktrax/type-workers/');
  return data;
}

export async function fetchTypeContrats() {
  const { data } = await apiClient.get('/api/worktrax/type-contrats/');
  return data;
}

export async function fetchSocietes() {
  const { data } = await apiClient.get('/api/worktrax/societes/');
  return data;
}

export async function fetchWorkers() {
  const { data } = await apiClient.get('/api/worktrax/workers/');
  return data;
}

export async function createWorker(payload) {
  const { data } = await apiClient.post('/api/worktrax/workers-create/', payload);
  return data;
}

export async function updateWorker(id, payload) {
  const { data } = await apiClient.put(`/api/worktrax/workers/${id}/update/`, payload);
  return data;
}

export async function deleteWorker(id) {
  await apiClient.delete(`/api/worktrax/workers/${id}/delete/`);
}

export async function fetchSites() {
  const { data } = await apiClient.get('/api/worktrax/sites/');
  return data;
}

export async function createSite(payload) {
  const { data } = await apiClient.post('/api/worktrax/sites-create/', payload);
  return data;
}

export async function fetchMachines() {
  const { data } = await apiClient.get('/api/worktrax/machines/');
  return data;
}

export async function createMachine(payload) {
  const { data } = await apiClient.post('/api/worktrax/machines-create/', payload);
  return data;
}

export async function updateMachine(id, payload) {
  const { data } = await apiClient.put(`/api/worktrax/machines/${id}/update/`, payload);
  return data;
}

export async function deleteMachine(id) {
  await apiClient.delete(`/api/worktrax/machines/${id}/delete/`);
}

export async function fetchWorkerAssignments() {
  const { data } = await apiClient.get('/api/worktrax/worker-assignments/');
  return data;
}

export async function createWorkerAssignment(payload) {
  const { data } = await apiClient.post('/api/worktrax/worker-assignments-create/', payload);
  return data;
}
