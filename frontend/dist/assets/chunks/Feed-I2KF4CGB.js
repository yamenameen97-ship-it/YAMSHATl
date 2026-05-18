import{a as ie}from"./chunk-ALW4JOJN.js";import{a as re,b as ne,c as k,d as oe}from"./chunk-OLPZG774.js";import{a as ae,c as te}from"./chunk-YUI6XURV.js";import{b as se}from"./chunk-VWSV6YD4.js";import{b as q,d as W,e as D,f as G}from"./chunk-WJMN45ZI.js";import{a as X,b as Z,c as ee}from"./chunk-4YVGGSCT.js";import{a as V}from"./chunk-SASJULPO.js";import{b as Y}from"./chunk-4XIFRW6W.js";import{a as J}from"./chunk-6PAOTIFF.js";import"./chunk-QDERKRC2.js";import"./chunk-7DXJ3TCH.js";import{a as E}from"./chunk-4VVMVC2S.js";import{G as H}from"./chunk-MYYGGH6K.js";import{a as Q,b as R}from"./chunk-T3SILTKH.js";import{d as v,k as w}from"./chunk-XSUFE7BX.js";w();var C=v(Q(),1);w();var l=v(Q(),1);var i=v(R(),1),M="yamshat_post_draft",_="yamshat_quote_draft";function de(a=""){let n=Array.from(new Set((a.match(/#[\p{L}\p{N}_-]+/gu)||[]).map(s=>s.replace("#","")))),r=Array.from(new Set((a.match(/@[\p{L}\p{N}_.-]+/gu)||[]).map(s=>s.replace("@",""))));return{hashtags:n,mentions:r}}function B(){let[a,n]=(0,l.useState)(""),[r,s]=(0,l.useState)(null),[m,c]=(0,l.useState)(null),[y,N]=(0,l.useState)(0),[p,b]=(0,l.useState)(!1),[f,I]=(0,l.useState)(!1),[P,t]=(0,l.useState)(""),[g,u]=(0,l.useState)(!1),[h,S]=(0,l.useState)(null),T=(0,l.useRef)(null),pe=q(),{pushToast:U}=Y();(0,l.useEffect)(()=>{let o=localStorage.getItem(M),d=localStorage.getItem(_);if(o&&n(o),d)try{S(JSON.parse(d))}catch{localStorage.removeItem(_)}let F=()=>{try{let A=JSON.parse(localStorage.getItem(_)||"null");S(A)}catch{S(null)}};return window.addEventListener("yamshat:quote-post",F),()=>window.removeEventListener("yamshat:quote-post",F)},[]),(0,l.useEffect)(()=>{let o=window.setTimeout(()=>{a.trim()?localStorage.setItem(M,a):localStorage.removeItem(M)},500);return()=>window.clearTimeout(o)},[a]);let x=(0,l.useMemo)(()=>de(a),[a]),ge=()=>{n(""),s(null),c(null),N(0),t(""),I(!1),u(!1),S(null),T.current&&(T.current.value=""),localStorage.removeItem(M),localStorage.removeItem(_)},$=o=>{n(d=>`${d}${d&&!d.endsWith(" ")?" ":""}${o}`)},ue=o=>{let d=o.target.files?.[0];if(d){if(d.size>200*1024*1024){U({type:"error",title:"\u0627\u0644\u0645\u0644\u0641 \u0643\u0628\u064A\u0631 \u062C\u062F\u064B\u0627",description:"\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 200 \u0645\u064A\u062C\u0627."});return}s(d),c(URL.createObjectURL(d))}},O=async(o="published")=>{if(!(p||!a.trim()&&!r&&!h)){b(!0);try{let d="";if(r){let L=await J.uploadFile(r,{purpose:r?.type?.startsWith("video/")?"post-video":"post-image",onProgress:j=>{let ye=Number(typeof j=="number"?j||0:j?.percent||0);N(ye)}});d=L?.mediaUrl||L?.url||L?.file_url||""}let{hashtags:F,mentions:A}=de(a);await Z({content:a,media_url:d,status:o,scheduled_at:o==="scheduled"?P:null,is_pinned:g,hashtags:F,mentions:A,quote_source_id:h?.id||null}),U({type:"success",title:o==="draft"?"\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0645\u0633\u0648\u062F\u0629":o==="scheduled"?"\u062A\u0645\u062A \u062C\u062F\u0648\u0644\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631":"\u062A\u0645 \u0646\u0634\u0631 \u0627\u0644\u0645\u0646\u0634\u0648\u0631",description:g?"\u0627\u0644\u0645\u0646\u0634\u0648\u0631 \u0645\u062A\u062C\u0647\u0632 \u0643\u0645\u0646\u0634\u0648\u0631 \u0645\u062B\u0628\u062A.":void 0}),ge(),pe.invalidateQueries(["feed-data"])}catch(d){U({type:"error",title:"\u0641\u0634\u0644 \u0646\u0634\u0631 \u0627\u0644\u0645\u0646\u0634\u0648\u0631",description:d?.response?.data?.detail||d?.message||"\u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u062A\u0627\u0646\u064A\u0629."})}finally{b(!1)}}};return(0,i.jsxs)(V,{style:{marginBottom:24,padding:20,border:"1px solid var(--line)"},children:[(0,i.jsxs)("div",{style:{display:"flex",gap:12},children:[(0,i.jsx)("div",{style:{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg, #3b82f6, #8b5cf6)",flexShrink:0}}),(0,i.jsxs)("div",{style:{flex:1},children:[h?(0,i.jsx)("div",{style:{borderRadius:16,padding:12,background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.12)",marginBottom:12},children:(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start"},children:[(0,i.jsxs)("div",{children:[(0,i.jsxs)("div",{style:{fontWeight:700,marginBottom:4},children:["\u0627\u0642\u062A\u0628\u0627\u0633 \u0645\u0646 @",h.username]}),(0,i.jsx)("div",{className:"muted",style:{fontSize:13,lineHeight:1.6},children:h.content})]}),(0,i.jsx)("button",{type:"button",onClick:()=>{S(null),localStorage.removeItem(_)},style:{background:"none",border:"none",cursor:"pointer",fontSize:18},children:"\u2715"})]})}):null,(0,i.jsx)("textarea",{placeholder:"\u0627\u0643\u062A\u0628 \u0645\u0646\u0634\u0648\u0631\u0643... \u0627\u0633\u062A\u062E\u062F\u0645 #\u0647\u0627\u0634\u062A\u0627\u062C \u0648 @\u0645\u0646\u0634\u0646 \u0644\u0648 \u062D\u0627\u0628\u0628",value:a,onChange:o=>n(o.target.value),style:{width:"100%",minHeight:96,background:"transparent",border:"none",color:"var(--text)",fontSize:16,resize:"none",outline:"none",paddingTop:8,lineHeight:1.7}})]})]}),(0,i.jsxs)("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginTop:10},children:[(0,i.jsx)("button",{type:"button",className:"composer-chip",onClick:()=>$("#\u062A\u0631\u0646\u062F"),children:"#\u0647\u0627\u0634\u062A\u0627\u062C"}),(0,i.jsx)("button",{type:"button",className:"composer-chip",onClick:()=>$("@username"),children:"@\u0645\u0646\u0634\u0646"}),(0,i.jsx)("button",{type:"button",className:"composer-chip",onClick:()=>$("\u0627\u0642\u062A\u0628\u0627\u0633: "),children:"\u0627\u0642\u062A\u0628\u0627\u0633"}),(0,i.jsx)("button",{type:"button",className:`composer-chip ${g?"active":""}`,onClick:()=>u(o=>!o),children:"\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u0645\u0646\u0634\u0648\u0631"})]}),x.hashtags.length||x.mentions.length?(0,i.jsxs)("div",{style:{display:"grid",gap:8,marginTop:12},children:[x.hashtags.length?(0,i.jsxs)("div",{className:"muted",style:{fontSize:13},children:["\u0647\u0627\u0634\u062A\u0627\u062C: ",x.hashtags.map(o=>`#${o}`).join(" \xB7 ")]}):null,x.mentions.length?(0,i.jsxs)("div",{className:"muted",style:{fontSize:13},children:["\u0645\u0646\u0634\u0646: ",x.mentions.map(o=>`@${o}`).join(" \xB7 ")]}):null]}):null,m?(0,i.jsxs)("div",{style:{position:"relative",marginTop:12,borderRadius:12,overflow:"hidden",maxHeight:320},children:[(0,i.jsx)("button",{type:"button",onClick:()=>{s(null),c(null)},style:{position:"absolute",top:10,right:10,background:"rgba(0,0,0,0.5)",color:"white",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",zIndex:1},children:"\u2715"}),r?.type?.startsWith("video")?(0,i.jsx)("video",{src:m,style:{width:"100%",display:"block"},controls:!0}):(0,i.jsx)("img",{src:m,style:{width:"100%",objectFit:"cover"},alt:"Preview"}),p?(0,i.jsx)("div",{style:{position:"absolute",bottom:0,left:0,right:0,height:4,background:"rgba(255,255,255,0.2)"},children:(0,i.jsx)("div",{style:{height:"100%",background:"var(--accent)",width:`${y}%`,transition:"width 0.2s"}})}):null]}):null,f?(0,i.jsxs)("div",{style:{marginTop:16,padding:12,background:"var(--bg-soft)",borderRadius:12,border:"1px solid var(--line)"},children:[(0,i.jsx)("label",{style:{display:"block",marginBottom:8,fontSize:13,fontWeight:"bold"},children:"\u062A\u062D\u062F\u064A\u062F \u0648\u0642\u062A \u0627\u0644\u0646\u0634\u0631"}),(0,i.jsx)("input",{type:"datetime-local",value:P,onChange:o=>t(o.target.value),style:{width:"100%",background:"var(--bg-input)",color:"var(--text)",border:"1px solid var(--line)",padding:10,borderRadius:8}})]}):null,(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",marginTop:16,alignItems:"center",borderTop:"1px solid var(--line)",paddingTop:16,gap:12,flexWrap:"wrap"},children:[(0,i.jsxs)("div",{style:{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"},children:[(0,i.jsx)("button",{type:"button",onClick:()=>T.current?.click(),style:{background:"none",border:"none",cursor:"pointer",fontSize:20,opacity:.8},title:"\u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u0623\u0648 \u0641\u064A\u062F\u064A\u0648",children:"\u{1F5BC}\uFE0F"}),(0,i.jsx)("button",{type:"button",onClick:()=>I(o=>!o),style:{background:"none",border:"none",cursor:"pointer",fontSize:20,opacity:f?1:.8,color:f?"var(--accent)":"inherit"},title:"\u062C\u062F\u0648\u0644\u0629",children:"\u{1F4C5}"}),(0,i.jsx)("span",{className:"muted",style:{fontSize:13},children:g?"\u0647\u064A\u062A\u062B\u0628\u062A \u0628\u0639\u062F \u0627\u0644\u0646\u0634\u0631":"\u0645\u0646\u0634\u0648\u0631 \u0639\u0627\u062F\u064A"}),(0,i.jsx)("input",{type:"file",ref:T,hidden:!0,accept:"image/*,video/*",onChange:ue})]}),(0,i.jsxs)("div",{style:{display:"flex",gap:10,flexWrap:"wrap"},children:[(0,i.jsx)(E,{variant:"secondary",onClick:()=>O("draft"),disabled:p||!a.trim()&&!h,children:"\u062D\u0641\u0638 \u0645\u0633\u0648\u062F\u0629"}),(0,i.jsx)(E,{onClick:()=>O(f?"scheduled":"published"),loading:p,disabled:p||!a.trim()&&!r&&!h,children:f?"\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062C\u062F\u0648\u0644\u0629":"\u0646\u0634\u0631"})]})]}),(0,i.jsx)("style",{children:`
        .composer-chip {
          border: 1px solid rgba(59,130,246,0.15);
          background: rgba(59,130,246,0.06);
          color: var(--text);
          padding: 6px 12px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
        }
        .composer-chip.active {
          background: rgba(16,185,129,0.12);
          border-color: rgba(16,185,129,0.3);
          color: #059669;
        }
      `})]})}w();var me=v(Q(),1);function ce(a={}){let{tab:n="all",filter:r="latest",limit:s=10,pollingInterval:m=3e4}=a,c=(0,me.useRef)(Date.now()),y=G({queryKey:["feed-data",n,r],queryFn:async({pageParam:p=1})=>{let b=await X({tab:n,filter:r,page:p,limit:s});return c.current=Date.now(),b.data},getNextPageParam:(p,b)=>p?.length===s?b.length+1:void 0,staleTime:300*1e3,cacheTime:1800*1e3,refetchOnWindowFocus:!0,refetchInterval:p=>p?.pages?.length===1&&document.visibilityState==="visible"?m:!1});return{posts:y.data?.pages.flatMap(p=>p)||[],...y,lastFetched:c.current}}var e=v(R(),1);function z({name:a,src:n,size:r=46,ring:s=!1}){let m={width:r,height:r,borderRadius:"50%",objectFit:"cover",border:s?"2px solid rgba(139,92,246,0.8)":"none",boxShadow:s?"0 0 0 4px rgba(139,92,246,0.14)":"none",flexShrink:0};return n?(0,e.jsx)("img",{src:n,alt:a,style:m}):(0,e.jsx)("div",{style:{...m,display:"grid",placeItems:"center",color:"white",fontWeight:900,background:ne(a)},children:re(a).slice(0,1)})}function K(a){return Array.isArray(a?.media_urls)&&a.media_urls.length?a.media_urls:Array.isArray(a?.images)&&a.images.length?a.images:a?.image_url?[a.image_url]:a?.media?[a.media]:[]}function be({media:a,title:n}){let r=a.slice(0,3);return r.length?r.length===1?(0,e.jsx)("img",{src:r[0],alt:n,className:"yam-feed-main-media"}):(0,e.jsxs)("div",{className:`yam-feed-media-grid ${r.length===2?"two":"three"}`,children:[(0,e.jsx)("img",{src:r[0],alt:n,className:"primary"}),(0,e.jsx)("div",{className:"secondary-stack",children:r.slice(1).map((s,m)=>(0,e.jsxs)("div",{className:"secondary-cell",children:[(0,e.jsx)("img",{src:s,alt:`${n}-${m}`}),m===1&&a.length>3?(0,e.jsxs)("span",{className:"media-overlay",children:["+",a.length-3]}):null]},`${s}-${m}`))})]}):(0,e.jsxs)("div",{className:"yam-feed-fallback-media",children:[(0,e.jsxs)("div",{className:"monitor-grid",children:[(0,e.jsx)("div",{}),(0,e.jsx)("div",{}),(0,e.jsx)("div",{})]}),(0,e.jsx)("strong",{children:n||"Gaming vibes"})]})}function fe({post:a,onLike:n}){let r=K(a),s=a.likes_count??a.like_count??a.likes??0,m=a.comments_count??a.comment_count??Math.max(12,Math.floor(s/9)),c=a.share_count??a.shares??Math.max(6,Math.floor(s/18));return(0,e.jsxs)("article",{className:"yam-feed-post-card",children:[(0,e.jsxs)("div",{className:"yam-post-header",children:[(0,e.jsxs)("div",{className:"yam-post-author",children:[(0,e.jsx)(z,{name:a.username||"User",src:a.avatar}),(0,e.jsxs)("div",{children:[(0,e.jsxs)("div",{className:"yam-post-author-line",children:[(0,e.jsx)("strong",{children:a.username||"Creator"}),(0,e.jsx)("span",{className:"verify-dot",children:"\u2713"})]}),(0,e.jsx)("small",{children:oe(a.created_at)})]})]}),(0,e.jsx)("button",{type:"button",className:"yam-icon-ghost",children:"\u22EF"})]}),(0,e.jsx)("div",{className:"yam-post-copy",children:a.content||"\u062C\u0644\u0633\u0629 \u0645\u0645\u062A\u0639\u0629 \u0627\u0644\u064A\u0648\u0645 \u0645\u0639 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u064A\u0646! \u0634\u0643\u0631\u0627\u064B \u0644\u0643\u0644 \u0645\u0646 \u0643\u0627\u0646 \u0645\u0648\u062C\u0648\u062F."}),(0,e.jsx)(be,{media:r,title:a.content||a.username}),(0,e.jsxs)("div",{className:"yam-post-actions",children:[(0,e.jsxs)("button",{type:"button",className:"yam-react-btn",onClick:()=>n(a.id),children:["\u2764 ",(0,e.jsx)("span",{children:k(s)})]}),(0,e.jsxs)("button",{type:"button",className:"yam-react-btn",children:["\u{1F4AC} ",(0,e.jsx)("span",{children:k(m)})]}),(0,e.jsxs)("button",{type:"button",className:"yam-react-btn",children:["\u2934 ",(0,e.jsx)("span",{children:k(c)})]}),(0,e.jsx)("button",{type:"button",className:"yam-react-btn save",children:"\u2311"})]})]})}function he(){let a=q(),n=H(),{posts:r=[],isLoading:s,refetch:m}=ce({limit:10,pollingInterval:25e3}),{data:c=[]}=W({queryKey:["feed-users-sidebar"],queryFn:async()=>(await ae()).data||[],staleTime:6e4}),{data:y=[]}=W({queryKey:["feed-live-sidebar"],queryFn:async()=>(await ie()).data||[],staleTime:15e3,refetchInterval:2e4}),N=D({mutationFn:ee,onSettled:()=>a.invalidateQueries({queryKey:["feed-data"]})}),p=D({mutationFn:te,onSettled:()=>a.invalidateQueries({queryKey:["feed-users-sidebar"]})}),b=(0,C.useMemo)(()=>{let t=Array.isArray(y)?y.slice(0,2).map(u=>({id:`live-${u.id}`,username:u.host||u.username||"PlayerOne",avatar:u.avatar,live:!0})):[],g=Array.isArray(c)?c.slice(0,4).map(u=>({id:u.username,username:u.username,avatar:u.avatar,live:!1})):[];return[...t,...g].slice(0,5)},[y,c]),f=(0,C.useMemo)(()=>[...r].sort((t,g)=>Number(g.likes_count??g.like_count??g.likes??0)-Number(t.likes_count??t.like_count??t.likes??0)).slice(0,3),[r]),I=(0,C.useMemo)(()=>c.filter(t=>t.username!==n).slice(0,5),[c,n]),P=(0,C.useMemo)(()=>c.filter(t=>t.username!==n).slice(0,3),[c,n]);return(0,e.jsxs)(se,{children:[(0,e.jsxs)("div",{className:"yam-feed-page desktop-post mobile-post",children:[(0,e.jsxs)("div",{className:"yam-feed-main-column",children:[(0,e.jsxs)("section",{className:"yam-feed-composer-shell",children:[(0,e.jsxs)("div",{className:"yam-feed-composer-head",children:[(0,e.jsx)(z,{name:n||"You",size:54,ring:!0}),(0,e.jsxs)("div",{className:"yam-feed-composer-prompt",children:[(0,e.jsx)("strong",{children:"\u0628\u0645 \u062A\u0641\u0643\u0631 \u0627\u0644\u064A\u0648\u0645\u061F"}),(0,e.jsx)("span",{children:"\u0646\u0635 \u2022 \u0635\u0648\u0631\u0629 \u2022 \u0645\u0642\u0637\u0639 \u0642\u0635\u064A\u0631 \u2022 \u0644\u0627\u064A\u0641 \u0645\u0628\u0627\u0634\u0631"})]})]}),(0,e.jsx)(B,{})]}),(0,e.jsxs)("div",{className:"yam-feed-sort-row",children:[(0,e.jsx)("span",{children:"\u0639\u0631\u0636 \u062D\u0633\u0628"}),(0,e.jsx)("strong",{children:"\u0623\u062D\u062F\u062B \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A"}),(0,e.jsx)("button",{type:"button",className:"yam-refresh-btn",onClick:()=>m(),children:"\u062A\u062D\u062F\u064A\u062B"})]}),(0,e.jsxs)("div",{className:"yam-feed-posts-stack",children:[s?(0,e.jsx)("div",{className:"yam-empty-block",children:"\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A..."}):null,!s&&!r.length?(0,e.jsx)("div",{className:"yam-empty-block",children:"\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0646\u0634\u0648\u0631\u0627\u062A \u062D\u0627\u0644\u064A\u0627\u064B."}):null,r.map(t=>(0,e.jsx)(fe,{post:t,onLike:g=>N.mutate(g)},t.id))]})]}),(0,e.jsxs)("aside",{className:"yam-feed-right-column",children:[(0,e.jsxs)("section",{className:"yam-side-card",children:[(0,e.jsxs)("div",{className:"yam-side-card-head",children:[(0,e.jsx)("h3",{children:"\u0627\u0644\u0642\u0635\u0635"}),(0,e.jsx)("span",{children:"\u0639\u0631\u0636 \u0627\u0644\u0643\u0644"})]}),(0,e.jsxs)("div",{className:"yam-story-row",children:[(0,e.jsxs)("button",{type:"button",className:"yam-add-story",children:["\uFF0B",(0,e.jsx)("small",{children:"\u0625\u0636\u0627\u0641\u0629 \u0642\u0635\u0629"})]}),b.map(t=>(0,e.jsxs)("div",{className:"yam-story-user",children:[(0,e.jsx)("div",{className:`yam-story-ring ${t.live?"live":""}`,children:(0,e.jsx)(z,{name:t.username,src:t.avatar,size:58})}),t.live?(0,e.jsx)("span",{className:"yam-story-live",children:"LIVE"}):null,(0,e.jsx)("small",{children:t.username})]},t.id))]})]}),(0,e.jsxs)("section",{className:"yam-side-card",children:[(0,e.jsxs)("div",{className:"yam-side-card-head",children:[(0,e.jsx)("h3",{children:"\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0627\u0644\u0631\u0627\u0626\u062C\u0629"}),(0,e.jsx)("span",{children:"\u0639\u0631\u0636 \u0627\u0644\u0645\u0632\u064A\u062F"})]}),(0,e.jsx)("div",{className:"yam-trending-list",children:f.map(t=>(0,e.jsxs)("div",{className:"yam-trending-item",children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:t.username}),(0,e.jsx)("p",{children:(t.content||"\u0645\u0646\u0634\u0648\u0631 \u0645\u0645\u064A\u0632").slice(0,70)}),(0,e.jsxs)("div",{className:"yam-trending-stats",children:["\u2764 ",k(t.likes_count??t.like_count??t.likes??0)," \xB7 \u{1F4AC} ",k(t.comments_count??0)]})]}),(0,e.jsx)("div",{className:"yam-trending-thumb",children:K(t)[0]?(0,e.jsx)("img",{src:K(t)[0],alt:t.username}):(0,e.jsx)("span",{children:"\u{1F3AE}"})})]},t.id))})]}),(0,e.jsxs)("section",{className:"yam-side-card",children:[(0,e.jsxs)("div",{className:"yam-side-card-head",children:[(0,e.jsx)("h3",{children:"\u0627\u0644\u0623\u0635\u062F\u0642\u0627\u0621 \u0627\u0644\u0645\u062A\u0635\u0644\u0648\u0646"}),(0,e.jsx)("span",{children:"\u0639\u0631\u0636 \u0627\u0644\u0643\u0644"})]}),(0,e.jsx)("div",{className:"yam-online-list",children:I.map(t=>(0,e.jsxs)("div",{className:"yam-online-item",children:[(0,e.jsxs)("div",{className:"yam-online-meta",children:[(0,e.jsxs)("div",{className:"yam-online-avatar-wrap",children:[(0,e.jsx)(z,{name:t.username,src:t.avatar,size:42}),(0,e.jsx)("span",{className:"online-indicator"})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:t.username}),(0,e.jsx)("small",{children:t.profile?.activity_tagline||"\u0645\u062A\u0635\u0644 \u0627\u0644\u0622\u0646"})]})]}),(0,e.jsx)("button",{type:"button",className:"yam-chat-shortcut",children:"\u{1F4AC}"})]},t.username))})]}),(0,e.jsxs)("section",{className:"yam-side-card promo",children:[(0,e.jsx)("div",{className:"promo-visual",children:"\u{1F3AE}"}),(0,e.jsx)("h3",{children:"\u0627\u0646\u0636\u0645 \u0625\u0644\u0649 \u0645\u062C\u062A\u0645\u0639 \u064A\u0627\u0645\u0634\u0627\u062A"}),(0,e.jsx)("p",{children:"\u0627\u0643\u062A\u0634\u0641 \u0645\u062D\u062A\u0648\u0649 \u062C\u062F\u064A\u062F \u0648\u062A\u0639\u0631\u0651\u0641 \u0639\u0644\u0649 \u0623\u0635\u062F\u0642\u0627\u0621 \u062C\u062F\u062F \u0648\u0627\u0633\u062A\u0645\u062A\u0639 \u0628\u062A\u062C\u0631\u0628\u0629 \u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0641\u0631\u064A\u062F\u0629."}),(0,e.jsx)("button",{type:"button",className:"yam-primary-wide",children:"\u0627\u0633\u062A\u0643\u0634\u0641 \u0627\u0644\u0622\u0646"})]}),(0,e.jsxs)("section",{className:"yam-side-card",children:[(0,e.jsxs)("div",{className:"yam-side-card-head",children:[(0,e.jsx)("h3",{children:"\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629"}),(0,e.jsx)("span",{children:"\u0639\u0631\u0636 \u0627\u0644\u0643\u0644"})]}),(0,e.jsx)("div",{className:"yam-suggest-list",children:P.map(t=>(0,e.jsxs)("div",{className:"yam-suggest-row",children:[(0,e.jsxs)("div",{className:"yam-online-meta",children:[(0,e.jsx)(z,{name:t.username,src:t.avatar,size:42}),(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:t.username}),(0,e.jsx)("small",{children:t.email||"Gaming creator"})]})]}),(0,e.jsx)("button",{type:"button",className:"yam-follow-inline",onClick:()=>p.mutate(t.username),children:"\u0645\u062A\u0627\u0628\u0639\u0629"})]},t.username))})]})]})]}),(0,e.jsx)("style",{children:`
        .yam-feed-page {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 18px;
          padding: 18px;
        }
        @media (max-width: 1023px) {
          .yam-feed-page {
            grid-template-columns: 1fr;
            padding: 10px;
          }
          .yam-feed-right-column {
            display: none;
          }
        }
        .yam-feed-main-column { min-width: 0; display: grid; gap: 16px; }
        .yam-feed-right-column { display: grid; gap: 16px; align-content: start; }
        .yam-feed-composer-shell,
        .yam-side-card,
        .yam-feed-post-card {
          border-radius: 28px;
          background: rgba(7, 12, 24, 0.88);
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 24px 50px rgba(2,6,23,0.24);
          overflow: hidden;
        }
        .yam-feed-composer-shell { padding: 18px; }
        .yam-feed-composer-head {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }
        .yam-feed-composer-prompt strong { display: block; font-size: 18px; }
        .yam-feed-composer-prompt span { color: #94a3b8; font-size: 13px; }
        .yam-feed-sort-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #94a3b8;
          padding: 0 8px;
          font-size: 14px;
        }
        .yam-refresh-btn {
          margin-inline-start: auto;
          border: none;
          background: rgba(124,58,237,0.18);
          color: white;
          padding: 10px 14px;
          border-radius: 14px;
          font-weight: 700;
        }
        .yam-feed-posts-stack { display: grid; gap: 16px; }
        .yam-feed-post-card { padding: 18px; display: grid; gap: 16px; }
        .yam-post-header,
        .yam-post-actions,
        .yam-side-card-head,
        .yam-online-item,
        .yam-suggest-row,
        .yam-trending-item,
        .yam-post-author,
        .yam-online-meta { display: flex; align-items: center; gap: 12px; }
        .yam-post-header, .yam-side-card-head, .yam-trending-item, .yam-suggest-row, .yam-online-item {
          justify-content: space-between;
        }
        .yam-post-author-line { display: flex; align-items: center; gap: 6px; font-size: 16px; }
        .verify-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #3b82f6;
          color: white;
          font-size: 11px;
          font-weight: 900;
        }
        .yam-post-copy {
          color: #dbe4ff;
          line-height: 1.9;
          white-space: pre-wrap;
        }
        .yam-feed-main-media {
          width: 100%;
          max-height: 430px;
          object-fit: cover;
          border-radius: 24px;
          display: block;
        }
        .yam-feed-media-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(200px, 0.9fr);
          gap: 10px;
          min-height: 320px;
        }
        .yam-feed-media-grid.two .secondary-stack { grid-template-rows: 1fr; }
        .yam-feed-media-grid img,
        .yam-feed-media-grid video,
        .yam-trending-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .yam-feed-media-grid .primary,
        .yam-feed-fallback-media { border-radius: 22px; min-height: 320px; }
        .secondary-stack { display: grid; gap: 10px; }
        .secondary-cell { position: relative; border-radius: 22px; overflow: hidden; min-height: 155px; }
        .media-overlay {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: rgba(6,10,18,0.46);
          color: white;
          font-size: 30px;
          font-weight: 900;
          backdrop-filter: blur(4px);
        }
        .yam-feed-fallback-media {
          padding: 28px;
          background: radial-gradient(circle at top, rgba(139,92,246,0.26), transparent 50%), linear-gradient(135deg, rgba(10,18,38,0.96), rgba(7,12,24,1));
          display: grid;
          align-content: center;
          gap: 18px;
          color: white;
        }
        .monitor-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .monitor-grid div { min-height: 110px; border-radius: 18px; background: linear-gradient(135deg, rgba(59,130,246,0.24), rgba(139,92,246,0.34)); border: 1px solid rgba(255,255,255,0.08); }
        .yam-post-actions { justify-content: flex-start; flex-wrap: wrap; }
        .yam-react-btn, .yam-icon-ghost, .yam-chat-shortcut, .yam-follow-inline {
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.04);
          color: white;
          border-radius: 14px;
          padding: 10px 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
        }
        .yam-icon-ghost, .yam-chat-shortcut { width: 42px; height: 42px; padding: 0; justify-content: center; }
        .yam-react-btn.save { margin-inline-start: auto; }
        .yam-side-card { padding: 18px; display: grid; gap: 14px; }
        .yam-side-card-head h3 { margin: 0; font-size: 18px; }
        .yam-side-card-head span { color: #8b5cf6; font-size: 13px; font-weight: 700; }
        .yam-story-row { display: flex; align-items: flex-start; gap: 14px; overflow-x: auto; padding-bottom: 4px; }
        .yam-story-row::-webkit-scrollbar { height: 5px; }
        .yam-story-user { display: grid; justify-items: center; gap: 8px; min-width: 72px; }
        .yam-story-user small { color: #cbd5e1; }
        .yam-story-ring {
          padding: 4px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(236,72,153,0.88), rgba(124,58,237,0.88));
        }
        .yam-story-ring.live { background: linear-gradient(135deg, rgba(239,68,68,0.95), rgba(168,85,247,0.88)); }
        .yam-story-live {
          padding: 4px 8px;
          border-radius: 999px;
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 900;
          margin-top: -16px;
          z-index: 1;
        }
        .yam-add-story {
          min-width: 72px;
          min-height: 72px;
          border-radius: 50%;
          border: 1px dashed rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.02);
          color: white;
          display: grid;
          place-items: center;
          gap: 4px;
          padding: 0;
          font-size: 26px;
        }
        .yam-add-story small { font-size: 12px; color: #94a3b8; }
        .yam-trending-list, .yam-online-list, .yam-suggest-list { display: grid; gap: 12px; }
        .yam-trending-item, .yam-online-item, .yam-suggest-row {
          padding: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,0.03);
          gap: 12px;
        }
        .yam-trending-item p { margin: 6px 0 8px; color: #cbd5e1; line-height: 1.7; }
        .yam-trending-thumb {
          width: 92px;
          height: 92px;
          border-radius: 18px;
          overflow: hidden;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(59,130,246,0.24), rgba(139,92,246,0.22));
          display: grid;
          place-items: center;
          font-size: 24px;
        }
        .yam-trending-stats, .yam-online-item small, .yam-suggest-row small { color: #94a3b8; font-size: 13px; }
        .yam-online-avatar-wrap { position: relative; }
        .online-indicator {
          position: absolute;
          bottom: 1px;
          inset-inline-end: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #22c55e;
          border: 2px solid rgba(7,12,24,0.94);
        }
        .promo { text-align: center; }
        .promo-visual {
          width: 92px;
          height: 92px;
          border-radius: 26px;
          display: grid;
          place-items: center;
          margin: 0 auto 8px;
          font-size: 42px;
          background: linear-gradient(135deg, rgba(124,58,237,0.26), rgba(99,102,241,0.14));
        }
        .promo p { margin: 0; color: #94a3b8; line-height: 1.8; }
        .yam-primary-wide, .yam-follow-inline {
          border: none;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          color: white;
          border-radius: 16px;
          padding: 12px 16px;
          font-weight: 800;
        }
        .yam-follow-inline { padding: 10px 14px; }
        .yam-empty-block {
          border-radius: 24px;
          background: rgba(7,12,24,0.88);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 24px;
          text-align: center;
          color: #94a3b8;
        }
        @media (max-width: 1280px) {
          .yam-feed-page { grid-template-columns: minmax(0, 1fr) 320px; }
        }
        @media (max-width: 1024px) {
          .yam-feed-page { grid-template-columns: 1fr; }
          .yam-feed-right-column { order: -1; }
        }
        @media (max-width: 680px) {
          .yam-feed-page { padding: 12px; }
          .yam-feed-media-grid { grid-template-columns: 1fr; }
          .yam-react-btn.save { margin-inline-start: 0; }
          .yam-trending-thumb { width: 74px; height: 74px; }
        }
      `})]})}export{he as default};
