import API from './axios.js';

export const loginUser = async (data) => {
  const response = await API.post('/auth/login', data);
  return response;
};

export const registerUser = async (data) => {
  const response = await API.post('/auth/register', data);
  return response;
};

export const getMe = () => API.get('/users/me');
export const logoutUser = () => API.post('/auth/logout');
