import{r as p,j as e,B as f}from"../index-DXEtNDUn.js";import{A as b,F as j}from"./react-virtualized-auto-sizer.esm-CvnpkmHD.js";const y=["❤️","🔥","😂","👏","😮","💯"];function v(n=""){return n.split(/(\s+)/).map((i,l)=>i.startsWith("@")?e.jsx("span",{style:{color:"var(--primary)",fontWeight:700},children:i},l):i)}function x(n={}){return Object.values(n).reduce((i,l)=>i+Number(l||0),0)}const w=({index:n,style:i,data:l})=>{const{items:c,onReply:m,onReact:o}=l,t=c[n];if(!t)return null;const u=x(t.reactions);return e.jsx("div",{style:{...i,padding:"10px"},children:e.jsxs("div",{className:`comment-card-shell ${t.optimistic?"optimistic":""} ${t.justArrived?"live":""}`,children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",gap:10,marginBottom:8,alignItems:"center",flexWrap:"wrap"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},children:[e.jsx("strong",{children:t.username||t.user||"مستخدم"}),t.optimistic?e.jsx("span",{className:"comment-state-pill pending",children:"قيد الإرسال"}):null,t.justArrived?e.jsx("span",{className:"comment-state-pill live",children:"وصل الآن"}):null]}),e.jsx("span",{className:"muted",style:{fontSize:12},children:t.created_at?new Date(t.created_at).toLocaleString("ar-EG"):"الآن"})]}),e.jsx("div",{style:{lineHeight:1.8,fontSize:14},children:v(t.content||t.text||t.comment||"")}),e.jsxs("div",{className:"comment-toolbar-row",style:{marginTop:8},children:[e.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:y.map(r=>{const d=Number(t.reactions?.[r]||0);return e.jsxs("button",{type:"button",className:"comment-emoji-btn",onClick:()=>o(t.id,r),children:[r," ",d||""]},r)})}),e.jsxs("div",{style:{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"},children:[e.jsxs("span",{className:"muted",style:{fontSize:11},children:["التفاعلات ",u]}),e.jsx("button",{type:"button",className:"comment-link-btn",style:{fontSize:11},children:"رد"})]})]})]})})};function S({comments:n=[],onAddComment:i,onReply:l,onToggleReaction:c}){const[m,o]=p.useState(""),[t,u]=p.useState("newest"),r=p.useMemo(()=>{const s=[...n];return s.sort((a,g)=>t==="popular"?x(g.reactions)-x(a.reactions):new Date(g.created_at||0)-new Date(a.created_at||0)),s},[n,t]),d=p.useMemo(()=>({items:r,onReply:l,onReact:c}),[r,l,c]),h=n.filter(s=>s.optimistic).length;return n.filter(s=>s.justArrived).length,e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%",gap:16},children:[e.jsxs("div",{className:"comments-head-row",children:[e.jsx("div",{children:e.jsxs("h4",{style:{margin:0},children:["التعليقات (",n.length,")"]})}),e.jsxs("div",{className:"comments-badges-wrap",children:[e.jsxs("span",{className:"comment-summary-pill live",children:[e.jsx("span",{className:"live-mini-dot"}),"Realtime"]}),h>0?e.jsx("span",{className:"comment-summary-pill pending",children:h}):null]})]}),e.jsx("div",{style:{flex:1,minHeight:300},children:r.length===0?e.jsx("div",{className:"muted text-center py-10",children:"لا توجد تعليقات بعد."}):e.jsx(b,{children:({height:s,width:a})=>e.jsx(j,{height:s,width:a,itemCount:r.length,itemSize:140,itemData:d,className:"no-scrollbar",children:w})})}),e.jsxs("div",{className:"comment-composer-shell",style:{marginTop:"auto"},children:[e.jsx("textarea",{placeholder:"اكتب تعليقك...",value:m,onChange:s=>o(s.target.value),rows:2,style:{width:"100%",borderRadius:16,padding:12,fontSize:14}}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginTop:8},children:[e.jsx("div",{style:{display:"flex",gap:4},children:y.slice(0,4).map(s=>e.jsx("button",{type:"button",className:"comment-emoji-btn",onClick:()=>o(a=>`${a}${s}`),children:s},s))}),e.jsx(f,{size:"sm",onClick:()=>{m.trim()&&(i({content:m.trim()}),o(""))},children:"نشر"})]})]}),e.jsx("style",{children:`
        .comment-composer-shell,
        .comment-card-shell {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.05);
          border-radius: 18px;
          padding: 14px;
        }
        .comment-emoji-btn,
        .comment-link-btn {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.06);
          border-radius: 999px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
        }
        .comments-head-row,
        .comment-toolbar-row,
        .comments-badges-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .comment-state-pill,
        .comment-summary-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 700;
        }
        .comment-summary-pill.live {
          background: rgba(34,197,94,0.12);
          color: #86efac;
        }
        .live-mini-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          animation: comment-live-pulse 1.5s infinite;
        }
        @keyframes comment-live-pulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          70% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `})]})}export{S as N};
