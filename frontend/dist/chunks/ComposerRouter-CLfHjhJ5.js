const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["chunks/PostComposerPage-WZMwL_0L.js","index-D5NOBPt4.js","chunks/PostComposer-ZkMWZPLd.js","chunks/posts-BMr4cr0i.js","chunks/ReelComposer-DzOs_v-L.js","chunks/reelsEngine-bJfUGmhY.js"])))=>i.map(i=>d[i]);
import { by as useLocation, ar as jsxRuntimeExports, b0 as reactExports, l as RoutePageSkeleton, _ as __vitePreload } from "../index-D5NOBPt4.js";
const PostComposerPage = reactExports.lazy(() => __vitePreload(() => import("./PostComposerPage-WZMwL_0L.js"), true ? __vite__mapDeps([0,1,2,3]) : void 0));
const ReelComposer = reactExports.lazy(() => __vitePreload(() => import("./ReelComposer-DzOs_v-L.js"), true ? __vite__mapDeps([4,1,5]) : void 0));
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
