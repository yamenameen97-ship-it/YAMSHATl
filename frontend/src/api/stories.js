import API from './axios.js';

export const getStories = () => API.get('/stories');

export const uploadStory = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/add_story', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
