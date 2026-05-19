import { A as API } from "../index-BAMQT-m6.js";
const loginUser = async (data) => {
  const response = await API.post("/auth/login", data);
  return response;
};
const verifyTwoFactorLogin = async (data) => {
  const response = await API.post("/auth/verify-2fa-login", data);
  return response;
};
const devLoginUser = async (data = {}) => {
  const response = await API.post("/auth/dev-login", data);
  return response;
};
const registerUser = async (data) => {
  const response = await API.post("/auth/register", data);
  return response;
};
const verifyEmail = async (data) => {
  const response = await API.post("/auth/verify-email", data);
  return response;
};
const resendVerification = async (data) => {
  const response = await API.post("/auth/resend-verification", data);
  return response;
};
const getCaptchaChallenge = async () => {
  const response = await API.get("/auth/captcha", { cache: false, forceRefresh: true });
  return response;
};
const forgotPassword = async (data) => {
  const response = await API.post("/auth/forgot-password", data);
  return response;
};
const verifyResetCode = async (data) => {
  const response = await API.post("/auth/verify-reset-code", data);
  return response;
};
const resetPassword = async (data) => {
  const response = await API.post("/auth/reset-password", data);
  return response;
};
const logoutUser = () => API.post("/auth/logout");
export {
  verifyEmail as a,
  resendVerification as b,
  verifyResetCode as c,
  devLoginUser as d,
  resetPassword as e,
  forgotPassword as f,
  getCaptchaChallenge as g,
  logoutUser as h,
  loginUser as l,
  registerUser as r,
  verifyTwoFactorLogin as v
};
