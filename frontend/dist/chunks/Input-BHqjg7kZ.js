import{r as k,j as e}from"./vendor-react-O1sHQkAE.js";function Y({label:x,hint:c,error:N,value:a="",maxLength:r,showCharCount:z=!1,clearable:h=!1,onClear:f,disabled:g=!1,loading:o=!1,icon:d,className:B="",type:E="text",required:b=!1,pattern:p,validate:m,onChange:s,...n}){const[F,v]=k.useState(!1),[y,l]=k.useState(""),t=N||y,j=a?.length||0,C=r&&j>=r,I=i=>{const u=i.target.value;if(y&&l(""),m){const w=m(u);w&&l(w)}p&&u&&!new RegExp(p).test(u)&&l("صيغة غير صحيحة"),s&&s(i)},$=()=>{f?f():s&&s({target:{value:""}}),l("")},R=i=>{v(!1),n.onBlur&&n.onBlur(i)},W=i=>{v(!0),n.onFocus&&n.onFocus(i)},D=["input-enhanced",t?"input-error":"",F?"input-focused":"",g?"input-disabled":"",o?"input-loading":"",d?"input-with-icon":"",h&&a?"input-clearable":"",B].filter(Boolean).join(" ");return e.jsxs("div",{className:"input-wrapper",children:[x&&e.jsxs("label",{className:"input-label",children:[x,b&&e.jsx("span",{className:"required-indicator",children:"*"})]}),e.jsxs("div",{className:"input-container",children:[d&&e.jsx("span",{className:"input-icon",children:d}),e.jsx("input",{type:E,className:D,value:a,onChange:I,onBlur:R,onFocus:W,disabled:g||o,maxLength:r,required:b,pattern:p,"aria-invalid":!!t,"aria-describedby":t?`${n.id}-error`:c?`${n.id}-hint`:void 0,...n}),o&&e.jsx("span",{className:"input-spinner","aria-hidden":"true",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10",opacity:"0.3"}),e.jsx("path",{d:"M12 2a10 10 0 0 1 10 10"})]})}),h&&a&&!o&&e.jsx("button",{type:"button",className:"input-clear-btn",onClick:$,"aria-label":"مسح المدخل",tabIndex:-1,children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),z&&r&&e.jsxs("div",{className:`char-counter ${C?"char-counter-warning":""}`,children:[j," / ",r]}),t&&e.jsxs("div",{className:"input-error-message",id:`${n.id}-error`,role:"alert",children:[e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2","aria-hidden":"true",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]}),e.jsx("span",{children:t})]}),c&&!t&&e.jsx("div",{className:"input-hint",id:`${n.id}-hint`,children:c}),e.jsx("style",{children:`
        .input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .required-indicator {
          color: #ef4444;
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-enhanced {
          width: 100%;
          padding: 10px 12px;
          font-size: 14px;
          border: 1px solid var(--line);
          border-radius: 6px;
          background: var(--bg-input);
          color: var(--text);
          transition: all 0.2s ease;
          outline: none;
          font-family: inherit;
        }

        .input-enhanced::placeholder {
          color: var(--muted);
        }

        .input-enhanced:hover:not(:disabled) {
          border-color: var(--line-hover);
        }

        .input-enhanced:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
        }

        .input-enhanced.input-error {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .input-enhanced.input-error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .input-enhanced:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: var(--bg-soft);
        }

        .input-enhanced.input-loading {
          padding-right: 36px;
        }

        .input-enhanced.input-with-icon {
          padding-left: 36px;
        }

        .input-icon {
          position: absolute;
          left: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
          pointer-events: none;
        }

        .input-spinner {
          position: absolute;
          right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .input-clear-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        }

        .input-clear-btn:hover {
          color: var(--text);
        }

        .input-clear-btn:active {
          transform: scale(0.95);
        }

        .input-error-message {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #ef4444;
          animation: slideDown 0.2s ease-out;
        }

        .input-hint {
          font-size: 12px;
          color: var(--muted);
        }

        .char-counter {
          font-size: 12px;
          color: var(--muted);
          text-align: right;
        }

        .char-counter-warning {
          color: #f59e0b;
          font-weight: 500;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive design */
        @media (max-width: 640px) {
          .input-enhanced {
            font-size: 16px;
            padding: 12px 14px;
          }

          .input-label {
            font-size: 13px;
          }

          .input-error-message {
            font-size: 11px;
          }
        }
      `})]})}export{Y as I};
