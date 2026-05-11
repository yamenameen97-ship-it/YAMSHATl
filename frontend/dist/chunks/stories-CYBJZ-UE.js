import { m as API } from "../index-RNpBu_Fp.js";
//#region src/api/stories.js
var getStories = () => API.get("/stories");
var getStoryHighlights = () => API.get("/stories/highlights");
var getStoryArchive = () => API.get("/stories/archive");
var getStoryAnalyticsSummary = () => API.get("/stories/analytics/summary");
var viewStory = (storyId) => API.post(`/stories/${storyId}/view`);
var toggleStoryHighlight = (storyId) => API.post(`/stories/${storyId}/highlight`);
var uploadStory = (file, meta = {}) => {
	const formData = new FormData();
	formData.append("file", file);
	Object.entries(meta || {}).forEach(([key, value]) => {
		if (value === void 0 || value === null) return;
		formData.append(key, Array.isArray(value) ? value.join(",") : value);
	});
	return API.post("/add_story", formData, { headers: { "Content-Type": "multipart/form-data" } });
};
//#endregion
export { toggleStoryHighlight as a, getStoryHighlights as i, getStoryAnalyticsSummary as n, uploadStory as o, getStoryArchive as r, viewStory as s, getStories as t };
