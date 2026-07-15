import { E as reactExports, ak as React, al as axios, am as API_BASE, I as jsxRuntimeExports } from "../index-DRmq1dbV.js";
const REASONS = [
  { value: "abuse", label: "إساءة وتنمر", icon: "🚫" },
  { value: "impersonation", label: "انتحال شخصية", icon: "🎭" },
  { value: "inappropriate", label: "محتوى غير لائق", icon: "⚠️" },
  { value: "spam", label: "محتوى مزعج (سبام)", icon: "📧" },
  { value: "unwanted", label: "محتوى غير مرغوب فيه", icon: "🙅" },
  { value: "hate_speech", label: "خطاب كراهية", icon: "😡" },
  { value: "violence", label: "عنف", icon: "⚔️" },
  { value: "nudity", label: "محتوى إباحي / عُري", icon: "🔞" },
  { value: "self_harm", label: "إيذاء النفس", icon: "🆘" },
  { value: "misinformation", label: "معلومات مضللة", icon: "❗" },
  { value: "scam", label: "احتيال", icon: "💰" },
  { value: "copyright", label: "انتهاك حقوق ملكية", icon: "©️" },
  { value: "other", label: "سبب آخر", icon: "✏️" }
];
function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  targetLabel = ""
}) {
  const [reason, setReason] = reactExports.useState("");
  const [details, setDetails] = reactExports.useState("");
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [done, setDone] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const isMountedRef = reactExports.useRef(true);
  const abortRef = reactExports.useRef(null);
  const dialogRef = reactExports.useRef(null);
  const closeBtnRef = reactExports.useRef(null);
  const detailsId = React.useId ? React.useId() : "report-details-field";
  const titleId = React.useId ? React.useId() : "report-modal-title";
  const previouslyFocusedRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      try {
        abortRef.current?.abort?.();
      } catch {
      }
    };
  }, []);
  reactExports.useEffect(() => {
    if (open) {
      setReason("");
      setDetails("");
      setDone(false);
      setError("");
      setSubmitting(false);
    } else {
      try {
        abortRef.current?.abort?.();
      } catch {
      }
    }
  }, [open]);
  reactExports.useEffect(() => {
    if (!open) return void 0;
    try {
      previouslyFocusedRef.current = typeof document !== "undefined" && document.activeElement || null;
    } catch {
    }
    const focusTimer = window.setTimeout(() => {
      try {
        closeBtnRef.current?.focus?.();
      } catch {
      }
    }, 30);
    const getFocusables = () => {
      const root = dialogRef.current;
      if (!root) return [];
      const sel = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(root.querySelectorAll(sel)).filter((el) => !el.hasAttribute("hidden"));
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key === "Tab") {
        const list = getFocusables();
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          try {
            last.focus();
          } catch {
          }
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          try {
            first.focus();
          } catch {
          }
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
      try {
        const prev = previouslyFocusedRef.current;
        if (prev && typeof prev.focus === "function" && document.contains(prev)) {
          prev.focus();
        }
      } catch {
      }
      previouslyFocusedRef.current = null;
    };
  }, [open, onClose]);
  const submit = reactExports.useCallback(async () => {
    if (!reason) {
      setError("يرجى اختيار سبب البلاغ");
      return;
    }
    setSubmitting(true);
    setError("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/reports`,
        {
          target_type: targetType,
          target_id: String(targetId),
          reason,
          details: details.trim() || null,
          context: { source: "web", target_label: targetLabel }
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal
        }
      );
      if (isMountedRef.current) setDone(true);
    } catch (e) {
      if (axios.isCancel?.(e) || e?.name === "CanceledError" || e?.code === "ERR_CANCELED") {
        return;
      }
      if (!isMountedRef.current) return;
      const msg = e?.response?.data?.detail || "تعذّر إرسال البلاغ، حاول مرة أخرى";
      setError(typeof msg === "string" ? msg : "حدث خطأ");
    } finally {
      if (isMountedRef.current) setSubmitting(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [reason, details, targetType, targetId, targetLabel]);
  if (!open) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      dir: "rtl",
      className: "report-modal-backdrop",
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        fontFamily: '"Noto Sans Arabic", "Cairo", system-ui, sans-serif',
        backdropFilter: "blur(6px)"
      },
      onClick: onClose,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          ref: dialogRef,
          className: "report-modal-card",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": titleId,
          onClick: (e) => e.stopPropagation(),
          style: {
            width: "100%",
            maxWidth: 520,
            background: "linear-gradient(180deg, #1e1b3a 0%, #14122a 100%)",
            borderTopRightRadius: 24,
            borderTopLeftRadius: 24,
            padding: "20px 18px 0",
            color: "#fff",
            maxHeight: "min(90dvh, calc(100dvh - env(safe-area-inset-top, 0px) - 8px))",
            overflowY: "auto",
            boxShadow: "0 -8px 32px rgba(124,58,237,0.35)",
            border: "1px solid rgba(124,58,237,0.3)",
            paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
              width: 48,
              height: 4,
              background: "rgba(255,255,255,0.25)",
              borderRadius: 4,
              margin: "0 auto 16px"
            } }),
            !done ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 24 }, "aria-hidden": "true", children: "🚨" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { id: titleId, style: { margin: 0, fontSize: 18, fontWeight: 700 }, children: "الإبلاغ عن مخالفة" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { margin: "0 0 18px", fontSize: 13, opacity: 0.75 }, children: [
                "ساعدنا في الحفاظ على مجتمع آمن. اختر سبب البلاغ وسيتم مراجعته بسرية.",
                targetLabel ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  " — ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: targetLabel })
                ] }) : null
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: REASONS.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "label",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    background: reason === r.value ? "linear-gradient(90deg,#7c3aed,#a855f7)" : "rgba(255,255,255,0.05)",
                    border: "1px solid " + (reason === r.value ? "rgba(168,85,247,0.6)" : "rgba(255,255,255,0.08)"),
                    transition: "all .15s"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "radio",
                        name: "reason",
                        value: r.value,
                        checked: reason === r.value,
                        onChange: () => setReason(r.value),
                        style: { display: "none" }
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 20 }, children: r.icon }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 15, fontWeight: 600 }, children: r.label }),
                    reason === r.value && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { marginInlineStart: "auto", fontSize: 18 }, children: "✓" })
                  ]
                },
                r.value
              )) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 16 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: detailsId, style: { fontSize: 13, opacity: 0.85, marginBottom: 6, display: "block" }, children: "تفاصيل إضافية (اختياري)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "textarea",
                  {
                    id: detailsId,
                    value: details,
                    onChange: (e) => setDetails(e.target.value),
                    maxLength: 2e3,
                    rows: 3,
                    placeholder: "اكتب أي تفاصيل تساعد فريق الإشراف...",
                    style: {
                      width: "100%",
                      padding: 12,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      color: "#fff",
                      resize: "vertical",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontFamily: "inherit",
                      fontSize: 14
                    }
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 11, opacity: 0.5, textAlign: "start", marginTop: 4 }, children: [
                  details.length,
                  "/2000"
                ] })
              ] }),
              error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.15)",
                color: "#fca5a5",
                fontSize: 13,
                border: "1px solid rgba(239,68,68,0.3)"
              }, children: [
                "⚠️ ",
                error
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  style: {
                    display: "flex",
                    gap: 10,
                    marginTop: 18,
                    position: "sticky",
                    bottom: 0,
                    padding: "14px 18px calc(14px + env(safe-area-inset-bottom, 0px))",
                    marginInline: "-18px",
                    marginBottom: "-12px",
                    background: "linear-gradient(180deg, rgba(20,18,42,0.08) 0%, rgba(20,18,42,0.92) 24%, rgba(20,18,42,1) 100%)",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    zIndex: 2
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        ref: closeBtnRef,
                        onClick: onClose,
                        disabled: submitting,
                        "aria-label": "إلغاء وإغلاق نافذة البلاغ",
                        style: {
                          flex: 1,
                          padding: "12px 16px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.08)",
                          color: "#fff",
                          border: "1px solid rgba(255,255,255,0.1)",
                          fontSize: 15,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit"
                        },
                        children: "إلغاء"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: submit,
                        disabled: submitting || !reason,
                        "aria-label": "إرسال البلاغ",
                        style: {
                          flex: 1.4,
                          padding: "12px 16px",
                          borderRadius: 12,
                          background: !reason ? "rgba(124,58,237,0.4)" : "linear-gradient(90deg,#7c3aed,#a855f7)",
                          color: "#fff",
                          border: "none",
                          fontSize: 15,
                          fontWeight: 700,
                          cursor: !reason ? "not-allowed" : "pointer",
                          fontFamily: "inherit",
                          opacity: submitting ? 0.6 : 1,
                          boxShadow: "0 10px 24px rgba(124,58,237,0.28)"
                        },
                        children: submitting ? "جارٍ الإرسال..." : "إرسال البلاغ"
                      }
                    )
                  ]
                }
              )
            ] }) : (
              /* بعد الإرسال */
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "20px 10px" }, role: "status", "aria-live": "polite", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 56, marginBottom: 10 }, "aria-hidden": "true", children: "✅" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { id: titleId, style: { margin: "0 0 8px", fontSize: 18, fontWeight: 700 }, children: "تم استلام بلاغك" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "0 0 18px", fontSize: 14, opacity: 0.8, lineHeight: 1.7 }, children: "شكراً لمساعدتك في الحفاظ على مجتمع آمن. سيقوم فريق الإشراف بمراجعة البلاغ خلال 24 ساعة، وستصلك إشعار بنتيجة المراجعة." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: onClose,
                    style: {
                      padding: "12px 28px",
                      borderRadius: 12,
                      background: "linear-gradient(90deg,#7c3aed,#a855f7)",
                      color: "#fff",
                      border: "none",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit"
                    },
                    children: "تم"
                  }
                )
              ] })
            )
          ]
        }
      )
    }
  );
}
export {
  ReportModal as R
};
