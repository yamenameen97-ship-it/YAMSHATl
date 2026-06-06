import API from './axios.js';

/**
 * Get active live rooms/streams
 * This file was created to fix a build error where Search.jsx expected this import.
 */
export async function getLiveRooms(params = {}) {
  try {
    const { data } = await API.get('/live_rooms', {
      params: {
        limit: params.limit || 50,
        ...params
      },
      cache: false,
      forceRefresh: true
    });
    return data;
  } catch (error) {
    console.error('Error fetching live rooms:', error);
    return { data: [], items: [] };
  }
}

export default {
  getLiveRooms
};
