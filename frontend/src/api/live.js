import { getActiveLiveStreams } from '../services/api/liveStreamApi.js';

export const getLiveRooms = async (params = {}) => {
  const response = await getActiveLiveStreams(params);
  const rooms = Array.isArray(response?.data) ? response.data : [];
  return {
    ...response,
    data: rooms,
  };
};

export default {
  getLiveRooms,
};
