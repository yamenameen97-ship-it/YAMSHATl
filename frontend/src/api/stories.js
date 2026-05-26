import API from './axios.js';

export const getStories = () => API.get('/stories');
export const getStoryHighlights = () => API.get('/stories/highlights');
export const getStoryArchive = () => API.get('/stories/archive');
export const getStoryAnalyticsSummary = () => API.get('/stories/analytics/summary');
export const viewStory = (storyId) => API.post(`/stories/${storyId}/view`);
export const reactToStory = (storyId, emoji) => API.post(`/stories/${storyId}/react`, { emoji });
export const replyToStory = (storyId, text) => API.post(`/stories/${storyId}/reply`, { text });
export const toggleStoryHighlight = (storyId) => API.post(`/stories/${storyId}/highlight`);

export const uploadStory = (file, meta = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  Object.entries(meta || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, Array.isArray(value) ? value.join(',') : value);
  });
  return API.post('/add_story', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
