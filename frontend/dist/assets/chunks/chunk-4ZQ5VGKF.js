import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime
} from "./chunk-SOYW6UE7.js";

// src/components/feedback/Skeleton.jsx
init_define_import_meta_env();
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function SkeletonBlock({ className = "" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `skeleton-block ${className}`.trim(), "aria-hidden": "true" });
}
function FeedSkeleton({ count = 3 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "feed-stack", children: Array.from({ length: count }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "card post-card skeleton-card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "post-head", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "user-row compact-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-avatar" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "user-meta", style: { minWidth: 180 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line short" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line tiny" })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line long" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line medium" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-media" })
  ] }, index)) });
}
function ListSkeleton({ count = 6 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "list-grid", children: Array.from({ length: count }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "card user-row skeleton-card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-avatar" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "user-meta", style: { minWidth: 180 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line short" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line tiny" })
    ] })
  ] }, index)) });
}
function TableSkeleton({ rows = 6, columns = 6 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "table-skeleton-card card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "table-skeleton-head", children: Array.from({ length: columns }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line table-head-cell" }, `head-${index}`)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "table-skeleton-body", children: Array.from({ length: rows }).map((_, rowIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "table-skeleton-row", children: Array.from({ length: columns }).map((__, cellIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line table-cell" }, `cell-${rowIndex}-${cellIndex}`)) }, `row-${rowIndex}`)) })
  ] });
}
function DashboardSkeleton() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "page-state-stack", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "card skeleton-card skeleton-hero-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-pill" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-title-xl" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line long" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line medium" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stats-skeleton-grid", children: Array.from({ length: 4 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "card skeleton-card stat-skeleton-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line tiny" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-value" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line short" })
    ] }, index)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "list-grid two-column-grid-skeleton", children: Array.from({ length: 2 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "card skeleton-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-title-md" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line long" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line medium" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-media short-media" })
    ] }, index)) })
  ] });
}
function AdminOverviewSkeleton() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "page-state-stack", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "list-grid two-column-grid-skeleton", children: Array.from({ length: 2 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "card skeleton-card skeleton-hero-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-pill" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-title-xl" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line long" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line medium" })
    ] }, index)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stats-skeleton-grid", children: Array.from({ length: 4 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "card skeleton-card stat-skeleton-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line tiny" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-value" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line short" })
    ] }, index)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "list-grid two-column-grid-skeleton", children: Array.from({ length: 2 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "card skeleton-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-title-md" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line long" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line medium" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line short" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-media short-media" })
    ] }, index)) })
  ] });
}
function RoutePageSkeleton() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "page-state-stack route-page-skeleton", role: "status", "aria-live": "polite", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "card skeleton-card skeleton-hero-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-pill" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-title-xl" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line long" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line medium" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stats-skeleton-grid", children: Array.from({ length: 3 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "card skeleton-card stat-skeleton-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line tiny" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-value" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line short" })
    ] }, index)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedSkeleton, { count: 2 })
  ] });
}

export {
  ListSkeleton,
  TableSkeleton,
  DashboardSkeleton,
  AdminOverviewSkeleton,
  RoutePageSkeleton
};
