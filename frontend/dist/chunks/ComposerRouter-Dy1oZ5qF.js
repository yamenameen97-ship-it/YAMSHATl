const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["chunks/PostComposerPage-BAla52iD.js","index-DRmq1dbV.js","chunks/PostComposer-A5eOLdUT.js","chunks/posts-CVbaeloP.js","chunks/ReelComposer-BfpEkr_7.js","chunks/reelsEngine-DPVKytN0.js"])))=>i.map(i=>d[i]);
import { G as useLocation, I as jsxRuntimeExports, E as reactExports, a3 as RoutePageSkeleton, a4 as __vitePreload } from "../index-DRmq1dbV.js";
const PostComposerPage = reactExports.lazy(() => __vitePreload(() => import("./PostComposerPage-BAla52iD.js"), true ? __vite__mapDeps([0,1,2,3]) : void 0));
const ReelComposer = reactExports.lazy(() => __vitePreload(() => import("./ReelComposer-BfpEkr_7.js"), true ? __vite__mapDeps([4,1,5]) : void 0));
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
