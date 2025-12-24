import{C}from"./index-CpvLR3Io.js";import"./iframe-vPjueFsm.js";import"./_commonjsHelpers-CqkleIqs.js";const w=async c=>{const e=document.createElement("div");e.className="canvas-container",e.id=`canvas-${Date.now()}`;const m=document.createElement("div");return m.className="controls",m.innerHTML=`
    <button id="start-btn">Start Animation</button>
    <button id="stop-btn">Stop Animation</button>
  `,e.appendChild(m),setTimeout(async()=>{var d,u;const n=new C(e,{theme:"light",autoResize:!0});await n.initialize();const p=["pulse","breathe","shake","bounce","rotate","blink","ripple","glow"],F=p.map((o,t)=>({id:`node-${t}`,x:t%4*150-225,y:Math.floor(t/4)*150-75,style:{shape:"circle",size:50,fill:["#4CAF50","#2196F3","#9C27B0","#FF9800","#F44336","#00BCD4","#FFEB3B","#E91E63"][t],label:{text:o,visible:!0,position:"bottom"}}}));n.import({nodes:F,edges:[]}),n.fitToContent();const l=()=>{p.forEach((o,t)=>{const a=n.getNodeShape(`node-${t}`);a&&a.animate({type:o,duration:c.duration,loop:!0,intensity:1})})},S=()=>{p.forEach((o,t)=>{const a=n.getNodeShape(`node-${t}`);a&&a.stopAnimation()})};l(),(d=document.getElementById("start-btn"))==null||d.addEventListener("click",l),(u=document.getElementById("stop-btn"))==null||u.addEventListener("click",S)},0),e},N={title:"Canvas/Animations",render:c=>w(c),argTypes:{animationType:{control:"select",options:["pulse","breathe","shake","bounce","rotate","blink","ripple","glow"]},duration:{control:{type:"range",min:200,max:3e3,step:100}}},args:{animationType:"pulse",duration:1e3}},s={args:{animationType:"pulse",duration:1e3}},i={args:{animationType:"pulse",duration:300}},r={args:{animationType:"breathe",duration:2e3}};var g,b,y;s.parameters={...s.parameters,docs:{...(g=s.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    animationType: 'pulse',
    duration: 1000
  }
}`,...(y=(b=s.parameters)==null?void 0:b.docs)==null?void 0:y.source}}};var h,A,E;i.parameters={...i.parameters,docs:{...(h=i.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    animationType: 'pulse',
    duration: 300
  }
}`,...(E=(A=i.parameters)==null?void 0:A.docs)==null?void 0:E.source}}};var T,v,f;r.parameters={...r.parameters,docs:{...(T=r.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    animationType: 'breathe',
    duration: 2000
  }
}`,...(f=(v=r.parameters)==null?void 0:v.docs)==null?void 0:f.source}}};const $=["AllAnimations","FastAnimations","SlowAnimations"];export{s as AllAnimations,i as FastAnimations,r as SlowAnimations,$ as __namedExportsOrder,N as default};
