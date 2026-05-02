import API from './axios.js';

export const loginUser = (data) => API.post('/login', data);
export const registerUser = (data) => API.post('/register', data);
export const getMe = () => API.get('/me');
export const logoutUser = () => API.post('/logout');
