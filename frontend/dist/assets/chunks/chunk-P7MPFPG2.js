import {
  axios_default
} from "./chunk-FJN4GIYV.js";
import {
  init_define_import_meta_env
} from "./chunk-SOYW6UE7.js";

// src/api/groups.js
init_define_import_meta_env();
var getGroups = () => axios_default.get("/groups");
var createGroup = (payload) => axios_default.post("/groups", payload);
var joinGroup = (groupId) => axios_default.post(`/groups/${groupId}/join`);

export {
  getGroups,
  createGroup,
  joinGroup
};
