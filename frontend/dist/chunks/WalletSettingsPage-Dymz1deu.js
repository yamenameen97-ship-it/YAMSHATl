import { a_ as reactExports, aq as jsxRuntimeExports, c as Button } from "../index-2I4hYPnI.js";
import { b as SettingsShell, a as SettingsSection, S as SettingsRow, c as SettingsToggle } from "./SettingsShell-bXNYH2-6.js";
const KEY = "yamshat:wallet-settings";
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
};
const save = (p) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
  }
};
function WalletSettingsPage() {
  const [prefs, setPrefs] = reactExports.useState(() => ({
    pinEnabled: true,
    biometricEnabled: true,
    requirePinForPayments: true,
    requirePinAboveAmount: true,
    pinAmountThreshold: 100,
    defaultCurrency: "USD",
    showBalance: true,
    hideBalanceOnAppOpen: false,
    autoConvertCurrency: true,
    dailyLimit: 1e3,
    monthlyLimit: 1e4,
    transactionAlerts: true,
    receiveTipsAllowed: true,
    sendTipsAllowed: true,
    allowGifts: true,
    autoTopupEnabled: false,
    autoTopupAmount: 50,
    twoFactorPayments: true,
    receiptsEmail: true,
    transactionHistory: "90days",
    preferredPaymentMethod: "card",
    paypalLinked: false,
    cardLinked: false,
    walletLinked: true,
    cryptoEnabled: false,
    refundPolicy: "auto",
    ...load()
  }));
  const [msg, setMsg] = reactExports.useState("");
  const u = (k, v) => {
    const n = { ...prefs, [k]: v };
    setPrefs(n);
    save(n);
    setMsg("تم الحفظ.");
    setTimeout(() => setMsg(""), 1500);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsShell, { title: "إعدادات المحفظة", subtitle: "أمان الدفعات، عملات، حدود، وطرق دفع.", icon: "💰", backTo: "/wallet", message: msg, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الأمان والمدفوعات", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔐", title: "رمز PIN للمحفظة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.pinEnabled, onChange: (v) => u("pinEnabled", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👆", title: "بصمة الإصبع / Face ID", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.biometricEnabled, onChange: (v) => u("biometricEnabled", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💳", title: "طلب PIN لكل عملية دفع", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.requirePinForPayments, onChange: (v) => u("requirePinForPayments", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔒", title: "طلب PIN للمبالغ الكبيرة فقط", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.requirePinAboveAmount, onChange: (v) => u("requirePinAboveAmount", v) }) }),
      prefs.requirePinAboveAmount ? /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💵", title: "حد المبلغ الكبير (بالعملة الأساسية)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "settings-input", type: "number", value: prefs.pinAmountThreshold, onChange: (e) => u("pinAmountThreshold", Number(e.target.value)) }) }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🛡️", title: "مصادقة ثنائية لكل عملية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.twoFactorPayments, onChange: (v) => u("twoFactorPayments", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "العملة والرصيد", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💱", title: "العملة الافتراضية", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.defaultCurrency, onChange: (e) => u("defaultCurrency", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "USD", children: "دولار أمريكي USD" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "EUR", children: "يورو EUR" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "SAR", children: "ريال سعودي SAR" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "AED", children: "درهم إماراتي AED" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "EGP", children: "جنيه مصري EGP" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "KWD", children: "دينار كويتي KWD" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "QAR", children: "ريال قطري QAR" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "👁️", title: "إظهار الرصيد", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.showBalance, onChange: (v) => u("showBalance", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🙈", title: "إخفاء الرصيد عند فتح التطبيق", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.hideBalanceOnAppOpen, onChange: (v) => u("hideBalanceOnAppOpen", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔄", title: "تحويل العملات تلقائيًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoConvertCurrency, onChange: (v) => u("autoConvertCurrency", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الحدود اليومية والشهرية", description: "حماية إضافية بضبط حدود الإنفاق", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📅", title: "الحد اليومي", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "settings-input", type: "number", value: prefs.dailyLimit, onChange: (e) => u("dailyLimit", Number(e.target.value)) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📆", title: "الحد الشهري", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "settings-input", type: "number", value: prefs.monthlyLimit, onChange: (e) => u("monthlyLimit", Number(e.target.value)) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الإكراميات والهدايا", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎁", title: "السماح باستلام إكراميات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.receiveTipsAllowed, onChange: (v) => u("receiveTipsAllowed", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💝", title: "السماح بإرسال إكراميات", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.sendTipsAllowed, onChange: (v) => u("sendTipsAllowed", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🎀", title: "السماح بالهدايا الافتراضية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.allowGifts, onChange: (v) => u("allowGifts", v) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "طرق الدفع", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💳", title: "بطاقة ائتمان", description: prefs.cardLinked ? "مرتبطة" : "غير مرتبطة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", children: prefs.cardLinked ? "إدارة" : "ربط" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🅿️", title: "PayPal", description: prefs.paypalLinked ? "مرتبطة" : "غير مرتبطة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", children: prefs.paypalLinked ? "إدارة" : "ربط" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🪙", title: "عملات رقمية (Crypto)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.cryptoEnabled, onChange: (v) => u("cryptoEnabled", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⭐", title: "طريقة الدفع المفضلة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.preferredPaymentMethod, onChange: (e) => u("preferredPaymentMethod", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "wallet", children: "المحفظة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "card", children: "بطاقة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "paypal", children: "PayPal" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "crypto", children: "عملات رقمية" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الإشعارات والسجلات", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔔", title: "تنبيهات لكل معاملة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.transactionAlerts, onChange: (v) => u("transactionAlerts", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📧", title: "إرسال الإيصالات بالبريد", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.receiptsEmail, onChange: (v) => u("receiptsEmail", v) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📜", title: "فترة سجل المعاملات", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.transactionHistory, onChange: (e) => u("transactionHistory", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "30days", children: "30 يوم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "90days", children: "90 يوم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "1year", children: "سنة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "الكل" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "↩️", title: "سياسة استرداد المبالغ", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "settings-select", value: prefs.refundPolicy, onChange: (e) => u("refundPolicy", e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "auto", children: "تلقائي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "manual", children: "يدوي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ask", children: "السؤال في كل مرة" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الشحن التلقائي", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "⚡", title: "شحن تلقائي عند نفاد الرصيد", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsToggle, { on: prefs.autoTopupEnabled, onChange: (v) => u("autoTopupEnabled", v) }) }),
      prefs.autoTopupEnabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "💰", title: "مبلغ الشحن التلقائي", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "settings-input", type: "number", value: prefs.autoTopupAmount, onChange: (e) => u("autoTopupAmount", Number(e.target.value)) }) }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "إجراءات", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "📥", title: "تنزيل سجل المعاملات (CSV)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", onClick: () => {
        setMsg("جاري التحضير...");
        setTimeout(() => setMsg(""), 1500);
      }, children: "تنزيل" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "🔒", title: "تجميد المحفظة مؤقتًا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", className: "settings-danger", children: "تجميد" }) })
    ] })
  ] });
}
export {
  WalletSettingsPage as default
};
