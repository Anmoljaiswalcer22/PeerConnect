import { api } from '../lib/axios';

export const checkAuth = () => api.get('/auth/check').then((r) => r.data.data.user);
export const signup = (body) => api.post('/auth/signup', body).then((r) => r.data.data.user);
export const login = (body) => api.post('/auth/login', body).then((r) => r.data.data.user);
export const logout = () => api.post('/auth/logout');
export const updateProfile = (body) => api.put('/auth/update-profile', body).then((r) => r.data.data.user);
export const fetchSocketToken = () => api.get('/auth/socket-token').then((r) => r.data.data.token);
