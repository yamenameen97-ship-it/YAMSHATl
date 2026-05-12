import{a as f}from"./rolldown-runtime-Ct_h1fMY.js";import{ct as b,n as j,t as v}from"./vendor-DTKoa8dz.js";import{n as w}from"./vendor-motion-4LZqcBTs.js";import{D as N}from"../index-CXlWWv0v.js";var p=f(b(),1),e=w(),y=["❤️","🔥","😂","👏","😮","💯"];function S(n=""){return n.split(/(\s+)/).map((r,a)=>r.startsWith("@")?(0,e.jsx)("span",{style:{color:"var(--primary)",fontWeight:700},children:r},a):r)}function x(n={}){return Object.values(n).reduce((r,a)=>r+Number(a||0),0)}var C=({index:n,style:r,data:a})=>{const{items:c,onReply:m,onReact:o}=a,t=c[n];if(!t)return null;const u=x(t.reactions);return(0,e.jsx)("div",{style:{...r,padding:"10px"},children:(0,e.jsxs)("div",{className:`comment-card-shell ${t.optimistic?"optimistic":""} ${t.justArrived?"live":""}`,children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:10,marginBottom:8,alignItems:"center",flexWrap:"wrap"},children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},children:[(0,e.jsx)("strong",{children:t.username||t.user||"مستخدم"}),t.optimistic?(0,e.jsx)("span",{className:"comment-state-pill pending",children:"قيد الإرسال"}):null,t.justArrived?(0,e.jsx)("span",{className:"comment-state-pill live",children:"وصل الآن"}):null]}),(0,e.jsx)("span",{className:"muted",style:{fontSize:12},children:t.created_at?new Date(t.created_at).toLocaleString("ar-EG"):"الآن"})]}),(0,e.jsx)("div",{style:{lineHeight:1.8,fontSize:14},children:S(t.content||t.text||t.comment||"")}),(0,e.jsxs)("div",{className:"comment-toolbar-row",style:{marginTop:8},children:[(0,e.jsx)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:y.map(i=>{const d=Number(t.reactions?.[i]||0);return(0,e.jsxs)("button",{type:"button",className:"comment-emoji-btn",onClick:()=>o(t.id,i),children:[i," ",d||""]},i)})}),(0,e.jsxs)("div",{style:{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"},children:[(0,e.jsxs)("span",{className:"muted",style:{fontSize:11},children:["التفاعلات ",u]}),(0,e.jsx)("button",{type:"button",className:"comment-link-btn",style:{fontSize:11},children:"رد"})]})]})]})})};function R({comments:n=[],onAddComment:r,onReply:a,onToggleReaction:c}){const[m,o]=(0,p.useState)(""),[t,u]=(0,p.useState)("newest"),i=(0,p.useMemo)(()=>{const s=[...n];return s.sort((l,g)=>t==="popular"?x(g.reactions)-x(l.reactions):new Date(g.created_at||0)-new Date(l.created_at||0)),s},[n,t]),d=(0,p.useMemo)(()=>({items:i,onReply:a,onReact:c}),[i,a,c]),h=n.filter(s=>s.optimistic).length;return n.filter(s=>s.justArrived).length,(0,e.jsxs)("div",{style:{display:"flex",flexDirection:"column",height:"100%",gap:16},children:[(0,e.jsxs)("div",{className:"comments-head-row",children:[(0,e.jsx)("div",{children:(0,e.jsxs)("h4",{style:{margin:0},children:["التعليقات (",n.length,")"]})}),(0,e.jsxs)("div",{className:"comments-badges-wrap",children:[(0,e.jsxs)("span",{className:"comment-summary-pill live",children:[(0,e.jsx)("span",{className:"live-mini-dot"}),"Realtime"]}),h>0?(0,e.jsx)("span",{className:"comment-summary-pill pending",children:h}):null]})]}),(0,e.jsx)("div",{style:{flex:1,minHeight:300},children:i.length===0?(0,e.jsx)("div",{className:"muted text-center py-10",children:"لا توجد تعليقات بعد."}):(0,e.jsx)(v,{children:({height:s,width:l})=>(0,e.jsx)(j,{height:s,width:l,itemCount:i.length,itemSize:140,itemData:d,className:"no-scrollbar",children:C})})}),(0,e.jsxs)("div",{className:"comment-composer-shell",style:{marginTop:"auto"},children:[(0,e.jsx)("textarea",{placeholder:"اكتب تعليقك...",value:m,onChange:s=>o(s.target.value),rows:2,style:{width:"100%",borderRadius:16,padding:12,fontSize:14}}),(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginTop:8},children:[(0,e.jsx)("div",{style:{display:"flex",gap:4},children:y.slice(0,4).map(s=>(0,e.jsx)("button",{type:"button",className:"comment-emoji-btn",onClick:()=>o(l=>`${l}${s}`),children:s},s))}),(0,e.jsx)(N,{size:"sm",onClick:()=>{m.trim()&&(r({content:m.trim()}),o(""))},children:"نشر"})]})]}),(0,e.jsx)("style",{children:`
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
      `})]})}export{R as t};
