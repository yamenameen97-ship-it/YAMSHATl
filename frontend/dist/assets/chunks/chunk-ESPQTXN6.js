import{a as Je,b as Qe,e as Xe,f as Ze,g as et}from"./chunk-OLPZG774.js";import{b as tt}from"./chunk-6QFO76GN.js";import{a as Ae}from"./chunk-SASJULPO.js";import{a as I}from"./chunk-I5OBQYGG.js";import{b as We}from"./chunk-4XIFRW6W.js";import{a as Ve,b as Fe,c as Ke,d as je,e as Oe,f as He,g as Ge,h as qe,i as Ye}from"./chunk-TMORTOLJ.js";import{a as Se}from"./chunk-NSLONKJH.js";import{i as Ce}from"./chunk-4STVG5GK.js";import{a as oe}from"./chunk-4VVMVC2S.js";import{H as $e,c as Me,d as Be,e as De,u as ze,y as Le}from"./chunk-OKBOFJIL.js";import{a as ke,b as ae}from"./chunk-T3SILTKH.js";import{d as q,k as O,l as D}from"./chunk-XSUFE7BX.js";O();var K=q(ke(),1);O();var V=q(ke(),1);O();var M=q(ke(),1);O();var Ue=q(ae(),1);function St(n=""){let e=String(n||"audio"),t=[],r=2166136261;for(let i=0;i<e.length;i+=1)r^=e.charCodeAt(i),r=Math.imul(r,16777619);for(let i=0;i<24;i+=1){r^=i+31,r=Math.imul(r,16777619);let s=20+Math.abs(r%75);t.push(s)}return t}function _e({seed:n,compact:e=!1}){let t=St(n);return(0,Ue.jsx)("div",{className:`audio-waveform ${e?"compact":""}`,"aria-hidden":"true",children:t.map((r,i)=>(0,Ue.jsx)("span",{style:{height:`${r}%`}},`${n}-${i}`))})}var v=q(ae(),1),_t=["audio/webm;codecs=opus","audio/ogg;codecs=opus","audio/webm"];function Rt(){return typeof MediaRecorder>"u"?"":_t.find(n=>MediaRecorder.isTypeSupported?.(n))||""}function Ct(n=0){let e=Math.floor(n/60),t=Math.floor(n%60);return`${e}:${String(t).padStart(2,"0")}`}function Kt(n,e,t){return Math.min(t,Math.max(e,n))}function Te({onSend:n,onCancel:e,onStateChange:t}){let[r,i]=(0,M.useState)("idle"),[s,u]=(0,M.useState)(0),[g,h]=(0,M.useState)(`voice-${Date.now()}`),[m,w]=(0,M.useState)(""),[T,k]=(0,M.useState)(null),[F,U]=(0,M.useState)(1),b=(0,M.useRef)(null),E=(0,M.useRef)(null),B=(0,M.useRef)([]),R=(0,M.useRef)(0),P=(0,M.useRef)(null),C=(0,M.useRef)(null);(0,M.useEffect)(()=>{t?.(r)},[t,r]),(0,M.useEffect)(()=>()=>{m&&URL.revokeObjectURL(m),P.current&&window.clearInterval(P.current),E.current?.getTracks()?.forEach(x=>x.stop())},[m]);let H=(0,M.useMemo)(()=>Rt(),[]),G=()=>{m&&URL.revokeObjectURL(m),w(""),k(null),U(1)},ie=()=>{P.current&&window.clearInterval(P.current),P.current=window.setInterval(()=>{R.current+=1,u(R.current)},1e3)},Z=()=>{P.current&&(window.clearInterval(P.current),P.current=null)},S=async()=>{try{G();let x=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:!0,noiseSuppression:!0,autoGainControl:!0}});E.current=x,B.current=[],R.current=0,u(0),h(`voice-${Date.now()}`);let te=new MediaRecorder(x,H?{mimeType:H}:void 0);b.current=te,te.ondataavailable=X=>{X.data?.size&&B.current.push(X.data)},te.onstop=()=>{Z();let X=new Blob(B.current,{type:H||"audio/webm"});if(!X.size){i("idle");return}let ue=URL.createObjectURL(X);k(X),w(ue),i("preview"),E.current?.getTracks()?.forEach(ce=>ce.stop())},te.start(250),i("recording"),ie()}catch(x){console.error(x),window.alert("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646 \u0623\u0648 \u0627\u0644\u0645\u062A\u0635\u0641\u062D \u0644\u0627 \u064A\u062F\u0639\u0645 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0635\u0648\u062A\u064A.")}},z=()=>{b.current?.state==="recording"&&(b.current.pause(),Z(),i("paused"))},ee=()=>{b.current?.state==="paused"&&(b.current.resume(),ie(),i("recording"))},se=()=>{b.current&&b.current.state!=="inactive"&&b.current.stop()},Q=()=>{Z(),b.current&&b.current.state!=="inactive"&&b.current.stop(),E.current?.getTracks()?.forEach(x=>x.stop()),G(),u(0),R.current=0,i("idle"),e?.()},de=()=>{if(!T)return;let x=new File([T],`voice-note-${Date.now()}.${H.includes("ogg")?"ogg":"webm"}`,{type:H||T.type||"audio/webm",lastModified:Date.now()});n?.({blob:T,file:x,durationSeconds:R.current,mimeType:x.type,waveformSeed:g}),G(),u(0),R.current=0,i("idle")};return(0,v.jsxs)("div",{style:{padding:12,borderRadius:18,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",display:"grid",gap:12},children:[(0,v.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12},children:[(0,v.jsxs)("div",{children:[(0,v.jsx)("div",{style:{fontWeight:700},children:"\u0631\u0633\u0627\u0644\u0629 \u0635\u0648\u062A\u064A\u0629"}),(0,v.jsxs)("div",{style:{fontSize:12,color:"var(--muted)"},children:[r==="idle"?"Opus codec + waveform + playback controls":null,r==="recording"?"\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u0633\u062C\u064A\u0644...":null,r==="paused"?"\u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0645\u062A\u0648\u0642\u0641 \u0645\u0624\u0642\u062A\u064B\u0627":null,r==="preview"?"\u0631\u0627\u062C\u0639 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0642\u0628\u0644 \u0627\u0644\u0625\u0631\u0633\u0627\u0644":null]})]}),(0,v.jsx)("div",{style:{fontSize:14,fontWeight:700,color:r==="recording"?"#ff7b7b":"var(--text)"},children:Ct(s)})]}),r==="recording"||r==="paused"?(0,v.jsxs)("div",{style:{display:"grid",gap:8},children:[(0,v.jsx)(_e,{seed:g}),(0,v.jsxs)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[r==="recording"?(0,v.jsx)("button",{type:"button",onClick:z,style:{padding:"8px 14px",borderRadius:999,border:"none",background:"#2e3350",color:"#fff"},children:"\u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A"}):(0,v.jsx)("button",{type:"button",onClick:ee,style:{padding:"8px 14px",borderRadius:999,border:"none",background:"#2e3350",color:"#fff"},children:"\u0627\u0633\u062A\u0643\u0645\u0627\u0644"}),(0,v.jsx)("button",{type:"button",onClick:se,style:{padding:"8px 14px",borderRadius:999,border:"none",background:"#8b5cf6",color:"#fff"},children:"\u0625\u0646\u0647\u0627\u0621"}),(0,v.jsx)("button",{type:"button",onClick:Q,style:{padding:"8px 14px",borderRadius:999,border:"1px solid rgba(255,255,255,0.12)",background:"transparent",color:"#fff"},children:"\u0625\u0644\u063A\u0627\u0621"})]})]}):null,r==="idle"?(0,v.jsxs)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[(0,v.jsx)("button",{type:"button",onClick:S,style:{padding:"10px 16px",borderRadius:999,border:"none",background:"#8b5cf6",color:"#fff",fontWeight:700},children:"\u0627\u0628\u062F\u0623 \u0627\u0644\u062A\u0633\u062C\u064A\u0644"}),(0,v.jsx)("button",{type:"button",onClick:()=>e?.(),style:{padding:"10px 16px",borderRadius:999,border:"1px solid rgba(255,255,255,0.12)",background:"transparent",color:"#fff"},children:"\u0631\u062C\u0648\u0639"})]}):null,r==="preview"&&m?(0,v.jsxs)("div",{style:{display:"grid",gap:10},children:[(0,v.jsx)(_e,{seed:g}),(0,v.jsx)("audio",{ref:C,src:m,controls:!0,preload:"metadata",style:{width:"100%"},onLoadedMetadata:()=>{let x=Kt(C.current?.duration||R.current||0,0,3600);x&&(R.current=Math.round(x),u(Math.round(x)))}}),(0,v.jsxs)("div",{style:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"},children:[(0,v.jsx)("label",{style:{fontSize:12,color:"var(--muted)"},children:"\u0627\u0644\u0633\u0631\u0639\u0629"}),[1,1.5,2].map(x=>(0,v.jsxs)("button",{type:"button",onClick:()=>{U(x),C.current&&(C.current.playbackRate=x)},style:{padding:"6px 10px",borderRadius:999,border:"1px solid rgba(255,255,255,0.12)",background:F===x?"rgba(139,92,246,0.2)":"transparent",color:"#fff"},children:["\xD7",x]},x))]}),(0,v.jsxs)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[(0,v.jsx)("button",{type:"button",onClick:de,style:{padding:"10px 16px",borderRadius:999,border:"none",background:"#22c55e",color:"#06110a",fontWeight:700},children:"\u0625\u0631\u0633\u0627\u0644"}),(0,v.jsx)("button",{type:"button",onClick:S,style:{padding:"10px 16px",borderRadius:999,border:"none",background:"#2e3350",color:"#fff"},children:"\u0625\u0639\u0627\u062F\u0629 \u062A\u0633\u062C\u064A\u0644"}),(0,v.jsx)("button",{type:"button",onClick:Q,style:{padding:"10px 16px",borderRadius:999,border:"1px solid rgba(255,255,255,0.12)",background:"transparent",color:"#fff"},children:"\u0625\u0644\u063A\u0627\u0621"})]})]}):null]})}O();O();var At=new TextEncoder,Ut=new TextDecoder;function ye(n=""){return At.encode(String(n??""))}function nt(n){if(!n)return"";let e=n instanceof Uint8Array?n:new Uint8Array(n);return Ut.decode(e)}function ne(n){if(!n)return"";let e=n instanceof Uint8Array?n:new Uint8Array(n),t="",r=32768;for(let i=0;i<e.length;i+=r){let s=e.subarray(i,i+r);t+=String.fromCharCode(...s)}return window.btoa(t)}function Y(n=""){if(!n)return new Uint8Array;let e=window.atob(String(n)),t=new Uint8Array(e.length);for(let r=0;r<e.length;r+=1)t[r]=e.charCodeAt(r);return t}function rt(n=16){let e=new Uint8Array(n);return crypto.getRandomValues(e),e}function it(n){let e=n instanceof Uint8Array?n:new Uint8Array(n||[]);return Array.from(e,t=>t.toString(16).padStart(2,"0")).join("")}function at(n,e=null){try{return n?JSON.parse(n):e}catch{return e}}var Tt="yamshat-signal-protocol",It=1,ot=24,we="P-256";function gt(n){return`${Tt}:${String(n||"guest").trim().toLowerCase()}`}function Nt(n){return typeof window>"u"?null:at(window.localStorage.getItem(gt(n)),null)}function be(n,e){typeof window>"u"||window.localStorage.setItem(gt(n),JSON.stringify(e))}function re(){return Date.now()}function Ie(){return Math.floor(1e3+Math.random()*9e5)}function fe(n){return Array.isArray(n)?n:[]}function st(n=0){let e=new DataView(new ArrayBuffer(4));return e.setUint32(0,Number(n)>>>0),new Uint8Array(e.buffer)}async function dt(n,e="raw"){return ne(new Uint8Array(await crypto.subtle.exportKey(e,n)))}async function ct(n){return ne(new Uint8Array(await crypto.subtle.exportKey("pkcs8",n)))}async function lt(n){return crypto.subtle.importKey("raw",Y(n),{name:"ECDH",namedCurve:we},!0,[])}async function ut(n){return crypto.subtle.importKey("pkcs8",Y(n),{name:"ECDH",namedCurve:we},!0,["deriveBits"])}async function Et(n){return crypto.subtle.importKey("pkcs8",Y(n),{name:"ECDSA",namedCurve:we},!0,["sign"])}async function ve(...n){let e=n.map(s=>s instanceof Uint8Array?s:new Uint8Array(s||[])),t=e.reduce((s,u)=>s+u.length,0),r=new Uint8Array(t),i=0;return e.forEach(s=>{r.set(s,i),i+=s.length}),new Uint8Array(await crypto.subtle.digest("SHA-256",r))}async function pt(n,e){let t=await crypto.subtle.deriveBits({name:"ECDH",public:e},n,256);return new Uint8Array(t)}async function me(n,e,t){let r=await crypto.subtle.importKey("raw",n,"HKDF",!1,["deriveBits"]),i=await crypto.subtle.deriveBits({name:"HKDF",hash:"SHA-256",salt:t,info:ye(e)},r,256);return new Uint8Array(i)}async function Pt(n,e,t,r){let i=await crypto.subtle.importKey("raw",n,{name:"AES-GCM"},!1,["encrypt"]),s=await crypto.subtle.encrypt({name:"AES-GCM",iv:e,additionalData:r},i,t);return new Uint8Array(s)}async function Mt(n,e,t,r){let i=await crypto.subtle.importKey("raw",n,{name:"AES-GCM"},!1,["decrypt"]),s=await crypto.subtle.decrypt({name:"AES-GCM",iv:e,additionalData:r},i,t);return new Uint8Array(s)}function Bt(n){return fe(n?.preKeys).find(e=>!e.usedAt)||fe(n?.preKeys)[0]||null}var Ne=class{async generateAgreementKeyPair(){let e=await crypto.subtle.generateKey({name:"ECDH",namedCurve:we},!0,["deriveBits"]);return{publicKey:await dt(e.publicKey),privateKey:await ct(e.privateKey)}}async generateSigningKeyPair(){let e=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:we},!0,["sign","verify"]);return{publicKey:await dt(e.publicKey),privateKey:await ct(e.privateKey)}}async signBytes(e,t){let r=await Et(e),i=await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},r,t);return ne(new Uint8Array(i))}async createSignedPreKeyRecord(e,t=Ie()){let r=await this.generateAgreementKeyPair(),i=await this.signBytes(e.signing.privateKey,Y(r.publicKey));return{id:t,publicKey:r.publicKey,privateKey:r.privateKey,signature:i,createdAt:re()}}async createPreKeys(e=ot){let t=[];for(let r=0;r<e;r+=1){let i=await this.generateAgreementKeyPair();t.push({id:Ie()+r,publicKey:i.publicKey,privateKey:i.privateKey,createdAt:re(),usedAt:null})}return t}async initializeIdentity(e){if(!e)return null;let t=Nt(e);if(t?.identity?.agreement?.publicKey&&t?.identity?.signing?.publicKey&&t?.signedPreKey?.publicKey)return t;let r={agreement:await this.generateAgreementKeyPair(),signing:await this.generateSigningKeyPair()},i=await this.createSignedPreKeyRecord(r),s=await this.createPreKeys(),u={version:1,username:e,deviceId:It,registrationId:Ie(),createdAt:re(),protocol:"signal-style-ratchet",identity:r,signedPreKey:i,preKeys:s,peerBundles:{},sessions:{},serverSupport:!!(typeof window<"u"&&window.APP_SIGNAL_SERVER_SUPPORT||D.VITE_SIGNAL_SERVER_SUPPORT==="true")};return be(e,u),u}async topUpPreKeys(e,t=8){let r=await this.initializeIdentity(e);if(!r)return null;let i=fe(r.preKeys).filter(g=>!g.usedAt).length;if(i>=t)return r;let s=await this.createPreKeys(ot-i),u={...r,preKeys:[...fe(r.preKeys),...s]};return be(e,u),u}async rotateSignedPreKey(e){let t=await this.initializeIdentity(e);if(!t)return null;let r=await this.createSignedPreKeyRecord(t.identity),i={...t,signedPreKey:r,signedPreKeyRotatedAt:re()};return be(e,i),i}async exportPublicBundle(e){let t=await this.topUpPreKeys(e);return t?{username:e,registrationId:t.registrationId,deviceId:t.deviceId,identityKey:t.identity.agreement.publicKey,identitySigningKey:t.identity.signing.publicKey,signedPreKey:{id:t.signedPreKey.id,publicKey:t.signedPreKey.publicKey,signature:t.signedPreKey.signature,createdAt:t.signedPreKey.createdAt},preKeys:fe(t.preKeys).filter(r=>!r.usedAt).slice(0,10).map(({id:r,publicKey:i,createdAt:s})=>({id:r,publicKey:i,createdAt:s})),protocol:t.protocol,ratchet:"hkdf-chain-key",createdAt:t.createdAt}:null}async registerPeerBundle(e,t,r){if(!e||!t||!r?.identityKey||!r?.signedPreKey?.publicKey)return null;let i=await this.initializeIdentity(e);if(!i)return null;let s={...i,peerBundles:{...i.peerBundles||{},[t]:{...r||{},registeredAt:re()}}};return be(e,s),s.peerBundles[t]}async generateFingerprint(e,t){let r=await this.initializeIdentity(e),i=r?.peerBundles?.[t];if(!i?.identityKey)return"";let s=await ve(Y(r.identity.agreement.publicKey),Y(i.identityKey)),u=it(s).toUpperCase();return u.match(/.{1,5}/g)?.slice(0,12).join(" ")||u}async deriveSessionMaterial(e,t){let r=await this.initializeIdentity(e),i=r?.peerBundles?.[t];if(!r||!i?.identityKey||!i?.signedPreKey?.publicKey)return{state:r,session:null,reason:"missing-peer-bundle"};let s=r.sessions?.[t];if(s?.chainKey){let C=await this.generateFingerprint(e,t);return{state:r,session:s,fingerprint:C}}let u=await ut(r.identity.agreement.privateKey),g=await ut(r.signedPreKey.privateKey),h=await lt(i.identityKey),m=await lt(i.signedPreKey.publicKey),w=await pt(u,m),T=await pt(g,h),k=await ve(w,T,ye(`${e}:${t}:double-ratchet`)),F=await ve(Y(r.identity.agreement.publicKey),Y(i.identityKey)),U=await me(k,"yamshat-root-key",F),b=await me(U,"yamshat-chain-key",F),E=Bt(r),B=await this.generateFingerprint(e,t),R={sessionId:`${e}:${t}:${re()}`,protocol:r.protocol,status:"established",fingerprint:B,preKeyId:E?.id||null,rootKey:ne(U),chainKey:ne(b),sendingCounter:0,receivingCounter:0,createdAt:re(),lastRotateAt:re()},P={...r,preKeys:fe(r.preKeys).map(C=>C.id===E?.id?{...C,usedAt:re()}:C),sessions:{...r.sessions||{},[t]:R}};return be(e,P),{state:P,session:R,fingerprint:B}}async encryptMessage({username:e,peer:t,plaintext:r}){if(!r)return{enabled:!1,plaintext:r,reason:"empty-message"};let{state:i,session:s,fingerprint:u,reason:g}=await this.deriveSessionMaterial(e,t);if(!s)return{enabled:!1,plaintext:r,reason:g,publicBundle:await this.exportPublicBundle(e)};let h=Number(s.sendingCounter||0)+1,m=Y(s.chainKey),w=await ve(st(h),ye(`${e}:${t}:ratchet`)),T=await me(m,"yamshat-ratchet-key",w),k=await me(T,"yamshat-next-chain",w),F=rt(12),U=ye(`${e}|${t}|${h}`),b=await Pt(T,F,ye(r),U),E={...i,sessions:{...i.sessions||{},[t]:{...s,chainKey:ne(k),sendingCounter:h,lastRotateAt:re()}}};return be(e,E),{enabled:!0,algorithm:"WebCrypto ECDH + HKDF + AES-GCM",counter:h,sessionId:s.sessionId,fingerprint:u,ciphertext:ne(b),nonce:ne(F),associatedData:ne(U),publicBundle:await this.exportPublicBundle(e)}}async decryptMessage({username:e,peer:t,payload:r}){let{state:i,session:s}=await this.deriveSessionMaterial(e,t);if(!s||!r?.ciphertext)return r?.plaintext||"";let u=Number(r?.counter||s.receivingCounter||0),g=Y(s.chainKey),h=await ve(st(u),ye(`${e}:${t}:ratchet`)),m=await me(g,"yamshat-ratchet-key",h),w=await me(m,"yamshat-next-chain",h),T=await Mt(m,Y(r.nonce),Y(r.ciphertext),Y(r.associatedData)),k={...i,sessions:{...i.sessions||{},[t]:{...s,chainKey:ne(w),receivingCounter:u,lastRotateAt:re()}}};return be(e,k),nt(T)}async getSecuritySnapshot(e,t){try{let r=await this.initializeIdentity(e);if(!r)return{enabled:!1,status:"disabled",reason:"missing-user"};let i=r.sessions?.[t]||null,s=r.peerBundles?.[t]||null,u=s?await this.generateFingerprint(e,t):"";return{enabled:!0,status:i?.status||(s?"bundle-ready":"waiting-peer-bundle"),protocol:r.protocol,registrationId:r.registrationId,deviceId:r.deviceId,availablePreKeys:fe(r.preKeys).filter(g=>!g.usedAt).length,signedPreKeyId:r.signedPreKey?.id||null,fingerprint:u,serverSupport:!!r.serverSupport,sessionId:i?.sessionId||null,lastRotateAt:i?.lastRotateAt||r.signedPreKey?.createdAt||r.createdAt}}catch(r){return ze.warn("Failed to compute security snapshot",{message:r?.message}),{enabled:!1,status:"failed",reason:r?.message||"security-error"}}}},Dt=new Ne,yt=Dt;var l=q(ae(),1);function xe(n){typeof window>"u"||window.dispatchEvent(new CustomEvent("yamshat:toast",{detail:n}))}function zt(n){return n?.type?.startsWith("image/")?"image":n?.type?.startsWith("video/")?"video":n?.type?.startsWith("audio/")?"audio":"file"}function Lt(n){let e=zt(n),t=["image","video","audio"].includes(e)?URL.createObjectURL(n):"";return{id:`attachment-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,file:n,kind:e,previewUrl:t,status:"queued",progress:0,stage:"queued",error:"",uploadResult:null}}function bt(n=[]){n.forEach(e=>{e?.previewUrl&&URL.revokeObjectURL(e.previewUrl)})}function ft(n){return Ce.find(t=>Number(t.value)===Number(n))?.label||"\u0628\u062F\u0648\u0646"}function Ee({currentUser:n,replyTo:e,onCancelReply:t,onSend:r,peer:i,securitySnapshot:s,disabled:u=!1,compact:g=!1}){let[h,m]=(0,V.useState)(""),[w,T]=(0,V.useState)(!1),[k,F]=(0,V.useState)([]),[U,b]=(0,V.useState)(!1),[E,B]=(0,V.useState)(!1),[R,P]=(0,V.useState)(0),C=(0,V.useRef)(null),H=(0,V.useRef)(!1),G=(0,V.useRef)(null),ie=(0,V.useRef)([]);(0,V.useEffect)(()=>{ie.current=k},[k]),(0,V.useEffect)(()=>()=>{bt(ie.current),C.current&&clearTimeout(C.current)},[]);let Z=(0,V.useMemo)(()=>k.filter(a=>a.status==="queued"||a.status==="uploading").length,[k]),S=u||!i,z=()=>{C.current&&clearTimeout(C.current),H.current&&(H.current=!1,i&&I.emit("chat_typing",{receiver:i,is_typing:!1}))},ee=a=>{S||(B(a==="recording"||a==="paused"),i&&I.emit("chat_recording",{receiver:i,is_recording:a==="recording"||a==="paused"}))},se=a=>{S||(m(a),i&&(!H.current&&a.trim()&&(H.current=!0,I.emit("chat_typing",{receiver:i,is_typing:!0})),C.current&&clearTimeout(C.current),C.current=setTimeout(z,1800)))},Q=(a,f)=>{F(A=>A.map(j=>j.id===a?{...j,...f||{}}:j))},de=()=>{bt(k),m(""),F([]),b(!1),T(!1),B(!1),G.current&&(G.current.value=""),t&&t(),z(),i&&I.emit("chat_recording",{receiver:i,is_recording:!1})},x=a=>{if(S)return;let f=Array.from(a||[]);if(!f.length)return;let A=[],j=[];f.forEach(c=>{try{Se.validate(c),A.push(Lt(c))}catch(_){j.push({file:c,error:_?.message||"\u0645\u0644\u0641 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D"})}}),A.length&&(F(c=>[...c,...A]),T(!1)),j.length&&xe({type:"error",title:"\u0628\u0639\u0636 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0645\u0631\u0641\u0648\u0636\u0629",description:j.map(c=>`${c.file.name}: ${c.error}`).join(" | ")})},te=a=>{F(f=>{let A=f.find(j=>j.id===a);return A?.previewUrl&&URL.revokeObjectURL(A.previewUrl),f.filter(j=>j.id!==a)})},X=async a=>{Q(a.id,{status:"uploading",progress:0,stage:"preparing",error:""});try{let f=await Se.uploadFile(a.file,{onProgress:A=>{Q(a.id,{status:A?.percent>=100?"uploaded":"uploading",progress:Number(A?.percent||0),stage:A?.stage||"uploading"})}});return Q(a.id,{status:"uploaded",progress:100,stage:"done",uploadResult:f}),f}catch(f){throw Q(a.id,{status:"failed",error:f?.message||"\u0641\u0634\u0644 \u0627\u0644\u0631\u0641\u0639",stage:"failed"}),f}},ue=async a=>{if(!n||!i||!a.trim())return null;try{return await yt.encryptMessage({username:n,peer:i,plaintext:a.trim()})}catch(f){return xe({type:"warning",title:"\u062A\u0639\u0630\u0631 \u062A\u062C\u0647\u064A\u0632 \u0637\u0628\u0642\u0629 \u0627\u0644\u062A\u0634\u0641\u064A\u0631",description:f?.message||"\u0633\u064A\u062A\u0645 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0628\u062A\u0648\u0627\u0641\u0642\u064A\u0629 \u0645\u0624\u0642\u062A\u0629."}),null}},ce=async()=>{if(!(S||U||!h.trim()&&k.length===0)){b(!0);try{let a=await Promise.all(k.map(A=>X(A))),f=await ue(h);await r?.({text:h.trim(),media_url:a[0]?.mediaUrl||"",media_urls:a.map(A=>A.mediaUrl).filter(Boolean),attachments:a,type:a.length?a[0]?.mediaType||"media":"text",replyTo:e,securityPayload:f,disappearing_in_seconds:Number(R||0),message_status:{sent:!1,delivered:!1,seen:!1,typing:!1,recording:!1}}),de()}catch(a){xe({type:"error",title:"\u062A\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629",description:a?.response?.data?.detail||a?.message||"\u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u062A\u0627\u0646\u064A\u0629."}),b(!1)}}},p=async a=>{if(!S){b(!0);try{let f=await Se.uploadVoiceNote(a.file,{fileName:a.file.name,onProgress:()=>{}});await r?.({text:"",media_url:f.mediaUrl,media_urls:[f.mediaUrl],attachments:[f],type:"voice",waveform_seed:a.waveformSeed,audio_duration_seconds:a.durationSeconds,replyTo:e,securityPayload:null,disappearing_in_seconds:Number(R||0),message_status:{sent:!1,delivered:!1,seen:!1,typing:!1,recording:!1}}),de()}catch(f){xe({type:"error",title:"\u0641\u0634\u0644 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062A\u0633\u062C\u064A\u0644",description:f?.message||"\u062C\u0631\u0651\u0628 \u0645\u0631\u0629 \u062A\u0627\u0646\u064A\u0629."}),b(!1)}}},L=s?.enabled?`${s.protocol||"Signal"} \u2022 ${s.status||"ready"}`:"Signal bootstrap pending";return(0,l.jsxs)("div",{style:{padding:g?10:12,background:g?"rgba(8,15,29,0.96)":"#111827",borderTop:"1px solid rgba(255,255,255,0.08)",display:"grid",gap:10},children:[g?null:(0,l.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"},children:[(0,l.jsxs)("div",{style:{fontSize:12,color:"var(--muted)"},children:["\u{1F510} ",L]}),(0,l.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},children:[(0,l.jsx)("label",{style:{fontSize:12,color:"var(--muted)"},children:"\u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0645\u062E\u062A\u0641\u064A\u0629"}),(0,l.jsx)("select",{value:R,disabled:S,onChange:a=>P(Number(a.target.value||0)),style:{background:"#0f172a",color:"#fff",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"8px 10px"},children:Ce.map(a=>(0,l.jsx)("option",{value:a.value,children:a.label},a.value))}),(0,l.jsxs)("span",{style:{fontSize:12,color:"var(--muted)"},children:["\u23F1 ",ft(R)]})]})]}),e?(0,l.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",padding:g?"8px 10px":"8px 12px",background:"rgba(255,255,255,0.05)",borderRadius:14,gap:10},children:[(0,l.jsxs)("div",{style:{fontSize:12,borderRight:"2px solid var(--primary)",paddingRight:8},children:[(0,l.jsxs)("div",{style:{fontWeight:"bold"},children:["\u0627\u0644\u0631\u062F \u0639\u0644\u0649 ",e.sender]}),(0,l.jsx)("div",{style:{opacity:.75},children:e.content||e.message})]}),(0,l.jsx)("button",{type:"button",onClick:t,disabled:S,style:{background:"none",border:"none",color:"white"},children:"\xD7"})]}):null,k.length>0?(0,l.jsx)("div",{style:{display:"grid",gap:8},children:k.map(a=>(0,l.jsxs)("div",{style:{display:"grid",gap:8,padding:10,borderRadius:14,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"},children:[(0,l.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10},children:[(0,l.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:10,minWidth:0},children:[a.previewUrl&&a.kind==="image"?(0,l.jsx)("img",{src:a.previewUrl,alt:a.file.name,style:{width:56,height:56,borderRadius:12,objectFit:"cover"}}):null,a.previewUrl&&a.kind==="video"?(0,l.jsx)("video",{src:a.previewUrl,style:{width:56,height:56,borderRadius:12,objectFit:"cover"}}):null,a.kind==="audio"&&a.previewUrl?(0,l.jsx)("audio",{src:a.previewUrl,controls:!0,style:{maxWidth:220}}):null,a.previewUrl?null:(0,l.jsx)("div",{style:{width:56,height:56,borderRadius:12,display:"grid",placeItems:"center",background:"rgba(139,92,246,0.15)"},children:"\u{1F4C4}"}),(0,l.jsxs)("div",{style:{minWidth:0},children:[(0,l.jsx)("div",{style:{fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:a.file.name}),(0,l.jsxs)("div",{style:{fontSize:12,color:"var(--muted)"},children:[a.stage," \u2022 ",a.progress,"%"]}),a.error?(0,l.jsx)("div",{style:{fontSize:12,color:"#fca5a5"},children:a.error}):null]})]}),(0,l.jsx)("button",{type:"button",onClick:()=>te(a.id),disabled:S,style:{background:"none",border:"none",color:"#fca5a5"},children:"\u062D\u0630\u0641"})]}),(0,l.jsx)("div",{style:{height:6,borderRadius:999,background:"rgba(255,255,255,0.08)",overflow:"hidden"},children:(0,l.jsx)("div",{style:{width:`${a.progress}%`,height:"100%",background:a.status==="failed"?"#ef4444":"#8b5cf6",transition:"width 0.2s ease"}})})]},a.id))}):null,w?(0,l.jsx)(Te,{onStateChange:ee,onSend:p,onCancel:()=>{ee("idle"),T(!1)}}):null,(0,l.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:10,direction:"rtl"},children:[(0,l.jsx)("button",{type:"button",disabled:S,style:{background:"none",border:"none",fontSize:20},onClick:()=>xe({type:"info",title:"\u0627\u0644\u0625\u064A\u0645\u0648\u062C\u064A",description:"\u0627\u0633\u062A\u062E\u062F\u0645 \u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u064A\u0645\u0648\u062C\u064A \u0641\u064A \u062C\u0647\u0627\u0632\u0643 \u0623\u0648 \u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D."}),children:"\u{1F60A}"}),(0,l.jsxs)("label",{style:{cursor:S?"not-allowed":"pointer",opacity:S?.55:1},children:[(0,l.jsx)("input",{ref:G,type:"file",hidden:!0,multiple:!0,disabled:S,onChange:a=>x(a.target.files)}),(0,l.jsx)("span",{style:{fontSize:20},children:"\u{1F4CE}"})]}),(0,l.jsx)("button",{type:"button",disabled:S,onClick:()=>T(a=>!a),style:{background:w||E?"#8b5cf6":"transparent",border:"1px solid rgba(255,255,255,0.12)",width:g?46:40,height:g?46:40,borderRadius:g?16:"50%",color:"white",flexShrink:0},children:"\u{1F3A4}"}),(0,l.jsx)("input",{type:"text",disabled:S,placeholder:u?"\u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0645\u0639\u0637\u0644\u0629 \u062D\u0627\u0644\u064A\u0627\u064B":i?`\u0627\u0643\u062A\u0628 \u0631\u0633\u0627\u0644\u0629 \u0625\u0644\u0649 ${i}...`:"\u0627\u0643\u062A\u0628 \u0631\u0633\u0627\u0644\u0629...",value:h,onChange:a=>se(a.target.value),onKeyDown:a=>{a.key==="Enter"&&!a.shiftKey&&(a.preventDefault(),ce())},style:{flex:1,minWidth:0,background:"#1f2937",border:"1px solid rgba(255,255,255,0.08)",padding:g?"15px 18px":"12px 14px",borderRadius:g?20:18,color:"white",outline:"none",minHeight:g?54:48}}),(0,l.jsx)(oe,{onClick:ce,loading:U,disabled:S||U||!h.trim()&&k.length===0,children:"\u0625\u0631\u0633\u0627\u0644"})]}),g?(0,l.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,color:"#94a3b8",fontSize:11},children:[(0,l.jsx)("span",{children:Z>0?`\u0645\u0631\u0641\u0642\u0627\u062A \u0642\u064A\u062F \u0627\u0644\u0625\u0631\u0633\u0627\u0644: ${Z}`:"\u0645\u0633\u0627\u062D\u0629 \u0643\u062A\u0627\u0628\u0629 \u0648\u0627\u0633\u0639\u0629 \u0628\u062F\u0648\u0646 \u0647\u064A\u062F\u0631 \u062C\u0627\u0646\u0628\u064A"}),(0,l.jsx)("span",{children:R?`\u0627\u0644\u0627\u062E\u062A\u0641\u0627\u0621: ${ft(R)}`:"\u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0639\u0627\u062F\u064A\u0629 \u0645\u0641\u0639\u0644\u0629"})]}):null]})}O();var N=q(ke(),1);O();var wt=(...n)=>n.flatMap(e=>String(e||"").split(",")).map(e=>e.trim()).filter(Boolean),mt=wt(D.VITE_STUN_URL,D.VITE_STUN_URL_FALLBACK,D.VITE_STUN_URLS),ht=wt(D.VITE_TURN_URL,D.VITE_TURN_URL_FALLBACK,D.VITE_TURN_URL_TCP,D.VITE_TURN_URLS),vt=[{urls:mt.length?mt:["stun:stun.l.google.com:19302","stun:global.stun.twilio.com:3478"]},...ht.length?[{urls:ht,username:D.VITE_TURN_USERNAME||"",credential:D.VITE_TURN_CREDENTIAL||""}]:[]].filter(Boolean),Re={mode:"voice",speaker:!0,muted:!1,cameraEnabled:!0,cameraFacingMode:"user"};function xt(){return{transport:"WebRTC",stun:vt.filter(n=>String(n.urls).includes("stun")).flatMap(n=>n.urls||[]),turn:vt.filter(n=>String(n.urls).includes("turn")).flatMap(n=>n.urls||[]),adaptiveReconnect:!0}}var d=q(ae(),1),$t=[{id:"host",name:"\u0623\u0646\u062A",role:"host"},{id:"guest-1",name:"\u0636\u064A\u0641 1",role:"guest"},{id:"guest-2",name:"\u0636\u064A\u0641 2",role:"guest"},{id:"guest-3",name:"\u0636\u064A\u0641 3",role:"guest"}];function Wt(n=0){let e=["linear-gradient(135deg, #3b82f6, #8b5cf6)","linear-gradient(135deg, #f97316, #ef4444)","linear-gradient(135deg, #10b981, #14b8a6)","linear-gradient(135deg, #eab308, #f97316)"];return e[n%e.length]}function Pe({open:n,mode:e="voice",callType:t="direct",participantName:r="\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645",onClose:i,onStatusChange:s}){let u=(0,N.useMemo)(()=>xt(),[]),g=(0,N.useRef)(null),[h,m]=(0,N.useState)("idle"),[w,T]=(0,N.useState)(Re.muted),[k,F]=(0,N.useState)(Re.speaker),[U,b]=(0,N.useState)(e==="video"),[E,B]=(0,N.useState)(Re.cameraFacingMode),[R,P]=(0,N.useState)(0),[C,H]=(0,N.useState)("excellent"),[G,ie]=(0,N.useState)(null),[Z,S]=(0,N.useState)(""),[z,ee]=(0,N.useState)(null),[se,Q]=(0,N.useState)(t==="group"?$t:[{id:"peer",name:r,role:"peer"}]);(0,N.useEffect)(()=>{if(!n)return;let p=!1;(async()=>{m("connecting"),S(""),s?.("connecting");try{let f=e==="video",A=await navigator.mediaDevices.getUserMedia({audio:!0,video:f?{facingMode:E,width:{ideal:1280},height:{ideal:720}}:!1});if(p){A.getTracks().forEach(j=>j.stop());return}ee(A),g.current&&(g.current.srcObject=A),m("connected"),ie(Date.now()),s?.("connected")}catch(f){m("fallback"),S(f?.message||"\u062A\u0639\u0630\u0631 \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646 \u0623\u0648 \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627."),s?.("fallback")}})();let a=window.setInterval(()=>{H(f=>f==="excellent"?"good":f==="good"?"stable":"excellent")},6e3);return()=>{p=!0,window.clearInterval(a)}},[E,e,s,n]),(0,N.useEffect)(()=>{!g.current||!z||(g.current.srcObject=z)},[z]),(0,N.useEffect)(()=>()=>{z?.getTracks?.().forEach(p=>p.stop())},[z]);let de=(0,N.useMemo)(()=>{if(!G)return"00:00";let p=Math.max(0,Math.floor((Date.now()-G)/1e3)),L=String(Math.floor(p/60)).padStart(2,"0"),a=String(p%60).padStart(2,"0");return`${L}:${a}`},[G,R,h]),x=()=>{let p=!w;T(p),z?.getAudioTracks?.().forEach(L=>{L.enabled=!p})},te=async()=>{if(e!=="video")return;let p=!U;b(p),z?.getVideoTracks?.().forEach(L=>{L.enabled=p})},X=async()=>{B(E==="user"?"environment":"user"),P(L=>L+1)},ue=async()=>{z?.getTracks?.().forEach(p=>p.stop()),ee(null),m("reconnecting"),P(p=>p+1),s?.("reconnecting");try{let p=await navigator.mediaDevices.getUserMedia({audio:!0,video:e==="video"?{facingMode:E}:!1});ee(p),g.current&&(g.current.srcObject=p),m("connected"),s?.("connected")}catch(p){m("fallback"),S(p?.message||"\u062A\u0639\u0630\u0631 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644."),s?.("fallback")}},ce=async()=>{F(L=>!L);let p=g.current;if(p&&typeof p.setSinkId=="function")try{await p.setSinkId(k?"default":"communications")}catch{}};return n?(0,d.jsxs)("div",{style:{display:"grid",gap:16},children:[(0,d.jsxs)(Ae,{style:{padding:16,background:"linear-gradient(160deg, rgba(15,23,42,0.95), rgba(30,41,59,0.96))",color:"white"},children:[(0,d.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:16,flexWrap:"wrap"},children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{style:{fontSize:13,opacity:.72,marginBottom:4},children:t==="group"?"Group call":e==="video"?"Video call":"Voice call"}),(0,d.jsx)("h3",{style:{margin:0,fontSize:24},children:t==="group"?"\u063A\u0631\u0641\u0629 \u0645\u0643\u0627\u0644\u0645\u0629 \u062C\u0645\u0627\u0639\u064A\u0629":r}),(0,d.jsxs)("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginTop:10},children:[(0,d.jsx)("span",{className:"call-chip",children:u.transport}),(0,d.jsx)("span",{className:"call-chip",children:h==="connected"?"Connected":h==="reconnecting"?"Reconnecting":h==="fallback"?"Fallback mode":"Connecting"}),(0,d.jsx)("span",{className:"call-chip",children:C}),(0,d.jsx)("span",{className:"call-chip",children:de})]})]}),(0,d.jsxs)("div",{style:{textAlign:"end"},children:[(0,d.jsx)("div",{style:{fontSize:12,opacity:.7},children:"TURN/STUN"}),(0,d.jsxs)("div",{style:{fontSize:13},children:[u.turn.length?`${u.turn.length} TURN`:"TURN pending"," \xB7 ",u.stun.length," STUN"]}),(0,d.jsxs)("div",{style:{fontSize:12,opacity:.7,marginTop:4},children:["Reconnect #",R]})]})]}),(0,d.jsxs)("div",{style:{display:"grid",gridTemplateColumns:t==="group"?"repeat(auto-fit, minmax(160px, 1fr))":"1fr",gap:12},children:[(0,d.jsxs)("div",{style:{minHeight:220,borderRadius:20,overflow:"hidden",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",position:"relative"},children:[e==="video"&&U&&z?(0,d.jsx)("video",{ref:g,autoPlay:!0,muted:!0,playsInline:!0,style:{width:"100%",height:"100%",objectFit:"cover"}}):(0,d.jsx)("div",{style:{minHeight:220,display:"grid",placeItems:"center",background:"radial-gradient(circle at top, rgba(59,130,246,0.35), rgba(15,23,42,0.95))"},children:(0,d.jsxs)("div",{style:{textAlign:"center"},children:[(0,d.jsx)("div",{style:{width:84,height:84,borderRadius:"50%",display:"grid",placeItems:"center",margin:"0 auto 12px",fontSize:30,fontWeight:700,background:"rgba(255,255,255,0.15)"},children:String(r||"Y").slice(0,1).toUpperCase()}),(0,d.jsx)("div",{style:{fontWeight:700},children:"\u0623\u0646\u062A"}),(0,d.jsx)("div",{style:{opacity:.75,fontSize:12},children:e==="video"?"\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627 \u0645\u063A\u0644\u0642\u0629 \u0623\u0648 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u0629":"\u0645\u0643\u0627\u0644\u0645\u0629 \u0635\u0648\u062A\u064A\u0629 \u0641\u0642\u0637"})]})}),(0,d.jsx)("div",{style:{position:"absolute",insetInlineStart:12,bottom:12,background:"rgba(15,23,42,0.78)",padding:"6px 10px",borderRadius:999,fontSize:12},children:w?"\u0627\u0644\u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646 \u0645\u0643\u062A\u0648\u0645":"\u0627\u0644\u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646 \u0634\u063A\u0627\u0644"})]}),t==="group"?se.map((p,L)=>(0,d.jsx)("div",{style:{minHeight:220,borderRadius:20,overflow:"hidden",background:Wt(L),position:"relative",display:"grid",placeItems:"center"},children:(0,d.jsxs)("div",{style:{textAlign:"center",color:"white"},children:[(0,d.jsx)("div",{style:{width:72,height:72,borderRadius:"50%",background:"rgba(255,255,255,0.18)",display:"grid",placeItems:"center",margin:"0 auto 10px",fontSize:26,fontWeight:700},children:p.name.slice(0,1).toUpperCase()}),(0,d.jsx)("div",{style:{fontWeight:700},children:p.name}),(0,d.jsx)("div",{style:{fontSize:12,opacity:.85},children:p.role==="host"?"Host":"Participant"})]})},p.id)):null]}),Z?(0,d.jsx)("div",{style:{marginTop:14,borderRadius:14,padding:12,background:"rgba(248,113,113,0.14)",border:"1px solid rgba(248,113,113,0.25)",fontSize:13},children:Z}):null]}),(0,d.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))",gap:10},children:[(0,d.jsx)(oe,{variant:w?"warning":"secondary",onClick:x,children:w?"\u0625\u0644\u063A\u0627\u0621 \u0643\u062A\u0645":"\u0643\u062A\u0645 \u0627\u0644\u0645\u064A\u0643"}),(0,d.jsx)(oe,{variant:k?"secondary":"warning",onClick:ce,children:k?"\u0627\u0644\u0633\u0645\u0627\u0639\u0629 \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629":"\u0633\u0645\u0627\u0639\u0629 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629"}),e==="video"?(0,d.jsx)(oe,{variant:U?"secondary":"warning",onClick:te,children:U?"\u0642\u0641\u0644 \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627":"\u0641\u062A\u062D \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627"}):null,e==="video"?(0,d.jsx)(oe,{variant:"secondary",onClick:X,children:"\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627"}):null,(0,d.jsx)(oe,{variant:"secondary",onClick:ue,children:"\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644"}),t==="group"?(0,d.jsx)(oe,{variant:"success",onClick:()=>Q(p=>[...p,{id:`guest-${Date.now()}`,name:`\u0636\u064A\u0641 ${p.length+1}`,role:"guest"}]),children:"\u0625\u0636\u0627\u0641\u0629 \u0645\u0634\u0627\u0631\u0643"}):null,(0,d.jsx)(oe,{variant:"danger",onClick:i,children:"\u0625\u0646\u0647\u0627\u0621"})]}),(0,d.jsxs)(Ae,{style:{padding:16},children:[(0,d.jsx)("div",{style:{fontWeight:700,marginBottom:10},children:"\u062C\u0627\u0647\u0632\u064A\u0629 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A"}),(0,d.jsxs)("div",{style:{display:"grid",gap:10},children:[(0,d.jsxs)("div",{className:"call-info-row",children:[(0,d.jsx)("strong",{children:"Voice / Video / Group"}),(0,d.jsx)("span",{children:t==="group"?"\u062C\u0627\u0647\u0632":e==="video"?"\u0641\u064A\u062F\u064A\u0648 + \u0635\u0648\u062A":"\u0635\u0648\u062A \u0641\u0642\u0637"})]}),(0,d.jsxs)("div",{className:"call-info-row",children:[(0,d.jsx)("strong",{children:"WebRTC"}),(0,d.jsx)("span",{children:"\u0645\u0641\u0639\u0644 \u0639\u0644\u0649 \u0627\u0644\u0648\u0627\u062C\u0647\u0629 \u0645\u0639 ICE config"})]}),(0,d.jsxs)("div",{className:"call-info-row",children:[(0,d.jsx)("strong",{children:"STUN"}),(0,d.jsx)("span",{children:u.stun.join(" \u2022 ")})]}),(0,d.jsxs)("div",{className:"call-info-row",children:[(0,d.jsx)("strong",{children:"TURN"}),(0,d.jsx)("span",{children:u.turn.length?u.turn.join(" \u2022 "):"\u0623\u0636\u0641 VITE_TURN_URL / USERNAME / CREDENTIAL"})]}),(0,d.jsxs)("div",{className:"call-info-row",children:[(0,d.jsx)("strong",{children:"Reconnect strategy"}),(0,d.jsx)("span",{children:"Exponential retry + manual reconnect"})]})]})]}),(0,d.jsx)("style",{children:`
        .call-chip {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 12px;
        }
        .call-info-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(15,23,42,0.04);
          border: 1px solid rgba(15,23,42,0.08);
          font-size: 13px;
        }
        @media (max-width: 640px) {
          .call-info-row {
            flex-direction: column;
          }
        }
      `})]}):null}var o=q(ae(),1);function kt({name:n="",src:e,size:t=44,ring:r=!1}){let i={width:t,height:t,borderRadius:r?18:"50%",objectFit:"cover",flexShrink:0,border:r?"1px solid rgba(139,92,246,0.42)":"none",boxShadow:r?"0 0 0 4px rgba(139,92,246,0.12)":"none"};return e?(0,o.jsx)("img",{src:e,alt:n,style:i}):(0,o.jsx)("div",{style:{...i,display:"grid",placeItems:"center",color:"white",fontWeight:900,background:Qe(n),fontSize:t*.34},children:Je(n).slice(0,1)})}function Vt({isOnline:n}){return(0,o.jsx)("span",{style:{display:"inline-block",width:10,height:10,borderRadius:"50%",background:n?"#22c55e":"#64748b",boxShadow:n?"0 0 0 3px rgba(34,197,94,0.22)":"none",flexShrink:0}})}function Ft({message:n,isMe:e,onReply:t,onDelete:r}){let i=!!n.media_url,s=n.type==="voice",u=n.type==="image"||i&&/\.(jpg|jpeg|png|gif|webp)/i.test(n.media_url||""),g=n.type==="video"||i&&/\.(mp4|webm|mov)/i.test(n.media_url||""),h=n.content||n.message||"";return(0,o.jsxs)("div",{className:`yam-bubble-wrap ${e?"me":"them"}`,children:[!e&&(0,o.jsx)(kt,{name:n.sender,size:34}),(0,o.jsxs)("div",{className:`yam-bubble ${e?"bubble-me":"bubble-them"}`,children:[n.reply_to?(0,o.jsxs)("div",{className:"bubble-reply-banner",children:[(0,o.jsx)("strong",{children:"\u21A9 \u0627\u0644\u0631\u062F \u0639\u0644\u0649:"})," ",n.reply_to?.content||"..."]}):null,s&&n.media_url?(0,o.jsx)("audio",{src:n.media_url,controls:!0,style:{width:"100%",maxWidth:320,display:"block"}}):null,u&&n.media_url?(0,o.jsx)("img",{src:n.media_url,alt:"media",style:{maxWidth:320,width:"100%",borderRadius:16,display:"block"}}):null,g&&n.media_url?(0,o.jsx)("video",{src:n.media_url,controls:!0,style:{maxWidth:320,width:"100%",borderRadius:16,display:"block"}}):null,h&&!n.deleted?(0,o.jsx)("div",{className:"bubble-text",children:h}):null,n.deleted?(0,o.jsx)("div",{className:"bubble-deleted",children:"\u{1F5D1} \u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0631\u0633\u0627\u0644\u0629"}):null,(0,o.jsxs)("div",{className:"bubble-meta",children:[(0,o.jsx)("span",{className:"bubble-time",children:new Date(n.created_at).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}),e?(0,o.jsx)("span",{style:{color:et(n.status),fontSize:13,fontWeight:700},children:Ze(n.status)}):null]}),(0,o.jsxs)("div",{className:"bubble-actions",children:[(0,o.jsx)("button",{type:"button",onClick:()=>t(n),children:"\u21A9"}),e&&!n.deleted?(0,o.jsx)("button",{type:"button",onClick:()=>r(n.id),children:"\u{1F5D1}"}):null]})]})]})}function jt(){let{userId:n}=Be(),e=Me(),t=decodeURIComponent(n||"").trim(),r=$e(),{pushToast:i}=We(),[s,u]=(0,K.useState)([]),[g,h]=(0,K.useState)(!0),[m,w]=(0,K.useState)([]),[T,k]=(0,K.useState)(!1),[F,U]=(0,K.useState)({}),[b,E]=(0,K.useState)({can_chat:!0,blocked_by_me:!1,blocked_me:!1}),[B,R]=(0,K.useState)(null),[P,C]=(0,K.useState)(null),[H,G]=(0,K.useState)([]),[ie,Z]=(0,K.useState)(!1),[S,z]=(0,K.useState)(!1),ee=(0,K.useRef)(null),se=Le(c=>c.setActivePeer);(0,K.useEffect)(()=>{let c=!0;return h(!0),je().then(({data:_})=>{c&&u(Array.isArray(_)?_:[])}).catch(()=>{}).finally(()=>{c&&h(!1)}),()=>{c=!1}},[]);let Q=(0,K.useCallback)(async()=>{if(t){k(!0);try{let{data:c}=await Ve(t,50);w(c?.items||[]),await Ke(t)}catch{i({type:"error",title:"\u062E\u0637\u0623",description:"\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0631\u0633\u0627\u0626\u0644"})}finally{k(!1)}}},[t,i]);(0,K.useEffect)(()=>{if(t)return Q(),z(!1),se(t),Oe(t).then(({data:c})=>{U(_=>({..._,[t]:{..._[t]||{},...c||{}}}))}).catch(()=>{}),He(t).then(({data:c})=>{E(c||{})}).catch(()=>{}),()=>se(null)},[t,Q,se]),(0,K.useEffect)(()=>{ee.current?.scrollIntoView({behavior:"smooth"})},[m]),(0,K.useEffect)(()=>{if(!r)return;I.connect(),I.emit("register_user",{user:r},{skipSignature:!0}),t&&(I.emit("join_chat",{peer:t}),I.emit("sync_chat_state",{peer:t}));let c=y=>{[y?.sender,y?.receiver].includes(r)&&(w(W=>{let le=W.findIndex(ge=>ge.id===y.id||ge.client_id&&ge.client_id===y.client_id);if(le>=0){let ge=[...W];return ge[le]={...ge[le],...y},ge}return[...W,y]}),u(W=>W.map(le=>le.username===y.sender||le.username===y.receiver?{...le,last_message:y.content||y.message,created_at:y.created_at}:le)),y.sender===t&&Ke(t).catch(()=>{}))},_=y=>{y?.sender===r&&w($=>$.map(W=>y.message_ids?.includes(W.id)?{...W,status:"delivered"}:W))},J=y=>{y?.sender===r&&w($=>$.map(W=>y.message_ids?.includes(W.id)?{...W,status:"seen"}:W))},pe=y=>{y?.user&&U($=>({...$,[y.user]:{...$[y.user]||{},...y}}))},he=y=>{y?.sender&&(U($=>({...$,[y.sender]:{...$[y.sender]||{},is_typing:y.is_typing}})),y.is_typing&&setTimeout(()=>U($=>({...$,[y.sender]:{...$[y.sender]||{},is_typing:!1}})),3200))};return I.on("new_private_message",c),I.on("messages_delivered",_),I.on("messages_seen",J),I.on("presence_update",pe),I.on("typing_update",he),()=>{t&&I.emit("leave_chat",{peer:t}),I.off("new_private_message",c),I.off("messages_delivered",_),I.off("messages_seen",J),I.off("presence_update",pe),I.off("typing_update",he)}},[r,t]);let de=async c=>{let _=c?.text?.trim()||"",J=c?.media_url||"";if(!_&&!J)return;let pe=`tmp-${Date.now()}`,he={id:pe,sender:r,receiver:t,content:_,message:_,media_url:J,type:J?c.type||"media":"text",created_at:new Date().toISOString(),status:"sending",reply_to:B?{id:B.id,content:B.content||B.message}:null};w(y=>[...y,he]),R(null);try{let{data:y}=await Fe({receiver:t,message:_,media_url:J,type:he.type,reply_to_id:B?.id||null,client_id:pe});w($=>$.map(W=>W.id===pe?{...W,...y||{},status:(y||{}).status||"sent"}:W))}catch{w(y=>y.filter($=>$.id!==pe)),i({type:"error",title:"\u062E\u0637\u0623",description:"\u0641\u0634\u0644 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629"})}},x=async c=>{try{await Ye(c),w(_=>_.map(J=>J.id===c?{...J,deleted:!0,content:"",message:""}:J))}catch{i({type:"error",title:"\u062A\u0639\u0630\u0631 \u0627\u0644\u062D\u0630\u0641"})}},te=async()=>{try{b.blocked_by_me?(await qe(t),E(c=>({...c,blocked_by_me:!1,can_chat:!0})),i({type:"success",title:"\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u062D\u0638\u0631"})):(await Ge(t),E(c=>({...c,blocked_by_me:!0,can_chat:!1})),i({type:"success",title:"\u062A\u0645 \u0627\u0644\u062D\u0638\u0631"}))}catch{i({type:"error",title:"\u062A\u0639\u0630\u0631\u062A \u0627\u0644\u0639\u0645\u0644\u064A\u0629"})}},X=()=>{Z(c=>{let _=!c;return i({type:"success",title:_?"\u062A\u0645 \u0643\u062A\u0645 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629":"\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0643\u062A\u0645 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629"}),_})},ue=()=>{w([]),i({type:"success",title:"\u062A\u0645 \u062A\u0646\u0638\u064A\u0641 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0627\u0644\u0645\u0639\u0631\u0648\u0636\u0629",description:"\u062A\u0645 \u062A\u0641\u0631\u064A\u063A \u0627\u0644\u0634\u0627\u0634\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0628\u062F\u0648\u0646 \u062D\u0630\u0641 \u0627\u0644\u0633\u062C\u0644 \u0645\u0646 \u0627\u0644\u0633\u064A\u0631\u0641\u0631."})},ce=()=>{let c=Date.now();G(_=>[..._,c]),setTimeout(()=>G(_=>_.filter(J=>J!==c)),1800)},p=F[t]||{},L=p.is_online,a=p.is_typing,f=p.last_seen,A=(0,K.useMemo)(()=>s.find(c=>c.username===t)||{},[s,t]),j=(0,K.useMemo)(()=>m.filter(c=>c.media_url),[m]);return t?(0,o.jsx)(tt,{children:(0,o.jsxs)("section",{className:"yam-chat-screen",dir:"rtl",children:[(0,o.jsxs)("div",{className:"yam-chat-stage",children:[(0,o.jsxs)("header",{className:"yam-chat-stage-header",children:[(0,o.jsx)("button",{type:"button",className:"yam-stage-icon",onClick:()=>e("/inbox"),title:"\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A",children:"\u2192"}),(0,o.jsxs)("div",{className:"yam-chat-stage-peer",children:[(0,o.jsx)(kt,{name:t,src:A.avatar,size:52,ring:!0}),(0,o.jsxs)("div",{className:"yam-chat-stage-peer-copy",children:[(0,o.jsx)("strong",{children:t}),(0,o.jsxs)("span",{children:[(0,o.jsx)(Vt,{isOnline:L}),a?"\u064A\u0643\u062A\u0628 \u0627\u0644\u0622\u0646...":Xe(f,L),ie?" \u2022 \u0645\u0643\u062A\u0648\u0645\u0629":""]})]})]}),(0,o.jsxs)("div",{className:"yam-chat-stage-actions",children:[(0,o.jsx)("button",{type:"button",className:"yam-stage-icon",onClick:()=>C("voice"),title:"\u0645\u0643\u0627\u0644\u0645\u0629 \u0635\u0648\u062A\u064A\u0629",children:"\u{1F4DE}"}),(0,o.jsx)("button",{type:"button",className:"yam-stage-icon",onClick:()=>C("video"),title:"\u0645\u0643\u0627\u0644\u0645\u0629 \u0641\u064A\u062F\u064A\u0648",children:"\u{1F4F9}"}),(0,o.jsx)("button",{type:"button",className:`yam-stage-icon ${S?"active":""}`,onClick:()=>z(c=>!c),title:"\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644",children:S?"\u27E8":"\u27E9"})]})]}),S?(0,o.jsxs)("div",{className:"yam-chat-details-drawer",children:[(0,o.jsxs)("div",{className:"yam-details-grid",children:[(0,o.jsx)("button",{type:"button",className:"yam-detail-action",onClick:X,children:ie?"\u{1F514} \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0643\u062A\u0645":"\u{1F515} \u0643\u062A\u0645 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629"}),(0,o.jsx)("button",{type:"button",className:"yam-detail-action",onClick:ce,children:"\u{1F49C} \u062A\u0641\u0627\u0639\u0644 \u0633\u0631\u064A\u0639"}),(0,o.jsx)("button",{type:"button",className:`yam-detail-action ${b.blocked_by_me?"danger":""}`,onClick:te,children:b.blocked_by_me?"\u0631\u0641\u0639 \u0627\u0644\u062D\u0638\u0631":"\u062D\u0638\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645"}),(0,o.jsx)("button",{type:"button",className:"yam-detail-action danger",onClick:ue,children:"\u062A\u0646\u0638\u064A\u0641 \u0627\u0644\u0634\u0627\u0634\u0629"})]}),(0,o.jsxs)("div",{className:"yam-details-section",children:[(0,o.jsx)("div",{className:"yam-details-head",children:"\u0627\u0644\u0648\u0633\u0627\u0626\u0637 \u0627\u0644\u0645\u0634\u062A\u0631\u0643\u0629"}),(0,o.jsxs)("div",{className:"yam-media-strip",children:[j.filter(c=>c.type==="image").slice(-5).map(c=>(0,o.jsx)("img",{src:c.media_url,alt:"media",className:"yam-media-thumb"},c.id)),j.length?null:(0,o.jsx)("span",{className:"yam-muted-note",children:"\u0644\u0627 \u062A\u0648\u062C\u062F \u0648\u0633\u0627\u0626\u0637 \u0645\u0634\u062A\u0631\u0643\u0629 \u0628\u0639\u062F"})]})]})]}):null,(0,o.jsx)("div",{className:"flying-hearts-layer","aria-hidden":!0,children:H.map(c=>(0,o.jsx)("span",{className:"flying-heart",children:"\u{1F49C}"},c))}),P?(0,o.jsx)("div",{className:"yam-call-overlay",children:(0,o.jsx)(Pe,{open:!!P,mode:P,callType:"direct",participantName:t,onClose:()=>C(null),onStatusChange:()=>{}})}):null,!b.can_chat&&b.blocked_by_me?(0,o.jsxs)("div",{className:"yam-block-banner",children:["\u0644\u0642\u062F \u062D\u0638\u0631\u062A \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645. ",(0,o.jsx)("button",{type:"button",onClick:te,children:"\u0631\u0641\u0639 \u0627\u0644\u062D\u0638\u0631"})]}):null,!b.can_chat&&b.blocked_me?(0,o.jsx)("div",{className:"yam-block-banner blocked",children:"\u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u062D\u0638\u0631\u0643."}):null,(0,o.jsxs)("div",{className:"yam-messages-area",children:[g&&!A.username?(0,o.jsx)("div",{className:"yam-empty-state",children:"\u062C\u0627\u0631\u064D \u062A\u062C\u0647\u064A\u0632 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629..."}):null,T?(0,o.jsx)("div",{className:"yam-empty-state",children:"\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0631\u0633\u0627\u0626\u0644..."}):null,!T&&!m.length?(0,o.jsx)("div",{className:"yam-empty-state",children:"\u0644\u0627 \u062A\u0648\u062C\u062F \u0631\u0633\u0627\u0626\u0644 \u0628\u0639\u062F. \u0627\u0628\u062F\u0623 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0627\u0644\u0622\u0646."}):null,m.map(c=>(0,o.jsx)(Ft,{message:c,isMe:c.sender===r,onReply:_=>R(_),onDelete:x},c.id)),(0,o.jsx)("div",{ref:ee})]}),(0,o.jsx)("div",{className:"yam-chat-input-wrap",children:(0,o.jsx)(Ee,{peer:t,currentUser:r,replyTo:B,onCancelReply:()=>R(null),onSend:de,disabled:!b.can_chat,compact:!0})})]}),(0,o.jsx)("style",{children:`
          .yam-chat-screen {
            min-height: 100vh;
            height: 100vh;
            padding: 0;
            background: radial-gradient(circle at top, rgba(139,92,246,0.1), transparent 28%), #040a14;
          }

          .yam-chat-stage {
            position: relative;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            height: 100vh;
            background: linear-gradient(180deg, rgba(6,12,24,0.98), rgba(4,9,18,1));
          }

          .yam-chat-stage-header {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) auto;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            background: rgba(4,9,18,0.94);
            backdrop-filter: blur(16px);
            flex-shrink: 0;
          }

          .yam-chat-stage-peer {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .yam-chat-stage-peer-copy {
            min-width: 0;
            display: grid;
            gap: 4px;
          }

          .yam-chat-stage-peer-copy strong {
            font-size: 17px;
            font-weight: 900;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .yam-chat-stage-peer-copy span {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: #94a3b8;
            font-size: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .yam-chat-stage-actions {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .yam-stage-icon {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15,23,42,0.78);
            color: white;
            display: grid;
            place-items: center;
            font-size: 17px;
          }

          .yam-stage-icon.active,
          .yam-stage-icon:hover {
            background: rgba(124,58,237,0.18);
            border-color: rgba(167,139,250,0.24);
          }

          .yam-chat-details-drawer {
            padding: 12px 16px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            background: rgba(7,12,24,0.92);
            display: grid;
            gap: 12px;
            flex-shrink: 0;
          }

          .yam-details-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }

          .yam-detail-action {
            min-height: 44px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15,23,42,0.72);
            color: white;
            font-weight: 800;
            padding: 0 12px;
          }

          .yam-detail-action.danger {
            color: #fecaca;
            border-color: rgba(239,68,68,0.18);
            background: rgba(127,29,29,0.2);
          }

          .yam-details-section {
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            padding: 12px;
          }

          .yam-details-head {
            font-weight: 900;
            margin-bottom: 10px;
          }

          .yam-media-strip {
            display: flex;
            gap: 8px;
            overflow-x: auto;
          }

          .yam-media-thumb {
            width: 72px;
            height: 72px;
            border-radius: 16px;
            object-fit: cover;
            flex-shrink: 0;
          }

          .yam-muted-note {
            color: #94a3b8;
            font-size: 13px;
          }

          .flying-hearts-layer {
            position: absolute;
            bottom: 96px;
            left: 22px;
            pointer-events: none;
            z-index: 6;
          }

          .flying-heart {
            position: absolute;
            font-size: 28px;
            animation: fly-up 1.8s ease-out forwards;
            left: 0;
          }

          @keyframes fly-up {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            60% { transform: translateY(-120px) scale(1.4); opacity: 0.9; }
            100% { transform: translateY(-240px) scale(0.5); opacity: 0; }
          }

          .yam-call-overlay {
            position: absolute;
            inset: 0;
            background: rgba(4,8,18,0.92);
            backdrop-filter: blur(8px);
            z-index: 20;
            overflow-y: auto;
            padding: 20px;
          }

          .yam-block-banner {
            padding: 10px 16px;
            background: rgba(239,68,68,0.12);
            border-bottom: 1px solid rgba(239,68,68,0.22);
            color: #fca5a5;
            font-size: 13px;
            text-align: center;
            flex-shrink: 0;
          }

          .yam-block-banner button {
            background: none;
            border: none;
            color: #f97316;
            cursor: pointer;
            font-weight: 700;
            margin-inline-start: 8px;
          }

          .yam-block-banner.blocked {
            background: rgba(127,29,29,0.24);
          }

          .yam-messages-area {
            flex: 1;
            overflow-y: auto;
            padding: 20px 14px 14px;
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .yam-messages-area::-webkit-scrollbar { width: 5px; }
          .yam-messages-area::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.22); border-radius: 999px; }

          .yam-empty-state {
            color: #64748b;
            font-size: 14px;
            padding: 20px;
            text-align: center;
          }

          .yam-bubble-wrap {
            display: flex;
            align-items: flex-end;
            gap: 8px;
          }

          .yam-bubble-wrap.me { flex-direction: row-reverse; }

          .yam-bubble {
            max-width: min(74%, 560px);
            padding: 12px 15px;
            border-radius: 22px;
            position: relative;
            line-height: 1.6;
          }

          .bubble-me {
            background: linear-gradient(135deg, #7c3aed, #6d28d9);
            color: white;
            border-bottom-right-radius: 8px;
          }

          .bubble-them {
            background: rgba(30,41,59,0.88);
            color: #e2e8f0;
            border: 1px solid rgba(255,255,255,0.06);
            border-bottom-left-radius: 8px;
          }

          .bubble-reply-banner {
            font-size: 12px;
            padding: 6px 8px;
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            margin-bottom: 8px;
            border-inline-start: 2px solid rgba(255,255,255,0.4);
          }

          .bubble-text { font-size: 14px; word-break: break-word; }
          .bubble-deleted { font-size: 13px; opacity: 0.5; font-style: italic; }

          .bubble-meta {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 5px;
            margin-top: 6px;
          }

          .bubble-time { font-size: 11px; opacity: 0.65; }

          .bubble-actions {
            display: none;
            gap: 6px;
            position: absolute;
            top: -28px;
            inset-inline-end: 0;
            background: rgba(15,23,42,0.92);
            border-radius: 10px;
            padding: 4px 8px;
            border: 1px solid rgba(255,255,255,0.08);
          }

          .yam-bubble:hover .bubble-actions { display: flex; }

          .bubble-actions button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 14px;
            padding: 2px 4px;
          }

          .yam-chat-input-wrap {
            flex-shrink: 0;
          }

          @media (max-width: 920px) {
            .yam-details-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 768px) {
            .yam-chat-stage-header {
              padding: 10px 12px;
            }

            .yam-chat-stage-peer-copy strong {
              font-size: 15px;
            }

            .yam-stage-icon {
              width: 40px;
              height: 40px;
              border-radius: 12px;
            }

            .yam-messages-area {
              padding: 16px 10px 10px;
            }

            .yam-bubble {
              max-width: 86%;
            }

            .yam-details-grid {
              grid-template-columns: 1fr;
            }
          }
        `})]})}):(0,o.jsx)(De,{to:"/inbox",replace:!0})}export{jt as a};
