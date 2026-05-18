import{a as w,b as N}from"./chunk-LM3Z3WNN.js";import{a as h}from"./chunk-4VVMVC2S.js";import{a as C,b as x}from"./chunk-T3SILTKH.js";import{d as u,k as b}from"./chunk-XSUFE7BX.js";b();var l=u(C(),1);var e=u(x(),1),k=["\u2764\uFE0F","\u{1F525}","\u{1F602}","\u{1F44F}","\u{1F62E}","\u{1F4AF}"];function S(i=""){return i.split(/(\s+)/).map((s,o)=>s.startsWith("@")?(0,e.jsx)("span",{style:{color:"var(--primary)",fontWeight:700},children:s},o):s)}function g(i={}){return Object.values(i).reduce((s,o)=>s+Number(o||0),0)}var z=({index:i,style:s,data:o})=>{let{items:c,onReply:p,onReact:m}=o,t=c[i];if(!t)return null;let v=g(t.reactions);return(0,e.jsx)("div",{style:{...s,padding:"10px"},children:(0,e.jsxs)("div",{className:`comment-card-shell ${t.optimistic?"optimistic":""} ${t.justArrived?"live":""}`,children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:10,marginBottom:8,alignItems:"center",flexWrap:"wrap"},children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},children:[(0,e.jsx)("strong",{children:t.username||t.user||"\u0645\u0633\u062A\u062E\u062F\u0645"}),t.optimistic?(0,e.jsx)("span",{className:"comment-state-pill pending",children:"\u0642\u064A\u062F \u0627\u0644\u0625\u0631\u0633\u0627\u0644"}):null,t.justArrived?(0,e.jsx)("span",{className:"comment-state-pill live",children:"\u0648\u0635\u0644 \u0627\u0644\u0622\u0646"}):null]}),(0,e.jsx)("span",{className:"muted",style:{fontSize:12},children:t.created_at?new Date(t.created_at).toLocaleString("ar-EG"):"\u0627\u0644\u0622\u0646"})]}),(0,e.jsx)("div",{style:{lineHeight:1.8,fontSize:14},children:S(t.content||t.text||t.comment||"")}),(0,e.jsxs)("div",{className:"comment-toolbar-row",style:{marginTop:8},children:[(0,e.jsx)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:k.map(a=>{let d=Number(t.reactions?.[a]||0);return(0,e.jsxs)("button",{type:"button",className:"comment-emoji-btn",onClick:()=>m(t.id,a),children:[a," ",d||""]},a)})}),(0,e.jsxs)("div",{style:{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"},children:[(0,e.jsxs)("span",{className:"muted",style:{fontSize:11},children:["\u0627\u0644\u062A\u0641\u0627\u0639\u0644\u0627\u062A ",v]}),(0,e.jsx)("button",{type:"button",className:"comment-link-btn",style:{fontSize:11},children:"\u0631\u062F"})]})]})]})})};function A({comments:i=[],onAddComment:s,onReply:o,onToggleReaction:c}){let[p,m]=(0,l.useState)(""),[t,v]=(0,l.useState)("newest"),a=(0,l.useMemo)(()=>{let n=[...i];return n.sort((r,f)=>t==="popular"?g(f.reactions)-g(r.reactions):new Date(f.created_at||0)-new Date(r.created_at||0)),n},[i,t]),d=(0,l.useMemo)(()=>({items:a,onReply:o,onReact:c}),[a,o,c]),y=i.filter(n=>n.optimistic).length,D=i.filter(n=>n.justArrived).length;return(0,e.jsxs)("div",{style:{display:"flex",flexDirection:"column",height:"100%",gap:16},children:[(0,e.jsxs)("div",{className:"comments-head-row",children:[(0,e.jsx)("div",{children:(0,e.jsxs)("h4",{style:{margin:0},children:["\u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A (",i.length,")"]})}),(0,e.jsxs)("div",{className:"comments-badges-wrap",children:[(0,e.jsxs)("span",{className:"comment-summary-pill live",children:[(0,e.jsx)("span",{className:"live-mini-dot"}),"Realtime"]}),y>0?(0,e.jsx)("span",{className:"comment-summary-pill pending",children:y}):null]})]}),(0,e.jsx)("div",{style:{flex:1,minHeight:300},children:a.length===0?(0,e.jsx)("div",{className:"muted text-center py-10",children:"\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0639\u0644\u064A\u0642\u0627\u062A \u0628\u0639\u062F."}):(0,e.jsx)(N,{children:({height:n,width:r})=>(0,e.jsx)(w,{height:n,width:r,itemCount:a.length,itemSize:140,itemData:d,className:"no-scrollbar",children:z})})}),(0,e.jsxs)("div",{className:"comment-composer-shell",style:{marginTop:"auto"},children:[(0,e.jsx)("textarea",{placeholder:"\u0627\u0643\u062A\u0628 \u062A\u0639\u0644\u064A\u0642\u0643...",value:p,onChange:n=>m(n.target.value),rows:2,style:{width:"100%",borderRadius:16,padding:12,fontSize:14}}),(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginTop:8},children:[(0,e.jsx)("div",{style:{display:"flex",gap:4},children:k.slice(0,4).map(n=>(0,e.jsx)("button",{type:"button",className:"comment-emoji-btn",onClick:()=>m(r=>`${r}${n}`),children:n},n))}),(0,e.jsx)(h,{size:"sm",onClick:()=>{p.trim()&&(s({content:p.trim()}),m(""))},children:"\u0646\u0634\u0631"})]})]}),(0,e.jsx)("style",{children:`
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
      `})]})}export{A as a};
