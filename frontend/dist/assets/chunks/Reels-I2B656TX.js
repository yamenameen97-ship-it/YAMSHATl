import{a as W,b as Y}from"./chunk-LM3Z3WNN.js";import{e as he}from"./chunk-H6O2GARQ.js";import{b as xe}from"./chunk-VWSV6YD4.js";import{b as Q}from"./chunk-ACAREEYL.js";import"./chunk-WJMN45ZI.js";import{a as de,b as ce}from"./chunk-NGLKGT5E.js";import{a as pe,b as ue,c as me,d as fe,e as ge,f as be,g as ve}from"./chunk-4YVGGSCT.js";import{a as K}from"./chunk-VZO6UGC6.js";import{b as ne}from"./chunk-4XIFRW6W.js";import{j as le}from"./chunk-66XV2M3V.js";import"./chunk-6PAOTIFF.js";import"./chunk-QDERKRC2.js";import"./chunk-7DXJ3TCH.js";import{a as z}from"./chunk-4VVMVC2S.js";import{G as ie,b as oe,c as se}from"./chunk-MYYGGH6K.js";import{a as q,b as B}from"./chunk-T3SILTKH.js";import{d as M,k as T}from"./chunk-XSUFE7BX.js";T();var o=M(q(),1);T();var L=M(q(),1);var l=M(B(),1),G=500*1024*1024,ye=["video/mp4","video/webm","video/quicktime"];function je(r=0){return`${(r/(1024*1024)).toFixed(2)}MB`}function J({onUploadComplete:r,onError:p,label:v="\u0631\u0641\u0639 \u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0631\u064A\u0644"}){let[b,y]=(0,L.useState)(null),[g,d]=(0,L.useState)(!1),[C,x]=(0,L.useState)(0),[w,_]=(0,L.useState)(""),m=(0,L.useRef)(null),u=(0,L.useMemo)(()=>"MP4, WebM \u0623\u0648 MOV",[]),i=()=>{if(w)try{URL.revokeObjectURL(w)}catch{}y(null),d(!1),x(0),_(""),m.current&&(m.current.value="")},R=async n=>{let S=n.target.files?.[0];if(!S)return;if(!ye.includes(S.type)){p?.("\u0646\u0648\u0639 \u0627\u0644\u0645\u0644\u0641 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645. \u0627\u0633\u062A\u062E\u062F\u0645 MP4 \u0623\u0648 WebM \u0623\u0648 MOV");return}if(S.size>G){p?.(`\u062D\u062C\u0645 \u0627\u0644\u0645\u0644\u0641 \u0643\u0628\u064A\u0631 \u062C\u062F\u0627\u064B. \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649: ${G/(1024*1024)}MB`);return}if(w)try{URL.revokeObjectURL(w)}catch{}let $=URL.createObjectURL(S);y(S),_($),d(!0),x(0);try{let N=(await le(S,I=>x(Number(I||0))))?.data||{};r?.({file:S,previewUrl:$,url:N.media_url||N.url||N.file_url,payload:N})}catch(D){p?.(D?.response?.data?.detail||D?.message||"\u0641\u0634\u0644 \u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648"),i()}finally{d(!1)}};return(0,l.jsxs)("div",{className:"video-uploader-shell",children:[b?(0,l.jsxs)("div",{className:"video-upload-status",children:[(0,l.jsx)("div",{className:"video-preview-card",children:(0,l.jsx)("video",{src:w,controls:!0,playsInline:!0,className:"video-preview-player"})}),(0,l.jsxs)("div",{className:"video-info-row",children:[(0,l.jsxs)("div",{children:[(0,l.jsx)("strong",{children:b.name}),(0,l.jsx)("p",{className:"muted",children:je(b.size)})]}),(0,l.jsx)("span",{className:`upload-state-pill ${g?"busy":"done"}`,children:g?"\u062C\u0627\u0631\u064D \u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648...":"\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648"})]}),(0,l.jsxs)("div",{className:"upload-progress",children:[(0,l.jsx)("div",{className:"progress-bar",children:(0,l.jsx)("div",{className:"progress-fill",style:{width:`${Math.min(C,100)}%`}})}),(0,l.jsxs)("div",{className:"progress-info",children:[(0,l.jsxs)("span",{children:[Math.min(C,100),"%"]}),(0,l.jsx)("span",{className:"muted",children:"\u0631\u0641\u0639 \u062D\u0642\u064A\u0642\u064A \u0645\u0639 \u0627\u0633\u062A\u0626\u0646\u0627\u0641"})]})]}),(0,l.jsxs)("div",{className:"upload-actions",children:[(0,l.jsx)(z,{variant:"secondary",onClick:()=>m.current?.click(),loading:g,children:"\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0641\u064A\u062F\u064A\u0648"}),(0,l.jsx)(z,{variant:"ghost",onClick:i,disabled:g,children:"\u0625\u0632\u0627\u0644\u0629"})]})]}):(0,l.jsxs)("div",{className:"video-upload-area",children:[(0,l.jsx)("div",{className:"upload-icon",children:"\u{1F3AC}"}),(0,l.jsx)("p",{className:"upload-title",children:v}),(0,l.jsx)("p",{className:"muted",children:"\u0627\u0633\u062D\u0628 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0647\u0646\u0627 \u0623\u0648 \u0627\u062E\u062A\u0631\u0647 \u0645\u0646 \u0627\u0644\u062C\u0647\u0627\u0632"}),(0,l.jsx)("p",{className:"muted",children:u}),(0,l.jsxs)("p",{className:"muted",children:["\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649: ",G/(1024*1024),"MB"]}),(0,l.jsx)(z,{variant:"secondary",onClick:()=>m.current?.click(),loading:g,children:"\u0627\u062E\u062A\u064A\u0627\u0631 \u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0631\u064A\u0644"})]}),(0,l.jsx)("input",{ref:m,type:"file",accept:ye.join(","),onChange:R,style:{display:"none"}}),(0,l.jsx)("style",{children:`
        .video-uploader-shell {
          display: grid;
          gap: 12px;
        }
        .video-upload-status,
        .video-upload-area {
          display: grid;
          gap: 12px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.66);
        }
        .video-upload-area {
          text-align: center;
          justify-items: center;
          padding: 20px 16px;
        }
        .upload-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.28), rgba(59,130,246,0.16));
          font-size: 28px;
        }
        .upload-title {
          font-weight: 800;
          color: #fff;
          margin: 0;
        }
        .video-preview-card {
          border-radius: 18px;
          overflow: hidden;
          background: #020617;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .video-preview-player {
          width: 100%;
          max-height: 320px;
          display: block;
          background: #000;
        }
        .video-info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          color: #fff;
        }
        .upload-state-pill {
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          background: rgba(34,197,94,0.16);
          color: #86efac;
        }
        .upload-state-pill.busy {
          background: rgba(59,130,246,0.16);
          color: #93c5fd;
        }
        .muted {
          margin: 0;
          color: #94a3b8;
          font-size: 13px;
        }
        .upload-progress {
          display: grid;
          gap: 8px;
        }
        .progress-bar {
          height: 10px;
          border-radius: 999px;
          background: rgba(148,163,184,0.18);
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8b5cf6, #3b82f6);
          transition: width 160ms ease;
        }
        .progress-info,
        .upload-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
      `})]})}T();var P=M(q(),1);var s=M(B(),1),Ne=["\u2764\uFE0F","\u{1F525}","\u{1F602}","\u{1F44F}","\u{1F62E}","\u{1F4AF}"];function Ve(r=""){return r.split(/(\s+)/).map((p,v)=>p.startsWith("@")?(0,s.jsx)("span",{style:{color:"var(--primary)",fontWeight:700},children:p},v):p)}function X(r={}){return Object.values(r).reduce((p,v)=>p+Number(v||0),0)}var $e=({index:r,style:p,data:v})=>{let{items:b,onReply:y,onReact:g}=v,d=b[r];if(!d)return null;let C=X(d.reactions);return(0,s.jsx)("div",{style:{...p,padding:"10px"},children:(0,s.jsxs)("div",{className:`comment-card-shell ${d.optimistic?"optimistic":""} ${d.justArrived?"live":""}`,children:[(0,s.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:10,marginBottom:8,alignItems:"center",flexWrap:"wrap"},children:[(0,s.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},children:[(0,s.jsx)("strong",{children:d.username||d.user||"\u0645\u0633\u062A\u062E\u062F\u0645"}),d.optimistic?(0,s.jsx)("span",{className:"comment-state-pill pending",children:"\u0642\u064A\u062F \u0627\u0644\u0625\u0631\u0633\u0627\u0644"}):null,d.justArrived?(0,s.jsx)("span",{className:"comment-state-pill live",children:"\u0648\u0635\u0644 \u0627\u0644\u0622\u0646"}):null]}),(0,s.jsx)("span",{className:"muted",style:{fontSize:12},children:d.created_at?new Date(d.created_at).toLocaleString("ar-EG"):"\u0627\u0644\u0622\u0646"})]}),(0,s.jsx)("div",{style:{lineHeight:1.8,fontSize:14},children:Ve(d.content||d.text||d.comment||"")}),(0,s.jsxs)("div",{className:"comment-toolbar-row",style:{marginTop:8},children:[(0,s.jsx)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:Ne.map(x=>{let w=Number(d.reactions?.[x]||0);return(0,s.jsxs)("button",{type:"button",className:"comment-emoji-btn",onClick:()=>g(d.id,x),children:[x," ",w||""]},x)})}),(0,s.jsxs)("div",{style:{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"},children:[(0,s.jsxs)("span",{className:"muted",style:{fontSize:11},children:["\u0627\u0644\u062A\u0641\u0627\u0639\u0644\u0627\u062A ",C]}),(0,s.jsx)("button",{type:"button",className:"comment-link-btn",style:{fontSize:11},children:"\u0631\u062F"})]})]})]})})};function Z({comments:r=[],onAddComment:p,onReply:v,onToggleReaction:b}){let[y,g]=(0,P.useState)(""),[d,C]=(0,P.useState)("newest"),x=(0,P.useMemo)(()=>{let u=[...r];return u.sort((i,R)=>d==="popular"?X(R.reactions)-X(i.reactions):new Date(R.created_at||0)-new Date(i.created_at||0)),u},[r,d]),w=(0,P.useMemo)(()=>({items:x,onReply:v,onReact:b}),[x,v,b]),_=r.filter(u=>u.optimistic).length,m=r.filter(u=>u.justArrived).length;return(0,s.jsxs)("div",{style:{display:"flex",flexDirection:"column",height:"100%",gap:16},children:[(0,s.jsxs)("div",{className:"comments-head-row",children:[(0,s.jsx)("div",{children:(0,s.jsxs)("h4",{style:{margin:0},children:["\u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A (",r.length,")"]})}),(0,s.jsxs)("div",{className:"comments-badges-wrap",children:[(0,s.jsxs)("span",{className:"comment-summary-pill live",children:[(0,s.jsx)("span",{className:"live-mini-dot"}),"Realtime"]}),_>0?(0,s.jsx)("span",{className:"comment-summary-pill pending",children:_}):null]})]}),(0,s.jsx)("div",{style:{flex:1,minHeight:300},children:x.length===0?(0,s.jsx)("div",{className:"muted text-center py-10",children:"\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0639\u0644\u064A\u0642\u0627\u062A \u0628\u0639\u062F."}):(0,s.jsx)(Y,{children:({height:u,width:i})=>(0,s.jsx)(W,{height:u,width:i,itemCount:x.length,itemSize:140,itemData:w,className:"no-scrollbar",children:$e})})}),(0,s.jsxs)("div",{className:"comment-composer-shell",style:{marginTop:"auto"},children:[(0,s.jsx)("textarea",{placeholder:"\u0627\u0643\u062A\u0628 \u062A\u0639\u0644\u064A\u0642\u0643...",value:y,onChange:u=>g(u.target.value),rows:2,style:{width:"100%",borderRadius:16,padding:12,fontSize:14}}),(0,s.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginTop:8},children:[(0,s.jsx)("div",{style:{display:"flex",gap:4},children:Ne.slice(0,4).map(u=>(0,s.jsx)("button",{type:"button",className:"comment-emoji-btn",onClick:()=>g(i=>`${i}${u}`),children:u},u))}),(0,s.jsx)(z,{size:"sm",onClick:()=>{y.trim()&&(p({content:y.trim()}),g(""))},children:"\u0646\u0634\u0631"})]})]}),(0,s.jsx)("style",{children:`
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
      `})]})}var e=M(B(),1);function Oe(r){let p=Number(r.likes_count||0),v=Number(r.comments_count||0),b=Number(r.share_count||0),y=Number(r.saved_count||0),g=Math.max(1,(Date.now()-new Date(r.created_at||Date.now()).getTime())/36e5);return p*2+v*3+b*4+y*4+96/g}function We(r=""){return/\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(r)}function Ce(r){let p=r.thumbnail_url||r.image_url||r.preview_url||"";return p?Q(p,720,74):""}function ke(r,p,v=!1){let b=v?p.preferredVideoQuality:p.isLowEndDevice?"low":"medium";return ce(r.media_url||r.video_url||"",b)}var Ye=({index:r,style:p,data:v})=>{let{reels:b,activeIndex:y,setVideoRef:g,handleLike:d,openComments:C,handleSave:x,handleShare:w,currentUser:_,scrollToIndex:m,isDesktop:u}=v,i=b[r],R=r===y,n=(0,o.useRef)(null);return(0,o.useEffect)(()=>(g(r,n.current),()=>g(r,null)),[r,g]),i?(0,e.jsx)("div",{style:p,className:"reel-container",children:(0,e.jsxs)("div",{className:"reel-card relative bg-black overflow-hidden h-full w-full",children:[(0,e.jsx)("video",{ref:n,className:"w-full h-full object-cover",loop:!0,playsInline:!0,muted:!R,poster:Ce(i),onClick:()=>{n.current&&(n.current.paused?n.current.play().catch(()=>{}):n.current.pause())},onDoubleClick:()=>d(i,{burst:!0})}),(0,e.jsx)("div",{className:"absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-4 pt-4 pb-10 text-white pointer-events-none",children:(0,e.jsxs)("div",{className:"flex items-center justify-between gap-3 pointer-events-auto",children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{className:"reel-chip",children:"\u0627\u0644\u0631\u064A\u0644\u0632"}),(0,e.jsx)("p",{className:"reel-hint",children:u?"\u062A\u0646\u0642\u0644 \u0628\u0627\u0644\u0623\u0633\u0647\u0645 \u2191 \u2193":"\u062A\u0646\u0642\u0644 \u0628\u0627\u0644\u0633\u062D\u0628 \u0627\u0644\u0639\u0645\u0648\u062F\u064A"})]}),(0,e.jsxs)("div",{className:"reel-count-pill",children:[r+1," / ",b.length]})]})}),(0,e.jsxs)("div",{className:"absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 via-black/35 to-transparent text-white pointer-events-none",children:[(0,e.jsxs)("div",{className:"flex items-center gap-3 mb-2 pointer-events-auto",children:[(0,e.jsx)("div",{className:"w-10 h-10 rounded-full bg-gray-600 overflow-hidden border border-white/20",children:(0,e.jsx)("img",{src:Q(i.user_avatar,80),alt:"",className:"w-full h-full object-cover"})}),(0,e.jsxs)("span",{className:"font-bold text-sm",children:["@",i.username||"user"]}),i.username!==_?(0,e.jsx)("button",{className:"text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors",children:"\u0645\u062A\u0627\u0628\u0639\u0629"}):null]}),(0,e.jsx)("p",{className:"text-sm leading-6 line-clamp-3 mb-2 pointer-events-auto",children:i.content||"\u0631\u064A\u0644 \u062C\u062F\u064A\u062F"}),(0,e.jsxs)("div",{className:"flex items-center gap-2 text-xs text-white/80 pointer-events-auto",children:[i.duration_label?(0,e.jsx)("span",{className:"reel-chip ghost",children:i.duration_label}):null,(0,e.jsxs)("span",{className:"reel-chip ghost",children:["\u{1F441} ",Number(i.views_count||0)]})]})]}),(0,e.jsxs)("div",{className:"absolute right-4 bottom-24 flex flex-col gap-5 items-center z-20",children:[(0,e.jsxs)("div",{className:"flex flex-col items-center gap-1",children:[(0,e.jsx)("button",{onClick:()=>d(i),className:`reel-action-btn ${i.is_liked?"liked":""}`,children:"\u2764\uFE0F"}),(0,e.jsx)("span",{className:"reel-action-label",children:i.likes_count||0})]}),(0,e.jsxs)("div",{className:"flex flex-col items-center gap-1",children:[(0,e.jsx)("button",{onClick:()=>C(i),className:"reel-action-btn",children:"\u{1F4AC}"}),(0,e.jsx)("span",{className:"reel-action-label",children:i.comments_count||0})]}),(0,e.jsxs)("div",{className:"flex flex-col items-center gap-1",children:[(0,e.jsx)("button",{onClick:()=>x(i),className:`reel-action-btn ${i.is_saved?"saved":""}`,children:"\u{1F516}"}),(0,e.jsx)("span",{className:"reel-action-label",children:"\u062D\u0641\u0638"})]}),(0,e.jsxs)("div",{className:"flex flex-col items-center gap-1",children:[(0,e.jsx)("button",{onClick:()=>w(i),className:"reel-action-btn",children:"\u2197"}),(0,e.jsx)("span",{className:"reel-action-label",children:"\u0645\u0634\u0627\u0631\u0643\u0629"})]})]}),u?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("button",{type:"button",className:"reel-arrow reel-arrow-up",onClick:()=>m(r-1),disabled:r===0,children:"\u2191"}),(0,e.jsx)("button",{type:"button",className:"reel-arrow reel-arrow-down",onClick:()=>m(r+1),disabled:r>=b.length-1,children:"\u2193"})]}):null]})}):null};function Fe(){let{pushToast:r}=ne(),p=ie(),v=(0,o.useRef)(null),b=(0,o.useRef)(new Map),y=(0,o.useRef)(new Map),g=(0,o.useRef)([]),d=(0,o.useRef)(new Set),C=(0,o.useRef)(!1),x=(0,o.useRef)(0),w=se(),_=oe(),[m,u]=(0,o.useState)([]),[i,R]=(0,o.useState)(!0),[n,S]=(0,o.useState)(0),[$,D]=(0,o.useState)(""),[N,I]=(0,o.useState)(!1),[A,ee]=(0,o.useState)(!1),[_e,Se]=(0,o.useState)(null),[ze,F]=(0,o.useState)([]),[k,E]=(0,o.useState)({mediaUrl:"",previewUrl:"",uploading:!1,publishing:!1,content:"",fileName:""}),j=(0,o.useMemo)(()=>de(),[]),O=j.isLowEndDevice?1:2,V=(0,o.useMemo)(()=>typeof window<"u"&&window.matchMedia("(min-width: 1024px)").matches,[]),Re=(0,o.useCallback)(()=>{E({mediaUrl:"",previewUrl:"",uploading:!1,publishing:!1,content:"",fileName:""})},[]),U=(0,o.useCallback)(a=>{let t=Math.max(0,Math.min(a,m.length-1));Number.isFinite(t)&&(S(t),v.current?.scrollToItem?.(t,"start"))},[m.length]),H=(0,o.useCallback)(async()=>{R(!0);try{let{data:a}=await pe({limit:40,page:1}),c=(Array.isArray(a)?a:a?.items||[]).filter(f=>We(f?.media_url||f?.video_url||"")).map(f=>({...f,media_url:f.media_url||f.video_url,recommendation_score:Oe(f),views_count:Number(f.views_count||f.view_count||0),poster_url:Ce(f),duration_label:f.duration_label||f.duration||""})),h=await he(c);u(Array.isArray(h)?h:c)}catch(a){r({type:"error",title:"\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0631\u064A\u0644\u0632",description:a?.message})}finally{R(!1)}},[r]);(0,o.useEffect)(()=>{H()},[H]),(0,o.useEffect)(()=>{new URLSearchParams(_.search).get("upload")==="1"&&I(!0)},[_.search]),(0,o.useEffect)(()=>(g.current.forEach(t=>t.remove?.()),g.current=[],m.slice(n+1,n+1+O).forEach(t=>{let c=ke(t,j,!1);if(!c)return;let h=document.createElement("link");h.rel="preload",h.as="video",h.href=c,document.head.appendChild(h),g.current.push(h)}),()=>{g.current.forEach(t=>t.remove?.())}),[n,j,m,O]),(0,o.useEffect)(()=>{b.current.forEach((t,c)=>{if(!t)return;let h=Math.abs(c-n)<=O,f=m[c];if(!h){t.pause(),t.removeAttribute("src"),t.load(),t.preload="none";return}if(!f)return;let re=ke(f,j,c===n);t.src!==re&&(t.src=re,t.load()),t.preload=c===n?"auto":"metadata",c===n?t.play().catch(()=>{}):t.pause()});let a=m[n];if(a){let t=String(a.id);if(y.current.has(t)&&clearTimeout(y.current.get(t)),!d.current.has(t)){let c=setTimeout(()=>{d.current.add(t)},2e3);return y.current.set(t,c),()=>clearTimeout(c)}}},[n,m,j,O]),(0,o.useEffect)(()=>{let a=t=>{V&&(N||A||(t.key==="ArrowDown"&&(t.preventDefault(),U(n+1)),t.key==="ArrowUp"&&(t.preventDefault(),U(n-1)),t.key.toLowerCase()==="u"&&(t.preventDefault(),I(!0))))};return window.addEventListener("keydown",a),()=>window.removeEventListener("keydown",a)},[n,V,U,A,N]);let te=(0,o.useCallback)((a,t)=>{t?b.current.set(a,t):b.current.delete(a)},[]),Ue=(0,o.useCallback)(({startIndex:a})=>{a!==n&&S(a)},[n]),Me=(0,o.useCallback)(a=>{N||A||C.current||Math.abs(a.deltaY)<18||(C.current=!0,U(n+(a.deltaY>0?1:-1)),window.setTimeout(()=>{C.current=!1},420))},[n,U,A,N]),Le=(0,o.useCallback)(a=>{x.current=a.touches?.[0]?.clientY||0},[]),Ie=(0,o.useCallback)(a=>{if(N||A)return;let t=a.changedTouches?.[0]?.clientY||0,c=x.current-t;Math.abs(c)<50||U(n+(c>0?1:-1))},[n,U,A,N]),Ae=async(a,{burst:t=!1}={})=>{t&&(D(String(a.id)),setTimeout(()=>D(""),650));let c=[...m];u(h=>h.map(f=>f.id===a.id?{...f,is_liked:!f.is_liked,likes_count:f.is_liked?Number(f.likes_count||0)-1:Number(f.likes_count||0)+1}:f));try{await me(a.id)}catch{u(c),r({type:"error",title:"\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0639\u062C\u0627\u0628"})}},De=async a=>{let t=[...m];u(c=>c.map(h=>h.id===a.id?{...h,is_saved:!h.is_saved}:h));try{await fe(a.id)}catch{u(t),r({type:"error",title:"\u062A\u0639\u0630\u0631 \u062D\u0641\u0638 \u0627\u0644\u0631\u064A\u0644"})}},Te=async a=>{try{await navigator.clipboard.writeText(`${window.location.origin}/reels/${a.id}`),r({type:"success",title:"\u062A\u0645 \u0646\u0633\u062E \u0631\u0627\u0628\u0637 \u0627\u0644\u0631\u064A\u0644"}),await ge(a.id,"copy")}catch{r({type:"warning",title:"\u062A\u0639\u0630\u0631 \u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637"})}},Be=async a=>{Se(a),ee(!0);try{let{data:t}=await ve(a.id);F(Array.isArray(t)?t:t?.items||[])}catch{F([])}},Pe=async()=>{if(!k.mediaUrl){r({type:"warning",title:"\u0627\u0631\u0641\u0639 \u0641\u064A\u062F\u064A\u0648 \u0623\u0648\u0644\u0627\u064B"});return}try{E(a=>({...a,publishing:!0})),await ue({content:k.content?.trim()||"\u0631\u064A\u0644 \u062C\u062F\u064A\u062F",media_url:k.mediaUrl,media:k.mediaUrl,media_urls:[k.mediaUrl]}),I(!1),Re(),w("/reels",{replace:!0}),await H(),r({type:"success",title:"\u062A\u0645 \u0646\u0634\u0631 \u0627\u0644\u0631\u064A\u0644 \u0628\u0646\u062C\u0627\u062D"})}catch(a){E(t=>({...t,publishing:!1})),r({type:"error",title:"\u0641\u0634\u0644 \u0646\u0634\u0631 \u0627\u0644\u0631\u064A\u0644",description:a?.response?.data?.detail||a?.message})}},Ee=(0,o.useMemo)(()=>({reels:m,activeIndex:n,setVideoRef:te,handleLike:Ae,openComments:Be,handleSave:De,handleShare:Te,currentUser:p,scrollToIndex:U,isDesktop:V}),[m,n,te,p,U,V]),ae=()=>{I(!1),w("/reels",{replace:!0})};return(0,e.jsx)(xe,{hideNav:!0,children:(0,e.jsxs)("div",{className:"reels-page-shell",onWheelCapture:Me,onTouchStart:Le,onTouchEnd:Ie,children:[(0,e.jsxs)("div",{className:"reels-header-bar",children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("h1",{children:"\u0627\u0644\u0631\u064A\u0644\u0632"}),(0,e.jsx)("p",{children:V?"\u0627\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0623\u0633\u0647\u0645 \u0644\u0644\u062A\u0646\u0642\u0644 \u0628\u064A\u0646 \u0627\u0644\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A":"\u0645\u0631\u0631 \u0644\u0623\u0639\u0644\u0649 \u0648\u0623\u0633\u0641\u0644 \u0644\u0644\u062A\u0646\u0642\u0644 \u0628\u064A\u0646 \u0627\u0644\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A"})]}),(0,e.jsx)("button",{type:"button",className:"upload-reel-button",onClick:()=>I(!0),children:"\u2B06 \u0631\u0641\u0639 \u0631\u064A\u0644"})]}),(0,e.jsx)("div",{className:"reels-stage-shell",children:i?(0,e.jsxs)("div",{className:"reels-loading-state",children:[(0,e.jsx)("div",{className:"reel-loader"}),(0,e.jsx)("p",{children:"\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0631\u064A\u0644\u0632..."})]}):m.length?(0,e.jsx)(Y,{children:({height:a,width:t})=>(0,e.jsx)(W,{ref:v,height:a,width:t,itemCount:m.length,itemSize:a,onItemsRendered:({visibleStartIndex:c})=>Ue({startIndex:c}),itemData:Ee,className:"no-scrollbar",children:Ye})}):(0,e.jsxs)("div",{className:"reels-empty-state",children:[(0,e.jsx)("div",{className:"empty-icon",children:"\u{1F3AC}"}),(0,e.jsx)("h2",{children:"\u0645\u0627\u0641\u064A\u0634 \u0631\u064A\u0644\u0632 \u0644\u0633\u0647"}),(0,e.jsx)("p",{children:"\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0632\u0631 \u0631\u0641\u0639 \u0631\u064A\u0644 \u0648\u0623\u0636\u0641 \u0623\u0648\u0644 \u0641\u064A\u062F\u064A\u0648 \u0628\u0634\u0643\u0644 \u0648\u0627\u0636\u062D \u0648\u0645\u0628\u0627\u0634\u0631."}),(0,e.jsx)(z,{onClick:()=>I(!0),children:"\u0631\u0641\u0639 \u0623\u0648\u0644 \u0631\u064A\u0644"})]})}),$?(0,e.jsx)("div",{className:"reel-heart-burst",children:"\u2764\uFE0F"}):null,(0,e.jsx)(K,{isOpen:N,onClose:ae,title:"\u0625\u0636\u0627\u0641\u0629 \u0631\u064A\u0644 \u062C\u062F\u064A\u062F",children:(0,e.jsxs)("div",{className:"upload-modal-layout",children:[(0,e.jsxs)("div",{className:"upload-modal-help",children:[(0,e.jsx)("strong",{children:"\u0627\u0644\u062E\u0637\u0648\u0629 1"}),(0,e.jsx)("p",{children:"\u0627\u062E\u062A\u0631 \u0641\u064A\u062F\u064A\u0648 \u0648\u0627\u0636\u062D \u0644\u0644\u0631\u064A\u0644"}),(0,e.jsx)("strong",{children:"\u0627\u0644\u062E\u0637\u0648\u0629 2"}),(0,e.jsx)("p",{children:"\u0628\u0639\u062F \u0627\u0643\u062A\u0645\u0627\u0644 \u0627\u0644\u0631\u0641\u0639 \u0633\u064A\u0638\u0647\u0631 \u0644\u0643 \u0645\u0634\u063A\u0644 \u0641\u064A\u062F\u064A\u0648 \u0644\u0644\u0645\u0639\u0627\u064A\u0646\u0629"}),(0,e.jsx)("strong",{children:"\u0627\u0644\u062E\u0637\u0648\u0629 3"}),(0,e.jsx)("p",{children:"\u0627\u0636\u063A\u0637 \u0632\u0631 \u0646\u0634\u0631 \u0627\u0644\u0631\u064A\u0644"})]}),(0,e.jsx)("textarea",{value:k.content,onChange:a=>E(t=>({...t,content:a.target.value})),rows:4,placeholder:"\u0627\u0643\u062A\u0628 \u0648\u0635\u0641 \u0627\u0644\u0631\u064A\u0644 \u0623\u0648 \u0627\u0644\u0643\u0627\u0628\u0634\u0646",className:"upload-caption-field"}),(0,e.jsx)(J,{label:"\u0631\u0641\u0639 \u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0631\u064A\u0644",onUploadComplete:({url:a,previewUrl:t,file:c})=>{E(h=>({...h,mediaUrl:a||"",previewUrl:t||"",fileName:c?.name||"",uploading:!1})),r({type:"success",title:"\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648",description:"\u0631\u0627\u062C\u0639 \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u062B\u0645 \u0627\u0636\u063A\u0637 \u0646\u0634\u0631 \u0627\u0644\u0631\u064A\u0644."})},onError:a=>r({type:"error",title:"\u0641\u0634\u0644 \u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648",description:a})}),k.mediaUrl?(0,e.jsxs)("div",{className:"uploaded-preview-shell",children:[(0,e.jsxs)("div",{className:"uploaded-preview-head",children:[(0,e.jsx)("strong",{children:"\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0631\u064A\u0644"}),(0,e.jsx)("span",{children:k.fileName||"video.mp4"})]}),(0,e.jsx)("video",{src:k.mediaUrl,controls:!0,playsInline:!0,className:"uploaded-preview-video"})]}):null,(0,e.jsxs)("div",{className:"upload-modal-actions",children:[(0,e.jsx)(z,{variant:"secondary",onClick:ae,children:"\u0625\u063A\u0644\u0627\u0642"}),(0,e.jsx)(z,{onClick:Pe,loading:k.publishing,disabled:!k.mediaUrl||k.publishing,children:"\u0646\u0634\u0631 \u0627\u0644\u0631\u064A\u0644 \u0627\u0644\u0622\u0646"})]})]})}),(0,e.jsx)(K,{isOpen:A,onClose:()=>ee(!1),title:"\u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A",children:(0,e.jsx)("div",{className:"comments-modal-shell",children:(0,e.jsx)(Z,{comments:ze,onAddComment:async a=>{let{data:t}=await be(_e.id,a);F(c=>[t,...c])}})})}),(0,e.jsx)("style",{children:`
          .reels-page-shell {
            position: relative;
            min-height: 100vh;
            height: 100vh;
            background: #000;
            color: #fff;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .reels-header-bar {
            position: absolute;
            inset-inline: 0;
            top: 0;
            z-index: 30;
            padding: 18px 18px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: linear-gradient(180deg, rgba(0,0,0,0.78), rgba(0,0,0,0));
          }
          .reels-header-bar h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 900;
          }
          .reels-header-bar p {
            margin: 4px 0 0;
            color: rgba(255,255,255,0.76);
            font-size: 13px;
          }
          .upload-reel-button {
            border: none;
            border-radius: 999px;
            padding: 12px 18px;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            color: #fff;
            font-weight: 900;
            cursor: pointer;
            box-shadow: 0 18px 36px rgba(59,130,246,0.24);
          }
          .reels-stage-shell {
            flex: 1;
            height: 100%;
          }
          .reels-loading-state,
          .reels-empty-state {
            height: 100%;
            display: grid;
            place-items: center;
            text-align: center;
            gap: 12px;
            padding: 24px;
          }
          .reel-loader {
            width: 54px;
            height: 54px;
            border-radius: 999px;
            border: 4px solid rgba(255,255,255,0.16);
            border-top-color: #8b5cf6;
            animation: reelSpin 0.9s linear infinite;
          }
          .reels-empty-state .empty-icon {
            width: 84px;
            height: 84px;
            border-radius: 26px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,0.06);
            font-size: 34px;
          }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .reel-container { scroll-snap-align: start; }
          .reel-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(255,255,255,0.12);
            color: #fff;
            font-size: 12px;
            font-weight: 800;
          }
          .reel-chip.ghost {
            background: rgba(15,23,42,0.58);
            border: 1px solid rgba(255,255,255,0.08);
          }
          .reel-hint {
            margin: 8px 0 0;
            color: rgba(255,255,255,0.78);
            font-size: 12px;
          }
          .reel-count-pill {
            border-radius: 999px;
            padding: 8px 12px;
            background: rgba(0,0,0,0.42);
            border: 1px solid rgba(255,255,255,0.08);
            font-size: 12px;
            font-weight: 800;
          }
          .reel-action-btn {
            width: 54px;
            height: 54px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.12);
            color: #fff;
            font-size: 24px;
            display: grid;
            place-items: center;
            cursor: pointer;
            transition: transform 120ms ease, background 120ms ease;
          }
          .reel-action-btn:hover {
            transform: translateY(-2px);
            background: rgba(255,255,255,0.18);
          }
          .reel-action-btn.liked {
            background: rgba(239,68,68,0.22);
            color: #fecaca;
          }
          .reel-action-btn.saved {
            background: rgba(245,158,11,0.22);
            color: #fde68a;
          }
          .reel-action-label {
            font-size: 11px;
            color: rgba(255,255,255,0.85);
            font-weight: 700;
          }
          .reel-arrow {
            position: absolute;
            left: 24px;
            width: 52px;
            height: 52px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(0,0,0,0.34);
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 20;
          }
          .reel-arrow:disabled {
            opacity: 0.35;
            cursor: not-allowed;
          }
          .reel-arrow-up { top: 50%; transform: translateY(-68px); }
          .reel-arrow-down { top: 50%; transform: translateY(16px); }
          .reel-heart-burst {
            position: absolute;
            inset: 0;
            z-index: 35;
            display: grid;
            place-items: center;
            font-size: 84px;
            pointer-events: none;
            animation: heartBurst 0.65s ease-out forwards;
          }
          .upload-modal-layout,
          .comments-modal-shell {
            display: grid;
            gap: 14px;
          }
          .upload-modal-help {
            display: grid;
            gap: 6px;
            padding: 14px;
            border-radius: 16px;
            background: rgba(15,23,42,0.6);
            border: 1px solid rgba(255,255,255,0.06);
            color: #cbd5e1;
          }
          .upload-modal-help strong {
            color: #fff;
          }
          .upload-modal-help p {
            margin: 0;
            font-size: 13px;
          }
          .upload-caption-field {
            width: 100%;
            border-radius: 16px;
            padding: 14px;
            background: rgba(15,23,42,0.72);
            border: 1px solid rgba(255,255,255,0.08);
            color: #fff;
            resize: vertical;
          }
          .uploaded-preview-shell {
            display: grid;
            gap: 10px;
            padding: 14px;
            border-radius: 16px;
            background: rgba(15,23,42,0.62);
            border: 1px solid rgba(255,255,255,0.08);
          }
          .uploaded-preview-head {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: wrap;
            color: #fff;
            font-size: 13px;
          }
          .uploaded-preview-video {
            width: 100%;
            max-height: 320px;
            border-radius: 14px;
            background: #000;
          }
          .upload-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            flex-wrap: wrap;
          }
          @keyframes reelSpin {
            to { transform: rotate(360deg); }
          }
          @keyframes heartBurst {
            0% { opacity: 0; transform: scale(0.4); }
            45% { opacity: 1; transform: scale(1.08); }
            100% { opacity: 0; transform: scale(1.35); }
          }
          @media (max-width: 1023px) {
            .reels-header-bar {
              padding: 14px 14px 12px;
            }
            .reels-header-bar h1 {
              font-size: 20px;
            }
            .upload-reel-button {
              padding: 10px 14px;
              font-size: 14px;
            }
          }
        `})]})})}export{Fe as default};
