import { m as API } from "../index-RNpBu_Fp.js";
//#region src/api/groups.js
var getGroups = () => API.get("/groups");
var createGroup = (payload) => API.post("/groups", payload);
var joinGroup = (groupId) => API.post(`/groups/${groupId}/join`);
//#endregion
export { getGroups as n, joinGroup as r, createGroup as t };
