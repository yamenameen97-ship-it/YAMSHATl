import { A as API } from "../index-BtxTC4_g.js";
const getUsers = async (params = {}) => {
  const normalizedParams = {
    limit: Math.max(Number(params?.limit) || 60, 1),
    page: Math.max(Number(params?.page) || 1, 1),
    ...params
  };
  try {
    return await API.get("/users", {
      params: normalizedParams,
      cache: false,
      forceRefresh: true
    });
  } catch (error) {
    if (error?.response?.status !== 500) throw error;
    const meResponse = await API.get("/users/me", { cache: false, forceRefresh: true }).catch(() => null);
    const me = meResponse?.data;
    return {
      data: me ? [me] : [],
      fallback: true
    };
  }
};
const getMe = () => API.get("/users/me");
const getProfileBundle = (username) => API.get(`/users/profile/${encodeURIComponent(username)}`, { cache: false, forceRefresh: true });
const followUser = (username) => API.post("/users/follow", { following: username });
const updateMyProfile = (payload) => API.patch("/users/me", payload);
const muteUser = (username) => API.post("/users/mute", { username });
const unmuteUser = (username) => API.post("/users/unmute", { username });
const uploadAvatar = (formData) => API.post("/upload", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
export {
  getProfileBundle as a,
  getUsers as b,
  updateMyProfile as c,
  uploadAvatar as d,
  followUser as f,
  getMe as g,
  muteUser as m,
  unmuteUser as u
};
