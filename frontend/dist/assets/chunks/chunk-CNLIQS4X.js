import {
  axios_default
} from "./chunk-FJN4GIYV.js";
import {
  init_define_import_meta_env
} from "./chunk-SOYW6UE7.js";

// src/api/stories.js
init_define_import_meta_env();
var getStories = () => axios_default.get("/stories");
var getStoryHighlights = () => axios_default.get("/stories/highlights");
var getStoryArchive = () => axios_default.get("/stories/archive");
var getStoryAnalyticsSummary = () => axios_default.get("/stories/analytics/summary");
var viewStory = (storyId) => axios_default.post(`/stories/${storyId}/view`);
var reactToStory = (storyId, emoji) => axios_default.post(`/stories/${storyId}/react`, { emoji });
var replyToStory = (storyId, text) => axios_default.post(`/stories/${storyId}/reply`, { text });
var toggleStoryHighlight = (storyId) => axios_default.post(`/stories/${storyId}/highlight`);
var uploadStory = (file, meta = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  Object.entries(meta || {}).forEach(([key, value]) => {
    if (value === void 0 || value === null) return;
    formData.append(key, Array.isArray(value) ? value.join(",") : value);
  });
  return axios_default.post("/add_story", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export {
  getStories,
  getStoryHighlights,
  getStoryArchive,
  getStoryAnalyticsSummary,
  viewStory,
  reactToStory,
  replyToStory,
  toggleStoryHighlight,
  uploadStory
};
