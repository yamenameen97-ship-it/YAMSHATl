import{d as Y}from"./chunk-WJMN45ZI.js";import{b as K,c as J}from"./chunk-XGMKN6IA.js";import{A as w,C as D,F as B,G as V,H as G,b as I,i as N,j as S,n as W,q,y as _,z as E}from"./chunk-OKBOFJIL.js";import{a as H,b as x}from"./chunk-T3SILTKH.js";import{d as h,k as c}from"./chunk-XSUFE7BX.js";c();var Q=(e=50)=>J.get("/notifications",{params:{limit:e},cache:!0,cacheTtlMs:2e4});c();var f=h(H(),1);c();var b=h(H(),1);var t=h(x(),1),le=[{to:"/",label:"\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",match:e=>e==="/"},{to:"/live",label:"\u0627\u0644\u0628\u062B",match:e=>e.startsWith("/live")},{to:"/groups",label:"\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A",match:e=>e.startsWith("/groups")},{to:"/reels",label:"\u0627\u0644\u0631\u064A\u0644\u0632",match:e=>e.startsWith("/reels")},{to:"/stories",label:"\u0627\u0644\u0633\u062A\u0648\u0631\u064A",match:e=>e.startsWith("/stories")},{to:"/inbox",label:"\u0627\u0644\u062F\u0631\u062F\u0634\u0629",match:e=>e.startsWith("/inbox")||e.startsWith("/chat")},{to:"/notifications",label:"\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A",match:e=>e.startsWith("/notifications"),badgeType:"notifications"},{to:"/settings",label:"\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",match:e=>e.startsWith("/settings")}],ce=[{to:"/profile",label:"\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A",icon:"\u{1F464}"},{to:"/",label:"\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",icon:"\u{1F3E0}"},{to:"/inbox",label:"\u0627\u0644\u062F\u0631\u062F\u0634\u0629",icon:"\u{1F4AC}"},{to:"/groups",label:"\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A",icon:"\u{1F465}"},{to:"/reels",label:"\u0627\u0644\u0631\u064A\u0644\u0632",icon:"\u{1F3AC}"},{to:"/live",label:"\u0627\u0644\u0628\u062B",icon:"\u{1F4E1}"},{to:"/settings",label:"\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",icon:"\u2699\uFE0F"}];function U(){let e=I(),n=_(E),i=w(o=>o.toggleTheme),r=w(o=>o.theme),m=G(),a=D(),[u,v]=(0,b.useState)(!1),[p,M]=(0,b.useState)(!1),d=(0,b.useRef)(null),{data:l=[]}=Y({queryKey:["topbar-notifications-count"],queryFn:async()=>(await Q(20)).data||[],staleTime:15e3,refetchInterval:2e4}),y=(0,b.useMemo)(()=>Array.isArray(l)?l.filter(o=>!o.is_read).length:0,[l]),T=m||a?.username||"Y",C=String(T).trim().charAt(0).toUpperCase()||"Y";(0,b.useEffect)(()=>()=>{d.current&&window.clearTimeout(d.current)},[]);let ie=()=>{d.current&&window.clearTimeout(d.current),v(!0)},re=()=>{d.current&&window.clearTimeout(d.current),d.current=window.setTimeout(()=>v(!1),120)},O=()=>{d.current&&window.clearTimeout(d.current),v(!1)},se=async()=>{if(!p){M(!0);try{let o=V(),L=W();await fetch(`${q}/api/auth/logout`,{method:"POST",headers:{...o?{Authorization:`Bearer ${o}`}:{},...L?{"X-CSRF-Token":L}:{}},credentials:"include"})}catch{}finally{B(),O(),M(!1),K("/login")}}};return(0,t.jsxs)("header",{className:"yam-topbar-shell",dir:"rtl",children:[(0,t.jsxs)("div",{className:"yam-topbar-track",children:[(0,t.jsxs)(N,{to:"/",className:"yam-brand-pill","aria-label":"YAMSHAT",children:[(0,t.jsx)("span",{className:"yam-brand-mark",children:"\u{1F451}"}),(0,t.jsx)("span",{className:"yam-brand-name",children:"YAMSHAT"})]}),(0,t.jsx)("nav",{className:"yam-topbar-nav","aria-label":"\u0627\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",children:le.map(o=>{let L=o.match(e.pathname),F=o.badgeType==="notifications"?y:o.to==="/inbox"?n:0;return(0,t.jsxs)(S,{to:o.to,className:`yam-topbar-pill ${L?"active":""}`,children:[(0,t.jsx)("span",{children:o.label}),F>0?(0,t.jsx)("strong",{className:"yam-topbar-badge",children:F}):null]},o.to)})}),(0,t.jsx)("button",{type:"button",className:`yam-topbar-pill yam-theme-pill ${r==="dark"?"active":""}`,onClick:i,children:(0,t.jsx)("span",{children:r==="dark"?"\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A":"\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0646\u0647\u0627\u0631\u064A"})}),(0,t.jsxs)("div",{className:"yam-account-menu-wrap",onMouseEnter:ie,onMouseLeave:re,children:[(0,t.jsxs)("button",{type:"button",className:`yam-account-pill ${u?"open":""}`,title:T,"aria-haspopup":"menu","aria-expanded":u,onClick:()=>v(o=>!o),children:[(0,t.jsx)("span",{className:"yam-account-chevron","aria-hidden":"true",children:"\u2630"}),(0,t.jsx)("span",{className:"yam-account-avatar",children:C}),(0,t.jsx)("span",{className:"yam-account-chevron",children:"\u25BE"})]}),(0,t.jsxs)("div",{className:`yam-account-dropdown ${u?"open":""}`,role:"menu",children:[(0,t.jsxs)("div",{className:"yam-account-dropdown-head",children:[(0,t.jsx)("div",{className:"yam-account-dropdown-avatar",children:C}),(0,t.jsxs)("div",{children:[(0,t.jsx)("strong",{children:T}),(0,t.jsx)("p",{children:"\u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0633\u0631\u064A\u0639\u0629"})]})]}),(0,t.jsxs)("div",{className:"yam-account-dropdown-list",children:[ce.map(o=>(0,t.jsxs)(N,{to:o.to,className:"yam-account-link",role:"menuitem",onClick:O,children:[(0,t.jsx)("span",{children:o.icon}),(0,t.jsx)("span",{children:o.label})]},o.to)),(0,t.jsxs)("button",{type:"button",className:"yam-account-link logout",role:"menuitem",onClick:se,disabled:p,children:[(0,t.jsx)("span",{children:"\u{1F6AA}"}),(0,t.jsx)("span",{children:p?"\u062C\u0627\u0631\u064D \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C...":"\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C"})]})]})]})]})]}),(0,t.jsx)("style",{children:`
        .yam-topbar-shell {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 8px 12px 6px;
          background: rgba(4, 8, 18, 0.86);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(18px);
        }

        .yam-topbar-track {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          padding-bottom: 2px;
          scrollbar-width: thin;
          scrollbar-color: rgba(148,163,184,0.28) transparent;
          white-space: nowrap;
        }

        .yam-topbar-track::-webkit-scrollbar { height: 4px; }
        .yam-topbar-track::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,0.28);
          border-radius: 999px;
        }

        .yam-topbar-nav {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .yam-brand-pill,
        .yam-topbar-pill,
        .yam-account-pill {
          min-height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(15,23,42,0.74);
          color: #dbe4ff;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          flex-shrink: 0;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
        }

        .yam-brand-pill {
          background: linear-gradient(135deg, rgba(124,58,237,0.22), rgba(59,130,246,0.12));
          color: #fff;
        }

        .yam-brand-mark,
        .yam-account-avatar,
        .yam-account-dropdown-avatar {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: inline-grid;
          place-items: center;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          color: white;
          font-size: 13px;
          font-weight: 900;
        }

        .yam-topbar-pill {
          position: relative;
          transition: 0.18s ease;
        }

        .yam-topbar-pill:hover,
        .yam-topbar-pill.active,
        .yam-account-pill:hover,
        .yam-account-pill.open {
          color: #fff;
          background: linear-gradient(135deg, rgba(124,58,237,0.24), rgba(99,102,241,0.14));
          border-color: rgba(167,139,250,0.24);
        }

        .yam-theme-pill,
        .yam-account-pill {
          cursor: pointer;
        }

        .yam-topbar-badge {
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          background: #ef4444;
          color: #fff;
          font-size: 11px;
          line-height: 1;
        }

        .yam-account-menu-wrap {
          position: relative;
          margin-inline-start: auto;
          flex-shrink: 0;
        }

        .yam-account-pill {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.82);
          padding: 0 12px;
        }

        .yam-account-chevron {
          font-size: 12px;
          opacity: 0.88;
        }

        .yam-account-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          inset-inline-end: 0;
          width: min(280px, 90vw);
          background: rgba(10,16,31,0.98);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          box-shadow: 0 28px 60px rgba(2,6,23,0.46);
          padding: 12px;
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
          pointer-events: none;
          transition: opacity 160ms ease, transform 180ms ease;
          backdrop-filter: blur(20px);
        }

        .yam-account-dropdown.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .yam-account-dropdown-head {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 8px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 8px;
        }

        .yam-account-dropdown-head strong {
          display: block;
          color: #fff;
          font-size: 15px;
        }

        .yam-account-dropdown-head p {
          margin: 2px 0 0;
          color: #94a3b8;
          font-size: 12px;
        }

        .yam-account-dropdown-list {
          display: grid;
          gap: 4px;
        }

        .yam-account-link {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          border: none;
          background: transparent;
          color: #e2e8f0;
          padding: 11px 12px;
          border-radius: 14px;
          text-decoration: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          text-align: start;
        }

        .yam-account-link:hover {
          background: rgba(124,58,237,0.14);
          color: #fff;
        }

        .yam-account-link.logout {
          color: #fca5a5;
        }

        .yam-account-link.logout:hover {
          background: rgba(239,68,68,0.12);
        }

        @media (max-width: 768px) {
          .yam-topbar-shell {
            padding: 8px 10px 6px;
          }

          .yam-brand-pill,
          .yam-topbar-pill,
          .yam-account-pill {
            min-height: 38px;
            border-radius: 12px;
            padding: 0 12px;
            font-size: 13px;
          }

          .yam-account-dropdown {
            width: min(240px, 88vw);
          }
        }
      `})]})}c();c();var X={ar:{brandSubtitle:"\u0648\u0627\u062C\u0647\u0629 \u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0629 \u0645\u0646\u0638\u0645\u0629 \u0645\u0639 \u0634\u0631\u064A\u0637 \u0639\u0644\u0648\u064A \u0648\u0633\u0641\u0644\u064A \u0645\u062A\u0646\u0627\u0633\u0642 \u0648\u0631\u0628\u0637 \u062D\u064A \u0628\u0627\u0644\u062E\u062F\u0645\u0627\u062A.",routeMeta:{"/":{title:"\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",note:"\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0641\u0642\u0637 \u0645\u0639 \u0645\u0633\u0627\u062D\u0629 \u0623\u0648\u0633\u0639 \u0644\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u062A\u0646\u0642\u0644 \u0623\u0648\u0636\u062D."},"/dashboard":{title:"\u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0648\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",note:"\u0627\u0644\u0644\u063A\u0629\u060C \u0627\u0644\u0633\u0645\u0627\u062A\u060C \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A\u060C \u0648\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u062E\u062F\u0645\u0627\u062A."},"/users":{title:"\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646",note:"\u0627\u0643\u062A\u0634\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0648\u0627\u0628\u062F\u0623 \u062F\u0631\u062F\u0634\u0629 \u0623\u0648 \u0645\u062A\u0627\u0628\u0639\u0629 \u0645\u0628\u0627\u0634\u0631\u0629."},"/profile":{title:"\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A",note:"\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062D\u0633\u0627\u0628\u060C \u0627\u0644\u0644\u063A\u0629\u060C \u0648\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0627\u0644\u0634\u062E\u0635\u064A\u0629."},"/inbox":{title:"\u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A",note:"\u0635\u0646\u062F\u0648\u0642 \u0648\u0627\u0631\u062F \u0645\u0646\u0638\u0645 \u0644\u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A \u0627\u0644\u062E\u0627\u0635\u0629."},"/stories":{title:"\u0627\u0644\u0642\u0635\u0635",note:"\u0633\u062A\u0648\u0631\u064A \u0645\u0646\u0641\u0635\u0644 \u0633\u0631\u064A\u0639 \u0648\u062E\u0641\u064A\u0641."},"/reels":{title:"\u0627\u0644\u0631\u064A\u0644\u0632",note:"\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A \u0642\u0635\u064A\u0631\u0629 \u0641\u064A \u0635\u0641\u062D\u0629 \u0645\u0633\u062A\u0642\u0644\u0629."},"/groups":{title:"\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A",note:"\u0627\u0644\u0645\u062C\u062A\u0645\u0639\u0627\u062A \u0648\u0627\u0644\u0646\u0642\u0627\u0634\u0627\u062A \u0641\u064A \u0634\u0627\u0634\u0629 \u0645\u0633\u062A\u0642\u0644\u0629."},"/live":{title:"\u0627\u0644\u0628\u062B \u0627\u0644\u0645\u0628\u0627\u0634\u0631",note:"\u0627\u0644\u0628\u062B \u0648\u0627\u0644\u062A\u0641\u0627\u0639\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0648\u063A\u0631\u0641 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629."},"/notifications":{title:"\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A",note:"\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0645\u0631\u062A\u0628\u0629 \u062D\u0633\u0628 \u0627\u0644\u0646\u0648\u0639 \u0648\u0627\u0644\u0632\u0645\u0646."}},topbarFallback:{title:"YAMSHAT",note:"\u0645\u0646\u0635\u0629 \u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0629 \u0639\u0631\u0628\u064A\u0629 \u0628\u0648\u0627\u062C\u0647\u0629 \u0623\u0643\u062B\u0631 \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629."},nav:{home:"\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",reels:"\u0627\u0644\u0631\u064A\u0644\u0632",live:"\u0645\u0628\u0627\u0634\u0631",inbox:"\u0627\u0644\u062F\u0631\u062F\u0634\u0629",notifications:"\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A",users:"\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646",groups:"\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A",stories:"\u0627\u0644\u0642\u0635\u0635",profile:"\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A",dashboard:"\u0627\u0644\u0642\u0627\u0626\u0645\u0629",publish:"\u0646\u0634\u0631"},navMeta:{home:"\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A",reels:"\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A \u0642\u0635\u064A\u0631\u0629",live:"\u063A\u0631\u0641 \u0645\u0628\u0627\u0634\u0631\u0629",inbox:"\u0627\u0644\u0631\u0633\u0627\u0626\u0644",notifications:"\u062A\u0646\u0628\u064A\u0647\u0627\u062A",users:"\u0645\u062A\u0627\u0628\u0639\u0629 \u0648\u062A\u0648\u0627\u0635\u0644",groups:"\u0645\u062C\u062A\u0645\u0639\u0627\u062A",stories:"\u0644\u062D\u0638\u0627\u062A \u0633\u0631\u064A\u0639\u0629",profile:"\u062D\u0633\u0627\u0628\u0643",dashboard:"\u0625\u0639\u062F\u0627\u062F\u0627\u062A"},dashboard:{title:"\u0625\u0639\u062F\u0627\u062F\u0627\u062A + \u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A + \u0631\u0648\u0627\u0628\u0637 \u0633\u0631\u064A\u0639\u0629",description:"\u0645\u0631\u0643\u0632 \u0645\u0648\u062D\u062F \u0644\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0639\u0629 \u0648\u062A\u062E\u0635\u064A\u0635 \u0627\u0644\u0644\u063A\u0629 \u0648\u0627\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A.",languageLabel:"\u0644\u063A\u0629 \u0627\u0644\u0648\u0627\u062C\u0647\u0629",languageHint:"\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 \u0625\u0644\u0649 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0648\u064A\u0628 \u0648\u062D\u0641\u0638\u0647\u0627 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.",translationLabel:"\u062A\u0631\u062C\u0645\u0629 \u0627\u0644\u0631\u0633\u0627\u0626\u0644",translationHint:"\u062A\u0641\u0639\u064A\u0644 \u062A\u0631\u062C\u0645\u0629 \u0633\u0631\u064A\u0639\u0629 \u062F\u0627\u062E\u0644 \u0627\u0644\u062F\u0631\u062F\u0634\u0629 \u0644\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0646\u0635\u064A\u0629.",save:"\u062D\u0641\u0638 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",saving:"\u062C\u0627\u0631\u064D \u0627\u0644\u062D\u0641\u0638...",languageSaved:"\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0644\u063A\u0629 \u0648\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0628\u0646\u062C\u0627\u062D."},chat:{audioCall:"\u0645\u0643\u0627\u0644\u0645\u0629 \u0635\u0648\u062A\u064A\u0629",videoCall:"\u0645\u0643\u0627\u0644\u0645\u0629 \u0645\u0631\u0626\u064A\u0629",block:"\u062D\u0638\u0631",unblock:"\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062D\u0638\u0631",translate:"\u062A\u0631\u062C\u0645\u0629",translatedToEnglish:"\u0645\u062A\u0631\u062C\u0645\u0629 \u0625\u0644\u0649 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629",translatedToArabic:"\u0645\u062A\u0631\u062C\u0645\u0629 \u0625\u0644\u0649 \u0627\u0644\u0639\u0631\u0628\u064A\u0629",incomingAudio:"\u0645\u0643\u0627\u0644\u0645\u0629 \u0635\u0648\u062A\u064A\u0629 \u0648\u0627\u0631\u062F\u0629",incomingVideo:"\u0645\u0643\u0627\u0644\u0645\u0629 \u0645\u0631\u0626\u064A\u0629 \u0648\u0627\u0631\u062F\u0629",accept:"\u0631\u062F",decline:"\u0631\u0641\u0636",hangup:"\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629",preparingCall:"\u062C\u0627\u0631\u064D \u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629...",blockedByMe:"\u062A\u0645 \u062D\u0638\u0631 \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645. \u064A\u0645\u0643\u0646\u0643 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062D\u0638\u0631 \u0644\u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u0627\u0644\u062F\u0631\u062F\u0634\u0629 \u0648\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A.",blockedMe:"\u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0642\u0627\u0645 \u0628\u062D\u0638\u0631\u0643. \u062A\u0645 \u062A\u0639\u0637\u064A\u0644 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0648\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A.",translatorOff:"\u0641\u0639\u0651\u0644 \u062A\u0631\u062C\u0645\u0629 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0645\u0646 \u0635\u0641\u062D\u0629 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0623\u0648\u0644\u0627\u064B.",callFallback:"\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u062C\u0644\u0633\u0629 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629 \u0644\u0643\u0646 \u062E\u062F\u0645\u0629 \u0627\u0644\u0635\u0648\u062A/\u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u063A\u064A\u0631 \u0645\u0641\u0639\u0644\u0629 \u062D\u0627\u0644\u064A\u0627\u064B \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645."}},en:{brandSubtitle:"Organized social interface with polished top and bottom navigation.",routeMeta:{"/":{title:"Home",note:"Posts only with wider content space and cleaner navigation."},"/dashboard":{title:"Menu & Settings",note:"Language, theme, readiness checks, and service links."},"/users":{title:"Users",note:"Discover people and start chats or follows quickly."},"/profile":{title:"Profile",note:"Account settings, language, and personal posts."},"/inbox":{title:"Inbox",note:"A cleaner private messaging hub."},"/stories":{title:"Stories",note:"A standalone fast stories page."},"/reels":{title:"Reels",note:"Short-form videos in a dedicated page."},"/groups":{title:"Groups",note:"Communities and discussions in their own screen."},"/live":{title:"Live",note:"Live rooms, audience activity, and streaming tools."},"/notifications":{title:"Notifications",note:"Alerts organized by type and time."}},topbarFallback:{title:"YAMSHAT",note:"A more professional social experience."},nav:{home:"Home",reels:"Reels",live:"Live",inbox:"Chat",notifications:"Alerts",users:"Users",groups:"Groups",stories:"Stories",profile:"Profile",dashboard:"Menu",publish:"Post"},navMeta:{home:"Posts",reels:"Short videos",live:"Live rooms",inbox:"Messages",notifications:"Updates",users:"People",groups:"Communities",stories:"Moments",profile:"Your account",dashboard:"Settings"},dashboard:{title:"Settings + checks + quick links",description:"A unified settings center with language control and cleaner navigation.",languageLabel:"Interface language",languageHint:"English is now available in web settings and saved to the database.",translationLabel:"Message translation",translationHint:"Enable quick in-chat translation for text messages.",save:"Save settings",saving:"Saving...",languageSaved:"Language and preferences saved successfully."},chat:{audioCall:"Audio call",videoCall:"Video call",block:"Block",unblock:"Unblock",translate:"Translate",translatedToEnglish:"Translated to English",translatedToArabic:"Translated to Arabic",incomingAudio:"Incoming audio call",incomingVideo:"Incoming video call",accept:"Answer",decline:"Decline",hangup:"End call",preparingCall:"Preparing call...",blockedByMe:"You blocked this user. Unblock to continue chat and calls.",blockedMe:"This user blocked you. Messaging and calls are disabled.",translatorOff:"Enable message translation first from settings.",callFallback:"The call session was created but realtime media is not enabled on the server."}}};function Z(e="ar"){return X[e]||X.ar}c();var j="yamshat-scroll-cache-v1",$=new Set,pe={"/":()=>import("./Feed-B2JD4LXV.js"),"/dashboard":()=>import("./Dashboard-ULCBGBDL.js"),"/stories":()=>import("./Stories-Y4QY2HMB.js"),"/reels":()=>import("./Reels-5JZWWB33.js"),"/groups":()=>import("./Groups-QCWUJS23.js"),"/live":()=>import("./Live-D2RO77QK.js"),"/inbox":()=>import("./Inbox-4VCGYBQE.js"),"/users":()=>import("./Users-KKANTTVH.js"),"/profile":()=>import("./Profile-OEUUUM6L.js"),"/notifications":()=>import("./Notifications-QI773KBF.js"),"/search":()=>import("./Search-DFHXV3QH.js"),"/settings":()=>import("./Settings-DA2ZXZPZ.js"),"/chat":()=>import("./Chat-JCNSVHZ3.js")};function P(e="/"){return e?e.startsWith("/profile/")?"/profile":e.startsWith("/chat/")?"/chat":e:"/"}function ee(){if(typeof window>"u")return{};try{let e=window.sessionStorage.getItem(j),n=e?JSON.parse(e):{};return n&&typeof n=="object"?n:{}}catch{return{}}}function de(e){if(!(typeof window>"u"))try{window.sessionStorage.setItem(j,JSON.stringify(e))}catch{}}function te(e,n=0){if(typeof window>"u")return;let i=P(e),r=ee();r[i]=Math.max(0,Number(n||0)),de(r)}function ae(e){let n=P(e),i=ee();return Math.max(0,Number(i[n]||0))}async function A(e){let n=P(e);if($.has(n))return;let i=pe[n];if(i){$.add(n);try{await i()}catch{$.delete(n)}}}function oe(e="/"){let n=P(e);({"/":["/reels","/stories","/inbox"],"/reels":["/","/stories","/live"],"/stories":["/","/reels","/profile"],"/inbox":["/chat","/notifications","/"],"/chat":["/inbox","/profile"],"/profile":["/","/stories"]}[n]||["/reels","/stories"]).forEach(r=>typeof window<"u"&&"requestIdleCallback"in window?window.requestIdleCallback(()=>A(r),{timeout:1200}):window.setTimeout(()=>A(r),180))}function R(e){return{onMouseEnter:()=>A(e),onFocus:()=>A(e),onTouchStart:()=>A(e)}}var s=h(x(),1);function z(){let e=w(a=>a.language),n=w(a=>a.isOnline),i=Z(e),r=_(E),m=[{to:"/",label:i.nav.home,icon:"\u2302",badge:0},{to:"/reels",label:i.nav.reels,icon:"\u25A3",badge:0},{to:"/live",label:i.nav.live,icon:"\u25C9",badge:n?"live":0},{to:"/inbox",label:i.nav.inbox,icon:"\u2709",badge:r}];return(0,s.jsxs)("nav",{className:"mobile-dock mobile-dock-professional","aria-label":e==="en"?"Quick navigation":"\u0627\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u0633\u0631\u064A\u0639",children:[(0,s.jsxs)("div",{className:"mobile-dock-inner mobile-dock-grid-5 mobile-dock-balanced-grid",children:[m.slice(0,2).map(a=>(0,s.jsxs)(S,{to:a.to,className:({isActive:u})=>`mobile-dock-link ${u?"active":""}`,...R(a.to),children:[(0,s.jsx)("span",{className:"mobile-dock-icon",children:a.icon}),(0,s.jsx)("span",{children:a.label}),typeof a.badge=="number"&&a.badge>0?(0,s.jsx)("strong",{className:"topbar-badge",children:a.badge}):null]},a.to)),(0,s.jsxs)(N,{to:{pathname:"/reels",search:"?upload=1"},className:"mobile-dock-link mobile-dock-center","aria-label":"\u0631\u0641\u0639 \u0631\u064A\u0644",...R("/reels"),children:[(0,s.jsx)("span",{className:"mobile-dock-icon",children:"\u2B06"}),(0,s.jsx)("span",{children:"\u0631\u0641\u0639 \u0631\u064A\u0644"})]}),m.slice(2).map(a=>(0,s.jsxs)(S,{to:a.to,className:({isActive:u})=>`mobile-dock-link ${u?"active":""}`,...R(a.to),children:[(0,s.jsx)("span",{className:"mobile-dock-icon",children:a.icon}),(0,s.jsx)("span",{children:a.label}),a.badge==="live"?(0,s.jsx)("span",{className:"mobile-live-dot","aria-hidden":"true"}):null,typeof a.badge=="number"&&a.badge>0?(0,s.jsx)("strong",{className:"topbar-badge",children:a.badge}):null]},a.to))]}),(0,s.jsx)("style",{children:`
        .mobile-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 5px rgba(34,197,94,0.18);
          animation: mobile-live-pulse 1.6s infinite;
        }
        @keyframes mobile-live-pulse {
          0% { transform: scale(0.9); opacity: 0.75; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.75; }
        }
      `})]})}c();function ne(){try{return localStorage.getItem("yamshatNativeShell")==="1"}catch{return!1}}var g=h(x(),1);function me({children:e,hideNav:n=!1}){let i=ne(),r=I(),m=(0,f.useRef)(null),a=(0,f.useRef)(0),[u,v]=(0,f.useState)(!1),p=/^\/chat\/[^/]+/.test(r.pathname),M=!n&&!i&&!p,d=!n&&!i&&!p;return(0,f.useEffect)(()=>{let l=m.current;if(!l||p)return;let y=()=>{let C=ae(r.pathname);l.scrollTo({top:C,behavior:"auto"}),v(!0),window.clearTimeout(l.__yamshatTransitionTimer__),l.__yamshatTransitionTimer__=window.setTimeout(()=>v(!1),260)},T=window.requestAnimationFrame(y);return oe(r.pathname),()=>{window.cancelAnimationFrame(T),window.clearTimeout(l.__yamshatTransitionTimer__)}},[p,r.pathname]),(0,f.useEffect)(()=>{let l=m.current;if(!l||p)return;let y=()=>{a.current&&window.cancelAnimationFrame(a.current),a.current=window.requestAnimationFrame(()=>{te(r.pathname,l.scrollTop)})};return l.addEventListener("scroll",y,{passive:!0}),()=>{l.removeEventListener("scroll",y),a.current&&window.cancelAnimationFrame(a.current)}},[p,r.pathname]),(0,g.jsxs)("div",{className:`app-shell yamshat-shell ${i?"native-shell":""} ${p?"conversation-shell":""}`,children:[(0,g.jsxs)("div",{className:`main-shell ${i?"native-shell":""}`,children:[M?(0,g.jsx)(U,{}):null,(0,g.jsx)("main",{className:`page-content ${i?"native-shell":""} ${u?"is-transitioning":""} ${p?"conversation-mode":""}`,ref:m,children:(0,g.jsx)("div",{className:`page-shell-glow ${p?"conversation-mode":""}`,children:e},r.pathname)})]}),d?(0,g.jsx)(z,{}):null,(0,g.jsx)("style",{dangerouslySetInnerHTML:{__html:`
          .app-shell {
            display: flex;
            min-height: 100vh;
            height: 100vh;
            background:
              radial-gradient(circle at top, rgba(59,130,246,0.08), transparent 34%),
              linear-gradient(180deg, #07111f 0%, #0f172a 34%, #08101d 100%);
            overflow: hidden;
          }

          .app-shell.native-shell,
          .app-shell.conversation-shell {
            flex-direction: column;
          }

          .main-shell {
            display: flex;
            flex-direction: column;
            flex: 1;
            overflow: hidden;
            min-width: 0;
          }

          .main-shell.native-shell {
            width: 100%;
          }

          .page-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            scroll-behavior: smooth;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            transition: opacity 220ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease;
            will-change: transform, opacity;
          }

          .page-content.conversation-mode {
            overflow: hidden;
            padding-bottom: 0;
          }

          .page-content.is-transitioning {
            opacity: 0.96;
            transform: translate3d(0, 8px, 0);
            filter: saturate(0.95);
          }

          .page-content.native-shell {
            padding-bottom: 68px;
          }

          .page-shell-glow {
            min-height: 100%;
            animation: pageFadeIn 260ms cubic-bezier(0.22, 1, 0.36, 1);
            content-visibility: auto;
            contain-intrinsic-size: 900px;
          }

          .page-shell-glow.conversation-mode {
            min-height: 100vh;
          }

          .page-content::-webkit-scrollbar {
            width: 8px;
          }

          .page-content::-webkit-scrollbar-track {
            background: transparent;
          }

          .page-content::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.35);
            border-radius: 999px;
          }

          .page-content::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.55);
          }

          @keyframes pageFadeIn {
            from {
              opacity: 0;
              transform: translate3d(0, 12px, 0) scale(0.995);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          @media (max-width: 768px) {
            .app-shell {
              flex-direction: column;
            }

            .page-content:not(.conversation-mode) {
              padding-bottom: 78px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .page-content,
            .page-shell-glow {
              animation: none;
              transition: none;
              scroll-behavior: auto;
            }
          }
        `}})]})}export{Q as a,me as b};
