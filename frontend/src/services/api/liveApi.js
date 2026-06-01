import apiClient from './api/apiClient';

export const liveApi = {
  streams: () => apiClient.get('/api/live'),
  createStream: (payload) =>
    apiClient.post('/api/live', payload),
  joinStream: (streamId) =>
    apiClient.post(`/api/live/${streamId}/join`, {}),
  sendReaction: (streamId, reaction) =>
    apiClient.post(`/api/live/${streamId}/reaction`, {
      reaction,
    }),
};

export default liveApi;