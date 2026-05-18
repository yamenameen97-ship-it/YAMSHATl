import{a as g,b as m}from"./chunk-T3SILTKH.js";import{d as u,k as p}from"./chunk-XSUFE7BX.js";p();var n=u(g(),1),i=u(m(),1),b=(0,n.createContext)({pushToast:()=>{}}),h=4;function v(t={}){let d=t.title||t.message||t.label||(t.type==="error"?"\u062D\u062F\u062B \u062E\u0637\u0623":t.type==="success"?"\u062A\u0645 \u0628\u0646\u062C\u0627\u062D":"\u062A\u0646\u0628\u064A\u0647"),s=t.description||(t.title&&t.message&&t.title!==t.message?t.message:"")||"";return{id:t.id||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,type:t.type||"info",title:d,description:s,duration:Number(t.duration||4200),actionLabel:t.actionLabel||"",onAction:typeof t.onAction=="function"?t.onAction:null}}function w({children:t}){let[d,s]=(0,n.useState)([]),r=(0,n.useCallback)(e=>{s(o=>o.filter(a=>a.id!==e))},[]),l=(0,n.useCallback)(e=>{let o=v(e);s(a=>[...a.filter(c=>c.title!==o.title||c.description!==o.description),o].slice(-h)),window.setTimeout(()=>{s(a=>a.filter(c=>c.id!==o.id))},o.duration)},[]);(0,n.useEffect)(()=>{let e=o=>l(o.detail||{});return window.addEventListener("yamshat:toast",e),()=>window.removeEventListener("yamshat:toast",e)},[l]);let f=(0,n.useMemo)(()=>({pushToast:l,dismissToast:r}),[r,l]);return(0,i.jsxs)(b.Provider,{value:f,children:[t,(0,i.jsx)("div",{className:"toast-stack","aria-live":"polite","aria-atomic":"true",children:d.map(e=>(0,i.jsxs)("div",{className:`toast toast-${e.type}`,children:[(0,i.jsxs)("div",{className:"toast-head-row",children:[(0,i.jsx)("strong",{children:e.title}),(0,i.jsx)("button",{type:"button",className:"toast-close-btn",onClick:()=>r(e.id),"aria-label":"\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0625\u0634\u0639\u0627\u0631",children:"\xD7"})]}),e.description?(0,i.jsx)("span",{children:e.description}):null,e.actionLabel?(0,i.jsx)("button",{type:"button",className:"toast-action-btn",onClick:()=>{e.onAction?.(),r(e.id)},children:e.actionLabel}):null,(0,i.jsx)("div",{className:"toast-progress",style:{animationDuration:`${e.duration}ms`}})]},e.id))}),(0,i.jsx)("style",{children:`
        .toast-head-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .toast-close-btn,
        .toast-action-btn {
          border: none;
          cursor: pointer;
          font: inherit;
        }
        .toast-close-btn {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          color: inherit;
        }
        .toast-action-btn {
          justify-self: start;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(59,130,246,0.14);
          color: #bfdbfe;
          font-weight: 700;
        }
        .toast {
          overflow: hidden;
          position: relative;
        }
        .toast-progress {
          position: absolute;
          inset-inline-start: 0;
          bottom: 0;
          height: 3px;
          width: 100%;
          transform-origin: left;
          background: linear-gradient(90deg, #8b5cf6, #22d3ee);
          animation-name: toast-progress-shrink;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes toast-progress-shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `})]})}function x(){return(0,n.useContext)(b)}export{w as a,x as b};
