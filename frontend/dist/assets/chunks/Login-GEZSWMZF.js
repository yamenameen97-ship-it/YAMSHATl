import{a as J}from"./chunk-OEPWAQ3R.js";import{a as H,b as K}from"./chunk-324YRZET.js";import{a as ee}from"./chunk-NRENSZK4.js";import{a as Q,b as Z,d as x,e as L}from"./chunk-A4DPWT2D.js";import{a as j,b as W,g as Y}from"./chunk-UUXJ3X4W.js";import{a as C}from"./chunk-FTXI6DBC.js";import{a as V}from"./chunk-4VVMVC2S.js";import{c as X}from"./chunk-Y2LPHHCG.js";import{a as $}from"./chunk-5IVTSCP7.js";import"./chunk-7DXJ3TCH.js";import{E as U,b as G,c as R,i as m,m as O}from"./chunk-AJGMHTUE.js";import{a as me,b as q}from"./chunk-T3SILTKH.js";import{d as k,k as D}from"./chunk-XSUFE7BX.js";D();var r=k(me(),1);var e=k(q(),1),he=[{key:"google",label:"\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0639\u0628\u0631 Google",shortLabel:"Google",accent:"#ffffff",textColor:"#111827",borderColor:"rgba(255,255,255,0.16)",glyph:"G"},{key:"facebook",label:"\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0639\u0628\u0631 Facebook",shortLabel:"Facebook",accent:"#1877F2",textColor:"#ffffff",borderColor:"rgba(24,119,242,0.45)",glyph:"f"},{key:"apple",label:"\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0639\u0628\u0631 Apple",shortLabel:"Apple",accent:"#111111",textColor:"#ffffff",borderColor:"rgba(255,255,255,0.14)",glyph:"\uF8FF"}];function ue({loading:o,activeProvider:h,onStart:s}){return(0,e.jsxs)("div",{className:"social-auth-panel",children:[(0,e.jsxs)("div",{className:"social-auth-header",children:[(0,e.jsx)("span",{className:"social-auth-line"}),(0,e.jsx)("span",{className:"social-auth-title",children:"\u062A\u0633\u062C\u064A\u0644 \u0623\u0633\u0631\u0639 \u0648\u0622\u0645\u0646"}),(0,e.jsx)("span",{className:"social-auth-line"})]}),(0,e.jsx)("div",{className:"social-auth-grid",children:he.map(l=>{let g=h===l.key;return(0,e.jsxs)("button",{type:"button",className:"social-auth-btn",onClick:()=>s(l.key),disabled:o||!!h,"aria-busy":g?"true":"false",style:{"--social-bg":l.accent,"--social-color":l.textColor,"--social-border":l.borderColor},children:[(0,e.jsx)("span",{className:"social-auth-glyph","aria-hidden":"true",children:l.glyph}),(0,e.jsxs)("span",{className:"social-auth-copy",children:[(0,e.jsx)("strong",{children:l.shortLabel}),(0,e.jsx)("small",{children:g?"\u062C\u0627\u0631\u064A \u062A\u062D\u0648\u064A\u0644\u0643 \u0627\u0644\u0622\u0646...":l.label})]})]},l.key)})})]})}function fe(){let[o,h]=(0,r.useState)({identifier:"",password:"",rememberMe:!0,captchaAnswer:""}),[s,l]=(0,r.useState)(!1),[g,A]=(0,r.useState)(!1),[w,ae]=(0,r.useState)(null),[v,c]=(0,r.useState)(""),[te,N]=(0,r.useState)(""),[oe,S]=(0,r.useState)(!1),[d,_]=(0,r.useState)(null),[re,u]=(0,r.useState)(""),[ie,F]=(0,r.useState)(!1),[f,M]=(0,r.useState)(0),[B,le]=(0,r.useState)(0),[p,z]=(0,r.useState)(""),ne=R(),se=G(),{run:ce}=ee();(0,r.useEffect)(()=>{if(f<=0)return;let a=setInterval(()=>M(t=>t-1),1e3);return()=>clearInterval(a)},[f]);let b=async()=>{if(!(f>0))try{A(!0),N("");let{data:a}=await Y();ae(a),h(t=>({...t,captchaAnswer:""})),M(5)}catch(a){N(x(a?.response?.data?.detail,"\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0643\u0627\u0628\u062A\u0634\u0627 \u062D\u0627\u0644\u064A\u0627\u064B. \u062D\u0627\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B \u0628\u0639\u062F \u0642\u0644\u064A\u0644."))}finally{A(!1)}};(0,r.useEffect)(()=>{b()},[]);let y=a=>t=>{let i=a==="rememberMe"?t.target.checked:t.target.value;h(n=>({...n,[a]:i})),v&&c("")},E=a=>{U({...a,remember_me:o.rememberMe});let t=O(a);ne(se.state?.from?.pathname||t,{replace:!0})},P=()=>{S(!1),_(null),u("")},de=async a=>{if(!d?.challenge_id||!d?.email){u("\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0625\u0636\u0627\u0641\u064A \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629. \u062D\u0627\u0648\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0646 \u062C\u062F\u064A\u062F.");return}try{F(!0),u("");let{data:t}=await W({email:d.email,challenge_id:d.challenge_id,code:a,remember_me:d.remember_me});P(),E(t)}catch(t){let i=L(t?.response?.data?.detail,"\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0623\u0648 \u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u062A\u0647.");u(i?.message||"\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0623\u0648 \u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u062A\u0647.")}finally{F(!1)}},T=async a=>{a&&a.preventDefault();let t=K(o.identifier,{maxLength:120});if(!t){c("\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645.");return}if(Q(t)&&!Z(t)){c("\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D.");return}if(!o.password.trim()){c("\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u0637\u0644\u0648\u0628\u0629.");return}if(!w?.captcha_id){c("\u064A\u0631\u062C\u0649 \u062D\u0644 \u0627\u0644\u0643\u0627\u0628\u062A\u0634\u0627 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629."),b();return}if(!o.captchaAnswer){c("\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u0643\u0627\u0628\u062A\u0634\u0627.");return}l(!0),c("");try{let i=await ce(async()=>await j({identifier:t,password:o.password,remember_me:o.rememberMe,captcha_id:w.captcha_id,captcha_answer:o.captchaAnswer})),{data:n}=i;if(n?.requires_2fa&&n?.challenge_id){_({challenge_id:n.challenge_id,email:n.email,remember_me:o.rememberMe,delivery:n.delivery||null,devCode:n.dev_verification_code||""}),u(""),S(!0);return}E(n)}catch(i){le(pe=>pe+1);let n=L(i?.response?.data?.detail),I=x(n?.message||i?.message,"\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.");c(I),(n?.field==="captcha"||I.includes("\u0643\u0627\u0628\u062A\u0634\u0627"))&&b()}finally{l(!1)}};return(0,e.jsxs)($,{badge:"YAMSHAT",title:"\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",description:"\u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u062D\u062F\u064A\u062B \u0645\u0639 Google \u0648Facebook \u0648Apple\u060C \u0643\u0627\u0628\u062A\u0634\u0627\u060C \u062A\u0630\u0643\u0631\u0646\u064A\u060C \u0648\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u062C\u0644\u0633\u0629 \u0645\u062D\u0633\u0651\u0646\u0629.",children:[(0,e.jsxs)("form",{className:"auth-form auth-form-enhanced",onSubmit:T,noValidate:!0,children:[(0,e.jsxs)("div",{className:"auth-form-head",children:[(0,e.jsx)("h2",{children:"\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644"}),(0,e.jsx)("p",{className:"muted",children:"\u0623\u062F\u062E\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u062D\u0633\u0627\u0628\u0643 \u0644\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0628\u0634\u0643\u0644 \u0622\u0645\u0646."})]}),(0,e.jsx)(ue,{loading:s,activeProvider:p,onStart:async a=>{try{z(a),c("");let t=window.location.origin,{data:i}=await X.get(`/auth/oauth/${a}/login`,{params:{frontend_url:t},timeout:15e3});if(!i?.url)throw new Error("\u062A\u0639\u0630\u0631 \u062A\u062C\u0647\u064A\u0632 \u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u0635\u0627\u062F\u0642\u0629 \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0629.");window.location.assign(i.url)}catch(t){let i=x(t?.response?.data?.detail,a==="apple"?"\u062A\u0633\u062C\u064A\u0644 Apple \u063A\u064A\u0631 \u0645\u0641\u0639\u0651\u0644 \u062D\u0627\u0644\u064A\u0627\u064B \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0646\u0634\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629.":`\u062A\u0639\u0630\u0631 \u0628\u062F\u0621 \u062A\u0633\u062C\u064A\u0644 ${a}.`);c(i),z("")}}}),(0,e.jsxs)("div",{className:"auth-mini-links",children:[(0,e.jsx)(m,{to:"/verify-email",className:"link-btn secondary",children:"\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0628\u0631\u064A\u062F"}),(0,e.jsx)(m,{to:"/forgot-password",className:"link-btn secondary",children:"\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631"})]}),(0,e.jsx)(C,{label:"\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F",placeholder:"username / email",value:o.identifier,onChange:y("identifier"),autoComplete:"username",disabled:s||!!p,required:!0}),(0,e.jsxs)("div",{style:{position:"relative"},children:[(0,e.jsx)(C,{label:"\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",type:"password",placeholder:"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",value:o.password,onChange:y("password"),autoComplete:"current-password",disabled:s||!!p,required:!0}),(0,e.jsx)(m,{to:"/forgot-password",className:"auth-inline-link",style:{position:"absolute",top:0,left:0,fontSize:12},children:"\u0646\u0633\u064A\u062A \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631\u061F"})]}),(0,e.jsx)(H,{challenge:w,value:o.captchaAnswer,onChange:y("captchaAnswer"),onRefresh:b,loading:g,error:te,disabled:s||f>0||!!p,refreshCooldown:f}),(0,e.jsxs)("div",{className:"auth-control-row",children:[(0,e.jsxs)("label",{className:"remember-me-toggle",children:[(0,e.jsx)("input",{type:"checkbox",checked:o.rememberMe,onChange:y("rememberMe"),disabled:s||!!p}),(0,e.jsx)("span",{children:"\u062A\u0630\u0643\u0631\u0646\u064A \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632"})]}),(0,e.jsx)(m,{to:"/verify-email",className:"auth-inline-link",children:"\u0625\u0639\u0627\u062F\u0629 \u0625\u0631\u0633\u0627\u0644 \u0643\u0648\u062F \u0627\u0644\u062A\u0641\u0639\u064A\u0644"})]}),v&&(0,e.jsxs)("div",{className:"alert error",style:{display:"flex",alignItems:"center",gap:10,animation:"shake 0.4s ease"},children:[(0,e.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[(0,e.jsx)("circle",{cx:"12",cy:"12",r:"10"}),(0,e.jsx)("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),(0,e.jsx)("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]}),(0,e.jsxs)("div",{style:{flex:1},children:[(0,e.jsx)("div",{children:v}),B>2&&(0,e.jsx)("div",{style:{fontSize:11,marginTop:4,opacity:.8},children:"\u0625\u0630\u0627 \u0643\u0646\u062A \u062A\u0648\u0627\u062C\u0647 \u0645\u0634\u0643\u0644\u0629 \u0645\u0633\u062A\u0645\u0631\u0629\u060C \u0627\u0633\u062A\u062E\u062F\u0645 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646 \u0623\u0648 \u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u062B\u0645 \u062D\u0627\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B."})]}),B>1&&!p&&(0,e.jsx)("button",{type:"button",onClick:T,disabled:s,style:{background:"none",border:"none",color:"inherit",cursor:"pointer",textDecoration:"underline",fontSize:12},children:"\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629"})]}),(0,e.jsx)(V,{type:"submit",loading:s,disabled:s||!!p||!o.identifier||!o.password||!o.captchaAnswer,style:{height:50,fontSize:16,fontWeight:"bold"},children:s?"\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0642\u0642...":"\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644"}),(0,e.jsxs)("div",{className:"auth-form-footer auth-form-footer-grid",children:[(0,e.jsx)("span",{children:"\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u062D\u0633\u0627\u0628\u061F"}),(0,e.jsx)(m,{to:"/register",className:"link-btn",children:"\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628 \u062C\u062F\u064A\u062F"})]})]}),(0,e.jsx)(J,{isOpen:oe,onClose:P,onSubmit:de,loading:ie,error:re,email:d?.email||"",devCode:d?.devCode||"",delivery:d?.delivery||null}),(0,e.jsx)("style",{children:`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .auth-form-enhanced {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .social-auth-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
        }
        .social-auth-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: rgba(255,255,255,0.65);
        }
        .social-auth-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.1);
        }
        .social-auth-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .social-auth-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          min-height: 64px;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid var(--social-border);
          background: linear-gradient(180deg, color-mix(in srgb, var(--social-bg) 92%, transparent), color-mix(in srgb, var(--social-bg) 80%, #000 20%));
          color: var(--social-color);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          text-align: right;
        }
        .social-auth-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.18);
        }
        .social-auth-btn:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }
        .social-auth-glyph {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(255,255,255,0.14);
          font-size: 20px;
          font-weight: 700;
          flex: 0 0 auto;
        }
        .social-auth-copy {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .social-auth-copy strong {
          font-size: 14px;
          white-space: nowrap;
        }
        .social-auth-copy small {
          font-size: 11px;
          opacity: 0.88;
          line-height: 1.4;
        }
        .auth-mini-links {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .auth-control-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: -4px;
        }
        .remember-me-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          user-select: none;
        }
        .auth-form-footer-grid {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        @media (max-width: 900px) {
          .social-auth-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .auth-control-row,
          .auth-form-footer-grid {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `})]})}export{fe as default};
