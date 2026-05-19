import { r as reactExports, j as jsxRuntimeExports } from "../index-BAMQT-m6.js";
import { n as normalizeOtpDigits } from "./authValidation-DEop1LBJ.js";
function OtpCodeInput({
  value = "",
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  label = "رمز التحقق",
  hint = "اكتب الرمز أو الصقه وسيتم توزيعه تلقائياً.",
  allowClipboardRead = true
}) {
  const refs = reactExports.useRef([]);
  const digits = reactExports.useMemo(() => {
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
  reactExports.useEffect(() => {
    if (digits.every((digit) => !digit)) {
      refs.current[0]?.focus();
    }
  }, [digits]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "10px", direction: "ltr", justifyContent: "center", flexWrap: "wrap" }, children: digits.map((digit, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
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
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-hint", children: hint }),
      allowClipboardRead ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "mini-action", onClick: handleReadClipboard, disabled, children: "قراءة الرمز من الحافظة" }) : null
    ] })
  ] });
}
export {
  OtpCodeInput as O
};
