import { A as API } from "../index-BtxTC4_g.js";
const getStories = () => API.get("/stories");
const getStoryHighlights = () => API.get("/stories/highlights");
const getStoryArchive = () => API.get("/stories/archive");
const getStoryAnalyticsSummary = () => API.get("/stories/analytics/summary");
const viewStory = (storyId) => API.post(`/stories/${storyId}/view`);
const reactToStory = (storyId, emoji) => API.post(`/stories/${storyId}/react`, { emoji });
const replyToStory = (storyId, text) => API.post(`/stories/${storyId}/reply`, { text });
const toggleStoryHighlight = (storyId) => API.post(`/stories/${storyId}/highlight`);
const uploadStory = (file, meta = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  Object.entries(meta || {}).forEach(([key, value]) => {
    if (value === void 0 || value === null) return;
    formData.append(key, Array.isArray(value) ? value.join(",") : value);
  });
  return API.post("/add_story", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};
export {
  getStoryAnalyticsSummary as a,
  getStoryArchive as b,
  getStoryHighlights as c,
  replyToStory as d,
  getStories as g,
  reactToStory as r,
  toggleStoryHighlight as t,
  uploadStory as u,
  viewStory as v
};
