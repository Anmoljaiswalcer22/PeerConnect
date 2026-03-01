import { api } from '../lib/axios';

export const fetchContacts = () => api.get('/messages/users').then((r) => r.data.data.users);

/** → { peer, messages (oldest → newest), hasMore } */
export const fetchConversation = (userId, params = {}) =>
  api.get(`/messages/${userId}`, { params }).then((r) => r.data.data);

export const sendMessage = (userId, body) =>
  api.post(`/messages/send/${userId}`, body, { timeout: 120_000 }).then((r) => r.data.data.message);
