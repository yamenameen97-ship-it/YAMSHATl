import { F as useNavigate, I as jsxRuntimeExports } from "../index-DRmq1dbV.js";
const GroupSubHeader = ({ title, subtitle, action = null, onBack = null }) => {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-toolbar", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: "yamg-back",
        onClick: () => onBack ? onBack() : navigate(-1),
        "aria-label": "رجوع",
        children: "→"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "yamg-title", children: title }),
      subtitle && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yamg-subtitle", children: subtitle })
    ] }),
    action
  ] });
};
export {
  GroupSubHeader as G
};
