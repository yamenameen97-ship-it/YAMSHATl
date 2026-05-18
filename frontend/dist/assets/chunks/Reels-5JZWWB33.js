import{a as fe}from"./chunk-L5C7RFNJ.js";import{e as ge}from"./chunk-242APSI5.js";import{a as ue,b as me}from"./chunk-LM3Z3WNN.js";import{b as be}from"./chunk-6QFO76GN.js";import{b as F}from"./chunk-RO27QGKP.js";import"./chunk-WJMN45ZI.js";import{a as re,b as oe}from"./chunk-NGLKGT5E.js";import{a as se,b as ie,d as le,e as ne,f as de,g as ce,h as pe}from"./chunk-6YUDYOSL.js";import{a as $}from"./chunk-WLB3S3IH.js";import{b as te}from"./chunk-4XIFRW6W.js";import{j as ae}from"./chunk-TMORTOLJ.js";import"./chunk-NSLONKJH.js";import"./chunk-4STVG5GK.js";import{a as M}from"./chunk-4VVMVC2S.js";import"./chunk-XGMKN6IA.js";import"./chunk-7DXJ3TCH.js";import{H as ee,b as G,c as J}from"./chunk-OKBOFJIL.js";import{a as Z,b as j}from"./chunk-T3SILTKH.js";import{d as T,k as V}from"./chunk-XSUFE7BX.js";V();var o=T(Z(),1);V();var _=T(Z(),1);var i=T(j(),1),W=500*1024*1024,he=["video/mp4","video/webm","video/quicktime"];function De(r=0){return`${(r/(1024*1024)).toFixed(2)}MB`}function q({onUploadComplete:r,onError:u,label:h="\u0631\u0641\u0639 \u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0631\u064A\u0644"}){let[f,v]=(0,_.useState)(null),[m,N]=(0,_.useState)(!1),[U,R]=(0,_.useState)(0),[x,S]=(0,_.useState)(""),c=(0,_.useRef)(null),w=(0,_.useMemo)(()=>"MP4, WebM \u0623\u0648 MOV",[]),n=()=>{if(x)try{URL.revokeObjectURL(x)}catch{}v(null),N(!1),R(0),S(""),c.current&&(c.current.value="")},L=async s=>{let y=s.target.files?.[0];if(!y)return;if(!he.includes(y.type)){u?.("\u0646\u0648\u0639 \u0627\u0644\u0645\u0644\u0641 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645. \u0627\u0633\u062A\u062E\u062F\u0645 MP4 \u0623\u0648 WebM \u0623\u0648 MOV");return}if(y.size>W){u?.(`\u062D\u062C\u0645 \u0627\u0644\u0645\u0644\u0641 \u0643\u0628\u064A\u0631 \u062C\u062F\u0627\u064B. \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649: ${W/(1024*1024)}MB`);return}if(x)try{URL.revokeObjectURL(x)}catch{}let B=URL.createObjectURL(y);v(y),S(B),N(!0),R(0);try{let g=(await ae(y,C=>R(Number(C||0))))?.data||{};r?.({file:y,previewUrl:B,url:g.media_url||g.url||g.file_url,payload:g})}catch(I){u?.(I?.response?.data?.detail||I?.message||"\u0641\u0634\u0644 \u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648"),n()}finally{N(!1)}};return(0,i.jsxs)("div",{className:"video-uploader-shell",children:[f?(0,i.jsxs)("div",{className:"video-upload-status",children:[(0,i.jsx)("div",{className:"video-preview-card",children:(0,i.jsx)("video",{src:x,controls:!0,playsInline:!0,className:"video-preview-player"})}),(0,i.jsxs)("div",{className:"video-info-row",children:[(0,i.jsxs)("div",{children:[(0,i.jsx)("strong",{children:f.name}),(0,i.jsx)("p",{className:"muted",children:De(f.size)})]}),(0,i.jsx)("span",{className:`upload-state-pill ${m?"busy":"done"}`,children:m?"\u062C\u0627\u0631\u064D \u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648...":"\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648"})]}),(0,i.jsxs)("div",{className:"upload-progress",children:[(0,i.jsx)("div",{className:"progress-bar",children:(0,i.jsx)("div",{className:"progress-fill",style:{width:`${Math.min(U,100)}%`}})}),(0,i.jsxs)("div",{className:"progress-info",children:[(0,i.jsxs)("span",{children:[Math.min(U,100),"%"]}),(0,i.jsx)("span",{className:"muted",children:"\u0631\u0641\u0639 \u062D\u0642\u064A\u0642\u064A \u0645\u0639 \u0627\u0633\u062A\u0626\u0646\u0627\u0641"})]})]}),(0,i.jsxs)("div",{className:"upload-actions",children:[(0,i.jsx)(M,{variant:"secondary",onClick:()=>c.current?.click(),loading:m,children:"\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0641\u064A\u062F\u064A\u0648"}),(0,i.jsx)(M,{variant:"ghost",onClick:n,disabled:m,children:"\u0625\u0632\u0627\u0644\u0629"})]})]}):(0,i.jsxs)("div",{className:"video-upload-area",children:[(0,i.jsx)("div",{className:"upload-icon",children:"\u{1F3AC}"}),(0,i.jsx)("p",{className:"upload-title",children:h}),(0,i.jsx)("p",{className:"muted",children:"\u0627\u0633\u062D\u0628 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0647\u0646\u0627 \u0623\u0648 \u0627\u062E\u062A\u0631\u0647 \u0645\u0646 \u0627\u0644\u062C\u0647\u0627\u0632"}),(0,i.jsx)("p",{className:"muted",children:w}),(0,i.jsxs)("p",{className:"muted",children:["\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649: ",W/(1024*1024),"MB"]}),(0,i.jsx)(M,{variant:"secondary",onClick:()=>c.current?.click(),loading:m,children:"\u0627\u062E\u062A\u064A\u0627\u0631 \u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0631\u064A\u0644"})]}),(0,i.jsx)("input",{ref:c,type:"file",accept:he.join(","),onChange:L,style:{display:"none"}}),(0,i.jsx)("style",{children:`
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
      `})]})}var e=T(j(),1);function Pe(r){let u=Number(r.likes_count||0),h=Number(r.comments_count||0),f=Number(r.share_count||0),v=Number(r.saved_count||0),m=Math.max(1,(Date.now()-new Date(r.created_at||Date.now()).getTime())/36e5);return u*2+h*3+f*4+v*4+96/m}function Be(r=""){return/\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(r)}function xe(r){let u=r.thumbnail_url||r.image_url||r.preview_url||"";return u?F(u,720,74):""}function ve(r,u,h=!1){let f=h?u.preferredVideoQuality:u.isLowEndDevice?"low":"medium";return oe(r.media_url||r.video_url||"",f)}var Ee=({index:r,style:u,data:h})=>{let{reels:f,activeIndex:v,setVideoRef:m,handleLike:N,openComments:U,handleSave:R,handleShare:x,currentUser:S,scrollToIndex:c,isDesktop:w}=h,n=f[r],L=r===v,s=(0,o.useRef)(null);return(0,o.useEffect)(()=>(m(r,s.current),()=>m(r,null)),[r,m]),n?(0,e.jsx)("div",{style:u,className:"reel-container",children:(0,e.jsxs)("div",{className:"reel-card relative bg-black overflow-hidden h-full w-full",children:[(0,e.jsx)("video",{ref:s,className:"w-full h-full object-cover",loop:!0,playsInline:!0,muted:!L,poster:xe(n),onClick:()=>{s.current&&(s.current.paused?s.current.play().catch(()=>{}):s.current.pause())},onDoubleClick:()=>N(n,{burst:!0})}),(0,e.jsx)("div",{className:"absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-4 pt-4 pb-10 text-white pointer-events-none",children:(0,e.jsxs)("div",{className:"flex items-center justify-between gap-3 pointer-events-auto",children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{className:"reel-chip",children:"\u0627\u0644\u0631\u064A\u0644\u0632"}),(0,e.jsx)("p",{className:"reel-hint",children:w?"\u062A\u0646\u0642\u0644 \u0628\u0627\u0644\u0623\u0633\u0647\u0645 \u2191 \u2193":"\u062A\u0646\u0642\u0644 \u0628\u0627\u0644\u0633\u062D\u0628 \u0627\u0644\u0639\u0645\u0648\u062F\u064A"})]}),(0,e.jsxs)("div",{className:"reel-count-pill",children:[r+1," / ",f.length]})]})}),(0,e.jsxs)("div",{className:"absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 via-black/35 to-transparent text-white pointer-events-none",children:[(0,e.jsxs)("div",{className:"flex items-center gap-3 mb-2 pointer-events-auto",children:[(0,e.jsx)("div",{className:"w-10 h-10 rounded-full bg-gray-600 overflow-hidden border border-white/20",children:(0,e.jsx)("img",{src:F(n.user_avatar,80),alt:"",className:"w-full h-full object-cover"})}),(0,e.jsxs)("span",{className:"font-bold text-sm",children:["@",n.username||"user"]}),n.username!==S?(0,e.jsx)("button",{className:"text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors",children:"\u0645\u062A\u0627\u0628\u0639\u0629"}):null]}),(0,e.jsx)("p",{className:"text-sm leading-6 line-clamp-3 mb-2 pointer-events-auto",children:n.content||"\u0631\u064A\u0644 \u062C\u062F\u064A\u062F"}),(0,e.jsxs)("div",{className:"flex items-center gap-2 text-xs text-white/80 pointer-events-auto",children:[n.duration_label?(0,e.jsx)("span",{className:"reel-chip ghost",children:n.duration_label}):null,(0,e.jsxs)("span",{className:"reel-chip ghost",children:["\u{1F441} ",Number(n.views_count||0)]})]})]}),(0,e.jsxs)("div",{className:"absolute right-4 bottom-24 flex flex-col gap-5 items-center z-20",children:[(0,e.jsxs)("div",{className:"flex flex-col items-center gap-1",children:[(0,e.jsx)("button",{onClick:()=>N(n),className:`reel-action-btn ${n.is_liked?"liked":""}`,children:"\u2764\uFE0F"}),(0,e.jsx)("span",{className:"reel-action-label",children:n.likes_count||0})]}),(0,e.jsxs)("div",{className:"flex flex-col items-center gap-1",children:[(0,e.jsx)("button",{onClick:()=>U(n),className:"reel-action-btn",children:"\u{1F4AC}"}),(0,e.jsx)("span",{className:"reel-action-label",children:n.comments_count||0})]}),(0,e.jsxs)("div",{className:"flex flex-col items-center gap-1",children:[(0,e.jsx)("button",{onClick:()=>R(n),className:`reel-action-btn ${n.is_saved?"saved":""}`,children:"\u{1F516}"}),(0,e.jsx)("span",{className:"reel-action-label",children:"\u062D\u0641\u0638"})]}),(0,e.jsxs)("div",{className:"flex flex-col items-center gap-1",children:[(0,e.jsx)("button",{onClick:()=>x(n),className:"reel-action-btn",children:"\u2197"}),(0,e.jsx)("span",{className:"reel-action-label",children:"\u0645\u0634\u0627\u0631\u0643\u0629"})]})]}),w?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("button",{type:"button",className:"reel-arrow reel-arrow-up",onClick:()=>c(r-1),disabled:r===0,children:"\u2191"}),(0,e.jsx)("button",{type:"button",className:"reel-arrow reel-arrow-down",onClick:()=>c(r+1),disabled:r>=f.length-1,children:"\u2193"})]}):null]})}):null};function Ve(){let{pushToast:r}=te(),u=ee(),h=(0,o.useRef)(null),f=(0,o.useRef)(new Map),v=(0,o.useRef)(new Map),m=(0,o.useRef)([]),N=(0,o.useRef)(new Set),U=(0,o.useRef)(!1),R=(0,o.useRef)(0),x=J(),S=G(),[c,w]=(0,o.useState)([]),[n,L]=(0,o.useState)(!0),[s,y]=(0,o.useState)(0),[B,I]=(0,o.useState)(""),[g,C]=(0,o.useState)(!1),[z,H]=(0,o.useState)(!1),[we,ye]=(0,o.useState)(null),[Ne,O]=(0,o.useState)([]),[b,A]=(0,o.useState)({mediaUrl:"",previewUrl:"",uploading:!1,publishing:!1,content:"",fileName:""}),D=(0,o.useMemo)(()=>re(),[]),E=D.isLowEndDevice?1:2,P=(0,o.useMemo)(()=>typeof window<"u"&&window.matchMedia("(min-width: 1024px)").matches,[]),ke=(0,o.useCallback)(()=>{A({mediaUrl:"",previewUrl:"",uploading:!1,publishing:!1,content:"",fileName:""})},[]),k=(0,o.useCallback)(a=>{let t=Math.max(0,Math.min(a,c.length-1));Number.isFinite(t)&&(y(t),h.current?.scrollToItem?.(t,"start"))},[c.length]),Y=(0,o.useCallback)(async()=>{L(!0);try{let{data:a}=await se({limit:40,page:1}),l=(Array.isArray(a)?a:a?.items||[]).filter(d=>Be(d?.media_url||d?.video_url||"")).map(d=>({...d,media_url:d.media_url||d.video_url,recommendation_score:Pe(d),views_count:Number(d.views_count||d.view_count||0),poster_url:xe(d),duration_label:d.duration_label||d.duration||""})),p=await ge(l);w(Array.isArray(p)?p:l)}catch(a){r({type:"error",title:"\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0631\u064A\u0644\u0632",description:a?.message})}finally{L(!1)}},[r]);(0,o.useEffect)(()=>{Y()},[Y]),(0,o.useEffect)(()=>{new URLSearchParams(S.search).get("upload")==="1"&&C(!0)},[S.search]),(0,o.useEffect)(()=>(m.current.forEach(t=>t.remove?.()),m.current=[],c.slice(s+1,s+1+E).forEach(t=>{let l=ve(t,D,!1);if(!l)return;let p=document.createElement("link");p.rel="preload",p.as="video",p.href=l,document.head.appendChild(p),m.current.push(p)}),()=>{m.current.forEach(t=>t.remove?.())}),[s,D,c,E]),(0,o.useEffect)(()=>{f.current.forEach((t,l)=>{if(!t)return;let p=Math.abs(l-s)<=E,d=c[l];if(!p){t.pause(),t.removeAttribute("src"),t.load(),t.preload="none";return}if(!d)return;let X=ve(d,D,l===s);t.src!==X&&(t.src=X,t.load()),t.preload=l===s?"auto":"metadata",l===s?t.play().catch(()=>{}):t.pause()});let a=c[s];if(a){let t=String(a.id);if(v.current.has(t)&&clearTimeout(v.current.get(t)),!N.current.has(t)){let l=setTimeout(()=>{N.current.add(t)},2e3);return v.current.set(t,l),()=>clearTimeout(l)}}},[s,c,D,E]),(0,o.useEffect)(()=>{let a=t=>{P&&(g||z||(t.key==="ArrowDown"&&(t.preventDefault(),k(s+1)),t.key==="ArrowUp"&&(t.preventDefault(),k(s-1)),t.key.toLowerCase()==="u"&&(t.preventDefault(),C(!0))))};return window.addEventListener("keydown",a),()=>window.removeEventListener("keydown",a)},[s,P,k,z,g]);let K=(0,o.useCallback)((a,t)=>{t?f.current.set(a,t):f.current.delete(a)},[]),_e=(0,o.useCallback)(({startIndex:a})=>{a!==s&&y(a)},[s]),Ue=(0,o.useCallback)(a=>{g||z||U.current||Math.abs(a.deltaY)<18||(U.current=!0,k(s+(a.deltaY>0?1:-1)),window.setTimeout(()=>{U.current=!1},420))},[s,k,z,g]),Re=(0,o.useCallback)(a=>{R.current=a.touches?.[0]?.clientY||0},[]),Ce=(0,o.useCallback)(a=>{if(g||z)return;let t=a.changedTouches?.[0]?.clientY||0,l=R.current-t;Math.abs(l)<50||k(s+(l>0?1:-1))},[s,k,z,g]),Me=async(a,{burst:t=!1}={})=>{t&&(I(String(a.id)),setTimeout(()=>I(""),650));let l=[...c];w(p=>p.map(d=>d.id===a.id?{...d,is_liked:!d.is_liked,likes_count:d.is_liked?Number(d.likes_count||0)-1:Number(d.likes_count||0)+1}:d));try{await le(a.id)}catch{w(l),r({type:"error",title:"\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0639\u062C\u0627\u0628"})}},Se=async a=>{let t=[...c];w(l=>l.map(p=>p.id===a.id?{...p,is_saved:!p.is_saved}:p));try{await ne(a.id)}catch{w(t),r({type:"error",title:"\u062A\u0639\u0630\u0631 \u062D\u0641\u0638 \u0627\u0644\u0631\u064A\u0644"})}},ze=async a=>{try{await navigator.clipboard.writeText(`${window.location.origin}/reels/${a.id}`),r({type:"success",title:"\u062A\u0645 \u0646\u0633\u062E \u0631\u0627\u0628\u0637 \u0627\u0644\u0631\u064A\u0644"}),await de(a.id,"copy")}catch{r({type:"warning",title:"\u062A\u0639\u0630\u0631 \u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637"})}},Le=async a=>{ye(a),H(!0);try{let{data:t}=await pe(a.id);O(Array.isArray(t)?t:t?.items||[])}catch{O([])}},Ie=async()=>{if(!b.mediaUrl){r({type:"warning",title:"\u0627\u0631\u0641\u0639 \u0641\u064A\u062F\u064A\u0648 \u0623\u0648\u0644\u0627\u064B"});return}try{A(a=>({...a,publishing:!0})),await ie({content:b.content?.trim()||"\u0631\u064A\u0644 \u062C\u062F\u064A\u062F",media_url:b.mediaUrl,media:b.mediaUrl,media_urls:[b.mediaUrl]}),C(!1),ke(),x("/reels",{replace:!0}),await Y(),r({type:"success",title:"\u062A\u0645 \u0646\u0634\u0631 \u0627\u0644\u0631\u064A\u0644 \u0628\u0646\u062C\u0627\u062D"})}catch(a){A(t=>({...t,publishing:!1})),r({type:"error",title:"\u0641\u0634\u0644 \u0646\u0634\u0631 \u0627\u0644\u0631\u064A\u0644",description:a?.response?.data?.detail||a?.message})}},Te=(0,o.useMemo)(()=>({reels:c,activeIndex:s,setVideoRef:K,handleLike:Me,openComments:Le,handleSave:Se,handleShare:ze,currentUser:u,scrollToIndex:k,isDesktop:P}),[c,s,K,u,k,P]),Q=()=>{C(!1),x("/reels",{replace:!0})};return(0,e.jsx)(be,{hideNav:!0,children:(0,e.jsxs)("div",{className:"reels-page-shell",onWheelCapture:Ue,onTouchStart:Re,onTouchEnd:Ce,children:[(0,e.jsxs)("div",{className:"reels-header-bar",children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("h1",{children:"\u0627\u0644\u0631\u064A\u0644\u0632"}),(0,e.jsx)("p",{children:P?"\u0627\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0623\u0633\u0647\u0645 \u0644\u0644\u062A\u0646\u0642\u0644 \u0628\u064A\u0646 \u0627\u0644\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A":"\u0645\u0631\u0631 \u0644\u0623\u0639\u0644\u0649 \u0648\u0623\u0633\u0641\u0644 \u0644\u0644\u062A\u0646\u0642\u0644 \u0628\u064A\u0646 \u0627\u0644\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A"})]}),(0,e.jsx)("button",{type:"button",className:"upload-reel-button",onClick:()=>C(!0),children:"\u2B06 \u0631\u0641\u0639 \u0631\u064A\u0644"})]}),(0,e.jsx)("div",{className:"reels-stage-shell",children:n?(0,e.jsxs)("div",{className:"reels-loading-state",children:[(0,e.jsx)("div",{className:"reel-loader"}),(0,e.jsx)("p",{children:"\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0631\u064A\u0644\u0632..."})]}):c.length?(0,e.jsx)(me,{children:({height:a,width:t})=>(0,e.jsx)(ue,{ref:h,height:a,width:t,itemCount:c.length,itemSize:a,onItemsRendered:({visibleStartIndex:l})=>_e({startIndex:l}),itemData:Te,className:"no-scrollbar",children:Ee})}):(0,e.jsxs)("div",{className:"reels-empty-state",children:[(0,e.jsx)("div",{className:"empty-icon",children:"\u{1F3AC}"}),(0,e.jsx)("h2",{children:"\u0645\u0627\u0641\u064A\u0634 \u0631\u064A\u0644\u0632 \u0644\u0633\u0647"}),(0,e.jsx)("p",{children:"\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0632\u0631 \u0631\u0641\u0639 \u0631\u064A\u0644 \u0648\u0623\u0636\u0641 \u0623\u0648\u0644 \u0641\u064A\u062F\u064A\u0648 \u0628\u0634\u0643\u0644 \u0648\u0627\u0636\u062D \u0648\u0645\u0628\u0627\u0634\u0631."}),(0,e.jsx)(M,{onClick:()=>C(!0),children:"\u0631\u0641\u0639 \u0623\u0648\u0644 \u0631\u064A\u0644"})]})}),B?(0,e.jsx)("div",{className:"reel-heart-burst",children:"\u2764\uFE0F"}):null,(0,e.jsx)($,{isOpen:g,onClose:Q,title:"\u0625\u0636\u0627\u0641\u0629 \u0631\u064A\u0644 \u062C\u062F\u064A\u062F",children:(0,e.jsxs)("div",{className:"upload-modal-layout",children:[(0,e.jsxs)("div",{className:"upload-modal-help",children:[(0,e.jsx)("strong",{children:"\u0627\u0644\u062E\u0637\u0648\u0629 1"}),(0,e.jsx)("p",{children:"\u0627\u062E\u062A\u0631 \u0641\u064A\u062F\u064A\u0648 \u0648\u0627\u0636\u062D \u0644\u0644\u0631\u064A\u0644"}),(0,e.jsx)("strong",{children:"\u0627\u0644\u062E\u0637\u0648\u0629 2"}),(0,e.jsx)("p",{children:"\u0628\u0639\u062F \u0627\u0643\u062A\u0645\u0627\u0644 \u0627\u0644\u0631\u0641\u0639 \u0633\u064A\u0638\u0647\u0631 \u0644\u0643 \u0645\u0634\u063A\u0644 \u0641\u064A\u062F\u064A\u0648 \u0644\u0644\u0645\u0639\u0627\u064A\u0646\u0629"}),(0,e.jsx)("strong",{children:"\u0627\u0644\u062E\u0637\u0648\u0629 3"}),(0,e.jsx)("p",{children:"\u0627\u0636\u063A\u0637 \u0632\u0631 \u0646\u0634\u0631 \u0627\u0644\u0631\u064A\u0644"})]}),(0,e.jsx)("textarea",{value:b.content,onChange:a=>A(t=>({...t,content:a.target.value})),rows:4,placeholder:"\u0627\u0643\u062A\u0628 \u0648\u0635\u0641 \u0627\u0644\u0631\u064A\u0644 \u0623\u0648 \u0627\u0644\u0643\u0627\u0628\u0634\u0646",className:"upload-caption-field"}),(0,e.jsx)(q,{label:"\u0631\u0641\u0639 \u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0631\u064A\u0644",onUploadComplete:({url:a,previewUrl:t,file:l})=>{A(p=>({...p,mediaUrl:a||"",previewUrl:t||"",fileName:l?.name||"",uploading:!1})),r({type:"success",title:"\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648",description:"\u0631\u0627\u062C\u0639 \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u062B\u0645 \u0627\u0636\u063A\u0637 \u0646\u0634\u0631 \u0627\u0644\u0631\u064A\u0644."})},onError:a=>r({type:"error",title:"\u0641\u0634\u0644 \u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648",description:a})}),b.mediaUrl?(0,e.jsxs)("div",{className:"uploaded-preview-shell",children:[(0,e.jsxs)("div",{className:"uploaded-preview-head",children:[(0,e.jsx)("strong",{children:"\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0631\u064A\u0644"}),(0,e.jsx)("span",{children:b.fileName||"video.mp4"})]}),(0,e.jsx)("video",{src:b.mediaUrl,controls:!0,playsInline:!0,className:"uploaded-preview-video"})]}):null,(0,e.jsxs)("div",{className:"upload-modal-actions",children:[(0,e.jsx)(M,{variant:"secondary",onClick:Q,children:"\u0625\u063A\u0644\u0627\u0642"}),(0,e.jsx)(M,{onClick:Ie,loading:b.publishing,disabled:!b.mediaUrl||b.publishing,children:"\u0646\u0634\u0631 \u0627\u0644\u0631\u064A\u0644 \u0627\u0644\u0622\u0646"})]})]})}),(0,e.jsx)($,{isOpen:z,onClose:()=>H(!1),title:"\u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A",children:(0,e.jsx)("div",{className:"comments-modal-shell",children:(0,e.jsx)(fe,{comments:Ne,onAddComment:async a=>{let{data:t}=await ce(we.id,a);O(l=>[t,...l])}})})}),(0,e.jsx)("style",{children:`
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
        `})]})})}export{Ve as default};
