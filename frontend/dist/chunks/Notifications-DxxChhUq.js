import{a as W}from"./rolldown-runtime-Ct_h1fMY.js";import{ot as A}from"./vendor-CpEUa3rx.js";import{r as B}from"./vendor-motion-Dlm2umSl.js";import{O as p,S as y,a as m,i as R,k as T,r as g,x as $}from"../index-B366MIZN.js";import{t as h}from"./Card-Cr_XB2Gp.js";import{t as z}from"./Modal-ByR-Pilq.js";import{n as D,t as q}from"./MainLayout-BjbCpYiY.js";var o=W(A(),1),t=B(),F=[{id:"all",label:"الكل"},{id:"unread",label:"غير مقروء"},{id:"mention",label:"Mentions"},{id:"chat",label:"الرسائل"},{id:"live",label:"البث"}];function b(s){return s.type==="mention"||s.category==="mention"?"mentions":s.type==="chat"||s.category==="chat"?"messages":s.type==="live"||s.category==="live"?"live":"general"}function C(s){const a=b(s);return a==="mentions"?{icon:"@",label:"منشنات",tone:"#f59e0b"}:a==="messages"?{icon:"💬",label:"رسائل",tone:"#06b6d4"}:a==="live"?{icon:"🔴",label:"بث حي",tone:"#22c55e"}:{icon:"🔔",label:"عامة",tone:"#8b5cf6"}}function G(s=[],a=!0){if(!a)return[{id:"all",title:"كل الإشعارات",items:s}];const d=new Map;return s.forEach(c=>{const f=new Date(c.created_at||Date.now()).toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"}),u=`${f}-${b(c)}`;d.has(u)||d.set(u,{id:u,title:`${C(c).label} • ${f}`,items:[]}),d.get(u).items.push(c)}),Array.from(d.values())}function V(){const{pushToast:s}=T(),a=g(e=>e.items),d=g(e=>e.hydrateNotifications),c=g(e=>e.upsertNotification),f=g(e=>e.markRead),u=g(e=>e.markAllRead),_=g(e=>e.removeNotification),[l,I]=(0,o.useState)("all"),[L,v]=(0,o.useState)(!1),[j,w]=(0,o.useState)(!1),[r,N]=(0,o.useState)({pushEnabled:!0,realtimeEnabled:!0,groupedNotifications:!0,deepLinking:!0,browserPermission:typeof Notification<"u"?Notification.permission:"unsupported"});(0,o.useEffect)(()=>{let e=!0;return(async()=>{w(!0);try{const{data:n}=await D();if(!e)return;d(Array.isArray(n)?n.map(m):[],{replace:!0})}finally{e&&w(!1)}})(),()=>{e=!1}},[d]),(0,o.useEffect)(()=>{if(!r.realtimeEnabled)return;y.connected||y.connect();const e=async i=>{const n=m(i);c(n),s({type:"info",title:n.title,description:n.body,duration:4200}),r.pushEnabled&&await R(n).catch(()=>null)};return y.on("new_notification",e),()=>y.off("new_notification",e)},[s,r.pushEnabled,r.realtimeEnabled,c]);const k=(0,o.useMemo)(()=>a.map(m).filter(e=>l==="all"?!0:l==="unread"?!e.seen:l==="mention"?e.type==="mention"||e.category==="mention":e.type===l||e.category===l||e.payload?.screen===l),[l,a]),S=(0,o.useMemo)(()=>G(k,r.groupedNotifications),[k,r.groupedNotifications]),E=(0,o.useMemo)(()=>a.filter(e=>!m(e).seen).length,[a]),x=(0,o.useMemo)(()=>{const e=a.map(m);return{total:e.length,unread:e.filter(i=>!i.seen).length,live:e.filter(i=>b(i)==="live").length,mentions:e.filter(i=>b(i)==="mentions").length}},[a]),M=async()=>{if(!("Notification"in window))return;const e=await Notification.requestPermission();N(i=>({...i,browserPermission:e,pushEnabled:e==="granted"}))};return(0,t.jsxs)(q,{children:[(0,t.jsxs)("div",{style:{maxWidth:920,margin:"0 auto",padding:"20px 10px",display:"grid",gap:18},children:[(0,t.jsxs)(h,{style:{padding:18},children:[(0,t.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"},children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("h2",{style:{margin:0},children:"الإشعارات داخل التطبيق"}),(0,t.jsx)("div",{className:"muted",style:{marginTop:6},children:"Toast system + live badges + grouped notifications + deep linking"})]}),(0,t.jsxs)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[(0,t.jsx)(p,{variant:"secondary",onClick:()=>v(!0),children:"⚙️ الإعدادات"}),(0,t.jsx)(p,{variant:"secondary",onClick:()=>u(),children:"تحديد الكل كمقروء"}),(0,t.jsx)(p,{onClick:M,children:r.browserPermission==="granted"?"Push مفعّل":"تفعيل Push"})]})]}),(0,t.jsx)("div",{className:"notifications-summary-grid",children:[["إجمالي الإشعارات",x.total,"#8b5cf6"],["غير مقروء",x.unread,"#06b6d4"],["Live badges",x.live,"#22c55e"],["Mentions",x.mentions,"#f59e0b"]].map(([e,i,n])=>(0,t.jsxs)("div",{className:"notif-stat-card",style:{"--notif-tone":n},children:[(0,t.jsx)("strong",{children:i}),(0,t.jsx)("span",{children:e})]},e))})]}),(0,t.jsx)("div",{style:{display:"flex",gap:10,overflowX:"auto",paddingBottom:4},children:F.map(e=>(0,t.jsxs)("button",{type:"button",onClick:()=>I(e.id),className:`notif-filter-chip ${l===e.id?"active":""}`,children:[e.label,e.id==="unread"&&E>0?(0,t.jsx)("strong",{children:E}):null]},e.id))}),j?(0,t.jsx)(h,{style:{padding:24},children:"جارٍ تحميل الإشعارات..."}):null,!j&&S.length===0?(0,t.jsxs)(h,{style:{padding:36,textAlign:"center"},children:[(0,t.jsx)("div",{style:{fontSize:42},children:"📭"}),(0,t.jsx)("div",{className:"muted",children:"لا توجد إشعارات مطابقة للفلاتر الحالية"})]}):null,(0,t.jsx)("div",{style:{display:"grid",gap:18},children:S.map(e=>(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{className:"notifications-group-head",children:[(0,t.jsx)("strong",{children:e.title}),(0,t.jsxs)("span",{className:"muted",children:[e.items.length," عنصر"]})]}),(0,t.jsx)("div",{style:{display:"grid",gap:10},children:e.items.map(i=>{const n=C(i);return(0,t.jsxs)(h,{style:{padding:16,display:"flex",gap:14,alignItems:"start",border:i.seen?"1px solid var(--line)":`1px solid ${n.tone}44`,background:i.seen?"var(--bg-card)":`${n.tone}12`},children:[(0,t.jsx)("div",{style:{width:46,height:46,borderRadius:16,background:`linear-gradient(135deg, ${n.tone}, #0ea5e9)`,display:"grid",placeItems:"center",color:"white",fontSize:20},children:n.icon}),(0,t.jsxs)("div",{style:{flex:1},children:[(0,t.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start",flexWrap:"wrap"},children:[(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{style:{fontWeight:700,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"},children:[i.title,i.seen?null:(0,t.jsx)("span",{className:"notif-live-badge",children:"Live"})]}),(0,t.jsx)("div",{className:"muted",style:{marginTop:4,lineHeight:1.6},children:i.body})]}),i.seen?null:(0,t.jsx)("span",{className:"notif-dot"})]}),(0,t.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:10,marginTop:12,alignItems:"center",flexWrap:"wrap"},children:[(0,t.jsx)("span",{className:"muted",style:{fontSize:12},children:new Date(i.created_at||Date.now()).toLocaleString("ar-EG")}),(0,t.jsxs)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[i.seen?null:(0,t.jsx)(p,{variant:"secondary",onClick:()=>f(i.id),children:"مقروء"}),(0,t.jsx)(p,{variant:"secondary",onClick:()=>{f(i.id),r.deepLinking&&$(i.path||"/notifications",{replace:!1})},children:"فتح"}),(0,t.jsx)(p,{variant:"secondary",onClick:()=>_(i.id),children:"إخفاء"})]})]})]})]},i.id)})})]},e.id))})]}),(0,t.jsx)(z,{open:L,onClose:()=>v(!1),title:"إعدادات الإشعارات الحقيقية",children:(0,t.jsxs)("div",{style:{display:"grid",gap:14},children:[[["pushEnabled","Push notifications"],["realtimeEnabled","Realtime notifications"],["groupedNotifications","Grouped notifications"],["deepLinking","Deep linking"]].map(([e,i])=>(0,t.jsxs)("label",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:12,borderRadius:14,background:"rgba(59,130,246,0.05)"},children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("strong",{children:i}),(0,t.jsx)("div",{className:"muted",style:{fontSize:12},children:e==="pushEnabled"?"Browser / Service Worker alerts":e==="deepLinking"?"فتح الشاشة المستهدفة مباشرة":"تحسين التجربة الاجتماعية اللحظية"})]}),(0,t.jsx)("input",{type:"checkbox",checked:!!r[e],onChange:n=>N(P=>({...P,[e]:n.target.checked}))})]},e)),(0,t.jsxs)(h,{style:{padding:14},children:[(0,t.jsx)("div",{style:{fontWeight:700,marginBottom:6},children:"Browser permission"}),(0,t.jsx)("div",{className:"muted",children:r.browserPermission})]}),(0,t.jsx)(p,{onClick:()=>v(!1),children:"تم"})]})}),(0,t.jsx)("style",{children:`
        .notifications-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
          margin-top: 16px;
        }
        .notif-stat-card {
          --notif-tone: #8b5cf6;
          padding: 14px;
          border-radius: 16px;
          background: color-mix(in srgb, var(--notif-tone) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--notif-tone) 24%, transparent);
          display: grid;
          gap: 6px;
        }
        .notif-filter-chip {
          border: none;
          border-radius: 999px;
          padding: 10px 14px;
          background: rgba(59,130,246,0.08);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .notif-filter-chip.active {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        .notif-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #2563eb;
          flex-shrink: 0;
          margin-top: 6px;
        }
        .notifications-group-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          margin-bottom: 8px;
        }
        .notif-live-badge {
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(34,197,94,0.14);
          color: #86efac;
          font-size: 11px;
          font-weight: 800;
        }
      `})]})}export{V as default};
