import { o as API } from "../index-dyGfSAus.js";
//#region src/api/users.js
var getUsers = () => API.get("/users");
var getProfileBundle = (username) => API.get(`/users/profile/${encodeURIComponent(username)}`, {
	cache: false,
	forceRefresh: true
});
var followUser = (username) => API.post("/users/follow", { following: username });
var updateMyProfile = (payload) => API.patch("/users/me", payload);
//#endregion
export { updateMyProfile as i, getProfileBundle as n, getUsers as r, followUser as t };
