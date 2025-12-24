import{C as g}from"./index-CpvLR3Io.js";import"./iframe-vPjueFsm.js";import"./_commonjsHelpers-CqkleIqs.js";const u=async r=>{const s=document.createElement("div");return s.className="canvas-container",s.id=`canvas-${Date.now()}`,setTimeout(async()=>{const a=new g(s,{theme:r.theme,autoResize:!0});await a.initialize();const m=[{shape:"circle",label:"Circle"},{shape:"rectangle",label:"Rectangle"},{shape:"square",label:"Square"},{shape:"triangle",label:"Triangle"},{shape:"diamond",label:"Diamond"},{shape:"pentagon",label:"Pentagon"},{shape:"hexagon",label:"Hexagon"},{shape:"octagon",label:"Octagon"}].map((t,e)=>({id:`node-${e}`,x:e%4*150-225,y:Math.floor(e/4)*150-75,style:{shape:t.shape,size:60,fill:["#4CAF50","#2196F3","#9C27B0","#FF9800","#F44336","#00BCD4","#FFEB3B","#E91E63"][e],label:{text:t.label,visible:!0,position:"bottom"}}}));a.import({nodes:m,edges:[]}),a.fitToContent(),a.on("node:hover",t=>{const{node:e}=t;a.setNodeState(e.id,"highlighted",!0)}),a.on("node:hoverEnd",t=>{const{node:e}=t;a.setNodeState(e.id,"highlighted",!1)})},0),s},F={title:"Canvas/Node Shapes",render:r=>u(r),argTypes:{theme:{control:"select",options:["light","dark"]}},args:{theme:"light"}},o={args:{theme:"light"}},n={args:{theme:"dark"}};var l,c,i;o.parameters={...o.parameters,docs:{...(l=o.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    theme: 'light'
  }
}`,...(i=(c=o.parameters)==null?void 0:c.docs)==null?void 0:i.source}}};var d,h,p;n.parameters={...n.parameters,docs:{...(d=n.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    theme: 'dark'
  }
}`,...(p=(h=n.parameters)==null?void 0:h.docs)==null?void 0:p.source}}};const f=["AllShapes","DarkMode"];export{o as AllShapes,n as DarkMode,f as __namedExportsOrder,F as default};
