import {
  axios_default
} from "./chunk-FJN4GIYV.js";
import {
  init_define_import_meta_env
} from "./chunk-SOYW6UE7.js";

// src/api/auth.js
init_define_import_meta_env();
var loginUser = async (data) => {
  const response = await axios_default.post("/auth/login", data);
  return response;
};
var verifyTwoFactorLogin = async (data) => {
  const response = await axios_default.post("/auth/verify-2fa-login", data);
  return response;
};
var devLoginUser = async (data = {}) => {
  const response = await axios_default.post("/auth/dev-login", data);
  return response;
};
var registerUser = async (data) => {
  const response = await axios_default.post("/auth/register", data);
  return response;
};
var verifyEmail = async (data) => {
  const response = await axios_default.post("/auth/verify-email", data);
  return response;
};
var resendVerification = async (data) => {
  const response = await axios_default.post("/auth/resend-verification", data);
  return response;
};
var getCaptchaChallenge = async () => {
  const response = await axios_default.get("/auth/captcha", { cache: false, forceRefresh: true });
  return response;
};
var forgotPassword = async (data) => {
  const response = await axios_default.post("/auth/forgot-password", data);
  return response;
};
var verifyResetCode = async (data) => {
  const response = await axios_default.post("/auth/verify-reset-code", data);
  return response;
};
var resetPassword = async (data) => {
  const response = await axios_default.post("/auth/reset-password", data);
  return response;
};
var logoutUser = () => axios_default.post("/auth/logout");

export {
  loginUser,
  verifyTwoFactorLogin,
  devLoginUser,
  registerUser,
  verifyEmail,
  resendVerification,
  getCaptchaChallenge,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  logoutUser
};
