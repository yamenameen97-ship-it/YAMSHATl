import { A as API } from "../index-BAMQT-m6.js";
const getUsers = () => API.get("/users");
const getProfileBundle = (username) => API.get(`/users/profile/${encodeURIComponent(username)}`, { cache: false, forceRefresh: true });
const followUser = (username) => API.post("/users/follow", { following: username });
const updateMyProfile = (payload) => API.patch("/users/me", payload);
export {
  getProfileBundle as a,
  followUser as f,
  getUsers as g,
  updateMyProfile as u
};
