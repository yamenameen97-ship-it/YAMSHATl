import{b as T}from"./chunk-TFAWJX5N.js";import{d as C}from"./chunk-WJMN45ZI.js";import{d as S}from"./chunk-TQYGJVDH.js";import{G as _,c as k}from"./chunk-XJIZY4FJ.js";import{a as M,b as N}from"./chunk-T3SILTKH.js";import{d as h,k as w}from"./chunk-XSUFE7BX.js";w();var o=h(M(),1);var a=h(N(),1);function U(d){if(!d)return"";let l=new Date(d);return Number.isNaN(l.getTime())?"":l.toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}function D({username:d}){let l=String(d||"?").trim().charAt(0).toUpperCase()||"?";return(0,a.jsx)("div",{className:"yam-inbox-avatar",children:l})}function Q(){let d=k(),l=_(),[p,b]=(0,o.useState)("all"),[g,z]=(0,o.useState)(""),[m,A]=(0,o.useState)(new Set),[c,P]=(0,o.useState)(new Set),[y,L]=(0,o.useState)(new Set),{data:f=[],isLoading:v}=C({queryKey:["chat-threads",l],queryFn:async()=>{let{data:e}=await S();return Array.isArray(e)?e:[]}}),u=(0,o.useMemo)(()=>f.filter(e=>{let n=String(e.username||"").toLowerCase().includes(g.toLowerCase()),i=c.has(e.username),r=m.has(e.username);return p==="archived"?i&&n:p==="pinned"?r&&n:!i&&n}).sort((e,t)=>{let n=m.has(e.username),i=m.has(t.username);return n&&!i?-1:!n&&i?1:new Date(t.last_message_at||t.created_at||0)-new Date(e.last_message_at||e.created_at||0)}),[f,p,g,c,m]),x=(e,t,n,i)=>{i.stopPropagation();let r=new Set(t);r.has(n)?r.delete(n):r.add(n),e(r)};return(0,a.jsx)(T,{children:(0,a.jsxs)("section",{className:"yam-inbox-page",dir:"rtl",children:[(0,a.jsxs)("div",{className:"yam-inbox-shell",children:[(0,a.jsxs)("header",{className:"yam-inbox-header",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("h1",{children:"\u0627\u0644\u062F\u0631\u062F\u0634\u0627\u062A"}),(0,a.jsx)("p",{children:"\u0648\u0627\u062C\u0647\u0629 \u0645\u0631\u062A\u0628\u0629 \u0645\u062B\u0644 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A: \u0627\u0633\u0645\u060C \u0622\u062E\u0631 \u0631\u0633\u0627\u0644\u0629\u060C \u0648\u0627\u0644\u0648\u0642\u062A \u0628\u062F\u0648\u0646 \u0641\u0648\u0636\u0649."})]}),(0,a.jsxs)("div",{className:"yam-inbox-stats",children:[u.length," \u0645\u062D\u0627\u062F\u062B\u0629"]})]}),(0,a.jsxs)("div",{className:"yam-inbox-toolbar",children:[(0,a.jsxs)("div",{className:"yam-inbox-tabs",children:[(0,a.jsx)("button",{type:"button",className:p==="all"?"active":"",onClick:()=>b("all"),children:"\u0627\u0644\u0643\u0644"}),(0,a.jsx)("button",{type:"button",className:p==="pinned"?"active":"",onClick:()=>b("pinned"),children:"\u0627\u0644\u0645\u062B\u0628\u062A\u0629"}),(0,a.jsx)("button",{type:"button",className:p==="archived"?"active":"",onClick:()=>b("archived"),children:"\u0627\u0644\u0645\u0624\u0631\u0634\u0641\u0629"})]}),(0,a.jsx)("input",{type:"search",placeholder:"\u0627\u0628\u062D\u062B \u0628\u0627\u0633\u0645 \u0627\u0644\u0634\u062E\u0635 \u0623\u0648 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629",value:g,onChange:e=>z(e.target.value)})]}),(0,a.jsxs)("div",{className:"yam-inbox-list",children:[v?(0,a.jsx)("div",{className:"yam-inbox-empty",children:"\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A..."}):null,!v&&!u.length?(0,a.jsx)("div",{className:"yam-inbox-empty",children:"\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u062D\u0627\u062F\u062B\u0627\u062A \u0645\u0637\u0627\u0628\u0642\u0629 \u062D\u0627\u0644\u064A\u0627\u064B."}):null,u.map(e=>{let t=e.username||"\u0645\u0633\u062A\u062E\u062F\u0645",n=U(e.last_message_at||e.created_at),i=y.has(t),r=m.has(t);return(0,a.jsxs)("button",{type:"button",className:`yam-thread-card ${e.unread_count>0?"unread":""}`,onClick:()=>d(`/chat/${encodeURIComponent(t)}`),children:[(0,a.jsx)(D,{username:t}),(0,a.jsxs)("div",{className:"yam-thread-body",children:[(0,a.jsxs)("div",{className:"yam-thread-row-top",children:[(0,a.jsx)("strong",{children:t}),(0,a.jsx)("span",{children:n})]}),(0,a.jsxs)("div",{className:"yam-thread-row-bottom",children:[(0,a.jsx)("p",{children:e.last_message||"\u0627\u0628\u062F\u0623 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0627\u0644\u0622\u0646"}),(0,a.jsxs)("div",{className:"yam-thread-meta-tools",children:[i?(0,a.jsx)("span",{className:"yam-mini-flag",children:"\u{1F515}"}):null,r?(0,a.jsx)("span",{className:"yam-mini-flag",children:"\u{1F4CC}"}):null,e.unread_count>0?(0,a.jsx)("span",{className:"yam-unread-pill",children:e.unread_count}):null]})]})]}),(0,a.jsxs)("div",{className:"yam-thread-tools",onClick:s=>s.stopPropagation(),children:[(0,a.jsx)("button",{type:"button",title:"\u062A\u062B\u0628\u064A\u062A",onClick:s=>x(A,m,t,s),children:r?"\u{1F4CD}":"\u{1F4CC}"}),(0,a.jsx)("button",{type:"button",title:"\u0643\u062A\u0645",onClick:s=>x(L,y,t,s),children:i?"\u{1F50A}":"\u{1F507}"}),(0,a.jsx)("button",{type:"button",title:"\u0623\u0631\u0634\u0641\u0629",onClick:s=>x(P,c,t,s),children:c.has(t)?"\u{1F4E4}":"\u{1F5C2}\uFE0F"})]})]},t)})]})]}),(0,a.jsx)("style",{children:`
          .yam-inbox-page {
            padding: 18px;
            min-height: calc(100vh - 92px);
            background: radial-gradient(circle at top, rgba(139,92,246,0.08), transparent 28%), #060d19;
          }

          .yam-inbox-shell {
            max-width: 980px;
            margin: 0 auto;
            border-radius: 30px;
            background: rgba(7, 12, 24, 0.94);
            border: 1px solid rgba(255,255,255,0.05);
            box-shadow: 0 24px 60px rgba(2, 6, 23, 0.34);
            overflow: hidden;
          }

          .yam-inbox-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 22px 22px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }

          .yam-inbox-header h1 {
            margin: 0 0 6px;
            font-size: 28px;
          }

          .yam-inbox-header p {
            margin: 0;
            color: #94a3b8;
            font-size: 14px;
          }

          .yam-inbox-stats {
            min-height: 42px;
            padding: 0 16px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            background: rgba(124,58,237,0.12);
            border: 1px solid rgba(167,139,250,0.18);
            color: #ddd6fe;
            font-weight: 800;
            flex-shrink: 0;
          }

          .yam-inbox-toolbar {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 12px;
            padding: 14px 22px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }

          .yam-inbox-tabs {
            display: inline-flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .yam-inbox-tabs button {
            min-height: 42px;
            padding: 0 14px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15,23,42,0.7);
            color: #cbd5e1;
            font-weight: 800;
          }

          .yam-inbox-tabs button.active {
            background: linear-gradient(135deg, rgba(124,58,237,0.32), rgba(99,102,241,0.18));
            color: #fff;
            border-color: rgba(167,139,250,0.24);
          }

          .yam-inbox-toolbar input {
            min-height: 42px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15,23,42,0.78);
            padding: 0 16px;
            color: white;
          }

          .yam-inbox-list {
            display: grid;
          }

          .yam-thread-card {
            width: 100%;
            border: none;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            background: transparent;
            color: white;
            padding: 16px 20px;
            display: grid;
            grid-template-columns: 56px minmax(0, 1fr) auto;
            gap: 14px;
            text-align: start;
            align-items: center;
            transition: background 0.18s ease;
          }

          .yam-thread-card:hover {
            background: rgba(255,255,255,0.03);
          }

          .yam-thread-card.unread {
            background: rgba(124,58,237,0.07);
          }

          .yam-inbox-avatar {
            width: 56px;
            height: 56px;
            border-radius: 18px;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            color: white;
            font-size: 22px;
            font-weight: 900;
          }

          .yam-thread-body {
            min-width: 0;
            display: grid;
            gap: 8px;
          }

          .yam-thread-row-top,
          .yam-thread-row-bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .yam-thread-row-top strong {
            font-size: 16px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .yam-thread-row-top span {
            color: #94a3b8;
            font-size: 12px;
            flex-shrink: 0;
          }

          .yam-thread-row-bottom p {
            margin: 0;
            color: #cbd5e1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 14px;
          }

          .yam-thread-meta-tools {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
          }

          .yam-unread-pill,
          .yam-mini-flag {
            min-width: 22px;
            height: 22px;
            border-radius: 999px;
            display: inline-grid;
            place-items: center;
            font-size: 11px;
          }

          .yam-unread-pill {
            padding: 0 7px;
            background: #8b5cf6;
            color: white;
            font-weight: 800;
          }

          .yam-mini-flag {
            background: rgba(255,255,255,0.06);
          }

          .yam-thread-tools {
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          .yam-thread-tools button {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15,23,42,0.72);
            color: white;
          }

          .yam-inbox-empty {
            padding: 28px 20px;
            text-align: center;
            color: #94a3b8;
          }

          @media (max-width: 768px) {
            .yam-inbox-page {
              padding: 10px;
              min-height: calc(100vh - 118px);
            }

            .yam-inbox-header,
            .yam-inbox-toolbar {
              padding-inline: 14px;
            }

            .yam-inbox-header {
              flex-wrap: wrap;
            }

            .yam-inbox-toolbar {
              grid-template-columns: 1fr;
            }

            .yam-thread-card {
              grid-template-columns: 52px minmax(0, 1fr);
              padding: 14px;
            }

            .yam-thread-tools {
              grid-column: 2;
              justify-content: flex-start;
              margin-top: 8px;
            }
          }
        `})]})})}export{Q as a};
