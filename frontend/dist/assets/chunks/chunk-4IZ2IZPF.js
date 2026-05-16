import {
  normalizeOtpDigits
} from "./chunk-2GKLYX3P.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/components/auth/OtpCodeInput.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function OtpCodeInput({
  value = "",
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  label = "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642",
  hint = "\u0627\u0643\u062A\u0628 \u0627\u0644\u0631\u0645\u0632 \u0623\u0648 \u0627\u0644\u0635\u0642\u0647 \u0648\u0633\u064A\u062A\u0645 \u062A\u0648\u0632\u064A\u0639\u0647 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B.",
  allowClipboardRead = true
}) {
  const refs = (0, import_react.useRef)([]);
  const digits = (0, import_react.useMemo)(() => {
    const normalized = normalizeOtpDigits(value, length);
    return Array.from({ length }, (_, index) => normalized[index] || "");
  }, [length, value]);
  const emitValue = (nextValue) => {
    const normalized = normalizeOtpDigits(nextValue, length);
    onChange?.(normalized);
    if (normalized.length === length) {
      onComplete?.(normalized);
    }
  };
  const focusIndex = (index) => {
    const target = refs.current[index];
    if (target) {
      target.focus();
      target.select();
    }
  };
  const handleDigitChange = (index) => (event) => {
    const incoming = normalizeOtpDigits(event.target.value, length);
    if (!incoming) {
      const next2 = [...digits];
      next2[index] = "";
      emitValue(next2.join(""));
      return;
    }
    if (incoming.length > 1) {
      emitValue(incoming);
      focusIndex(Math.min(incoming.length, length) - 1);
      return;
    }
    const next = [...digits];
    next[index] = incoming;
    emitValue(next.join(""));
    if (incoming && index < length - 1) {
      focusIndex(index + 1);
    }
  };
  const handleKeyDown = (index) => (event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusIndex(index - 1);
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  };
  const handlePaste = (event) => {
    event.preventDefault();
    emitValue(event.clipboardData.getData("text"));
  };
  const handleReadClipboard = async () => {
    if (!navigator?.clipboard?.readText) return;
    const text = await navigator.clipboard.readText();
    const normalized = normalizeOtpDigits(text, length);
    if (normalized) emitValue(normalized);
  };
  (0, import_react.useEffect)(() => {
    if (digits.every((digit) => !digit)) {
      refs.current[0]?.focus();
    }
  }, [digits]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "field-label", children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: "10px", direction: "ltr", justifyContent: "center", flexWrap: "wrap" }, children: digits.map((digit, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        ref: (node) => {
          refs.current[index] = node;
        },
        className: "input",
        inputMode: "numeric",
        autoComplete: index === 0 ? "one-time-code" : "off",
        maxLength: 1,
        disabled,
        value: digit,
        onChange: handleDigitChange(index),
        onKeyDown: handleKeyDown(index),
        onPaste: handlePaste,
        style: { width: "52px", textAlign: "center", fontSize: "1.25rem", fontWeight: 700, paddingInline: 0 }
      },
      `${label}-${index}`
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "field-hint", children: hint }),
      allowClipboardRead ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "mini-action", onClick: handleReadClipboard, disabled, children: "\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0631\u0645\u0632 \u0645\u0646 \u0627\u0644\u062D\u0627\u0641\u0638\u0629" }) : null
    ] })
  ] });
}

export {
  OtpCodeInput
};
