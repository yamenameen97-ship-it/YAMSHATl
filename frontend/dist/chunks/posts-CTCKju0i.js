import { o as API } from "../index-DMsnM20S.js";
//#region src/api/posts.js
var getPosts = (params = {}) => API.get("/posts", { params });
var createPost = (data) => API.post("/posts", data);
var uploadPostMedia = (file, onUploadProgress) => {
	const formData = new FormData();
	formData.append("file", file);
	return API.post("/upload", formData, {
		headers: { "Content-Type": "multipart/form-data" },
		onUploadProgress
	});
};
var likePost = (postId) => API.post(`/posts/${postId}/like`);
var savePost = (postId) => API.post(`/posts/${postId}/save`);
var sharePost = (postId, platform = "copy") => API.post(`/posts/${postId}/share`, { platform });
//#endregion
export { sharePost as a, savePost as i, getPosts as n, uploadPostMedia as o, likePost as r, createPost as t };
