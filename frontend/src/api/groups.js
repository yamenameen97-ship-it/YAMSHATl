import API from './axios.js';

export const getGroups = () => API.get('/groups');
export const createGroup = (payload) => API.post('/groups', payload);
export const joinGroup = (groupId) => API.post(`/groups/${groupId}/join`);
