import { o as API } from "../index-DMsnM20S.js";
//#region src/api/groups.js
var getGroups = () => API.get("/groups");
var createGroup = (payload) => API.post("/groups", payload);
var joinGroup = (groupId) => API.post(`/groups/${groupId}/join`);
//#endregion
export { getGroups as n, joinGroup as r, createGroup as t };
