import { m as API } from "../index-RNpBu_Fp.js";
//#region src/api/auth.js
var loginUser = async (data) => {
	return await API.post("/auth/login", data);
};
var devLoginUser = async (data = {}) => {
	return await API.post("/auth/dev-login", data);
};
var registerUser = async (data) => {
	return await API.post("/auth/register", data);
};
var verifyEmail = async (data) => {
	return await API.post("/auth/verify-email", data);
};
var resendVerification = async (data) => {
	return await API.post("/auth/resend-verification", data);
};
var getCaptchaChallenge = async () => {
	return await API.get("/auth/captcha", {
		cache: false,
		forceRefresh: true
	});
};
var forgotPassword = async (data) => {
	return await API.post("/auth/forgot-password", data);
};
var verifyResetCode = async (data) => {
	return await API.post("/auth/verify-reset-code", data);
};
var resetPassword = async (data) => {
	return await API.post("/auth/reset-password", data);
};
var logoutUser = () => API.post("/auth/logout");
//#endregion
export { logoutUser as a, resetPassword as c, loginUser as i, verifyEmail as l, forgotPassword as n, registerUser as o, getCaptchaChallenge as r, resendVerification as s, devLoginUser as t, verifyResetCode as u };
