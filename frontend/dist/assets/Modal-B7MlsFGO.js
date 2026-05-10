import{a as e}from"./rolldown-runtime-BYbx6iT9.js";import{n as t,r as n}from"./motion-C707sMom.js";import{d as r}from"./react-CRUh3XvS.js";var i=e(n(),1),a=e(r(),1),o=t();function s({open:e,title:t,children:n,onClose:r,size:s=`medium`}){let c=(0,i.useRef)(null),l=(0,i.useRef)(null),u=(0,i.useCallback)(e=>{if(!c.current)return;let t=c.current.querySelectorAll(`button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`);if(t.length===0)return;let n=t[0],r=t[t.length-1];e.key===`Tab`&&(e.shiftKey?document.activeElement===n&&(r.focus(),e.preventDefault()):document.activeElement===r&&(n.focus(),e.preventDefault()))},[]);return(0,i.useEffect)(()=>{if(e){l.current=document.activeElement,document.body.style.overflow=`hidden`,setTimeout(()=>{c.current?.focus()},50);let e=e=>{e.key===`Escape`&&r(),u(e)};return window.addEventListener(`keydown`,e),()=>{window.removeEventListener(`keydown`,e),document.body.style.overflow=`unset`,l.current?.focus()}}},[e,r,u]),e?(0,a.createPortal)((0,o.jsxs)(`div`,{className:`modal-backdrop fade-in`,onClick:r,role:`presentation`,children:[(0,o.jsxs)(`div`,{className:`modal-card slide-up ${s}`,onClick:e=>e.stopPropagation(),ref:c,tabIndex:`-1`,role:`dialog`,"aria-modal":`true`,"aria-labelledby":`modal-title`,children:[(0,o.jsxs)(`div`,{className:`modal-header`,children:[(0,o.jsx)(`h3`,{id:`modal-title`,children:t}),(0,o.jsx)(`button`,{type:`button`,className:`modal-close`,onClick:r,"aria-label":`إغلاق النافذة`,children:`✕`})]}),(0,o.jsx)(`div`,{className:`modal-body`,children:n})]}),(0,o.jsx)(`style`,{dangerouslySetInnerHTML:{__html:`
        .modal-backdrop {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-card {
          background: white; border-radius: 16px; width: 90%; max-height: 90vh;
          display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
          outline: none;
        }
        .modal-card.small { max-width: 400px; }
        .modal-card.medium { max-width: 600px; }
        .modal-card.large { max-width: 900px; }
        .modal-header { padding: 20px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
        .modal-header h3 { margin: 0; font-size: 1.25rem; font-weight: 600; }
        .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #9ca3af; transition: color 0.2s; }
        .modal-close:hover { color: #111827; }
        .modal-body { padding: 20px; overflow-y: auto; }
        .fade-in { animation: fadeIn 0.2s ease-out; }
        .slide-up { animation: slideUp 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}})]}),document.body):null}export{s as t};