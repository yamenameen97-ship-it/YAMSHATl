import{a as C}from"./rolldown-runtime-Ct_h1fMY.js";import{ot as S}from"./vendor-CpEUa3rx.js";import{n as v,r as k,t as g}from"./vendor-motion-Dlm2umSl.js";import{O as h}from"../index-B366MIZN.js";var c=C(S(),1),e=k(),w=["❤️","🔥","😂","👏","😮","💯"];function _(t=""){return t.split(/(\s+)/).map((s,i)=>s.startsWith("@")?(0,e.jsx)("span",{style:{color:"var(--primary)",fontWeight:700},children:s},i):s)}function I(t=[]){const s=new Map,i=[];return t.forEach(a=>s.set(String(a.id),{...a,replies:[...a.replies||[]]})),s.forEach(a=>{const l=a.parent_id??a.parentId??null;l&&s.has(String(l))?s.get(String(l)).replies.push(a):i.push(a)}),i}function y(t={}){return Object.values(t).reduce((s,i)=>s+Number(i||0),0)}function N({item:t,depth:s=0,onReply:i,onReact:a}){const[l,o]=(0,c.useState)(""),[u,d]=(0,c.useState)(!1),p=y(t.reactions);return(0,e.jsxs)(g.div,{layout:!0,initial:{opacity:0,y:14,scale:.98},animate:{opacity:1,y:0,scale:1},exit:{opacity:0,y:-10},transition:{duration:.22},style:{display:"grid",gap:10,marginInlineStart:s?18:0,paddingInlineStart:s?12:0,borderInlineStart:s?"2px solid rgba(59,130,246,0.12)":"none"},children:[(0,e.jsxs)("div",{className:`comment-card-shell ${t.optimistic?"optimistic":""} ${t.justArrived?"live":""}`,children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:10,marginBottom:8,alignItems:"center",flexWrap:"wrap"},children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},children:[(0,e.jsx)("strong",{children:t.username||t.user||"مستخدم"}),t.optimistic?(0,e.jsx)("span",{className:"comment-state-pill pending",children:"قيد الإرسال"}):null,t.justArrived?(0,e.jsx)("span",{className:"comment-state-pill live",children:"وصل الآن"}):null]}),(0,e.jsx)("span",{className:"muted",style:{fontSize:12},children:t.created_at?new Date(t.created_at).toLocaleString("ar-EG"):"الآن"})]}),(0,e.jsx)("div",{style:{lineHeight:1.8},children:_(t.content||t.text||t.comment||"")}),(0,e.jsxs)("div",{className:"comment-toolbar-row",children:[(0,e.jsx)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:w.map(r=>{const m=Number(t.reactions?.[r]||0);return(0,e.jsxs)("button",{type:"button",className:"comment-emoji-btn",onClick:()=>a(t.id,r),children:[r," ",m||""]},r)})}),(0,e.jsxs)("div",{style:{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"},children:[(0,e.jsxs)("span",{className:"muted",style:{fontSize:12},children:["التفاعلات ",p]}),(0,e.jsx)("button",{type:"button",className:"comment-link-btn",onClick:()=>d(r=>!r),children:"رد"})]})]}),(0,e.jsx)(v,{children:u?(0,e.jsx)(g.div,{initial:{opacity:0,height:0},animate:{opacity:1,height:"auto"},exit:{opacity:0,height:0},style:{overflow:"hidden"},children:(0,e.jsxs)("div",{style:{display:"grid",gap:8,marginTop:12},children:[(0,e.jsx)("textarea",{value:l,onChange:r=>o(r.target.value),rows:2,placeholder:"اكتب رد مع @منشن لو حابب",style:{width:"100%",borderRadius:12,padding:10}}),(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"flex-end",gap:8},children:[(0,e.jsx)(h,{variant:"secondary",onClick:()=>{d(!1),o("")},children:"إلغاء"}),(0,e.jsx)(h,{onClick:()=>{l.trim()&&(i(t.id,l.trim()),o(""),d(!1))},children:"إرسال الرد"})]})]})}):null})]}),t.replies?.length?t.replies.map(r=>(0,e.jsx)(N,{item:r,depth:s+1,onReply:i,onReact:a},r.id)):null]})}function B({comments:t=[],onAddComment:s,onReply:i,onToggleReaction:a}){const[l,o]=(0,c.useState)(""),[u,d]=(0,c.useState)(""),[p,r]=(0,c.useState)("newest"),m=(0,c.useMemo)(()=>{const n=[...t];return n.sort((x,b)=>p==="popular"?y(b.reactions)-y(x.reactions):new Date(b.created_at||0)-new Date(x.created_at||0)),I(n)},[t,p]),f=t.filter(n=>n.optimistic).length,j=t.filter(n=>n.justArrived).length;return(0,e.jsxs)("div",{style:{display:"grid",gap:16},children:[(0,e.jsxs)("div",{className:"comments-head-row",children:[(0,e.jsxs)("div",{children:[(0,e.jsxs)("h4",{style:{margin:0},children:["التعليقات (",t.length,")"]}),(0,e.jsx)("div",{className:"muted",style:{marginTop:6,fontSize:13},children:"واجهة تعليقات لحظية مع Animations و Optimistic Updates"})]}),(0,e.jsxs)("div",{className:"comments-badges-wrap",children:[(0,e.jsxs)("span",{className:"comment-summary-pill live",children:[(0,e.jsx)("span",{className:"live-mini-dot"}),"Realtime"]}),f>0?(0,e.jsxs)("span",{className:"comment-summary-pill pending",children:[f," قيد الإرسال"]}):null,j>0?(0,e.jsxs)("span",{className:"comment-summary-pill accent",children:[j," جديد"]}):null]})]}),(0,e.jsx)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"},children:(0,e.jsxs)("div",{style:{display:"flex",gap:8,alignItems:"center"},children:[(0,e.jsx)("input",{value:u,onChange:n=>d(n.target.value),placeholder:"منشن سريع",style:{borderRadius:999,padding:"8px 12px"}}),(0,e.jsxs)("select",{value:p,onChange:n=>r(n.target.value),style:{borderRadius:999,padding:"8px 12px"},children:[(0,e.jsx)("option",{value:"newest",children:"الأحدث"}),(0,e.jsx)("option",{value:"popular",children:"الأكثر تفاعلاً"})]})]})}),(0,e.jsxs)("div",{className:"comment-composer-shell",children:[(0,e.jsx)("textarea",{placeholder:"اكتب تعليقك... دعم @mentions + realtime updates",value:l,onChange:n=>o(n.target.value),rows:3,style:{width:"100%",borderRadius:16,padding:12}}),(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"},children:[(0,e.jsxs)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[w.map(n=>(0,e.jsx)("button",{type:"button",className:"comment-emoji-btn",onClick:()=>o(x=>`${x}${n}`),children:n},n)),(0,e.jsx)("button",{type:"button",className:"comment-link-btn",onClick:()=>o(n=>`${n}${n&&!n.endsWith(" ")?" ":""}@${u||"username"} `),children:"إضافة منشن"})]}),(0,e.jsx)(h,{onClick:()=>{l.trim()&&(s({content:l.trim()}),o(""))},children:"نشر التعليق"})]})]}),(0,e.jsx)(g.div,{layout:!0,style:{display:"grid",gap:12},children:(0,e.jsx)(v,{mode:"popLayout",children:m.length?m.map(n=>(0,e.jsx)(N,{item:n,onReply:i,onReact:a},n.id)):(0,e.jsx)("div",{className:"muted",children:"لا توجد تعليقات بعد."})})}),(0,e.jsx)("style",{children:`
        .comment-composer-shell,
        .comment-card-shell {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.05);
          border-radius: 18px;
          padding: 14px;
        }
        .comment-card-shell.optimistic {
          border-color: rgba(245,158,11,0.28);
          background: rgba(245,158,11,0.06);
        }
        .comment-card-shell.live {
          box-shadow: 0 0 0 1px rgba(34,197,94,0.26), 0 18px 36px rgba(34,197,94,0.08);
        }
        .comment-emoji-btn,
        .comment-link-btn {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.06);
          border-radius: 999px;
          padding: 6px 10px;
          cursor: pointer;
        }
        .comments-head-row,
        .comment-toolbar-row,
        .comments-badges-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: space-between;
        }
        .comment-state-pill,
        .comment-summary-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 700;
        }
        .comment-state-pill.pending,
        .comment-summary-pill.pending {
          background: rgba(245,158,11,0.12);
          color: #fbbf24;
        }
        .comment-state-pill.live,
        .comment-summary-pill.live {
          background: rgba(34,197,94,0.12);
          color: #86efac;
        }
        .comment-summary-pill.accent {
          background: rgba(139,92,246,0.14);
          color: #c4b5fd;
        }
        .live-mini-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          animation: comment-live-pulse 1.5s infinite;
        }
        @keyframes comment-live-pulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          70% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
      `})]})}export{B as t};
