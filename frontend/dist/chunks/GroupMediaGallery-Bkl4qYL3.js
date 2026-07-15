import { a8 as useParams, E as reactExports, I as jsxRuntimeExports, a0 as MainLayout } from "../index-DRmq1dbV.js";
import { G as GroupSubHeader } from "./GroupSubHeader-uejDrITd.js";
import { i as listGroupMedia, a as getGroupDetails } from "./groups-5AJH-Iws.js";
/* empty css                         */
const TABS = [
  { id: "all", label: "الكل", icon: "🗂️" },
  { id: "image", label: "الصور", icon: "🖼️" },
  { id: "video", label: "الفيديو", icon: "🎬" },
  { id: "audio", label: "الصوت", icon: "🎵" },
  { id: "file", label: "الملفات", icon: "📎" }
];
const detectType = (item) => {
  const t = (item.media_type || item.type || "").toLowerCase();
  if (t) return t;
  const url = String(item.url || item.media_url || "").toLowerCase();
  if (/\.(jpe?g|png|webp|gif|avif|bmp)$/.test(url)) return "image";
  if (/\.(mp4|webm|mov|m4v|3gp)$/.test(url)) return "video";
  if (/\.(mp3|wav|m4a|ogg|aac)$/.test(url)) return "audio";
  return "file";
};
const GroupMediaGallery = () => {
  const { groupId } = useParams();
  const [media, setMedia] = reactExports.useState([]);
  const [group, setGroup] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [tab, setTab] = reactExports.useState("all");
  const [preview, setPreview] = reactExports.useState(null);
  reactExports.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [mr, det] = await Promise.allSettled([
          listGroupMedia(groupId, { limit: 200 }),
          getGroupDetails(groupId)
        ]);
        if (cancelled) return;
        if (mr.status === "fulfilled") {
          const list = Array.isArray(mr.value?.data) ? mr.value.data : mr.value?.data?.items || [];
          setMedia(list.map((x) => ({ ...x, _type: detectType(x) })));
        }
        if (det.status === "fulfilled") setGroup(det.value?.data || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId]);
  const filtered = reactExports.useMemo(
    () => tab === "all" ? media : media.filter((m) => m._type === tab),
    [media, tab]
  );
  const counts = reactExports.useMemo(() => {
    const c = { all: media.length, image: 0, video: 0, audio: 0, file: 0 };
    for (const m of media) c[m._type] = (c[m._type] || 0) + 1;
    return c;
  }, [media]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-page", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      GroupSubHeader,
      {
        title: `وسائط ${group?.name || "المجموعة"}`,
        subtitle: `${media.length} عنصر مشارك`
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-media-tabs", children: TABS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `tab ${tab === t.id ? "active" : ""}`,
        onClick: () => setTab(t.id),
        children: [
          t.icon,
          " ",
          t.label,
          " (",
          counts[t.id] || 0,
          ")"
        ]
      },
      t.id
    )) }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-loading", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-spinner" }),
      "جاري التحميل..."
    ] }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-empty", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ic", children: "🖼️" }),
      "لا توجد وسائط في هذا القسم بعد."
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-media-grid", children: filtered.map((m, i) => {
      const url = m.url || m.media_url || m.cdn_url;
      if (m._type === "image") {
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-media-cell", onClick: () => setPreview(m), children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: url, alt: "", loading: "lazy" }) }, m.id || i);
      }
      if (m._type === "video") {
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-media-cell", onClick: () => setPreview(m), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: url, muted: true, preload: "metadata" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ic-overlay", children: "▶ فيديو" })
        ] }, m.id || i);
      }
      if (m._type === "audio") {
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-media-cell", style: { display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4, padding: 8 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 32 }, children: "🎵" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ic-overlay", style: { position: "static" }, children: "صوت" })
        ] }, m.id || i);
      }
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "a",
        {
          href: url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "yamg-media-cell",
          style: { display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4, padding: 8, textDecoration: "none", color: "white" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 32 }, children: "📎" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 10, textAlign: "center", wordBreak: "break-all" }, children: (m.filename || m.name || "ملف").slice(0, 18) })
          ]
        },
        m.id || i
      );
    }) }),
    preview && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        onClick: () => setPreview(null),
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.92)",
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20
        },
        children: [
          preview._type === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: preview.url || preview.media_url, controls: true, autoPlay: true, style: { maxWidth: "95%", maxHeight: "90vh" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: preview.url || preview.media_url, alt: "", style: { maxWidth: "95%", maxHeight: "90vh", borderRadius: 12 } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                setPreview(null);
              },
              style: {
                position: "fixed",
                top: 20,
                left: 20,
                background: "rgba(255,255,255,.15)",
                color: "white",
                border: 0,
                width: 40,
                height: 40,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: 20
              },
              children: "✕"
            }
          )
        ]
      }
    )
  ] }) });
};
export {
  GroupMediaGallery as default
};
