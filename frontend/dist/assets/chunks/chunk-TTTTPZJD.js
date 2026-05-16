import {
  init_define_import_meta_env
} from "./chunk-SOYW6UE7.js";

// src/utils/deviceProfile.js
init_define_import_meta_env();
function getDeviceProfile() {
  if (typeof window === "undefined") {
    return {
      isLowEndDevice: false,
      prefersReducedMotion: false,
      saveData: false,
      effectiveType: "4g",
      deviceMemory: 8,
      hardwareConcurrency: 8,
      maxVisibleReels: 3,
      videoPreloadRange: 1,
      preferredVideoQuality: "high"
    };
  }
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const deviceMemory = Number(navigator.deviceMemory || 4);
  const hardwareConcurrency = Number(navigator.hardwareConcurrency || 4);
  const effectiveType = connection?.effectiveType || "4g";
  const saveData = Boolean(connection?.saveData);
  const isSlowNetwork = ["slow-2g", "2g", "3g"].includes(effectiveType);
  const isLowEndDevice = saveData || prefersReducedMotion || deviceMemory <= 4 || hardwareConcurrency <= 4 || isSlowNetwork;
  return {
    isLowEndDevice,
    prefersReducedMotion,
    saveData,
    effectiveType,
    deviceMemory,
    hardwareConcurrency,
    maxVisibleReels: isLowEndDevice ? 1 : 3,
    videoPreloadRange: isLowEndDevice ? 1 : 2,
    preferredVideoQuality: saveData || effectiveType === "2g" ? "low" : effectiveType === "3g" || deviceMemory <= 4 ? "medium" : "high"
  };
}
function appendVideoQuality(url = "", quality = "high") {
  if (!url) return "";
  if (/\.m3u8($|\?)/i.test(url)) return url;
  const normalized = String(quality || "high").toLowerCase();
  const separator = url.includes("?") ? "&" : "?";
  if (/([?&])quality=/i.test(url)) {
    return url.replace(/([?&])quality=[^&]+/i, `$1quality=${normalized}`);
  }
  return `${url}${separator}quality=${normalized}`;
}

export {
  getDeviceProfile,
  appendVideoQuality
};
