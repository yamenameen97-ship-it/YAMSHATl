import { A as API } from "../index-Dz8FA2T4.js";
const apiClient = {
  get: (url, config = {}) => API.get(url, config),
  post: (url, body = {}, config = {}) => API.post(url, body, config),
  put: (url, body = {}, config = {}) => API.put(url, body, config),
  patch: (url, body = {}, config = {}) => API.patch(url, body, config),
  delete: (url, config = {}) => API.delete(url, config)
};
export {
  apiClient as a
};
