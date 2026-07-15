import { a5 as API } from "../index-DRmq1dbV.js";
const noCache = { cache: false, forceRefresh: true };
const getFriends = (params = {}) => API.get("/friends", {
  params: { limit: 50, page: 1, ...params },
  ...noCache
});
const getReceivedRequests = () => API.get("/friends/requests/received", noCache);
const getSentRequests = () => API.get("/friends/requests/sent", noCache);
const getFriendSuggestions = (limit = 20) => API.get("/friends/suggestions", { params: { limit }, ...noCache });
const searchFriendsCandidates = (q, limit = 30) => API.get("/friends/search", { params: { q, limit }, ...noCache });
const sendFriendRequest = (target) => API.post("/friends/request", typeof target === "string" ? { username: target } : target);
const acceptFriendRequest = (friendshipId) => API.post(`/friends/${friendshipId}/accept`);
const removeFriendship = (friendshipId) => API.delete(`/friends/${friendshipId}`);
const dismissSuggestion = (target) => API.post("/friends/dismiss", typeof target === "string" ? { username: target } : target);
const getFriendsStats = () => API.get("/friends/stats", noCache);
export {
  getReceivedRequests as a,
  getSentRequests as b,
  getFriendSuggestions as c,
  getFriendsStats as d,
  acceptFriendRequest as e,
  sendFriendRequest as f,
  getFriends as g,
  dismissSuggestion as h,
  removeFriendship as r,
  searchFriendsCandidates as s
};
