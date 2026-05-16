import{e as xe,r,j as e,B as y}from"../index-BOmwylhg.js";import{M as ye}from"./MainLayout-BFwSeUBC.js";import{C as a}from"./Card-CH6UC0x0.js";import{M as me}from"./Modal-vsgrOIBs.js";import{v as ve,g as fe,a as je,u as be,r as we,b as Se}from"./stories-DmZbSV72.js";import"./proxy-CGWyWqSt.js";const G=[{id:"lofi-night",label:"Lo-fi Night",mood:"هادئ",color:"#3b82f6"},{id:"arabic-pop",label:"Arabic Pop Intro",mood:"حيوي",color:"#8b5cf6"},{id:"cinematic-rise",label:"Cinematic Rise",mood:"ملحمي",color:"#f97316"},{id:"acoustic-vibes",label:"Acoustic Vibes",mood:"دافئ",color:"#10b981"}],ke=["🔥","❤️","✨","🎉","🧿","📍","🎵","🚀"],Ne=["❤️","🔥","😂","😮","👏"];function te(c=[]){return c.map(n=>{const o=Array.isArray(n.viewers)?n.viewers:Array.isArray(n.viewers_list)?n.viewers_list:[];return{...n,viewers:o,sticker_items:Array.isArray(n.sticker_items)?n.sticker_items:Array.isArray(n.stickers)?n.stickers:[],music:n.music||n.music_track||"",reactions:n.reactions||{},replies_count:Number(n.replies_count||0),views_count:Number(n.views_count||n.view_count||o.length||0),viewer_count:Number(n.views_count||n.view_count||o.length||0)}})}function ie(c=[]){const n=new Map;return c.forEach(o=>{const p=o.username||"مستخدم";n.has(p)||n.set(p,{username:p,stories:[]}),n.get(p).stories.push(o)}),Array.from(n.values())}function I(c){return/\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(c?.media_url||"")}function re(c){return c?.is_close_friends?"الأصدقاء المقربون":"عام"}function Ue(){const{pushToast:c}=xe(),n=r.useRef(null),o=r.useRef(0),p=r.useRef([]),[R,b]=r.useState("feed"),[A,ne]=r.useState("feed"),[w,N]=r.useState([]),[j,P]=r.useState([]),[T,$]=r.useState(null),[u,V]=r.useState(""),[D,Y]=r.useState(!1),[U,q]=r.useState(""),[W,H]=r.useState([]),[z,K]=r.useState(G[0]),[_,J]=r.useState(!0),[ae,Q]=r.useState(!1),[g,C]=r.useState(0),[h,m]=r.useState(0),[S,E]=r.useState(!1),[M,F]=r.useState(""),[le,X]=r.useState(0),[Z,v]=r.useState(!1),L=async()=>{J(!0);try{const[s,t]=await Promise.all([fe(),je()]);N(te(Array.isArray(s?.data)?s.data:[])),P(te(Array.isArray(t?.data)?t.data:[]))}catch(s){c({type:"error",title:"فشل تحميل القصص",description:s?.response?.data?.detail||s?.message})}finally{J(!1)}};r.useEffect(()=>{L()},[]),r.useEffect(()=>()=>{u&&URL.revokeObjectURL(u),o.current&&window.clearInterval(o.current),p.current.forEach(s=>s?.())},[u]);const k=r.useMemo(()=>ie(w),[w]),B=r.useMemo(()=>ie(j),[j]),f=A==="archive"?B:k,x=f[g]||null,i=x?.stories?.[h]||null;r.useEffect(()=>{if(p.current.forEach(t=>t?.()),p.current=[],!S||!x)return;const s=x.stories?.[h+1]||f[g+1]?.stories?.[0];if(s?.media_url){if(I(s)){const t=document.createElement("video");t.preload="metadata",t.src=s.media_url,p.current.push(()=>{t.pause?.(),t.removeAttribute("src"),t.load?.()})}else{const t=new Image;t.decoding="async",t.src=s.media_url,p.current.push(()=>{t.src=""})}return()=>{p.current.forEach(t=>t?.()),p.current=[]}}},[x,g,h,f,S]),r.useEffect(()=>{if(!(!S||!i))return X(0),ve(i.id).catch(()=>null),N(s=>s.map(t=>String(t.id)===String(i.id)?{...t,views_count:Number(t.views_count||0)+1}:t)),o.current&&window.clearInterval(o.current),Z||(o.current=window.setInterval(()=>{X(s=>s>=100?(h<(x?.stories?.length||0)-1?m(t=>t+1):g<f.length-1?(C(t=>t+1),m(0)):E(!1),0):s+2)},120)),()=>{o.current&&window.clearInterval(o.current)}},[x?.stories?.length,g,i,h,Z,f.length,S]);const ee=()=>{u&&URL.revokeObjectURL(u),$(null),V(""),q(""),H([]),K(G[0]),Y(!1)},de=s=>{const t=s.target.files?.[0];t&&(u&&URL.revokeObjectURL(u),$(t),V(URL.createObjectURL(t)),b("create"))},oe=async()=>{if(T){Q(!0);try{await be(T,{caption:U,is_close_friends:D,filter_name:"Yamshat Stories",stickers:W,music:z.label}),c({type:"success",title:"تم نشر الستوري"}),ee(),b("feed"),await L()}catch(s){c({type:"error",title:"تعذر رفع الستوري",description:s?.response?.data?.detail||s?.message})}finally{Q(!1)}}},ce=s=>{H(t=>t.includes(s)?t.filter(l=>l!==s):[...t,s].slice(0,3))},O=(s,t,l=0)=>{ne(s),C(t),m(l),F(""),v(!1),E(!0)},pe=async s=>{if(!i)return;try{await we(i.id,s)}catch{}const t=l=>l.map(d=>String(d.id)===String(i.id)?{...d,reactions:{...d.reactions||{},[s]:Number(d.reactions?.[s]||0)+1}}:d);A==="archive"?P(l=>t(l)):N(l=>t(l))},ue=async()=>{if(!(!i||!M.trim()))try{await Se(i.id,M.trim()),N(s=>s.map(t=>String(t.id)===String(i.id)?{...t,replies_count:Number(t.replies_count||0)+1}:t)),F(""),c({type:"success",title:"تم إرسال الرد"})}catch(s){c({type:"error",title:"تعذر إرسال الرد",description:s?.response?.data?.detail||s?.message})}},se=j.length,he=w.reduce((s,t)=>s+Number(t.views_count||0),0),ge=w.reduce((s,t)=>s+Object.values(t.reactions||{}).reduce((l,d)=>l+Number(d||0),0),0);return e.jsxs(ye,{children:[e.jsxs("div",{style:{maxWidth:980,margin:"0 auto",padding:"20px 10px",display:"grid",gap:18},children:[e.jsx(a,{style:{padding:18},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",alignItems:"center"},children:[e.jsxs("div",{children:[e.jsx("h2",{style:{margin:0},children:"الستوري"}),e.jsx("div",{className:"muted",style:{marginTop:6},children:"viewers list + reactions + stickers + music UI + archive UI"})]}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[e.jsx(y,{variant:"secondary",onClick:()=>b("feed"),children:"القصص"}),e.jsx(y,{variant:"secondary",onClick:()=>b("archive"),children:"الأرشيف"}),e.jsx(y,{variant:"secondary",onClick:L,loading:_,children:"تحديث"}),e.jsx(y,{onClick:()=>n.current?.click(),children:"رفع ستوري"}),e.jsx("input",{ref:n,type:"file",hidden:!0,accept:"image/*,video/*",onChange:de})]})]})}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:12},children:[e.jsx(a,{style:{padding:14},children:e.jsxs("div",{className:"story-kpi",children:[e.jsx("strong",{children:k.length}),e.jsx("span",{children:"دوائر الستوري"})]})}),e.jsx(a,{style:{padding:14},children:e.jsxs("div",{className:"story-kpi",children:[e.jsx("strong",{children:he}),e.jsx("span",{children:"إجمالي المشاهدات"})]})}),e.jsx(a,{style:{padding:14},children:e.jsxs("div",{className:"story-kpi",children:[e.jsx("strong",{children:ge}),e.jsx("span",{children:"إجمالي التفاعلات"})]})}),e.jsx(a,{style:{padding:14},children:e.jsxs("div",{className:"story-kpi",children:[e.jsx("strong",{children:se}),e.jsx("span",{children:"عناصر الأرشيف"})]})})]}),_?e.jsx(a,{style:{padding:24},children:"جارٍ تحميل الستوري..."}):null,!_&&R==="feed"?e.jsxs("div",{style:{display:"grid",gap:16},children:[e.jsx("div",{className:"story-circles-strip",children:k.map((s,t)=>e.jsxs("button",{type:"button",onClick:()=>O("feed",t,0),className:"story-user-card",children:[e.jsx("div",{className:"story-user-ring",children:e.jsx("img",{src:`https://ui-avatars.com/api/?name=${s.username}`,alt:s.username,className:"story-user-avatar"})}),e.jsx("div",{style:{marginTop:8,fontSize:12},children:s.username}),e.jsxs("small",{className:"muted",children:[s.stories.length," قصة"]})]},s.username))}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))",gap:12},children:w.map(s=>e.jsxs(a,{style:{overflow:"hidden",padding:0},children:[e.jsxs("div",{style:{aspectRatio:"9 / 16",position:"relative",background:"#111"},children:[I(s)?e.jsx("video",{src:s.media_url,muted:!0,loop:!0,autoPlay:!0,playsInline:!0,preload:"metadata",style:{width:"100%",height:"100%",objectFit:"cover"}}):e.jsx("img",{src:s.media_url,alt:"story",loading:"lazy",decoding:"async",style:{width:"100%",height:"100%",objectFit:"cover"}}),e.jsxs("div",{style:{position:"absolute",top:12,right:12,display:"flex",gap:6,flexWrap:"wrap"},children:[s.music?e.jsxs("span",{className:"story-chip",children:["🎵 ",s.music]}):null,s.sticker_items?.length?e.jsx("span",{className:"story-chip",children:s.sticker_items.join(" ")}):null]}),e.jsxs("div",{style:{position:"absolute",insetInline:0,bottom:0,padding:12,background:"linear-gradient(transparent, rgba(0,0,0,0.82))",color:"white"},children:[e.jsxs("div",{style:{fontWeight:700},children:["@",s.username]}),e.jsx("div",{style:{fontSize:12,opacity:.84},children:s.caption||"بدون كابشن"})]})]}),e.jsxs("div",{style:{padding:12,display:"grid",gap:8},children:[e.jsxs("div",{className:"muted",style:{fontSize:12},children:["👁️ ",s.views_count," · 💬 ",s.replies_count," · 🎵 ",s.music||"بدون موسيقى"]}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"},children:[e.jsx("span",{className:"story-chip",children:re(s)}),e.jsx(y,{variant:"secondary",onClick:()=>{const t=k.findIndex(d=>d.username===s.username),l=k[t]?.stories?.findIndex(d=>String(d.id)===String(s.id))||0;O("feed",t,l)},children:"عرض"})]})]})]},s.id))})]}):null,!_&&R==="archive"?j.length?e.jsxs("div",{style:{display:"grid",gap:16},children:[e.jsx(a,{style:{padding:16},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap",alignItems:"center"},children:[e.jsxs("div",{children:[e.jsx("strong",{children:"واجهة الأرشيف"}),e.jsx("div",{className:"muted",style:{marginTop:6},children:"مراجعة سريعة للقصص القديمة مع الموسيقى والملصقات والمشاهدات."})]}),e.jsxs("span",{className:"story-chip",children:[se," عنصر"]})]})}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:10},children:j.map(s=>{const t=B.findIndex(d=>d.username===s.username),l=B[t]?.stories?.findIndex(d=>String(d.id)===String(s.id))||0;return e.jsxs(a,{style:{overflow:"hidden",padding:0,cursor:"pointer"},onClick:()=>O("archive",t,l),children:[e.jsxs("div",{style:{aspectRatio:"9 / 16",background:"#111",position:"relative"},children:[I(s)?e.jsx("video",{src:s.media_url,muted:!0,preload:"metadata",style:{width:"100%",height:"100%",objectFit:"cover",opacity:.78}}):e.jsx("img",{src:s.media_url,alt:"archived",loading:"lazy",decoding:"async",style:{width:"100%",height:"100%",objectFit:"cover",opacity:.78}}),e.jsx("div",{style:{position:"absolute",top:10,left:10},children:e.jsx("span",{className:"story-chip",children:"🗄️ مؤرشف"})}),e.jsxs("div",{style:{position:"absolute",insetInline:0,bottom:0,padding:10,background:"linear-gradient(transparent, rgba(0,0,0,0.84))",color:"white"},children:[e.jsxs("strong",{children:["@",s.username]}),e.jsx("div",{style:{fontSize:11,opacity:.84},children:s.music||"بدون موسيقى"})]})]}),e.jsxs("div",{style:{padding:10,fontSize:12,display:"grid",gap:6},children:[e.jsxs("span",{className:"muted",children:["👁️ ",s.views_count," · 💬 ",s.replies_count]}),e.jsx("span",{className:"muted",children:s.sticker_items?.length?s.sticker_items.join(" "):"بدون ملصقات"})]})]},s.id)})})]}):e.jsx(a,{style:{padding:24},children:"الأرشيف فارغ."}):null,R==="create"?e.jsx(a,{style:{padding:18},children:e.jsxs("div",{style:{display:"grid",gap:16},children:[e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"minmax(0, 1fr) minmax(280px, 0.95fr)",gap:16},children:[e.jsxs("div",{style:{position:"relative",aspectRatio:"9 / 16",background:"#000",borderRadius:20,overflow:"hidden"},children:[T?.type?.startsWith("video/")?e.jsx("video",{src:u,controls:!0,style:{width:"100%",height:"100%",objectFit:"contain"}}):e.jsx("img",{src:u,alt:"preview",style:{width:"100%",height:"100%",objectFit:"contain"}}),e.jsx("div",{style:{position:"absolute",top:20,left:20,display:"flex",gap:8,flexWrap:"wrap"},children:W.map(s=>e.jsx("span",{className:"story-chip",style:{fontSize:20},children:s},s))}),e.jsxs("div",{style:{position:"absolute",insetInline:0,bottom:0,padding:16,background:"linear-gradient(transparent, rgba(0,0,0,0.82))",color:"white"},children:[e.jsx("div",{style:{fontSize:14,marginBottom:6},children:U||"اكتب كابشن للستوري"}),e.jsxs("div",{style:{fontSize:12,opacity:.82},children:["🎵 ",z.label]})]})]}),e.jsxs("div",{style:{display:"grid",gap:14},children:[e.jsxs(a,{style:{padding:14},children:[e.jsx("div",{style:{fontWeight:700,marginBottom:10},children:"Stickers"}),e.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:ke.map(s=>e.jsx("button",{type:"button",className:`story-picker-chip ${W.includes(s)?"active":""}`,onClick:()=>ce(s),children:s},s))})]}),e.jsxs(a,{style:{padding:14},children:[e.jsx("div",{style:{fontWeight:700,marginBottom:10},children:"Music UI"}),e.jsx("div",{style:{display:"grid",gap:10},children:G.map(s=>e.jsxs("button",{type:"button",className:`story-music-row ${z.id===s.id?"active":""}`,onClick:()=>K(s),children:[e.jsx("span",{className:"story-music-dot",style:{background:s.color}}),e.jsxs("span",{style:{textAlign:"start"},children:[e.jsx("strong",{children:s.label}),e.jsx("small",{className:"muted",style:{display:"block",marginTop:4},children:s.mood})]})]},s.id))})]})]})]}),e.jsx("textarea",{value:U,onChange:s=>q(s.target.value),rows:3,placeholder:"كابشن / CTA / سؤال للمشاهدين",style:{width:"100%",borderRadius:16,padding:12}}),e.jsxs("label",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx("input",{type:"checkbox",checked:D,onChange:s=>Y(s.target.checked)}),"نشر للأصدقاء المقربين فقط"]}),e.jsxs("div",{style:{display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap"},children:[e.jsx(y,{variant:"secondary",onClick:()=>{ee(),b("feed")},children:"إلغاء"}),e.jsx(y,{onClick:oe,loading:ae,children:"نشر الستوري"})]})]})}):null]}),e.jsx(me,{open:S&&!!i,onClose:()=>E(!1),title:i?`@${i.username}`:"Story",size:"large",children:i?e.jsxs("div",{style:{display:"grid",gap:16},children:[e.jsx("div",{style:{display:"flex",gap:6},children:(x?.stories||[]).map((s,t)=>e.jsx("div",{style:{flex:1,height:4,borderRadius:999,overflow:"hidden",background:"rgba(59,130,246,0.14)"},children:e.jsx("div",{style:{width:t<h?"100%":t===h?`${le}%`:"0%",height:"100%",background:"linear-gradient(135deg, #3b82f6, #8b5cf6)"}})},s.id||t))}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"minmax(0, 1.05fr) minmax(300px, 0.95fr)",gap:16},children:[e.jsxs("div",{style:{position:"relative",aspectRatio:"9 / 16",background:"#000",borderRadius:20,overflow:"hidden"},onMouseDown:()=>v(!0),onMouseUp:()=>v(!1),onTouchStart:()=>v(!0),onTouchEnd:()=>v(!1),children:[I(i)?e.jsx("video",{src:i.media_url,controls:!0,autoPlay:!0,playsInline:!0,style:{width:"100%",height:"100%",objectFit:"contain"}}):e.jsx("img",{src:i.media_url,alt:"story",style:{width:"100%",height:"100%",objectFit:"contain"}}),e.jsxs("div",{style:{position:"absolute",top:18,left:18,display:"flex",gap:8,flexWrap:"wrap"},children:[i.music?e.jsxs("span",{className:"story-chip",children:["🎵 ",i.music]}):null,i.sticker_items?.map(s=>e.jsx("span",{className:"story-chip",children:s},s))]}),e.jsx("button",{type:"button",className:"story-nav-hit story-nav-prev",onClick:()=>{if(h>0)m(s=>s-1);else if(g>0){const s=g-1,t=f[s]?.stories?.length||1;C(s),m(t-1)}},children:"‹"}),e.jsx("button",{type:"button",className:"story-nav-hit story-nav-next",onClick:()=>{h<(x?.stories?.length||0)-1?m(s=>s+1):g<f.length-1&&(C(s=>s+1),m(0))},children:"›"}),e.jsxs("div",{style:{position:"absolute",insetInline:0,bottom:0,padding:16,background:"linear-gradient(transparent, rgba(0,0,0,0.84))",color:"white"},children:[e.jsx("div",{style:{fontWeight:700,marginBottom:6},children:i.caption||"بدون كابشن"}),e.jsxs("div",{style:{fontSize:12,opacity:.82},children:["🎵 ",i.music||"بدون موسيقى"," · ",re(i)]})]})]}),e.jsxs("div",{style:{display:"grid",gap:12},children:[e.jsx(a,{style:{padding:14},children:e.jsxs("div",{style:{display:"grid",gap:8},children:[e.jsxs("div",{className:"story-meta-row",children:[e.jsx("strong",{children:"المشاهدات"}),e.jsx("span",{children:i.views_count})]}),e.jsxs("div",{className:"story-meta-row",children:[e.jsx("strong",{children:"الردود"}),e.jsx("span",{children:i.replies_count})]}),e.jsxs("div",{className:"story-meta-row",children:[e.jsx("strong",{children:"الأرشيف"}),e.jsx("span",{children:A==="archive"?"مؤرشف":j.some(s=>String(s.id)===String(i.id))?"موجود في الأرشيف":"نشط"})]}),e.jsxs("div",{className:"story-meta-row",children:[e.jsx("strong",{children:"المشاهدون التفصيليون"}),e.jsx("span",{children:i.viewers?.length||0})]})]})}),e.jsxs(a,{style:{padding:14},children:[e.jsx("div",{style:{fontWeight:700,marginBottom:10},children:"Reactions"}),e.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:Ne.map(s=>e.jsxs("button",{type:"button",className:"story-picker-chip",onClick:()=>pe(s),children:[s," ",i.reactions?.[s]?i.reactions[s]:""]},s))})]}),e.jsxs(a,{style:{padding:14},children:[e.jsx("div",{style:{fontWeight:700,marginBottom:10},children:"Viewers list"}),i.viewers?.length?e.jsx("div",{style:{display:"grid",gap:10,maxHeight:180,overflowY:"auto"},children:i.viewers.map((s,t)=>e.jsxs("div",{className:"story-viewer-row",children:[e.jsx("div",{className:"story-viewer-avatar",children:String(s?.username||s||"U").slice(0,1).toUpperCase()}),e.jsxs("div",{children:[e.jsx("strong",{children:s?.username||s}),e.jsx("div",{className:"muted",style:{fontSize:12},children:s?.viewed_at?new Date(s.viewed_at).toLocaleString("ar-EG"):"شاهد القصة"})]})]},`${s?.username||s}-${t}`))}):e.jsx("div",{className:"muted",children:"لا توجد بيانات viewers تفصيلية من الـ API حالياً، لكن عداد المشاهدات ظاهر فوق."})]}),e.jsxs(a,{style:{padding:14},children:[e.jsx("div",{style:{fontWeight:700,marginBottom:10},children:"Reply"}),e.jsx("textarea",{value:M,onChange:s=>F(s.target.value),rows:3,placeholder:"اكتب ردك على الستوري",style:{width:"100%",borderRadius:14,padding:12},onFocus:()=>v(!0),onBlur:()=>v(!1)}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginTop:10,flexWrap:"wrap"},children:[e.jsx("span",{className:"muted",style:{fontSize:12},children:"CTA / mentions / quick reactions جاهزين"}),e.jsx(y,{onClick:ue,children:"إرسال الرد"})]})]})]})]})]}):null}),e.jsx("style",{children:`
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
      `})]})}export{Ue as default};
