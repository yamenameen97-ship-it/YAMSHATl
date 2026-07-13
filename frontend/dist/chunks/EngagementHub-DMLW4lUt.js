import { b0 as reactExports, ar as jsxRuntimeExports, h as MainLayout } from "../index-D5NOBPt4.js";
import { e as engagementApi } from "./engagementApi-P5Jmec_e.js";
function DailyTasksCenter() {
  const [tasks, setTasks] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const load = async () => {
    try {
      setLoading(true);
      const d = await engagementApi.getTasks();
      setTasks(d.tasks || []);
    } catch (e) {
      setError(e?.message || "خطأ");
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const claim = async (id) => {
    try {
      await engagementApi.claimTask(id);
      await load();
    } catch (e) {
      alert("تعذر استلام المكافأة");
    }
  };
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "daily-tasks-center", style: {
    fontFamily: "'Noto Sans Arabic', system-ui, sans-serif",
    padding: 16,
    maxWidth: 720,
    margin: "0 auto"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: 0, fontSize: 22, fontWeight: 700 }, children: "🎯 مركز المهام اليومية" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: {
        background: "#1F2937",
        color: "#FBBF24",
        padding: "6px 14px",
        borderRadius: 20,
        fontWeight: 600,
        fontSize: 14
      }, children: [
        completedCount,
        " / ",
        totalCount
      ] })
    ] }),
    loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "جاري التحميل..." }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#EF4444" }, children: error }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 12 }, children: tasks.map((t) => {
      const pct = Math.min(100, t.progress / Math.max(1, t.target_count) * 100);
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        background: t.completed ? "#064E3B" : "#1F2937",
        borderRadius: 14,
        padding: 14,
        border: t.claimed ? "1px solid #10B981" : "1px solid transparent",
        opacity: t.claimed ? 0.65 : 1
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 12, alignItems: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 30 }, children: t.icon || "✨" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, color: "#fff" }, children: t.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 13, color: "#9CA3AF", marginTop: 2 }, children: t.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            marginTop: 8,
            background: "#111827",
            borderRadius: 8,
            overflow: "hidden",
            height: 8
          }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            width: `${pct}%`,
            height: "100%",
            background: "linear-gradient(90deg,#10B981,#34D399)",
            transition: "width .3s"
          } }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, color: "#9CA3AF", marginTop: 4 }, children: [
            t.progress,
            " / ",
            t.target_count
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", minWidth: 90 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#FBBF24", fontSize: 13 }, children: [
            "🪙 +",
            t.reward_coins
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#A78BFA", fontSize: 12 }, children: [
            "⭐ +",
            t.reward_xp,
            " XP"
          ] }),
          t.completed && !t.claimed ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => claim(t.id), style: {
            marginTop: 6,
            background: "#F59E0B",
            color: "#111",
            border: "none",
            padding: "6px 12px",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer"
          }, children: "استلم" }) : t.claimed ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: 6, color: "#10B981", fontWeight: 600 }, children: "✓ تم" }) : null
        ] })
      ] }) }, t.id);
    }) })
  ] });
}
function UserLevelBadge({ compact = false }) {
  const [lvl, setLvl] = reactExports.useState(null);
  reactExports.useEffect(() => {
    engagementApi.getMyLevel().then(setLvl).catch(() => {
    });
  }, []);
  if (!lvl) return null;
  if (compact) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", style: {
      fontFamily: "'Noto Sans Arabic', sans-serif",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: lvl.badge_color,
      color: "#fff",
      padding: "3px 10px",
      borderRadius: 12,
      fontWeight: 700,
      fontSize: 12
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Lv. ",
        lvl.level
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { opacity: 0.9 }, children: lvl.title })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", style: {
    fontFamily: "'Noto Sans Arabic', sans-serif",
    background: `linear-gradient(135deg, ${lvl.badge_color}, #111827)`,
    borderRadius: 16,
    padding: 18,
    color: "#fff"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 14, opacity: 0.85 }, children: "المستوى" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 32, fontWeight: 800, lineHeight: 1 }, children: lvl.level }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: 4, fontWeight: 600 }, children: lvl.title })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "left", fontSize: 13, opacity: 0.9 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          "XP: ",
          lvl.xp,
          " / ",
          lvl.next_level_xp
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          "إجمالي: ",
          lvl.total_xp
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      marginTop: 12,
      background: "rgba(0,0,0,0.35)",
      borderRadius: 8,
      height: 10,
      overflow: "hidden"
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      width: `${lvl.progress_pct}%`,
      height: "100%",
      background: "linear-gradient(90deg,#FBBF24,#F59E0B)",
      transition: "width .4s"
    } }) })
  ] });
}
function HostLevelBadge() {
  const [hl, setHl] = reactExports.useState(null);
  reactExports.useEffect(() => {
    engagementApi.getMyHostLevel().then(setHl).catch(() => {
    });
  }, []);
  if (!hl) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", style: {
    fontFamily: "'Noto Sans Arabic', sans-serif",
    background: "linear-gradient(135deg,#7C3AED,#1F2937)",
    borderRadius: 16,
    padding: 18,
    color: "#fff"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 14, opacity: 0.85 }, children: "مستوى المضيف" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 32, fontWeight: 800 }, children: hl.level }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 600 }, children: hl.title })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "left", fontSize: 13 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          "🎙️ ",
          hl.total_live_minutes,
          " دقيقة بث"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          "💎 ",
          hl.total_diamonds_received
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          "👁️ ",
          hl.total_viewers
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      marginTop: 12,
      background: "rgba(0,0,0,0.35)",
      borderRadius: 8,
      height: 10,
      overflow: "hidden"
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      width: `${hl.progress_pct}%`,
      height: "100%",
      background: "linear-gradient(90deg,#EC4899,#F43F5E)"
    } }) })
  ] });
}
const RARITY_COLORS = {
  common: { bg: "#374151", border: "#6B7280", text: "عادية" },
  rare: { bg: "#1E3A8A", border: "#3B82F6", text: "نادرة" },
  epic: { bg: "#5B21B6", border: "#8B5CF6", text: "ملحمية" },
  legendary: { bg: "#92400E", border: "#FBBF24", text: "أسطورية" }
};
function AchievementsGrid() {
  const [list, setList] = reactExports.useState([]);
  const [filter, setFilter] = reactExports.useState("all");
  reactExports.useEffect(() => {
    engagementApi.getAchievements().then((d) => setList(d.achievements || [])).catch(() => {
    });
  }, []);
  const filtered = list.filter((a) => {
    if (filter === "unlocked") return a.unlocked;
    if (filter === "locked") return !a.unlocked;
    return true;
  });
  const unlockedCount = list.filter((a) => a.unlocked).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", style: {
    fontFamily: "'Noto Sans Arabic', sans-serif",
    padding: 16,
    maxWidth: 900,
    margin: "0 auto"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: 0, fontWeight: 800 }, children: "🏆 شارات الإنجازات" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 14, color: "#9CA3AF" }, children: [
        unlockedCount,
        " / ",
        list.length,
        " مفتوحة"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 8, marginBottom: 16 }, children: [
      ["all", "الكل"],
      ["unlocked", "مفتوحة"],
      ["locked", "مغلقة"]
    ].map(([k, label]) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setFilter(k), style: {
      padding: "6px 16px",
      borderRadius: 20,
      background: filter === k ? "#F59E0B" : "#1F2937",
      color: filter === k ? "#111" : "#fff",
      border: "none",
      cursor: "pointer",
      fontWeight: 600
    }, children: label }, k)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      gap: 12
    }, children: filtered.map((a) => {
      const r = RARITY_COLORS[a.rarity] || RARITY_COLORS.common;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        background: a.unlocked ? r.bg : "#111827",
        border: `2px solid ${a.unlocked ? r.border : "#374151"}`,
        borderRadius: 14,
        padding: 12,
        textAlign: "center",
        opacity: a.unlocked ? 1 : 0.55,
        filter: a.unlocked ? "none" : "grayscale(0.8)",
        cursor: "pointer",
        transition: "transform .2s"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 42 }, children: a.icon || "🏅" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          fontWeight: 700,
          color: "#fff",
          marginTop: 6,
          fontSize: 14
        }, children: a.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 11, color: r.border, marginTop: 2 }, children: r.text }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          fontSize: 11,
          color: "#9CA3AF",
          marginTop: 4,
          minHeight: 32
        }, children: a.description }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 6, fontSize: 12 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#FBBF24" }, children: [
            "🪙 ",
            a.reward_coins
          ] }),
          " · ",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#A78BFA" }, children: [
            "⭐ ",
            a.reward_xp
          ] })
        ] })
      ] }, a.id);
    }) })
  ] });
}
function LuckyWheel() {
  const [state, setState] = reactExports.useState(null);
  const [spinning, setSpinning] = reactExports.useState(false);
  const [angle, setAngle] = reactExports.useState(0);
  const [result, setResult] = reactExports.useState(null);
  const wheelRef = reactExports.useRef(null);
  const load = async () => {
    try {
      const d = await engagementApi.getWheelState();
      setState(d);
    } catch (e) {
    }
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const doSpin = async (paid) => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);
    try {
      const r = await engagementApi.spinWheel(paid);
      const prizes2 = state.prizes || [];
      const slice2 = 360 / Math.max(1, prizes2.length);
      const idx = prizes2.findIndex((p) => p.id === r.prize_id);
      const targetAngle = 360 * 6 + (idx >= 0 ? 360 - idx * slice2 - slice2 / 2 : 0);
      setAngle((prev) => prev + targetAngle);
      setTimeout(() => {
        setResult(r.prize);
        setSpinning(false);
        load();
      }, 4200);
    } catch (e) {
      setSpinning(false);
      setResult({ label: "تعذر الدوران", type: "error" });
    }
  };
  if (!state) return null;
  const prizes = state.prizes || [];
  const slice = 360 / Math.max(1, prizes.length);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", style: {
    fontFamily: "'Noto Sans Arabic', sans-serif",
    padding: 16,
    maxWidth: 480,
    margin: "0 auto",
    textAlign: "center"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontWeight: 800 }, children: "🎡 عجلة الحظ" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { color: "#9CA3AF", fontSize: 14 }, children: [
      "لديك دورة مجانية يومياً. الدورة الإضافية بـ ",
      state.spin_cost_coins,
      " عملة."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", width: 320, height: 320, margin: "20px auto" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        position: "absolute",
        top: -8,
        left: "50%",
        transform: "translateX(-50%)",
        width: 0,
        height: 0,
        borderLeft: "16px solid transparent",
        borderRight: "16px solid transparent",
        borderTop: "28px solid #EF4444",
        zIndex: 5
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: wheelRef, style: {
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: "conic-gradient(" + prizes.map((p, i) => `${p.color} ${i * slice}deg ${(i + 1) * slice}deg`).join(",") + ")",
        transition: spinning ? "transform 4s cubic-bezier(.17,.67,.25,1)" : "none",
        transform: `rotate(${angle}deg)`,
        border: "6px solid #FBBF24",
        boxShadow: "0 0 30px rgba(251,191,36,0.5)",
        position: "relative"
      }, children: prizes.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%,-50%) rotate(${i * slice + slice / 2}deg) translateY(-110px)`,
        color: "#fff",
        fontWeight: 700,
        fontSize: 12,
        textShadow: "0 1px 2px rgba(0,0,0,0.7)",
        width: 70,
        textAlign: "center"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 18 }, children: p.icon }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: p.label })
      ] }, p.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: 70,
        height: 70,
        borderRadius: "50%",
        background: "#1F2937",
        border: "4px solid #FBBF24",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#FBBF24",
        fontWeight: 800,
        fontSize: 18
      }, children: "🎁" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          disabled: spinning || !state.free_spin_available,
          onClick: () => doSpin(false),
          style: {
            background: state.free_spin_available ? "#10B981" : "#374151",
            color: "#fff",
            border: "none",
            padding: "10px 22px",
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 15,
            cursor: state.free_spin_available && !spinning ? "pointer" : "not-allowed"
          },
          children: state.free_spin_available ? "دورة مجانية" : "تم استخدام الدورة"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          disabled: spinning,
          onClick: () => doSpin(true),
          style: {
            background: "#F59E0B",
            color: "#111",
            border: "none",
            padding: "10px 22px",
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 15,
            cursor: spinning ? "not-allowed" : "pointer"
          },
          children: [
            "🪙 ادفع ",
            state.spin_cost_coins
          ]
        }
      )
    ] }),
    result && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      marginTop: 18,
      padding: 14,
      borderRadius: 14,
      background: "linear-gradient(135deg,#1F2937,#0F172A)",
      border: "2px solid #FBBF24",
      color: "#fff",
      fontWeight: 700
    }, children: [
      "🎉 ربحت: ",
      result.label,
      result.value > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        " (+",
        result.value,
        ")"
      ] })
    ] })
  ] });
}
function ReferralPanel() {
  const [data, setData] = reactExports.useState(null);
  const [copied, setCopied] = reactExports.useState(false);
  const [applyCode, setApplyCode] = reactExports.useState("");
  const [applyMsg, setApplyMsg] = reactExports.useState(null);
  const load = () => engagementApi.getReferral().then(setData).catch(() => {
  });
  reactExports.useEffect(() => {
    load();
  }, []);
  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  const onApply = async () => {
    if (!applyCode.trim()) return;
    try {
      const r = await engagementApi.applyReferral(applyCode.trim().toUpperCase());
      setApplyMsg({
        ok: true,
        text: `✅ تم! حصلت على ${r.referred_reward} عملة وصديقك على ${r.referrer_reward}`
      });
      load();
    } catch (e) {
      setApplyMsg({ ok: false, text: "❌ كود غير صالح أو سبق استخدامه" });
    }
  };
  if (!data) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", style: {
    fontFamily: "'Noto Sans Arabic', sans-serif",
    padding: 16,
    maxWidth: 640,
    margin: "0 auto"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontWeight: 800 }, children: "👥 ادعُ أصدقاءك واربح" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { color: "#9CA3AF", fontSize: 14 }, children: [
      "ادعُ صديقاً يسجّل عبر كودك واحصل على ",
      data.referrer_reward,
      " عملة، وصديقك يحصل على ",
      data.referred_reward,
      " عملة."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      background: "linear-gradient(135deg,#7C3AED,#3B82F6)",
      borderRadius: 16,
      padding: 18,
      color: "#fff",
      marginTop: 12
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 13, opacity: 0.85 }, children: "كود الإحالة الخاص بك" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginTop: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { style: {
          background: "rgba(0,0,0,0.3)",
          padding: "8px 16px",
          borderRadius: 10,
          fontSize: 22,
          letterSpacing: 2,
          fontWeight: 800,
          flex: 1,
          textAlign: "center"
        }, children: data.code }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => copy(data.code), style: {
          background: "#FBBF24",
          color: "#111",
          border: "none",
          padding: "10px 16px",
          borderRadius: 10,
          fontWeight: 700,
          cursor: "pointer"
        }, children: copied ? "✓ نُسخ" : "نسخ" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 10, fontSize: 13 }, children: [
        "🔗 رابط الدعوة:",
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { onClick: () => copy(data.share_url), style: {
          background: "rgba(0,0,0,0.25)",
          padding: "6px 10px",
          borderRadius: 8,
          marginTop: 4,
          cursor: "pointer",
          direction: "ltr",
          wordBreak: "break-all"
        }, children: data.share_url })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginTop: 14
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "إجمالي الدعوات", value: data.uses_count, icon: "👥" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "عملات مكتسبة", value: data.total_earned_coins, icon: "🪙" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#1F2937", borderRadius: 14, padding: 14, marginTop: 14 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff", fontWeight: 700, marginBottom: 8 }, children: "هل لديك كود من صديق؟ أدخله هنا" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: applyCode,
            onChange: (e) => setApplyCode(e.target.value),
            placeholder: "ABC12345",
            maxLength: 20,
            style: {
              flex: 1,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #374151",
              background: "#111827",
              color: "#fff",
              textAlign: "center",
              letterSpacing: 2,
              fontWeight: 700,
              fontFamily: "inherit"
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onApply, style: {
          background: "#10B981",
          color: "#fff",
          border: "none",
          padding: "10px 18px",
          borderRadius: 10,
          fontWeight: 700,
          cursor: "pointer"
        }, children: "تطبيق" })
      ] }),
      applyMsg && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        marginTop: 8,
        color: applyMsg.ok ? "#10B981" : "#EF4444",
        fontWeight: 600
      }, children: applyMsg.text })
    ] })
  ] });
}
function Stat({ label, value, icon }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
    background: "#1F2937",
    borderRadius: 12,
    padding: 12,
    textAlign: "center"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 24 }, children: icon }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#FBBF24", fontWeight: 800, fontSize: 22 }, children: value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#9CA3AF", fontSize: 12 }, children: label })
  ] });
}
const TYPE_TABS = [
  { key: "frame", label: "🖼️ الإطارات" },
  { key: "avatar", label: "👤 الصور الشخصية" },
  { key: "background", label: "🌌 الخلفيات" },
  { key: "entrance", label: "✨ تأثيرات الدخول" }
];
const RARITY_BORDER = {
  common: "#6B7280",
  rare: "#3B82F6",
  epic: "#8B5CF6",
  legendary: "#FBBF24"
};
function ShopPage() {
  const [type, setType] = reactExports.useState("frame");
  const [items, setItems] = reactExports.useState([]);
  const [status, setStatus] = reactExports.useState({});
  const load = async () => {
    const d = await engagementApi.getShop({ item_type: type });
    setItems(d.items || []);
  };
  reactExports.useEffect(() => {
    load();
  }, [type]);
  const buy = async (id) => {
    setStatus((s) => ({ ...s, [id]: { loading: true } }));
    try {
      await engagementApi.buyItem(id);
      setStatus((s) => ({ ...s, [id]: { ok: true, msg: "✓ تم الشراء" } }));
      load();
    } catch (e) {
      const err = e?.response?.data?.detail || "تعذر الشراء";
      setStatus((s) => ({ ...s, [id]: { ok: false, msg: "✗ " + err } }));
    }
  };
  const equip = async (id) => {
    try {
      await engagementApi.equipItem(id);
      setStatus((s) => ({ ...s, [id]: { ok: true, msg: "✓ مُجهَّز" } }));
    } catch (e) {
      setStatus((s) => ({ ...s, [id]: { ok: false, msg: "✗ فشل التجهيز" } }));
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", style: {
    fontFamily: "'Noto Sans Arabic', sans-serif",
    padding: 16,
    maxWidth: 1e3,
    margin: "0 auto"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontWeight: 800 }, children: "🛍️ متجر يمشات" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 8, overflowX: "auto", padding: "8px 0" }, children: TYPE_TABS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setType(t.key), style: {
      padding: "8px 16px",
      borderRadius: 20,
      whiteSpace: "nowrap",
      background: type === t.key ? "#F59E0B" : "#1F2937",
      color: type === t.key ? "#111" : "#fff",
      border: "none",
      cursor: "pointer",
      fontWeight: 600
    }, children: t.label }, t.key)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
      gap: 12,
      marginTop: 12
    }, children: items.map((it) => {
      const st = status[it.id];
      const border = RARITY_BORDER[it.rarity] || "#6B7280";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        background: "#1F2937",
        borderRadius: 14,
        border: `2px solid ${border}`,
        padding: 12,
        textAlign: "center",
        position: "relative"
      }, children: [
        it.is_limited && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          position: "absolute",
          top: 6,
          right: 6,
          background: "#EF4444",
          color: "#fff",
          fontSize: 10,
          padding: "2px 8px",
          borderRadius: 8,
          fontWeight: 700
        }, children: "محدود" }),
        it.is_vip_only && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          position: "absolute",
          top: 6,
          left: 6,
          background: "#FBBF24",
          color: "#111",
          fontSize: 10,
          padding: "2px 8px",
          borderRadius: 8,
          fontWeight: 700
        }, children: "VIP" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          width: 100,
          height: 100,
          margin: "8px auto",
          background: `url(${it.image_url}) center/cover no-repeat, #111827`,
          borderRadius: it.item_type === "avatar" ? "50%" : 12,
          border: "2px solid #374151"
        } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff", fontWeight: 700, fontSize: 14 }, children: it.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 11, color: border, marginTop: 2 }, children: [
          it.rarity,
          " ",
          it.required_level > 0 && `· Lv. ${it.required_level}+`
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 6, color: "#FBBF24", fontWeight: 700 }, children: [
          it.price_diamonds > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            "💎 ",
            it.price_diamonds
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            "🪙 ",
            it.price_coins
          ] }),
          it.duration_days && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#9CA3AF", fontSize: 11 }, children: [
            " ",
            "(",
            it.duration_days,
            " يوم)"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 8 }, children: [
          it.owned ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => equip(it.id), style: {
            background: "#10B981",
            color: "#fff",
            border: "none",
            padding: "6px 14px",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
            width: "100%"
          }, children: "تجهيز" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => buy(it.id),
              disabled: st?.loading,
              style: {
                background: "#F59E0B",
                color: "#111",
                border: "none",
                padding: "6px 14px",
                borderRadius: 10,
                fontWeight: 700,
                cursor: st?.loading ? "wait" : "pointer",
                width: "100%"
              },
              children: st?.loading ? "..." : "شراء"
            }
          ),
          st?.msg && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            marginTop: 6,
            fontSize: 12,
            color: st.ok ? "#10B981" : "#EF4444"
          }, children: st.msg })
        ] })
      ] }, it.id);
    }) })
  ] });
}
const TABS = [
  { key: "overview", label: "🏠 نظرة عامة" },
  { key: "tasks", label: "🎯 المهام اليومية" },
  { key: "achievements", label: "🏆 الشارات" },
  { key: "wheel", label: "🎡 عجلة الحظ" },
  { key: "referral", label: "👥 الإحالة" },
  { key: "shop", label: "🛍️ المتجر" }
];
function EngagementHub() {
  const [tab, setTab] = reactExports.useState("overview");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", style: {
    fontFamily: "'Noto Sans Arabic', system-ui, sans-serif",
    minHeight: "100%",
    background: "#0F172A",
    color: "#fff"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      padding: "14px 16px",
      background: "linear-gradient(135deg,#7C3AED,#1F2937)",
      position: "sticky",
      top: 0,
      zIndex: 10
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: { margin: 0, fontSize: 22, fontWeight: 800 }, children: "⭐ مركز التفاعل والمكافآت" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        display: "flex",
        gap: 8,
        overflowX: "auto",
        marginTop: 12,
        paddingBottom: 4
      }, children: TABS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTab(t.key), style: {
        padding: "8px 16px",
        borderRadius: 20,
        whiteSpace: "nowrap",
        background: tab === t.key ? "#FBBF24" : "rgba(0,0,0,0.35)",
        color: tab === t.key ? "#111" : "#fff",
        border: "none",
        cursor: "pointer",
        fontWeight: 700,
        fontFamily: "inherit"
      }, children: t.label }, t.key)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 16 }, children: [
      tab === "overview" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 14 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(UserLevelBadge, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(HostLevelBadge, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DailyTasksCenter, {})
      ] }),
      tab === "tasks" && /* @__PURE__ */ jsxRuntimeExports.jsx(DailyTasksCenter, {}),
      tab === "achievements" && /* @__PURE__ */ jsxRuntimeExports.jsx(AchievementsGrid, {}),
      tab === "wheel" && /* @__PURE__ */ jsxRuntimeExports.jsx(LuckyWheel, {}),
      tab === "referral" && /* @__PURE__ */ jsxRuntimeExports.jsx(ReferralPanel, {}),
      tab === "shop" && /* @__PURE__ */ jsxRuntimeExports.jsx(ShopPage, {})
    ] })
  ] }) });
}
export {
  EngagementHub as default
};
