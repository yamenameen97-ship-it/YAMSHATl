import { A as API } from "../index-D6u1FUhW.js";
const getGroups = () => API.get("/groups");
const createGroup = (payload) => API.post("/groups", payload);
const joinGroup = (groupId) => API.post(`/groups/${groupId}/join`);
export {
  createGroup as c,
  getGroups as g,
  joinGroup as j
};
