import{a as ve,b as ue,c as ge,d as be,e as he,f as fe,g as xe,h as we}from"./chunk-ALW4JOJN.js";import{a as Ne,b as ke,d as _e}from"./chunk-OLPZG774.js";import{b as Ce}from"./chunk-VWSV6YD4.js";import"./chunk-WJMN45ZI.js";import{a as m}from"./chunk-SY7LNBFN.js";import{b as ye}from"./chunk-4XIFRW6W.js";import{G as pe}from"./chunk-MYYGGH6K.js";import{a as qe,b as me}from"./chunk-T3SILTKH.js";import{d as V,k as le}from"./chunk-XSUFE7BX.js";le();var i=V(qe(),1);var e=V(me(),1),Qe=[{id:1,name:"\u0648\u0631\u062F\u0629",icon:"\u{1F339}",price:10},{id:2,name:"\u0642\u0647\u0648\u0629",icon:"\u2615",price:50},{id:3,name:"\u0642\u0644\u0628 \u0643\u0628\u064A\u0631",icon:"\u{1F49C}",price:100},{id:4,name:"\u0646\u062C\u0645\u0629",icon:"\u2B50",price:250},{id:5,name:"\u062A\u0627\u062C",icon:"\u{1F451}",price:1e3}];function Re({name:n="",src:l,size:w=42,ring:N=!1}){let a={width:w,height:w,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:N?"2px solid rgba(239,68,68,0.88)":"none",boxShadow:N?"0 0 0 4px rgba(239,68,68,0.12)":"none"};return l?(0,e.jsx)("img",{src:l,alt:n,style:a}):(0,e.jsx)("div",{style:{...a,display:"grid",placeItems:"center",color:"white",fontWeight:900,background:ke(n)},children:Ne(n).slice(0,1)})}function Ze({items:n}){return(0,e.jsx)("div",{className:"yam-live-hearts-layer","aria-hidden":!0,children:n.map(l=>(0,e.jsx)("span",{className:"yam-live-heart",style:{left:`${l.left}%`,animationDuration:`${l.duration}ms`},children:"\u{1F49C}"},l.id))})}function et(){let{pushToast:n}=ye(),l=pe(),[w,N]=(0,i.useState)([]),[a,h]=(0,i.useState)(null),[A,L]=(0,i.useState)([]),[S,U]=(0,i.useState)(""),[Le,O]=(0,i.useState)(!0),[Se,K]=(0,i.useState)(!1),[H,u]=(0,i.useState)(""),[Me,Y]=(0,i.useState)(!1),[Pe,M]=(0,i.useState)([]),[Te,Ee]=(0,i.useState)(1250),[D,$e]=(0,i.useState)([]),[k,B]=(0,i.useState)(!0),[P,J]=(0,i.useState)(!0),[y,W]=(0,i.useState)(""),[ze,Ae]=(0,i.useState)(!1),[He,_]=(0,i.useState)("\u062C\u0627\u0647\u0632"),[De,T]=(0,i.useState)("\u063A\u064A\u0631 \u0645\u062A\u0635\u0644"),[X,j]=(0,i.useState)(""),[je,q]=(0,i.useState)(!1),Q=(0,i.useRef)(null),v=(0,i.useRef)(null),p=(0,i.useRef)(null),C=(0,i.useRef)(null),g=(0,i.useRef)(null),Z=(0,i.useRef)(null),E=(0,i.useRef)(null),F=(0,i.useRef)([]),R=(0,i.useCallback)(async()=>{O(!0);try{let{data:t}=await ve(),o=Array.isArray(t)?t:[];N(o),h(s=>{if(!o.length)return null;if(s?.id){let c=o.find(r=>r.id===s.id);if(c)return c}return o[0]})}catch(t){n({type:"error",title:"\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0628\u062B\u0648\u062B",description:t?.response?.data?.detail||t?.message})}finally{O(!1)}},[n]),$=(0,i.useCallback)(async t=>{if(t){K(!0);try{let[{data:o},{data:s}]=await Promise.all([ue(t),be(t)]);h(o),L(Array.isArray(s)?s:[]),$e(o?.multi_host?.current_hosts||o?.co_hosts||[]),Ae(!!o?.livekit_configured)}catch(o){n({type:"error",title:"\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0628\u062B",description:o?.response?.data?.detail||o?.message})}finally{K(!1)}}},[n]),ee=(0,i.useCallback)(()=>{F.current.forEach(t=>{try{t.remove?.()}catch{}}),F.current=[]},[]),G=(0,i.useCallback)(()=>{C.current?.getTracks?.().forEach(t=>t.stop()),C.current=null,q(!1),v.current&&(v.current.pause?.(),v.current.srcObject=null)},[]),b=(0,i.useCallback)(async({keepPreview:t=!1}={})=>{if(E.current&&p.current){try{E.current.detach(p.current)}catch{}E.current=null}if(p.current&&(p.current.pause?.(),p.current.srcObject=null,p.current.removeAttribute("src"),p.current.load?.()),ee(),g.current){try{await g.current.disconnect()}catch{}g.current=null}W(""),T("\u063A\u064A\u0631 \u0645\u062A\u0635\u0644"),j(""),t||G()},[ee,G]),z=(0,i.useCallback)(async()=>{if(C.current)return C.current;if(!navigator.mediaDevices?.getUserMedia)throw new Error("\u0627\u0644\u0645\u062A\u0635\u0641\u062D \u0644\u0627 \u064A\u062F\u0639\u0645 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627");let t=await navigator.mediaDevices.getUserMedia({video:!0,audio:!1});return C.current=t,q(!0),v.current&&(v.current.srcObject=t,v.current.muted=!0,v.current.playsInline=!0,await v.current.play().catch(()=>{})),_("\u062A\u0645 \u0641\u062A\u062D \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627"),t},[]),te=(0,i.useCallback)((t,o="")=>{if(t){if(t.kind==="video"&&p.current){try{t.attach(p.current)}catch{}E.current=t,j(o||"\u0636\u064A\u0641 \u0645\u0628\u0627\u0634\u0631")}if(t.kind==="audio"){let s=t.attach();s.autoplay=!0,s.style.display="none",document.body.appendChild(s),F.current.push(s)}}},[]),ae=(0,i.useCallback)(async t=>{if(!a?.id){n({type:"warning",title:"\u0627\u062E\u062A\u0631 \u063A\u0631\u0641\u0629 \u0628\u062B \u0623\u0648\u0644\u0627\u064B"});return}a.livekit_configured||(n({type:"warning",title:"\u0633\u064A\u062A\u0645 \u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u062D\u0642\u064A\u0642\u064A",description:"\u0633\u064A\u062A\u0645 \u0637\u0644\u0628 \u062A\u0648\u0643\u0646 \u0627\u0644\u0628\u062B \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645 \u0644\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0625\u0639\u062F\u0627\u062F LiveKit \u0627\u0644\u0641\u0639\u0644\u064A."}),t==="host"&&await z()),u("connect-livekit");try{let{Room:o,RoomEvent:s}=Z.current||await import("./livekit-client.esm-MDB55YU2.js");Z.current={Room:o,RoomEvent:s};let{data:c}=await he(a.id,{role:t});await b({keepPreview:t==="host"});let r=new o({adaptiveStream:!0,dynacast:!0});g.current=r,r.on(s.ConnectionStateChanged,d=>{T(d==="connected"?"\u0645\u062A\u0635\u0644":d==="reconnecting"?"\u062C\u0627\u0631\u064D \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644":"\u063A\u064A\u0631 \u0645\u062A\u0635\u0644")}),r.on(s.TrackSubscribed,(d,ce,de)=>{te(d,de?.name||de?.identity||"\u0636\u064A\u0641 \u0645\u0628\u0627\u0634\u0631")}),r.on(s.TrackUnsubscribed,d=>{try{d.detach?.(p.current)}catch{}}),r.on(s.ParticipantConnected,d=>{j(d?.name||d?.identity||"\u0636\u064A\u0641 \u0645\u0628\u0627\u0634\u0631")}),r.on(s.Disconnected,()=>{T("\u063A\u064A\u0631 \u0645\u062A\u0635\u0644")}),await r.connect(c.livekit_url,c.token),W(t),T("\u0645\u062A\u0635\u0644"),t==="host"?(await z(),await r.localParticipant.setCameraEnabled(k),await r.localParticipant.setMicrophoneEnabled(P),_(k?"\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627 \u062A\u0639\u0645\u0644 \u0648\u0627\u0644\u0628\u062B \u0645\u062A\u0635\u0644":"\u0627\u0644\u0628\u062B \u0645\u062A\u0635\u0644 \u0648\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627 \u0645\u063A\u0644\u0642\u0629")):_("\u062A\u0645 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0644\u0645\u0634\u0627\u0647\u062F\u0629"),n({type:"success",title:t==="host"?"\u062A\u0645 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0628\u062B \u0627\u0644\u062D\u0642\u064A\u0642\u064A":"\u062A\u0645 \u0627\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0628\u062B"})}catch(o){await b({keepPreview:!0}),n({type:"error",title:"\u062A\u0639\u0630\u0631 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0628\u062B \u0627\u0644\u062D\u0642\u064A\u0642\u064A",description:o?.response?.data?.detail||o?.message})}finally{u("")}},[a?.id,a?.livekit_configured,te,k,b,z,P,n]);(0,i.useEffect)(()=>{R()},[R]),(0,i.useEffect)(()=>{a?.id&&$(a.id)},[a?.id,$]),(0,i.useEffect)(()=>{Q.current?.scrollIntoView({behavior:"smooth"})},[A]),(0,i.useEffect)(()=>{if(!a?.id)return;m.connect(),m.emit("join_live",{room_id:a.id,role:a.host===l?"host":"viewer",platform:"web",device_type:"browser"});let t=c=>{!c||c.room_id!==a.id||L(r=>[...r,c])},o=c=>{!c||c.room_id!==a.id||(h(r=>r&&{...r,viewer_count:c.viewer_count,hearts_count:c.hearts_count}),N(r=>r.map(d=>d.id===c.room_id?{...d,viewer_count:c.viewer_count,hearts_count:c.hearts_count}:d)),Ee(r=>r>1950?980:r+75))},s=()=>{let c=`heart-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,r={id:c,left:14+Math.random()*72,duration:1500+Math.random()*900};M(d=>[...d,r]),setTimeout(()=>M(d=>d.filter(ce=>ce.id!==c)),r.duration)};return m.on("new_comment",t),m.on("room_stats",o),m.on("new_heart",s),()=>{m.emit("leave_live",{room_id:a.id}),m.off("new_comment",t),m.off("room_stats",o),m.off("new_heart",s)}},[a?.id,a?.host,l]),(0,i.useEffect)(()=>()=>{b()},[b]);let f=a?.host||a?.username||"Streamer",x=f===l,ie=Number(a?.economy?.pot||a?.economy?.current_pot||0),oe=2e3,ne=Math.min(100,Math.round(ie/oe*100)),re=Array.isArray(a?.economy?.top_gifters)?a.economy.top_gifters:[],I=a?.recording?.status||"idle",Fe=Number(a?.analytics?.health_score||92),Ge=Number(a?.analytics?.avg_bitrate||4200),Ie=Number(a?.hearts_count||0),se=Number(a?.viewer_count||0),Ve=async()=>{if(!S.trim()||!a?.id)return;let t={id:`local-${Date.now()}`,room_id:a.id,user:l,text:S.trim(),created_at:new Date().toISOString()};L(o=>[...o,t]),m.emit("send_comment",{room_id:a.id,text:S.trim()}),U("")},Ue=()=>{if(!a?.id)return;m.emit("send_heart",{room_id:a.id});let t=`heart-${Date.now()}`,o={id:t,left:14+Math.random()*72,duration:1500+Math.random()*900};M(s=>[...s,o]),setTimeout(()=>M(s=>s.filter(c=>c.id!==t)),o.duration)},Oe=async t=>{if(a?.id)try{await xe({room_id:a.id,gift_name:t.name,coins:t.price}),n({type:"success",title:`\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 ${t.icon} ${t.name}`}),$(a.id),Y(!1)}catch(o){n({type:"error",title:"\u062A\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0647\u062F\u064A\u0629",description:o?.response?.data?.detail||o?.message})}},Ke=async()=>{try{let t=`${window.location.origin}${window.location.pathname}#/live`;await navigator.clipboard.writeText(t),n({type:"success",title:"\u062A\u0645 \u0646\u0633\u062E \u0631\u0627\u0628\u0637 \u0627\u0644\u0628\u062B"})}catch{n({type:"warning",title:"\u062A\u0639\u0630\u0631 \u0627\u0644\u0646\u0633\u062E",description:"\u0627\u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637 \u064A\u062F\u0648\u064A\u064B\u0627."})}},Ye=async()=>{try{u("create");let{data:t}=await ge({title:`\u0628\u062B \u0645\u0628\u0627\u0634\u0631 \u0645\u0639 ${l}`});h(t),await R(),n({type:"success",title:"\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u063A\u0631\u0641\u0629 \u0627\u0644\u0628\u062B \u0648\u0631\u0628\u0637\u0647\u0627 \u0628\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A"})}catch(t){n({type:"error",title:"\u062A\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0628\u062B",description:t?.response?.data?.detail||t?.message})}finally{u("")}},Be=async()=>{if(a?.id)try{u("recording");let t=I==="recording"?"stop":"start";await we({room_id:a.id,action:t}),await $(a.id),n({type:"success",title:t==="start"?"\u062A\u0645 \u0628\u062F\u0621 \u0627\u0644\u062A\u0633\u062C\u064A\u0644":"\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u062A\u0633\u062C\u064A\u0644"})}catch(t){n({type:"error",title:"\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062A\u0633\u062C\u064A\u0644",description:t?.response?.data?.detail||t?.message})}finally{u("")}},Je=async()=>{if(a?.id)try{u("end"),await b(),await fe(a.id),h(null),L([]),await R(),n({type:"success",title:"\u062A\u0645 \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0628\u062B"})}catch(t){n({type:"error",title:"\u062A\u0639\u0630\u0631 \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0628\u062B",description:t?.response?.data?.detail||t?.message})}finally{u("")}},We=async()=>{let t=!k;B(t);try{t?await z():y||G(),y==="host"&&g.current&&await g.current.localParticipant.setCameraEnabled(t),_(t?"\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627 \u062A\u0639\u0645\u0644":"\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627 \u0645\u062A\u0648\u0642\u0641\u0629")}catch(o){B(!t),n({type:"error",title:"\u062A\u0639\u0630\u0631 \u0627\u0644\u062A\u062D\u0643\u0645 \u0641\u064A \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627",description:o?.message})}},Xe=async()=>{let t=!P;J(t);try{y==="host"&&g.current&&await g.current.localParticipant.setMicrophoneEnabled(t),_(t?"\u0627\u0644\u0645\u0627\u064A\u0643 \u0645\u0641\u062A\u0648\u062D":"\u0627\u0644\u0645\u0627\u064A\u0643 \u0645\u063A\u0644\u0642")}catch(o){J(!t),n({type:"error",title:"\u062A\u0639\u0630\u0631 \u0627\u0644\u062A\u062D\u0643\u0645 \u0641\u064A \u0627\u0644\u0645\u0627\u064A\u0643",description:o?.message})}};return(0,e.jsx)(Ce,{children:(0,e.jsxs)("div",{className:"yam-live-page desktop-post mobile-post",children:[(0,e.jsxs)("div",{className:"yam-live-main",children:[(0,e.jsxs)("div",{className:"yam-live-stage-card",children:[(0,e.jsx)(Ze,{items:Pe}),(0,e.jsx)("div",{className:"yam-live-stage-gradient"}),(0,e.jsxs)("div",{className:"yam-live-stage-head",children:[(0,e.jsxs)("div",{className:"yam-live-badges",children:[(0,e.jsx)("span",{className:"live-badge live",children:"LIVE"}),(0,e.jsxs)("span",{className:"live-badge",children:["\u{1F441} ",se]}),(0,e.jsxs)("span",{className:"live-badge",children:["\u{1F49C} ",Ie]}),(0,e.jsxs)("span",{className:"live-badge",children:["\u26A1 ",Te,"ms"]})]}),(0,e.jsxs)("div",{className:"yam-live-stage-actions",children:[(0,e.jsx)("button",{type:"button",className:"yam-live-action-btn",onClick:R,children:"\u062A\u062D\u062F\u064A\u062B"}),(0,e.jsx)("button",{type:"button",className:"yam-live-action-btn",onClick:Ke,children:"\u0645\u0634\u0627\u0631\u0643\u0629"}),x?(0,e.jsx)("button",{type:"button",className:"yam-live-action-btn",onClick:Be,children:I==="recording"?"\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u062A\u0633\u062C\u064A\u0644":"\u0628\u062F\u0621 \u0627\u0644\u062A\u0633\u062C\u064A\u0644"}):null,x?(0,e.jsx)("button",{type:"button",className:"yam-live-action-btn danger",onClick:Je,children:"\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0628\u062B"}):null]})]}),(0,e.jsxs)("div",{className:"yam-live-video-shell",children:[(0,e.jsx)("video",{ref:p,className:`yam-live-main-video ${y==="viewer"?"visible":""}`,playsInline:!0,autoPlay:!0,controls:!1}),(0,e.jsx)("video",{ref:v,className:`yam-live-preview-video ${je?"visible":""} ${y==="host"?"host-mode":""}`,playsInline:!0,muted:!0,autoPlay:!0}),y==="viewer"&&X?(0,e.jsxs)("div",{className:"yam-remote-tag",children:["\u0627\u0644\u0628\u062B \u0645\u0646 ",X]}):null,y?null:(0,e.jsxs)("div",{className:"yam-live-video-placeholder",children:[(0,e.jsx)("div",{className:"yam-live-hero-icon",children:"\u{1F3A5}"}),(0,e.jsx)("h1",{children:a?.title||"\u0628\u062B \u0645\u0628\u0627\u0634\u0631 \u0645\u0645\u064A\u0632"}),(0,e.jsxs)("p",{children:["\u0627\u0644\u0645\u0636\u064A\u0641: ",(0,e.jsx)("strong",{children:f})]}),(0,e.jsx)("div",{className:"yam-live-stage-tech",children:"Database-backed live rooms \u2022 LiveKit token endpoint \u2022 Camera preview \u2022 Real-time socket comments"})]})]}),(0,e.jsxs)("div",{className:"yam-live-stage-footer",children:[(0,e.jsxs)("div",{className:"yam-live-host-box",children:[(0,e.jsx)(Re,{name:f,size:52,ring:!0}),(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:f}),(0,e.jsx)("p",{children:a?.title||"\u0628\u062B \u0645\u0628\u0627\u0634\u0631"})]})]}),(0,e.jsxs)("div",{className:"yam-live-stage-tools",children:[x?(0,e.jsx)("button",{type:"button",className:"yam-chip-btn",onClick:We,children:k?"\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627":"\u0641\u062A\u062D \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627"}):null,x?(0,e.jsx)("button",{type:"button",className:"yam-chip-btn",onClick:Xe,children:P?"\u0643\u062A\u0645 \u0627\u0644\u0645\u0627\u064A\u0643":"\u0641\u062A\u062D \u0627\u0644\u0645\u0627\u064A\u0643"}):null,x?(0,e.jsx)("button",{type:"button",className:"yam-chip-btn primary",onClick:()=>ae("host"),disabled:H==="connect-livekit",children:y==="host"?"\u0625\u0639\u0627\u062F\u0629 \u0645\u0632\u0627\u0645\u0646\u0629 \u0627\u0644\u0628\u062B":"\u0628\u062F\u0621 \u0627\u0644\u0628\u062B \u0627\u0644\u062D\u0642\u064A\u0642\u064A"}):null,x?null:(0,e.jsx)("button",{type:"button",className:"yam-chip-btn primary",onClick:()=>ae("viewer"),disabled:H==="connect-livekit",children:"\u062F\u062E\u0648\u0644 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629"}),y?(0,e.jsx)("button",{type:"button",className:"yam-chip-btn",onClick:()=>b({keepPreview:!1}),children:"\u0641\u0635\u0644 \u0627\u0644\u0627\u062A\u0635\u0627\u0644"}):null,(0,e.jsx)("button",{type:"button",className:"yam-chip-btn",onClick:Ue,children:"\u0625\u0631\u0633\u0627\u0644 \u0642\u0644\u0628"}),(0,e.jsx)("button",{type:"button",className:"yam-chip-btn",onClick:()=>Y(t=>!t),children:"\u0627\u0644\u0647\u062F\u0627\u064A\u0627"})]})]})]}),(0,e.jsxs)("div",{className:"yam-live-grid-aux",children:[(0,e.jsxs)("div",{className:"yam-live-info-card",children:[(0,e.jsxs)("div",{className:"yam-card-head",children:[(0,e.jsx)("strong",{children:"\u062D\u0627\u0644\u0629 \u0627\u0644\u0631\u0628\u0637"}),(0,e.jsx)("span",{children:Se?"\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u062F\u064A\u062B...":"\u0645\u0628\u0627\u0634\u0631"})]}),(0,e.jsxs)("div",{className:"yam-info-grid",children:[(0,e.jsxs)("div",{className:"yam-stat-box",children:[(0,e.jsx)("span",{children:"\u0627\u0644\u0642\u0627\u0639\u062F\u0629"}),(0,e.jsx)("strong",{children:a?.id?"\u0645\u0631\u062A\u0628\u0637\u0629":"\u063A\u064A\u0631 \u0645\u0631\u062A\u0628\u0637\u0629"})]}),(0,e.jsxs)("div",{className:"yam-stat-box",children:[(0,e.jsx)("span",{children:"\u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D"}),(0,e.jsx)("strong",{children:ze?"\u0645\u0641\u0639\u0644\u0629":"\u062A\u062D\u062A\u0627\u062C \u0625\u0639\u062F\u0627\u062F"})]}),(0,e.jsxs)("div",{className:"yam-stat-box",children:[(0,e.jsx)("span",{children:"\u0627\u0644\u0627\u062A\u0635\u0627\u0644"}),(0,e.jsx)("strong",{children:De})]}),(0,e.jsxs)("div",{className:"yam-stat-box",children:[(0,e.jsx)("span",{children:"\u0627\u0644\u0623\u062C\u0647\u0632\u0629"}),(0,e.jsx)("strong",{children:He})]})]})]}),(0,e.jsxs)("div",{className:"yam-live-info-card",children:[(0,e.jsxs)("div",{className:"yam-card-head",children:[(0,e.jsx)("strong",{children:"\u062C\u0648\u062F\u0629 \u0627\u0644\u0628\u062B"}),(0,e.jsxs)("span",{children:[Fe,"%"]})]}),(0,e.jsxs)("div",{className:"yam-info-grid",children:[(0,e.jsxs)("div",{className:"yam-stat-box",children:[(0,e.jsx)("span",{children:"\u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0648\u0646"}),(0,e.jsx)("strong",{children:se})]}),(0,e.jsxs)("div",{className:"yam-stat-box",children:[(0,e.jsx)("span",{children:"\u0627\u0644\u0628\u062A \u0631\u064A\u062A"}),(0,e.jsxs)("strong",{children:[Ge," kbps"]})]}),(0,e.jsxs)("div",{className:"yam-stat-box",children:[(0,e.jsx)("span",{children:"\u0627\u0644\u062A\u0633\u062C\u064A\u0644"}),(0,e.jsx)("strong",{children:I})]}),(0,e.jsxs)("div",{className:"yam-stat-box",children:[(0,e.jsx)("span",{children:"\u0622\u062E\u0631 \u0646\u0634\u0627\u0637"}),(0,e.jsx)("strong",{children:a?.last_activity_at?_e(a.last_activity_at):"\u0627\u0644\u0622\u0646"})]})]})]}),(0,e.jsxs)("div",{className:"yam-live-info-card",children:[(0,e.jsxs)("div",{className:"yam-card-head",children:[(0,e.jsx)("strong",{children:"\u0647\u062F\u0641 \u0627\u0644\u062F\u0639\u0645"}),(0,e.jsxs)("span",{children:[ne,"%"]})]}),(0,e.jsx)("div",{className:"yam-goal-bar",children:(0,e.jsx)("span",{style:{width:`${ne}%`}})}),(0,e.jsxs)("p",{className:"yam-subtle-copy",children:[ie," / ",oe," \u0639\u0645\u0644\u0629"]}),(0,e.jsx)("div",{className:"yam-supporter-row",children:re.length?re.map(([t,o])=>(0,e.jsxs)("div",{className:"yam-supporter-pill",children:[t," \u2022 ",o]},t)):(0,e.jsx)("div",{className:"yam-supporter-pill",children:"\u0644\u0627 \u064A\u0648\u062C\u062F \u062F\u0627\u0639\u0645\u064A\u0646 \u0628\u0639\u062F"})})]})]})]}),(0,e.jsxs)("aside",{className:"yam-live-sidebar",children:[(0,e.jsxs)("div",{className:"yam-live-side-card",children:[(0,e.jsxs)("div",{className:"yam-card-head",children:[(0,e.jsx)("strong",{children:"\u063A\u0631\u0641 \u0627\u0644\u0628\u062B"}),(0,e.jsx)("button",{type:"button",className:"yam-mini-btn",onClick:Ye,disabled:H==="create",children:"+ \u0625\u0646\u0634\u0627\u0621"})]}),(0,e.jsx)("div",{className:"yam-room-list",children:Le?(0,e.jsx)("p",{className:"yam-subtle-copy",children:"\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u063A\u0631\u0641..."}):w.length?w.map(t=>(0,e.jsxs)("button",{type:"button",className:`yam-room-card ${a?.id===t.id?"active":""}`,onClick:()=>h(t),children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:t.title}),(0,e.jsxs)("p",{children:["@",t.host||t.username]})]}),(0,e.jsxs)("span",{children:[t.viewer_count||0," \u{1F441}"]})]},t.id)):(0,e.jsx)("p",{className:"yam-subtle-copy",children:"\u0645\u0641\u064A\u0634 \u063A\u0631\u0641 \u062D\u0627\u0644\u064A\u0627\u064B. \u0623\u0646\u0634\u0626 \u0628\u062B \u062C\u062F\u064A\u062F."})})]}),(0,e.jsxs)("div",{className:"yam-live-side-card",children:[(0,e.jsxs)("div",{className:"yam-card-head",children:[(0,e.jsx)("strong",{children:"\u0627\u0644\u0645\u0636\u064A\u0641\u0648\u0646 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0648\u0646"}),(0,e.jsx)("span",{children:D.length})]}),(0,e.jsx)("div",{className:"yam-cohost-list",children:(D.length?D:[f]).map(t=>(0,e.jsxs)("div",{className:"yam-cohost-row",children:[(0,e.jsx)(Re,{name:t,size:40}),(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:t}),(0,e.jsx)("p",{children:t===f?"\u0627\u0644\u0645\u0636\u064A\u0641 \u0627\u0644\u0631\u0626\u064A\u0633\u064A":"\u0645\u0636\u064A\u0641 \u0645\u0634\u0627\u0631\u0643"})]})]},t))})]}),(0,e.jsxs)("div",{className:"yam-live-side-card yam-live-chat-box",children:[(0,e.jsxs)("div",{className:"yam-card-head",children:[(0,e.jsx)("strong",{children:"\u0627\u0644\u0634\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631"}),(0,e.jsx)("span",{children:A.length})]}),(0,e.jsxs)("div",{className:"yam-comment-stream",children:[A.map(t=>(0,e.jsxs)("div",{className:"yam-live-comment",children:[(0,e.jsx)("strong",{children:t.user||t.username||"\u0639\u0636\u0648"}),(0,e.jsx)("p",{children:t.text})]},t.id)),(0,e.jsx)("div",{ref:Q})]}),Me?(0,e.jsx)("div",{className:"yam-gift-tray",children:Qe.map(t=>(0,e.jsxs)("button",{type:"button",className:"yam-gift-card",onClick:()=>Oe(t),children:[(0,e.jsx)("span",{children:t.icon}),(0,e.jsx)("strong",{children:t.name}),(0,e.jsx)("small",{children:t.price})]},t.id))}):null,(0,e.jsxs)("div",{className:"yam-comment-composer",children:[(0,e.jsx)("input",{value:S,onChange:t=>U(t.target.value),placeholder:"\u0627\u0643\u062A\u0628 \u062A\u0639\u0644\u064A\u0642\u0643"}),(0,e.jsx)("button",{type:"button",onClick:Ve,children:"\u0625\u0631\u0633\u0627\u0644"})]})]})]}),(0,e.jsx)("style",{children:`
          .yam-live-page {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 340px;
            gap: 18px;
            padding: 18px;
            direction: rtl;
            color: #fff;
          }
          .yam-live-main {
            display: grid;
            gap: 18px;
          }
          .yam-live-stage-card,
          .yam-live-info-card,
          .yam-live-side-card {
            position: relative;
            border-radius: 28px;
            background: rgba(7, 12, 24, 0.92);
            border: 1px solid rgba(255,255,255,0.06);
            box-shadow: 0 28px 60px rgba(2,6,23,0.35);
            overflow: hidden;
          }
          .yam-live-stage-card {
            padding: 20px;
            min-height: 620px;
          }
          .yam-live-stage-gradient {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at top, rgba(139,92,246,0.18), transparent 48%), linear-gradient(180deg, rgba(59,130,246,0.08), transparent 30%);
            pointer-events: none;
          }
          .yam-live-stage-head,
          .yam-live-stage-footer,
          .yam-live-video-shell,
          .yam-live-grid-aux {
            position: relative;
            z-index: 1;
          }
          .yam-live-stage-head,
          .yam-live-stage-footer,
          .yam-card-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }
          .yam-live-badges,
          .yam-live-stage-actions,
          .yam-live-stage-tools,
          .yam-supporter-row {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .live-badge,
          .yam-chip-btn,
          .yam-mini-btn,
          .yam-supporter-pill,
          .yam-remote-tag {
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(15,23,42,0.66);
            color: #fff;
            font-weight: 800;
          }
          .live-badge {
            padding: 9px 12px;
            font-size: 12px;
          }
          .live-badge.live {
            background: rgba(239,68,68,0.18);
            color: #fecaca;
            border-color: rgba(239,68,68,0.3);
          }
          .yam-live-action-btn,
          .yam-chip-btn,
          .yam-mini-btn,
          .yam-comment-composer button,
          .yam-gift-card,
          .yam-room-card {
            transition: 0.18s ease;
          }
          .yam-live-action-btn,
          .yam-chip-btn,
          .yam-mini-btn,
          .yam-comment-composer button {
            border: none;
            cursor: pointer;
            padding: 11px 16px;
          }
          .yam-live-action-btn {
            border-radius: 16px;
            background: rgba(255,255,255,0.08);
            color: #fff;
            font-weight: 800;
          }
          .yam-live-action-btn.danger {
            background: rgba(239,68,68,0.18);
            color: #fecaca;
          }
          .yam-live-video-shell {
            margin-top: 18px;
            min-height: 360px;
            border-radius: 24px;
            background: linear-gradient(180deg, rgba(15,23,42,0.85), rgba(2,6,23,0.96));
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.06);
            display: grid;
            place-items: center;
          }
          .yam-live-main-video,
          .yam-live-preview-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: none;
            background: #000;
          }
          .yam-live-main-video.visible {
            display: block;
          }
          .yam-live-preview-video.visible {
            display: block;
          }
          .yam-live-preview-video.host-mode {
            display: block;
          }
          .yam-live-preview-video.host-mode:not(.visible) {
            display: none;
          }
          .yam-remote-tag {
            position: absolute;
            top: 18px;
            right: 18px;
            padding: 8px 12px;
          }
          .yam-live-video-placeholder {
            text-align: center;
            padding: 32px;
          }
          .yam-live-hero-icon {
            width: 86px;
            height: 86px;
            border-radius: 28px;
            display: grid;
            place-items: center;
            margin: 0 auto 18px;
            font-size: 38px;
            background: linear-gradient(135deg, rgba(139,92,246,0.28), rgba(59,130,246,0.12));
          }
          .yam-live-video-placeholder h1 {
            margin: 0 0 8px;
            font-size: 28px;
          }
          .yam-live-video-placeholder p,
          .yam-live-stage-tech,
          .yam-subtle-copy,
          .yam-room-card p,
          .yam-cohost-row p,
          .yam-live-comment p {
            margin: 0;
            color: #94a3b8;
          }
          .yam-live-stage-tech {
            margin-top: 14px;
            font-size: 13px;
          }
          .yam-live-stage-footer {
            margin-top: 18px;
          }
          .yam-live-host-box {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .yam-live-host-box p,
          .yam-cohost-row p {
            margin-top: 4px;
            font-size: 13px;
          }
          .yam-chip-btn {
            padding: 10px 14px;
            cursor: pointer;
          }
          .yam-chip-btn.primary,
          .yam-mini-btn,
          .yam-comment-composer button {
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          }
          .yam-live-grid-aux {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
          }
          .yam-live-info-card,
          .yam-live-side-card {
            padding: 18px;
            display: grid;
            gap: 14px;
          }
          .yam-card-head span {
            color: #94a3b8;
            font-size: 13px;
          }
          .yam-info-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .yam-stat-box {
            padding: 14px;
            border-radius: 18px;
            background: rgba(15,23,42,0.64);
            border: 1px solid rgba(255,255,255,0.05);
            display: grid;
            gap: 6px;
          }
          .yam-stat-box span {
            color: #94a3b8;
            font-size: 12px;
          }
          .yam-stat-box strong {
            color: #fff;
            font-size: 17px;
          }
          .yam-goal-bar {
            width: 100%;
            height: 12px;
            border-radius: 999px;
            background: rgba(148,163,184,0.14);
            overflow: hidden;
          }
          .yam-goal-bar span {
            display: block;
            height: 100%;
            background: linear-gradient(90deg, #8b5cf6, #10b981);
          }
          .yam-live-sidebar {
            display: grid;
            gap: 18px;
            align-content: start;
          }
          .yam-room-list,
          .yam-cohost-list,
          .yam-comment-stream,
          .yam-gift-tray {
            display: grid;
            gap: 10px;
          }
          .yam-room-card {
            width: 100%;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15,23,42,0.5);
            border-radius: 18px;
            padding: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            color: #fff;
            text-align: start;
            cursor: pointer;
          }
          .yam-room-card.active,
          .yam-room-card:hover {
            background: rgba(124,58,237,0.18);
            border-color: rgba(167,139,250,0.24);
          }
          .yam-cohost-row,
          .yam-live-comment {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 12px 14px;
            border-radius: 16px;
            background: rgba(15,23,42,0.5);
            border: 1px solid rgba(255,255,255,0.05);
          }
          .yam-live-chat-box {
            min-height: 420px;
          }
          .yam-comment-stream {
            max-height: 280px;
            overflow-y: auto;
            padding-inline-end: 4px;
          }
          .yam-comment-composer {
            display: flex;
            gap: 10px;
          }
          .yam-comment-composer input {
            flex: 1;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(15,23,42,0.7);
            color: #fff;
            padding: 12px 14px;
          }
          .yam-gift-tray {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .yam-gift-card {
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 18px;
            padding: 14px;
            background: rgba(15,23,42,0.54);
            color: #fff;
            display: grid;
            gap: 6px;
            justify-items: start;
            cursor: pointer;
          }
          .yam-gift-card:hover,
          .yam-live-action-btn:hover,
          .yam-chip-btn:hover,
          .yam-mini-btn:hover,
          .yam-comment-composer button:hover {
            transform: translateY(-1px);
          }
          .yam-live-hearts-layer {
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
            z-index: 3;
          }
          .yam-live-heart {
            position: absolute;
            bottom: 18px;
            font-size: 30px;
            animation-name: yamHeartFly;
            animation-timing-function: ease-out;
            animation-fill-mode: forwards;
          }
          @keyframes yamHeartFly {
            0% { transform: translateY(0) scale(0.8); opacity: 0.2; }
            25% { opacity: 1; }
            100% { transform: translateY(-260px) translateX(16px) scale(1.16); opacity: 0; }
          }
          @media (max-width: 1200px) {
            .yam-live-page {
              grid-template-columns: 1fr;
            }
            .yam-live-grid-aux {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 720px) {
            .yam-live-page {
              padding: 12px;
            }
            .yam-live-stage-card {
              min-height: auto;
              padding: 14px;
            }
            .yam-live-video-shell {
              min-height: 240px;
            }
            .yam-info-grid {
              grid-template-columns: 1fr 1fr;
            }
            .yam-comment-composer {
              flex-direction: column;
            }
            .yam-gift-tray {
              grid-template-columns: 1fr 1fr;
            }
          }
        `})]})})}export{et as default};
