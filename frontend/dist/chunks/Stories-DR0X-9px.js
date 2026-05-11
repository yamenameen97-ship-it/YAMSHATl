import{a as xe}from"./rolldown-runtime-Ct_h1fMY.js";import{ot as ye}from"./vendor-CpEUa3rx.js";import{r as me}from"./vendor-motion-Dlm2umSl.js";import{O as y,k as ve}from"../index-B366MIZN.js";import{t as l}from"./Card-Cr_XB2Gp.js";import{t as fe}from"./Modal-ByR-Pilq.js";import{a as je,c as be,l as we,o as Se,r as ke,t as _e}from"./stories-4Gy0D4xr.js";import{t as Ne}from"./MainLayout-BjbCpYiY.js";var r=xe(ye(),1),e=me(),G=[{id:"lofi-night",label:"Lo-fi Night",mood:"هادئ",color:"#3b82f6"},{id:"arabic-pop",label:"Arabic Pop Intro",mood:"حيوي",color:"#8b5cf6"},{id:"cinematic-rise",label:"Cinematic Rise",mood:"ملحمي",color:"#f97316"},{id:"acoustic-vibes",label:"Acoustic Vibes",mood:"دافئ",color:"#10b981"}],Ce=["🔥","❤️","✨","🎉","🧿","📍","🎵","🚀"],Ie=["❤️","🔥","😂","😮","👏"];function te(o=[]){return o.map(a=>{const d=Array.isArray(a.viewers)?a.viewers:Array.isArray(a.viewers_list)?a.viewers_list:[];return{...a,viewers:d,sticker_items:Array.isArray(a.sticker_items)?a.sticker_items:Array.isArray(a.stickers)?a.stickers:[],music:a.music||a.music_track||"",reactions:a.reactions||{},replies_count:Number(a.replies_count||0),views_count:Number(a.views_count||a.view_count||d.length||0),viewer_count:Number(a.views_count||a.view_count||d.length||0)}})}function ie(o=[]){const a=new Map;return o.forEach(d=>{const c=d.username||"مستخدم";a.has(c)||a.set(c,{username:c,stories:[]}),a.get(c).stories.push(d)}),Array.from(a.values())}function I(o){return/\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(o?.media_url||"")}function re(o){return o?.is_close_friends?"الأصدقاء المقربون":"عام"}function Le(){const{pushToast:o}=ve(),a=(0,r.useRef)(null),d=(0,r.useRef)(0),c=(0,r.useRef)([]),[R,b]=(0,r.useState)("feed"),[A,ae]=(0,r.useState)("feed"),[w,_]=(0,r.useState)([]),[j,P]=(0,r.useState)([]),[T,$]=(0,r.useState)(null),[u,V]=(0,r.useState)(""),[q,D]=(0,r.useState)(!1),[U,Y]=(0,r.useState)(""),[W,H]=(0,r.useState)([]),[z,K]=(0,r.useState)(G[0]),[N,J]=(0,r.useState)(!0),[ne,Q]=(0,r.useState)(!1),[g,C]=(0,r.useState)(0),[h,m]=(0,r.useState)(0),[S,E]=(0,r.useState)(!1),[F,L]=(0,r.useState)(""),[le,X]=(0,r.useState)(0),[Z,v]=(0,r.useState)(!1),M=async()=>{J(!0);try{const[s,t]=await Promise.all([_e(),ke()]);_(te(Array.isArray(s?.data)?s.data:[])),P(te(Array.isArray(t?.data)?t.data:[]))}catch(s){o({type:"error",title:"فشل تحميل القصص",description:s?.response?.data?.detail||s?.message})}finally{J(!1)}};(0,r.useEffect)(()=>{M()},[]),(0,r.useEffect)(()=>()=>{u&&URL.revokeObjectURL(u),d.current&&window.clearInterval(d.current),c.current.forEach(s=>s?.())},[u]);const k=(0,r.useMemo)(()=>ie(w),[w]),B=(0,r.useMemo)(()=>ie(j),[j]),f=A==="archive"?B:k,x=f[g]||null,i=x?.stories?.[h]||null;(0,r.useEffect)(()=>{if(c.current.forEach(t=>t?.()),c.current=[],!S||!x)return;const s=x.stories?.[h+1]||f[g+1]?.stories?.[0];if(s?.media_url){if(I(s)){const t=document.createElement("video");t.preload="metadata",t.src=s.media_url,c.current.push(()=>{t.pause?.(),t.removeAttribute("src"),t.load?.()})}else{const t=new Image;t.decoding="async",t.src=s.media_url,c.current.push(()=>{t.src=""})}return()=>{c.current.forEach(t=>t?.()),c.current=[]}}},[x,g,h,f,S]),(0,r.useEffect)(()=>{if(!(!S||!i))return X(0),we(i.id).catch(()=>null),_(s=>s.map(t=>String(t.id)===String(i.id)?{...t,views_count:Number(t.views_count||0)+1}:t)),d.current&&window.clearInterval(d.current),Z||(d.current=window.setInterval(()=>{X(s=>s>=100?(h<(x?.stories?.length||0)-1?m(t=>t+1):g<f.length-1?(C(t=>t+1),m(0)):E(!1),0):s+2)},120)),()=>{d.current&&window.clearInterval(d.current)}},[x?.stories?.length,g,i,h,Z,f.length,S]);const ee=()=>{u&&URL.revokeObjectURL(u),$(null),V(""),Y(""),H([]),K(G[0]),D(!1)},de=s=>{const t=s.target.files?.[0];t&&(u&&URL.revokeObjectURL(u),$(t),V(URL.createObjectURL(t)),b("create"))},oe=async()=>{if(T){Q(!0);try{await be(T,{caption:U,is_close_friends:q,filter_name:"Yamshat Stories",stickers:W,music:z.label}),o({type:"success",title:"تم نشر الستوري"}),ee(),b("feed"),await M()}catch(s){o({type:"error",title:"تعذر رفع الستوري",description:s?.response?.data?.detail||s?.message})}finally{Q(!1)}}},ce=s=>{H(t=>t.includes(s)?t.filter(n=>n!==s):[...t,s].slice(0,3))},O=(s,t,n=0)=>{ae(s),C(t),m(n),L(""),v(!1),E(!0)},pe=async s=>{if(!i)return;try{await je(i.id,s)}catch{}const t=n=>n.map(p=>String(p.id)===String(i.id)?{...p,reactions:{...p.reactions||{},[s]:Number(p.reactions?.[s]||0)+1}}:p);A==="archive"?P(n=>t(n)):_(n=>t(n))},ue=async()=>{if(!(!i||!F.trim()))try{await Se(i.id,F.trim()),_(s=>s.map(t=>String(t.id)===String(i.id)?{...t,replies_count:Number(t.replies_count||0)+1}:t)),L(""),o({type:"success",title:"تم إرسال الرد"})}catch(s){o({type:"error",title:"تعذر إرسال الرد",description:s?.response?.data?.detail||s?.message})}},se=j.length,he=w.reduce((s,t)=>s+Number(t.views_count||0),0),ge=w.reduce((s,t)=>s+Object.values(t.reactions||{}).reduce((n,p)=>n+Number(p||0),0),0);return(0,e.jsxs)(Ne,{children:[(0,e.jsxs)("div",{style:{maxWidth:980,margin:"0 auto",padding:"20px 10px",display:"grid",gap:18},children:[(0,e.jsx)(l,{style:{padding:18},children:(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",alignItems:"center"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("h2",{style:{margin:0},children:"الستوري"}),(0,e.jsx)("div",{className:"muted",style:{marginTop:6},children:"viewers list + reactions + stickers + music UI + archive UI"})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[(0,e.jsx)(y,{variant:"secondary",onClick:()=>b("feed"),children:"القصص"}),(0,e.jsx)(y,{variant:"secondary",onClick:()=>b("archive"),children:"الأرشيف"}),(0,e.jsx)(y,{variant:"secondary",onClick:M,loading:N,children:"تحديث"}),(0,e.jsx)(y,{onClick:()=>a.current?.click(),children:"رفع ستوري"}),(0,e.jsx)("input",{ref:a,type:"file",hidden:!0,accept:"image/*,video/*",onChange:de})]})]})}),(0,e.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:12},children:[(0,e.jsx)(l,{style:{padding:14},children:(0,e.jsxs)("div",{className:"story-kpi",children:[(0,e.jsx)("strong",{children:k.length}),(0,e.jsx)("span",{children:"دوائر الستوري"})]})}),(0,e.jsx)(l,{style:{padding:14},children:(0,e.jsxs)("div",{className:"story-kpi",children:[(0,e.jsx)("strong",{children:he}),(0,e.jsx)("span",{children:"إجمالي المشاهدات"})]})}),(0,e.jsx)(l,{style:{padding:14},children:(0,e.jsxs)("div",{className:"story-kpi",children:[(0,e.jsx)("strong",{children:ge}),(0,e.jsx)("span",{children:"إجمالي التفاعلات"})]})}),(0,e.jsx)(l,{style:{padding:14},children:(0,e.jsxs)("div",{className:"story-kpi",children:[(0,e.jsx)("strong",{children:se}),(0,e.jsx)("span",{children:"عناصر الأرشيف"})]})})]}),N?(0,e.jsx)(l,{style:{padding:24},children:"جارٍ تحميل الستوري..."}):null,!N&&R==="feed"?(0,e.jsxs)("div",{style:{display:"grid",gap:16},children:[(0,e.jsx)("div",{className:"story-circles-strip",children:k.map((s,t)=>(0,e.jsxs)("button",{type:"button",onClick:()=>O("feed",t,0),className:"story-user-card",children:[(0,e.jsx)("div",{className:"story-user-ring",children:(0,e.jsx)("img",{src:`https://ui-avatars.com/api/?name=${s.username}`,alt:s.username,className:"story-user-avatar"})}),(0,e.jsx)("div",{style:{marginTop:8,fontSize:12},children:s.username}),(0,e.jsxs)("small",{className:"muted",children:[s.stories.length," قصة"]})]},s.username))}),(0,e.jsx)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))",gap:12},children:w.map(s=>(0,e.jsxs)(l,{style:{overflow:"hidden",padding:0},children:[(0,e.jsxs)("div",{style:{aspectRatio:"9 / 16",position:"relative",background:"#111"},children:[I(s)?(0,e.jsx)("video",{src:s.media_url,muted:!0,loop:!0,autoPlay:!0,playsInline:!0,preload:"metadata",style:{width:"100%",height:"100%",objectFit:"cover"}}):(0,e.jsx)("img",{src:s.media_url,alt:"story",loading:"lazy",decoding:"async",style:{width:"100%",height:"100%",objectFit:"cover"}}),(0,e.jsxs)("div",{style:{position:"absolute",top:12,right:12,display:"flex",gap:6,flexWrap:"wrap"},children:[s.music?(0,e.jsxs)("span",{className:"story-chip",children:["🎵 ",s.music]}):null,s.sticker_items?.length?(0,e.jsx)("span",{className:"story-chip",children:s.sticker_items.join(" ")}):null]}),(0,e.jsxs)("div",{style:{position:"absolute",insetInline:0,bottom:0,padding:12,background:"linear-gradient(transparent, rgba(0,0,0,0.82))",color:"white"},children:[(0,e.jsxs)("div",{style:{fontWeight:700},children:["@",s.username]}),(0,e.jsx)("div",{style:{fontSize:12,opacity:.84},children:s.caption||"بدون كابشن"})]})]}),(0,e.jsxs)("div",{style:{padding:12,display:"grid",gap:8},children:[(0,e.jsxs)("div",{className:"muted",style:{fontSize:12},children:["👁️ ",s.views_count," · 💬 ",s.replies_count," · 🎵 ",s.music||"بدون موسيقى"]}),(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"},children:[(0,e.jsx)("span",{className:"story-chip",children:re(s)}),(0,e.jsx)(y,{variant:"secondary",onClick:()=>{const t=k.findIndex(n=>n.username===s.username);O("feed",t,k[t]?.stories?.findIndex(n=>String(n.id)===String(s.id))||0)},children:"عرض"})]})]})]},s.id))})]}):null,!N&&R==="archive"?j.length?(0,e.jsxs)("div",{style:{display:"grid",gap:16},children:[(0,e.jsx)(l,{style:{padding:16},children:(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap",alignItems:"center"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:"واجهة الأرشيف"}),(0,e.jsx)("div",{className:"muted",style:{marginTop:6},children:"مراجعة سريعة للقصص القديمة مع الموسيقى والملصقات والمشاهدات."})]}),(0,e.jsxs)("span",{className:"story-chip",children:[se," عنصر"]})]})}),(0,e.jsx)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:10},children:j.map(s=>{const t=B.findIndex(p=>p.username===s.username),n=B[t]?.stories?.findIndex(p=>String(p.id)===String(s.id))||0;return(0,e.jsxs)(l,{style:{overflow:"hidden",padding:0,cursor:"pointer"},onClick:()=>O("archive",t,n),children:[(0,e.jsxs)("div",{style:{aspectRatio:"9 / 16",background:"#111",position:"relative"},children:[I(s)?(0,e.jsx)("video",{src:s.media_url,muted:!0,preload:"metadata",style:{width:"100%",height:"100%",objectFit:"cover",opacity:.78}}):(0,e.jsx)("img",{src:s.media_url,alt:"archived",loading:"lazy",decoding:"async",style:{width:"100%",height:"100%",objectFit:"cover",opacity:.78}}),(0,e.jsx)("div",{style:{position:"absolute",top:10,left:10},children:(0,e.jsx)("span",{className:"story-chip",children:"🗄️ مؤرشف"})}),(0,e.jsxs)("div",{style:{position:"absolute",insetInline:0,bottom:0,padding:10,background:"linear-gradient(transparent, rgba(0,0,0,0.84))",color:"white"},children:[(0,e.jsxs)("strong",{children:["@",s.username]}),(0,e.jsx)("div",{style:{fontSize:11,opacity:.84},children:s.music||"بدون موسيقى"})]})]}),(0,e.jsxs)("div",{style:{padding:10,fontSize:12,display:"grid",gap:6},children:[(0,e.jsxs)("span",{className:"muted",children:["👁️ ",s.views_count," · 💬 ",s.replies_count]}),(0,e.jsx)("span",{className:"muted",children:s.sticker_items?.length?s.sticker_items.join(" "):"بدون ملصقات"})]})]},s.id)})})]}):(0,e.jsx)(l,{style:{padding:24},children:"الأرشيف فارغ."}):null,R==="create"?(0,e.jsx)(l,{style:{padding:18},children:(0,e.jsxs)("div",{style:{display:"grid",gap:16},children:[(0,e.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"minmax(0, 1fr) minmax(280px, 0.95fr)",gap:16},children:[(0,e.jsxs)("div",{style:{position:"relative",aspectRatio:"9 / 16",background:"#000",borderRadius:20,overflow:"hidden"},children:[T?.type?.startsWith("video/")?(0,e.jsx)("video",{src:u,controls:!0,style:{width:"100%",height:"100%",objectFit:"contain"}}):(0,e.jsx)("img",{src:u,alt:"preview",style:{width:"100%",height:"100%",objectFit:"contain"}}),(0,e.jsx)("div",{style:{position:"absolute",top:20,left:20,display:"flex",gap:8,flexWrap:"wrap"},children:W.map(s=>(0,e.jsx)("span",{className:"story-chip",style:{fontSize:20},children:s},s))}),(0,e.jsxs)("div",{style:{position:"absolute",insetInline:0,bottom:0,padding:16,background:"linear-gradient(transparent, rgba(0,0,0,0.82))",color:"white"},children:[(0,e.jsx)("div",{style:{fontSize:14,marginBottom:6},children:U||"اكتب كابشن للستوري"}),(0,e.jsxs)("div",{style:{fontSize:12,opacity:.82},children:["🎵 ",z.label]})]})]}),(0,e.jsxs)("div",{style:{display:"grid",gap:14},children:[(0,e.jsxs)(l,{style:{padding:14},children:[(0,e.jsx)("div",{style:{fontWeight:700,marginBottom:10},children:"Stickers"}),(0,e.jsx)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:Ce.map(s=>(0,e.jsx)("button",{type:"button",className:`story-picker-chip ${W.includes(s)?"active":""}`,onClick:()=>ce(s),children:s},s))})]}),(0,e.jsxs)(l,{style:{padding:14},children:[(0,e.jsx)("div",{style:{fontWeight:700,marginBottom:10},children:"Music UI"}),(0,e.jsx)("div",{style:{display:"grid",gap:10},children:G.map(s=>(0,e.jsxs)("button",{type:"button",className:`story-music-row ${z.id===s.id?"active":""}`,onClick:()=>K(s),children:[(0,e.jsx)("span",{className:"story-music-dot",style:{background:s.color}}),(0,e.jsxs)("span",{style:{textAlign:"start"},children:[(0,e.jsx)("strong",{children:s.label}),(0,e.jsx)("small",{className:"muted",style:{display:"block",marginTop:4},children:s.mood})]})]},s.id))})]})]})]}),(0,e.jsx)("textarea",{value:U,onChange:s=>Y(s.target.value),rows:3,placeholder:"كابشن / CTA / سؤال للمشاهدين",style:{width:"100%",borderRadius:16,padding:12}}),(0,e.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:8},children:[(0,e.jsx)("input",{type:"checkbox",checked:q,onChange:s=>D(s.target.checked)}),"نشر للأصدقاء المقربين فقط"]}),(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap"},children:[(0,e.jsx)(y,{variant:"secondary",onClick:()=>{ee(),b("feed")},children:"إلغاء"}),(0,e.jsx)(y,{onClick:oe,loading:ne,children:"نشر الستوري"})]})]})}):null]}),(0,e.jsx)(fe,{open:S&&!!i,onClose:()=>E(!1),title:i?`@${i.username}`:"Story",size:"large",children:i?(0,e.jsxs)("div",{style:{display:"grid",gap:16},children:[(0,e.jsx)("div",{style:{display:"flex",gap:6},children:(x?.stories||[]).map((s,t)=>(0,e.jsx)("div",{style:{flex:1,height:4,borderRadius:999,overflow:"hidden",background:"rgba(59,130,246,0.14)"},children:(0,e.jsx)("div",{style:{width:t<h?"100%":t===h?`${le}%`:"0%",height:"100%",background:"linear-gradient(135deg, #3b82f6, #8b5cf6)"}})},s.id||t))}),(0,e.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"minmax(0, 1.05fr) minmax(300px, 0.95fr)",gap:16},children:[(0,e.jsxs)("div",{style:{position:"relative",aspectRatio:"9 / 16",background:"#000",borderRadius:20,overflow:"hidden"},onMouseDown:()=>v(!0),onMouseUp:()=>v(!1),onTouchStart:()=>v(!0),onTouchEnd:()=>v(!1),children:[I(i)?(0,e.jsx)("video",{src:i.media_url,controls:!0,autoPlay:!0,playsInline:!0,style:{width:"100%",height:"100%",objectFit:"contain"}}):(0,e.jsx)("img",{src:i.media_url,alt:"story",style:{width:"100%",height:"100%",objectFit:"contain"}}),(0,e.jsxs)("div",{style:{position:"absolute",top:18,left:18,display:"flex",gap:8,flexWrap:"wrap"},children:[i.music?(0,e.jsxs)("span",{className:"story-chip",children:["🎵 ",i.music]}):null,i.sticker_items?.map(s=>(0,e.jsx)("span",{className:"story-chip",children:s},s))]}),(0,e.jsx)("button",{type:"button",className:"story-nav-hit story-nav-prev",onClick:()=>{if(h>0)m(s=>s-1);else if(g>0){const s=g-1,t=f[s]?.stories?.length||1;C(s),m(t-1)}},children:"‹"}),(0,e.jsx)("button",{type:"button",className:"story-nav-hit story-nav-next",onClick:()=>{h<(x?.stories?.length||0)-1?m(s=>s+1):g<f.length-1&&(C(s=>s+1),m(0))},children:"›"}),(0,e.jsxs)("div",{style:{position:"absolute",insetInline:0,bottom:0,padding:16,background:"linear-gradient(transparent, rgba(0,0,0,0.84))",color:"white"},children:[(0,e.jsx)("div",{style:{fontWeight:700,marginBottom:6},children:i.caption||"بدون كابشن"}),(0,e.jsxs)("div",{style:{fontSize:12,opacity:.82},children:["🎵 ",i.music||"بدون موسيقى"," · ",re(i)]})]})]}),(0,e.jsxs)("div",{style:{display:"grid",gap:12},children:[(0,e.jsx)(l,{style:{padding:14},children:(0,e.jsxs)("div",{style:{display:"grid",gap:8},children:[(0,e.jsxs)("div",{className:"story-meta-row",children:[(0,e.jsx)("strong",{children:"المشاهدات"}),(0,e.jsx)("span",{children:i.views_count})]}),(0,e.jsxs)("div",{className:"story-meta-row",children:[(0,e.jsx)("strong",{children:"الردود"}),(0,e.jsx)("span",{children:i.replies_count})]}),(0,e.jsxs)("div",{className:"story-meta-row",children:[(0,e.jsx)("strong",{children:"الأرشيف"}),(0,e.jsx)("span",{children:A==="archive"?"مؤرشف":j.some(s=>String(s.id)===String(i.id))?"موجود في الأرشيف":"نشط"})]}),(0,e.jsxs)("div",{className:"story-meta-row",children:[(0,e.jsx)("strong",{children:"المشاهدون التفصيليون"}),(0,e.jsx)("span",{children:i.viewers?.length||0})]})]})}),(0,e.jsxs)(l,{style:{padding:14},children:[(0,e.jsx)("div",{style:{fontWeight:700,marginBottom:10},children:"Reactions"}),(0,e.jsx)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:Ie.map(s=>(0,e.jsxs)("button",{type:"button",className:"story-picker-chip",onClick:()=>pe(s),children:[s," ",i.reactions?.[s]?i.reactions[s]:""]},s))})]}),(0,e.jsxs)(l,{style:{padding:14},children:[(0,e.jsx)("div",{style:{fontWeight:700,marginBottom:10},children:"Viewers list"}),i.viewers?.length?(0,e.jsx)("div",{style:{display:"grid",gap:10,maxHeight:180,overflowY:"auto"},children:i.viewers.map((s,t)=>(0,e.jsxs)("div",{className:"story-viewer-row",children:[(0,e.jsx)("div",{className:"story-viewer-avatar",children:String(s?.username||s||"U").slice(0,1).toUpperCase()}),(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:s?.username||s}),(0,e.jsx)("div",{className:"muted",style:{fontSize:12},children:s?.viewed_at?new Date(s.viewed_at).toLocaleString("ar-EG"):"شاهد القصة"})]})]},`${s?.username||s}-${t}`))}):(0,e.jsx)("div",{className:"muted",children:"لا توجد بيانات viewers تفصيلية من الـ API حالياً، لكن عداد المشاهدات ظاهر فوق."})]}),(0,e.jsxs)(l,{style:{padding:14},children:[(0,e.jsx)("div",{style:{fontWeight:700,marginBottom:10},children:"Reply"}),(0,e.jsx)("textarea",{value:F,onChange:s=>L(s.target.value),rows:3,placeholder:"اكتب ردك على الستوري",style:{width:"100%",borderRadius:14,padding:12},onFocus:()=>v(!0),onBlur:()=>v(!1)}),(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginTop:10,flexWrap:"wrap"},children:[(0,e.jsx)("span",{className:"muted",style:{fontSize:12},children:"CTA / mentions / quick reactions جاهزين"}),(0,e.jsx)(y,{onClick:ue,children:"إرسال الرد"})]})]})]})]})]}):null}),(0,e.jsx)("style",{children:`
        .story-kpi {
          display: grid;
          gap: 6px;
        }
        .story-kpi strong {
          font-size: 28px;
        }
        .story-chip,
        .story-picker-chip {
          border: 1px solid rgba(59,130,246,0.15);
          background: rgba(59,130,246,0.06);
          padding: 6px 10px;
          border-radius: 999px;
          cursor: pointer;
        }
        .story-picker-chip.active {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        .story-circles-strip {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 6px;
        }
        .story-user-card {
          border: none;
          background: none;
          cursor: pointer;
          color: inherit;
          min-width: 98px;
          text-align: center;
        }
        .story-user-ring {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          padding: 3px;
          margin: 0 auto;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #f97316);
          box-shadow: 0 18px 36px rgba(59,130,246,0.18);
        }
        .story-user-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid white;
        }
        .story-meta-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(15,23,42,0.06);
        }
        .story-meta-row:last-child {
          border-bottom: none;
        }
        .story-viewer-row {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(15,23,42,0.06);
        }
        .story-viewer-row:last-child {
          border-bottom: none;
        }
        .story-viewer-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          font-weight: 700;
        }
        .story-music-row {
          width: 100%;
          border: 1px solid rgba(15,23,42,0.08);
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          padding: 12px 14px;
          display: flex;
          gap: 12px;
          align-items: center;
          cursor: pointer;
        }
        .story-music-row.active {
          border-color: rgba(59,130,246,0.4);
          box-shadow: 0 14px 30px rgba(59,130,246,0.12);
        }
        .story-music-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .story-nav-hit {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 54px;
          border: none;
          background: linear-gradient(90deg, rgba(0,0,0,0.24), transparent);
          color: white;
          font-size: 36px;
          cursor: pointer;
        }
        .story-nav-prev { left: 0; }
        .story-nav-next {
          right: 0;
          background: linear-gradient(270deg, rgba(0,0,0,0.24), transparent);
        }
        @media (max-width: 920px) {
          .story-circles-strip {
            padding-inline-end: 8px;
          }
        }
      `})]})}export{Le as default};
