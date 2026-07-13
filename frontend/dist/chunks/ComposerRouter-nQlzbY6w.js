const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["chunks/PostComposerPage-BnBcyWr7.js","index-2I4hYPnI.js","chunks/PostComposer-CgDT3q07.js","chunks/posts-8HKtDszf.js","chunks/ReelComposer-DM0kBFMp.js","chunks/reelsEngine-bJfUGmhY.js"])))=>i.map(i=>d[i]);
import { bu as useLocation, aq as jsxRuntimeExports, a_ as reactExports, l as RoutePageSkeleton, _ as __vitePreload } from "../index-2I4hYPnI.js";
const PostComposerPage = reactExports.lazy(() => __vitePreload(() => import("./PostComposerPage-BnBcyWr7.js"), true ? __vite__mapDeps([0,1,2,3]) : void 0));
const ReelComposer = reactExports.lazy(() => __vitePreload(() => import("./ReelComposer-DM0kBFMp.js"), true ? __vite__mapDeps([4,1,5]) : void 0));
function readTab(search) {
  try {
    const sp = new URLSearchParams(search);
    return String(sp.get("tab") || "").toLowerCase();
  } catch {
    return "";
  }
}
function ComposerRouter() {
  const location = useLocation();
  const tab = readTab(location.search);
  if (tab === "post" || location.pathname.startsWith("/post")) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(RoutePageSkeleton, {}), children: /* @__PURE__ */ jsxRuntimeExports.jsx(PostComposerPage, {}) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(RoutePageSkeleton, {}), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReelComposer, {}) });
}
export {
  ComposerRouter as default
};
