import{a as E}from"./chunk-OKBOFJIL.js";import{a as k,b as y}from"./chunk-T3SILTKH.js";import{d,k as b}from"./chunk-XSUFE7BX.js";b();var a=d(k(),1),x=d(E(),1),t=d(y(),1);function Y({open:s,isOpen:v,title:h,children:g,onClose:n,size:w="medium"}){let l=typeof s=="boolean"?s:!!v,i=(0,a.useRef)(null),c=(0,a.useRef)(null),[r,m]=(0,a.useState)(!1),u=(0,a.useCallback)(e=>{if(!i.current)return;let o=i.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');if(o.length===0)return;let f=o[0],p=o[o.length-1];e.key==="Tab"&&(e.shiftKey?document.activeElement===f&&(p.focus(),e.preventDefault()):document.activeElement===p&&(f.focus(),e.preventDefault()))},[]);return(0,a.useEffect)(()=>{if(l){m(!0),c.current=document.activeElement,document.body.style.overflow="hidden",setTimeout(()=>{i.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus()},100);let e=o=>{o.key==="Escape"&&n(),u(o)};return window.addEventListener("keydown",e),()=>{window.removeEventListener("keydown",e),document.body.style.overflow="unset",c.current?.focus()}}else m(!1)},[l,n,u]),!l&&!r?null:(0,x.createPortal)((0,t.jsxs)("div",{className:`modal-backdrop ${r?"fade-in":"fade-out"}`,onClick:n,role:"presentation","aria-hidden":!l,style:{opacity:r?1:0,pointerEvents:r?"auto":"none",transition:"opacity 0.2s ease-out"},children:[(0,t.jsxs)("div",{className:`modal-card ${r?"slide-up":"slide-down"} ${w}`,onClick:e=>e.stopPropagation(),ref:i,tabIndex:"-1",role:"dialog","aria-modal":"true","aria-labelledby":"modal-title",style:{transform:r?"translateY(0)":"translateY(20px)",opacity:r?1:0,transition:"all 0.3s ease-out"},children:[(0,t.jsxs)("div",{className:"modal-header",children:[(0,t.jsx)("h3",{id:"modal-title",children:h}),(0,t.jsx)("button",{type:"button",className:"modal-close",onClick:n,"aria-label":"\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0646\u0627\u0641\u0630\u0629",children:"\u2715"})]}),(0,t.jsx)("div",{className:"modal-body",children:g})]}),(0,t.jsx)("style",{dangerouslySetInnerHTML:{__html:`
          .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-card {
            background: var(--panel-strong, #0f172a);
            color: var(--text, #e2e8f0);
            border: 1px solid var(--line, rgba(148, 163, 184, 0.18));
            border-radius: 16px;
            width: 90%;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            outline: none;
          }

          .modal-card.small {
            max-width: 400px;
          }

          .modal-card.medium {
            max-width: 600px;
          }

          .modal-card.large {
            max-width: 900px;
          }

          .modal-header {
            padding: 20px;
            border-bottom: 1px solid var(--line, rgba(148, 163, 184, 0.18));
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .modal-header h3 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--muted, #94a3b8);
            transition: all 0.2s ease;
            padding: 4px 8px;
            border-radius: 4px;
          }

          .modal-close:hover {
            color: var(--text, #e2e8f0);
            background: rgba(255,255,255,0.08);
          }

          .modal-close:focus {
            outline: 2px solid var(--primary, #8b5cf6);
            outline-offset: 2px;
          }

          .modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
            color: inherit;
          }

          .modal-card input,
          .modal-card textarea,
          .modal-card select {
            width: 100%;
            background: rgba(255,255,255,0.06);
            color: var(--text, #e2e8f0);
            border: 1px solid var(--line, rgba(148, 163, 184, 0.18));
          }

          .modal-card input::placeholder,
          .modal-card textarea::placeholder {
            color: var(--muted, #94a3b8);
            opacity: 1;
          }

          .fade-in {
            animation: fadeIn 0.2s ease-out;
          }

          .fade-out {
            animation: fadeOut 0.2s ease-out;
          }

          .slide-up {
            animation: slideUp 0.3s ease-out;
          }

          .slide-down {
            animation: slideDown 0.3s ease-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes fadeOut {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }

          @keyframes slideUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes slideDown {
            from {
              transform: translateY(0);
              opacity: 1;
            }
            to {
              transform: translateY(20px);
              opacity: 0;
            }
          }
        `}})]}),document.body)}export{Y as a};
