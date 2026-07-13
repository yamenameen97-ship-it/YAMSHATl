const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["chunks/PostComposerPage-CXXa-klD.js","index-TztUfWYS.js","chunks/PostComposer-FHQ6zsx4.js","chunks/posts-C7Lsj7RA.js","chunks/ReelComposer-BrOZtm-Z.js","chunks/reelsEngine-bJfUGmhY.js"])))=>i.map(i=>d[i]);
import { by as useLocation, ar as jsxRuntimeExports, b0 as reactExports, l as RoutePageSkeleton, _ as __vitePreload } from "../index-TztUfWYS.js";
const PostComposerPage = reactExports.lazy(() => __vitePreload(() => import("./PostComposerPage-CXXa-klD.js"), true ? __vite__mapDeps([0,1,2,3]) : void 0));
const ReelComposer = reactExports.lazy(() => __vitePreload(() => import("./ReelComposer-BrOZtm-Z.js"), true ? __vite__mapDeps([4,1,5]) : void 0));
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
