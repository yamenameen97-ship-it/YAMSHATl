import { A as API, bb as resolveMediaUrl } from "../index-CbZjTFV4.js";
function normalizeStoryObject(story) {
  if (!story || typeof story !== "object") return story;
  const raw = String(story.media_url || story.media || story.url || "").trim();
  const absoluteMedia = resolveMediaUrl(raw);
  const thumb = resolveMediaUrl(story.thumbnail_url || story.thumb_url || story.preview_url || "");
  const avatar = resolveMediaUrl(story.user_avatar || story.avatar || story.author_avatar || story.avatar_url || "");
  return {
    ...story,
    media_url: absoluteMedia || raw,
    media: absoluteMedia || raw,
    thumbnail_url: thumb || "",
    preview_url: thumb || absoluteMedia || "",
    user_avatar: avatar || "",
    avatar_url: avatar || story.avatar_url || ""
  };
}
function normalizeStoryGroup(group) {
  if (!group || typeof group !== "object") return group;
  const stories = Array.isArray(group.stories) ? group.stories.map(normalizeStoryObject) : [];
  return {
    ...group,
    user_avatar: resolveMediaUrl(group.user_avatar || group.avatar || group.avatar_url || ""),
    avatar_url: resolveMediaUrl(group.avatar_url || group.user_avatar || group.avatar || ""),
    stories
  };
}
function normalizeStoriesResponse(res, mode = "list") {
  if (!res) return res;
  const data = res.data;
  if (mode === "group" && Array.isArray(data)) {
    return { ...res, data: data.map(normalizeStoryGroup) };
  }
  if (mode === "list" && Array.isArray(data)) {
    return { ...res, data: data.map(normalizeStoryObject) };
  }
  if (mode === "single" && data && typeof data === "object") {
    return { ...res, data: normalizeStoryObject(data) };
  }
  return res;
}
const getStories = async () => {
  const res = await API.get("/stories");
  return normalizeStoriesResponse(res, "list");
};
const getStoriesGrouped = async () => {
  const res = await API.get("/stories/grouped");
  return normalizeStoriesResponse(res, "group");
};
const getStoryHighlights = async () => {
  const res = await API.get("/stories/highlights");
  return normalizeStoriesResponse(res, "list");
};
const getStoryArchive = async () => {
  const res = await API.get("/stories/archive");
  return normalizeStoriesResponse(res, "list");
};
const getStoryAnalyticsSummary = async () => {
  const res = await API.get("/stories/analytics/summary");
  const topStory = normalizeStoryObject(res?.data?.top_story || null);
  const recentStories = Array.isArray(res?.data?.recent_stories) ? res.data.recent_stories.map(normalizeStoryObject) : [];
  return {
    ...res,
    data: {
      ...res?.data || {},
      top_story: topStory,
      recent_stories: recentStories
    }
  };
};
const viewStory = (storyId) => API.post(`/stories/${storyId}/view`);
const reactToStory = (storyId, emoji) => API.post(`/stories/${storyId}/react`, { emoji });
const replyToStory = (storyId, text) => API.post(`/stories/${storyId}/reply`, { text });
const voteStoryPoll = (storyId, optionIndex) => API.post(`/stories/${storyId}/poll/vote`, { option_index: optionIndex });
const getStoryViewers = (storyId) => API.get(`/stories/${storyId}/viewers`);
const toggleStoryHighlight = (storyId, title = "") => API.post(`/stories/${storyId}/highlight`, title ? { title } : {});
const deleteStory = (storyId) => API.delete(`/stories/${storyId}`);
const getStoryMusicCatalog = () => API.get("/stories/music-catalog");
const getMutedStoryUsers = () => API.get("/users/me/muted-story-users", { cache: false, forceRefresh: true });
const muteUserStories = (username) => API.post("/users/mute-story", { username });
const unmuteUserStories = (username) => API.post("/users/unmute-story", { username });
const uploadStory = async (file, meta = {}, onProgress) => {
  if (!file) throw new Error("story file is required");
  const formData = new FormData();
  formData.append("file", file);
  if (!meta.privacy) meta.privacy = meta.is_close_friends ? "close_friends" : "friends";
  Object.entries(meta || {}).forEach(([key, value]) => {
    if (value === void 0 || value === null || value === "") return;
    if (typeof value === "boolean") {
      formData.append(key, value ? "true" : "false");
      return;
    }
    formData.append(key, Array.isArray(value) ? value.join(",") : value);
  });
  const res = await API.post("/add_story", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: typeof onProgress === "function" ? onProgress : void 0
  });
  return normalizeStoriesResponse(res, "single");
};
const downloadStoryMedia = async (url, filename = "story") => {
  if (!url) return false;
  try {
    const absoluteUrl = resolveMediaUrl(url) || url;
    const res = await fetch(absoluteUrl, { credentials: "omit" });
    if (!res.ok) throw new Error(`download failed: ${res.status}`);
    const blob = await res.blob();
    const ext = (blob.type.split("/")[1] || "jpg").split(";")[0];
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    return true;
  } catch (err) {
    console.warn("[stories.downloadStoryMedia]", err);
    return false;
  }
};
export {
  deleteStory,
  downloadStoryMedia,
  getMutedStoryUsers,
  getStories,
  getStoriesGrouped,
  getStoryAnalyticsSummary,
  getStoryArchive,
  getStoryHighlights,
  getStoryMusicCatalog,
  getStoryViewers,
  muteUserStories,
  reactToStory,
  replyToStory,
  toggleStoryHighlight,
  unmuteUserStories,
  uploadStory,
  viewStory,
  voteStoryPoll
};
