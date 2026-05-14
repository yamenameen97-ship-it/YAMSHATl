import{r as n,p as y,j as o}from"../index-DXEtNDUn.js";function h({open:s,title:m,children:p,onClose:r,size:x="medium"}){const i=n.useRef(null),l=n.useRef(null),[a,d]=n.useState(!1),c=n.useCallback(e=>{if(!i.current)return;const t=i.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');if(t.length===0)return;const u=t[0],f=t[t.length-1];e.key==="Tab"&&(e.shiftKey?document.activeElement===u&&(f.focus(),e.preventDefault()):document.activeElement===f&&(u.focus(),e.preventDefault()))},[]);return n.useEffect(()=>{if(s){d(!0),l.current=document.activeElement,document.body.style.overflow="hidden",setTimeout(()=>{i.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus()},100);const e=t=>{t.key==="Escape"&&r(),c(t)};return window.addEventListener("keydown",e),()=>{window.removeEventListener("keydown",e),document.body.style.overflow="unset",l.current?.focus()}}else d(!1)},[s,r,c]),!s&&!a?null:y.createPortal(o.jsxs("div",{className:`modal-backdrop ${a?"fade-in":"fade-out"}`,onClick:r,role:"presentation","aria-hidden":!s,style:{opacity:a?1:0,pointerEvents:a?"auto":"none",transition:"opacity 0.2s ease-out"},children:[o.jsxs("div",{className:`modal-card ${a?"slide-up":"slide-down"} ${x}`,onClick:e=>e.stopPropagation(),ref:i,tabIndex:"-1",role:"dialog","aria-modal":"true","aria-labelledby":"modal-title",style:{transform:a?"translateY(0)":"translateY(20px)",opacity:a?1:0,transition:"all 0.3s ease-out"},children:[o.jsxs("div",{className:"modal-header",children:[o.jsx("h3",{id:"modal-title",children:m}),o.jsx("button",{type:"button",className:"modal-close",onClick:r,"aria-label":"إغلاق النافذة",children:"✕"})]}),o.jsx("div",{className:"modal-body",children:p})]}),o.jsx("style",{dangerouslySetInnerHTML:{__html:`
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
        `}})]}),document.body)}export{h as M};
