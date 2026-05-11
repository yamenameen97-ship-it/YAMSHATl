import { m as API } from "../index-RNpBu_Fp.js";
//#region src/api/posts.js
var getPosts = (params = {}) => API.get("/posts", { params });
var createPost = (data) => API.post("/posts", data);
var updatePost = (postId, data) => API.patch(`/posts/${postId}`, data);
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
var addComment = (postId, text, parentId = null) => API.post(`/posts/${postId}/comment`, {
	text,
	parent_id: parentId
});
var getComments = (postId) => API.get(`/posts/${postId}/comments`);
var deletePost = (postId) => API.delete(`/posts/${postId}`);
//#endregion
export { getPosts as a, sharePost as c, getComments as i, updatePost as l, createPost as n, likePost as o, deletePost as r, savePost as s, addComment as t, uploadPostMedia as u };
