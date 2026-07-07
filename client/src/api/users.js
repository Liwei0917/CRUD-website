import api from './client.js';

export const usersApi = {
  list(params) {
    return api.get('/users', { params }).then((r) => r.data);
  },
  stats() {
    return api.get('/users/stats').then((r) => r.data.stats);
  },
  get(id) {
    return api.get(`/users/${id}`).then((r) => r.data.user);
  },
  create(payload) {
    return api.post('/users', payload).then((r) => r.data.user);
  },
  update(id, payload) {
    return api.patch(`/users/${id}`, payload).then((r) => r.data.user);
  },
  remove(id) {
    return api.delete(`/users/${id}`).then((r) => r.data);
  },
};
