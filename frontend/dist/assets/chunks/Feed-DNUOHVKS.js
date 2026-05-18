import{a as k,b as _}from"./chunk-FDZSA5LI.js";import{a as z,c as F}from"./chunk-UQKSSL3E.js";import{a as A}from"./chunk-M3EH6G56.js";import{a as C,b as M,c as l,d as q}from"./chunk-OLPZG774.js";import{b as L}from"./chunk-OEVOLIXQ.js";import{b as v,d as u,e as b}from"./chunk-WJMN45ZI.js";import{d as N}from"./chunk-EWGLDKFP.js";import"./chunk-SASJULPO.js";import"./chunk-4XIFRW6W.js";import"./chunk-J63QYVMM.js";import"./chunk-O7PWFVGO.js";import"./chunk-4VVMVC2S.js";import"./chunk-Y2LPHHCG.js";import"./chunk-7DXJ3TCH.js";import{H as w}from"./chunk-AJGMHTUE.js";import{a as I,b as x}from"./chunk-T3SILTKH.js";import{d as y,k as h}from"./chunk-XSUFE7BX.js";h();var c=y(I(),1);var a=y(x(),1);function p({name:i,src:r,size:t=46,ring:s=!1}){let n={width:t,height:t,borderRadius:"50%",objectFit:"cover",border:s?"2px solid rgba(139,92,246,0.8)":"none",boxShadow:s?"0 0 0 4px rgba(139,92,246,0.14)":"none",flexShrink:0};return r?(0,a.jsx)("img",{src:r,alt:i,style:n}):(0,a.jsx)("div",{style:{...n,display:"grid",placeItems:"center",color:"white",fontWeight:900,background:M(i)},children:C(i).slice(0,1)})}function f(i){return Array.isArray(i?.media_urls)&&i.media_urls.length?i.media_urls:Array.isArray(i?.images)&&i.images.length?i.images:i?.image_url?[i.image_url]:i?.media?[i.media]:[]}function K({media:i,title:r}){let t=i.slice(0,3);return t.length?t.length===1?(0,a.jsx)("img",{src:t[0],alt:r,className:"yam-feed-main-media"}):(0,a.jsxs)("div",{className:`yam-feed-media-grid ${t.length===2?"two":"three"}`,children:[(0,a.jsx)("img",{src:t[0],alt:r,className:"primary"}),(0,a.jsx)("div",{className:"secondary-stack",children:t.slice(1).map((s,n)=>(0,a.jsxs)("div",{className:"secondary-cell",children:[(0,a.jsx)("img",{src:s,alt:`${r}-${n}`}),n===1&&i.length>3?(0,a.jsxs)("span",{className:"media-overlay",children:["+",i.length-3]}):null]},`${s}-${n}`))})]}):(0,a.jsxs)("div",{className:"yam-feed-fallback-media",children:[(0,a.jsxs)("div",{className:"monitor-grid",children:[(0,a.jsx)("div",{}),(0,a.jsx)("div",{}),(0,a.jsx)("div",{})]}),(0,a.jsx)("strong",{children:r||"Gaming vibes"})]})}function Q({post:i,onLike:r}){let t=f(i),s=i.likes_count??i.like_count??i.likes??0,n=i.comments_count??i.comment_count??Math.max(12,Math.floor(s/9)),d=i.share_count??i.shares??Math.max(6,Math.floor(s/18));return(0,a.jsxs)("article",{className:"yam-feed-post-card",children:[(0,a.jsxs)("div",{className:"yam-post-header",children:[(0,a.jsxs)("div",{className:"yam-post-author",children:[(0,a.jsx)(p,{name:i.username||"User",src:i.avatar}),(0,a.jsxs)("div",{children:[(0,a.jsxs)("div",{className:"yam-post-author-line",children:[(0,a.jsx)("strong",{children:i.username||"Creator"}),(0,a.jsx)("span",{className:"verify-dot",children:"\u2713"})]}),(0,a.jsx)("small",{children:q(i.created_at)})]})]}),(0,a.jsx)("button",{type:"button",className:"yam-icon-ghost",children:"\u22EF"})]}),(0,a.jsx)("div",{className:"yam-post-copy",children:i.content||"\u062C\u0644\u0633\u0629 \u0645\u0645\u062A\u0639\u0629 \u0627\u0644\u064A\u0648\u0645 \u0645\u0639 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u064A\u0646! \u0634\u0643\u0631\u0627\u064B \u0644\u0643\u0644 \u0645\u0646 \u0643\u0627\u0646 \u0645\u0648\u062C\u0648\u062F."}),(0,a.jsx)(K,{media:t,title:i.content||i.username}),(0,a.jsxs)("div",{className:"yam-post-actions",children:[(0,a.jsxs)("button",{type:"button",className:"yam-react-btn",onClick:()=>r(i.id),children:["\u2764 ",(0,a.jsx)("span",{children:l(s)})]}),(0,a.jsxs)("button",{type:"button",className:"yam-react-btn",children:["\u{1F4AC} ",(0,a.jsx)("span",{children:l(n)})]}),(0,a.jsxs)("button",{type:"button",className:"yam-react-btn",children:["\u2934 ",(0,a.jsx)("span",{children:l(d)})]}),(0,a.jsx)("button",{type:"button",className:"yam-react-btn save",children:"\u2311"})]})]})}function R(){let i=v(),r=w(),{posts:t=[],isLoading:s,refetch:n}=_({limit:10,pollingInterval:25e3}),{data:d=[]}=u({queryKey:["feed-users-sidebar"],queryFn:async()=>(await z()).data||[],staleTime:6e4}),{data:g=[]}=u({queryKey:["feed-live-sidebar"],queryFn:async()=>(await A()).data||[],staleTime:15e3,refetchInterval:2e4}),P=b({mutationFn:N,onSettled:()=>i.invalidateQueries({queryKey:["feed-data"]})}),$=b({mutationFn:F,onSettled:()=>i.invalidateQueries({queryKey:["feed-users-sidebar"]})}),j=(0,c.useMemo)(()=>{let e=Array.isArray(g)?g.slice(0,2).map(o=>({id:`live-${o.id}`,username:o.host||o.username||"PlayerOne",avatar:o.avatar,live:!0})):[],m=Array.isArray(d)?d.slice(0,4).map(o=>({id:o.username,username:o.username,avatar:o.avatar,live:!1})):[];return[...e,...m].slice(0,5)},[g,d]),S=(0,c.useMemo)(()=>[...t].sort((e,m)=>Number(m.likes_count??m.like_count??m.likes??0)-Number(e.likes_count??e.like_count??e.likes??0)).slice(0,3),[t]),U=(0,c.useMemo)(()=>d.filter(e=>e.username!==r).slice(0,5),[d,r]),G=(0,c.useMemo)(()=>d.filter(e=>e.username!==r).slice(0,3),[d,r]);return(0,a.jsxs)(L,{children:[(0,a.jsxs)("div",{className:"yam-feed-page desktop-post mobile-post",children:[(0,a.jsxs)("div",{className:"yam-feed-main-column",children:[(0,a.jsxs)("section",{className:"yam-feed-composer-shell",children:[(0,a.jsxs)("div",{className:"yam-feed-composer-head",children:[(0,a.jsx)(p,{name:r||"You",size:54,ring:!0}),(0,a.jsxs)("div",{className:"yam-feed-composer-prompt",children:[(0,a.jsx)("strong",{children:"\u0628\u0645 \u062A\u0641\u0643\u0631 \u0627\u0644\u064A\u0648\u0645\u061F"}),(0,a.jsx)("span",{children:"\u0646\u0635 \u2022 \u0635\u0648\u0631\u0629 \u2022 \u0645\u0642\u0637\u0639 \u0642\u0635\u064A\u0631 \u2022 \u0644\u0627\u064A\u0641 \u0645\u0628\u0627\u0634\u0631"})]})]}),(0,a.jsx)(k,{})]}),(0,a.jsxs)("div",{className:"yam-feed-sort-row",children:[(0,a.jsx)("span",{children:"\u0639\u0631\u0636 \u062D\u0633\u0628"}),(0,a.jsx)("strong",{children:"\u0623\u062D\u062F\u062B \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A"}),(0,a.jsx)("button",{type:"button",className:"yam-refresh-btn",onClick:()=>n(),children:"\u062A\u062D\u062F\u064A\u062B"})]}),(0,a.jsxs)("div",{className:"yam-feed-posts-stack",children:[s?(0,a.jsx)("div",{className:"yam-empty-block",children:"\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A..."}):null,!s&&!t.length?(0,a.jsx)("div",{className:"yam-empty-block",children:"\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0646\u0634\u0648\u0631\u0627\u062A \u062D\u0627\u0644\u064A\u0627\u064B."}):null,t.map(e=>(0,a.jsx)(Q,{post:e,onLike:m=>P.mutate(m)},e.id))]})]}),(0,a.jsxs)("aside",{className:"yam-feed-right-column",children:[(0,a.jsxs)("section",{className:"yam-side-card",children:[(0,a.jsxs)("div",{className:"yam-side-card-head",children:[(0,a.jsx)("h3",{children:"\u0627\u0644\u0642\u0635\u0635"}),(0,a.jsx)("span",{children:"\u0639\u0631\u0636 \u0627\u0644\u0643\u0644"})]}),(0,a.jsxs)("div",{className:"yam-story-row",children:[(0,a.jsxs)("button",{type:"button",className:"yam-add-story",children:["\uFF0B",(0,a.jsx)("small",{children:"\u0625\u0636\u0627\u0641\u0629 \u0642\u0635\u0629"})]}),j.map(e=>(0,a.jsxs)("div",{className:"yam-story-user",children:[(0,a.jsx)("div",{className:`yam-story-ring ${e.live?"live":""}`,children:(0,a.jsx)(p,{name:e.username,src:e.avatar,size:58})}),e.live?(0,a.jsx)("span",{className:"yam-story-live",children:"LIVE"}):null,(0,a.jsx)("small",{children:e.username})]},e.id))]})]}),(0,a.jsxs)("section",{className:"yam-side-card",children:[(0,a.jsxs)("div",{className:"yam-side-card-head",children:[(0,a.jsx)("h3",{children:"\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0627\u0644\u0631\u0627\u0626\u062C\u0629"}),(0,a.jsx)("span",{children:"\u0639\u0631\u0636 \u0627\u0644\u0645\u0632\u064A\u062F"})]}),(0,a.jsx)("div",{className:"yam-trending-list",children:S.map(e=>(0,a.jsxs)("div",{className:"yam-trending-item",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("strong",{children:e.username}),(0,a.jsx)("p",{children:(e.content||"\u0645\u0646\u0634\u0648\u0631 \u0645\u0645\u064A\u0632").slice(0,70)}),(0,a.jsxs)("div",{className:"yam-trending-stats",children:["\u2764 ",l(e.likes_count??e.like_count??e.likes??0)," \xB7 \u{1F4AC} ",l(e.comments_count??0)]})]}),(0,a.jsx)("div",{className:"yam-trending-thumb",children:f(e)[0]?(0,a.jsx)("img",{src:f(e)[0],alt:e.username}):(0,a.jsx)("span",{children:"\u{1F3AE}"})})]},e.id))})]}),(0,a.jsxs)("section",{className:"yam-side-card",children:[(0,a.jsxs)("div",{className:"yam-side-card-head",children:[(0,a.jsx)("h3",{children:"\u0627\u0644\u0623\u0635\u062F\u0642\u0627\u0621 \u0627\u0644\u0645\u062A\u0635\u0644\u0648\u0646"}),(0,a.jsx)("span",{children:"\u0639\u0631\u0636 \u0627\u0644\u0643\u0644"})]}),(0,a.jsx)("div",{className:"yam-online-list",children:U.map(e=>(0,a.jsxs)("div",{className:"yam-online-item",children:[(0,a.jsxs)("div",{className:"yam-online-meta",children:[(0,a.jsxs)("div",{className:"yam-online-avatar-wrap",children:[(0,a.jsx)(p,{name:e.username,src:e.avatar,size:42}),(0,a.jsx)("span",{className:"online-indicator"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("strong",{children:e.username}),(0,a.jsx)("small",{children:e.profile?.activity_tagline||"\u0645\u062A\u0635\u0644 \u0627\u0644\u0622\u0646"})]})]}),(0,a.jsx)("button",{type:"button",className:"yam-chat-shortcut",children:"\u{1F4AC}"})]},e.username))})]}),(0,a.jsxs)("section",{className:"yam-side-card promo",children:[(0,a.jsx)("div",{className:"promo-visual",children:"\u{1F3AE}"}),(0,a.jsx)("h3",{children:"\u0627\u0646\u0636\u0645 \u0625\u0644\u0649 \u0645\u062C\u062A\u0645\u0639 \u064A\u0627\u0645\u0634\u0627\u062A"}),(0,a.jsx)("p",{children:"\u0627\u0643\u062A\u0634\u0641 \u0645\u062D\u062A\u0648\u0649 \u062C\u062F\u064A\u062F \u0648\u062A\u0639\u0631\u0651\u0641 \u0639\u0644\u0649 \u0623\u0635\u062F\u0642\u0627\u0621 \u062C\u062F\u062F \u0648\u0627\u0633\u062A\u0645\u062A\u0639 \u0628\u062A\u062C\u0631\u0628\u0629 \u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0641\u0631\u064A\u062F\u0629."}),(0,a.jsx)("button",{type:"button",className:"yam-primary-wide",children:"\u0627\u0633\u062A\u0643\u0634\u0641 \u0627\u0644\u0622\u0646"})]}),(0,a.jsxs)("section",{className:"yam-side-card",children:[(0,a.jsxs)("div",{className:"yam-side-card-head",children:[(0,a.jsx)("h3",{children:"\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629"}),(0,a.jsx)("span",{children:"\u0639\u0631\u0636 \u0627\u0644\u0643\u0644"})]}),(0,a.jsx)("div",{className:"yam-suggest-list",children:G.map(e=>(0,a.jsxs)("div",{className:"yam-suggest-row",children:[(0,a.jsxs)("div",{className:"yam-online-meta",children:[(0,a.jsx)(p,{name:e.username,src:e.avatar,size:42}),(0,a.jsxs)("div",{children:[(0,a.jsx)("strong",{children:e.username}),(0,a.jsx)("small",{children:e.email||"Gaming creator"})]})]}),(0,a.jsx)("button",{type:"button",className:"yam-follow-inline",onClick:()=>$.mutate(e.username),children:"\u0645\u062A\u0627\u0628\u0639\u0629"})]},e.username))})]})]})]}),(0,a.jsx)("style",{children:`
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
      `})]})}export{R as default};
