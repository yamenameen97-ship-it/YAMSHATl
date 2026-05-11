import{a as f}from"./rolldown-runtime-Ct_h1fMY.js";import{ot as b}from"./vendor-CpEUa3rx.js";import{a as h}from"./vendor-react-BRKh28Ew.js";import{n as g}from"./vendor-motion-DK89H9OG.js";var r=f(b(),1),w=f(h(),1),o=g();function j({open:n,title:p,children:x,onClose:i,size:y="medium"}){const s=(0,r.useRef)(null),l=(0,r.useRef)(null),[t,d]=(0,r.useState)(!1),c=(0,r.useCallback)(e=>{if(!s.current)return;const a=s.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');if(a.length===0)return;const m=a[0],u=a[a.length-1];e.key==="Tab"&&(e.shiftKey?document.activeElement===m&&(u.focus(),e.preventDefault()):document.activeElement===u&&(m.focus(),e.preventDefault()))},[]);return(0,r.useEffect)(()=>{if(n){d(!0),l.current=document.activeElement,document.body.style.overflow="hidden",setTimeout(()=>{s.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus()},100);const e=a=>{a.key==="Escape"&&i(),c(a)};return window.addEventListener("keydown",e),()=>{window.removeEventListener("keydown",e),document.body.style.overflow="unset",l.current?.focus()}}else d(!1)},[n,i,c]),!n&&!t?null:(0,w.createPortal)((0,o.jsxs)("div",{className:`modal-backdrop ${t?"fade-in":"fade-out"}`,onClick:i,role:"presentation","aria-hidden":!n,style:{opacity:t?1:0,pointerEvents:t?"auto":"none",transition:"opacity 0.2s ease-out"},children:[(0,o.jsxs)("div",{className:`modal-card ${t?"slide-up":"slide-down"} ${y}`,onClick:e=>e.stopPropagation(),ref:s,tabIndex:"-1",role:"dialog","aria-modal":"true","aria-labelledby":"modal-title",style:{transform:t?"translateY(0)":"translateY(20px)",opacity:t?1:0,transition:"all 0.3s ease-out"},children:[(0,o.jsxs)("div",{className:"modal-header",children:[(0,o.jsx)("h3",{id:"modal-title",children:p}),(0,o.jsx)("button",{type:"button",className:"modal-close",onClick:i,"aria-label":"إغلاق النافذة",children:"✕"})]}),(0,o.jsx)("div",{className:"modal-body",children:x})]}),(0,o.jsx)("style",{dangerouslySetInnerHTML:{__html:`
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
            background: white;
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
            border-bottom: 1px solid #f3f4f6;
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
            color: #9ca3af;
            transition: all 0.2s ease;
            padding: 4px 8px;
            border-radius: 4px;
          }

          .modal-close:hover {
            color: #111827;
            background: #f3f4f6;
          }

          .modal-close:focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }

          .modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
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
        `}})]}),document.body)}export{j as t};
