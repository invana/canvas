import{C as h}from"./index-CpvLR3Io.js";import"./iframe-vPjueFsm.js";import"./_commonjsHelpers-CqkleIqs.js";const $=async o=>{const r=document.createElement("div");r.className="canvas-container",r.id=`canvas-${Date.now()}`;const l=document.createElement("div");return l.className="info-panel",l.innerHTML="Interact with the canvas...",r.appendChild(l),setTimeout(async()=>{const a=new h(r,{theme:"light",autoResize:!0,interactions:{hover:o.enableHover,drag:o.enableDrag,select:o.enableSelect,pan:o.enablePan,zoom:o.enableZoom}});await a.initialize();const f=[{id:"a",x:-100,y:0,style:{shape:"circle",label:{text:"Drag me!",visible:!0}}},{id:"b",x:100,y:-80,style:{shape:"hexagon",label:{text:"Click me!",visible:!0}}},{id:"c",x:100,y:80,style:{shape:"rectangle",label:{text:"Hover me!",visible:!0}}}],D=[{id:"e1",source:"a",target:"b",style:{type:"bezier"}},{id:"e2",source:"a",target:"c",style:{type:"bezier"}}];a.import({nodes:f,edges:D}),a.fitToContent();const t=(n,e)=>{l.innerHTML=`
        <strong>Last Event:</strong> ${n}<br>
        ${e}
      `};a.on("node:hover",n=>{const{node:e}=n;t("node:hover",`Node: ${e.id}`)}),a.on("node:click",n=>{const{node:e}=n;a.selectNode(e.id),t("node:click",`Node: ${e.id} (selected)`)}),a.on("node:dragStart",n=>{const{node:e}=n;t("node:dragStart",`Dragging: ${e.id}`)}),a.on("node:drag",n=>{const{node:e,position:d}=n;t("node:drag",`${e.id} → (${d.x.toFixed(0)}, ${d.y.toFixed(0)})`)}),a.on("node:dragEnd",n=>{const{node:e}=n;t("node:dragEnd",`Dropped: ${e.id}`)}),a.on("viewport:changed",n=>{const{viewport:e}=n;t("viewport:changed",`Zoom: ${e.zoom.toFixed(2)}, Pan: (${e.x.toFixed(0)}, ${e.y.toFixed(0)})`)}),a.on("canvas:click",()=>{a.clearSelection(),t("canvas:click","Selection cleared")})},0),r},w={title:"Canvas/Interactions",render:o=>$(o),argTypes:{enableHover:{control:"boolean"},enableDrag:{control:"boolean"},enableSelect:{control:"boolean"},enablePan:{control:"boolean"},enableZoom:{control:"boolean"}},args:{enableHover:!0,enableDrag:!0,enableSelect:!0,enablePan:!0,enableZoom:!0}},s={args:{enableHover:!0,enableDrag:!0,enableSelect:!0,enablePan:!0,enableZoom:!0}},c={args:{enableHover:!0,enableDrag:!1,enableSelect:!1,enablePan:!0,enableZoom:!0}},i={args:{enableHover:!0,enableDrag:!0,enableSelect:!1,enablePan:!1,enableZoom:!1}};var b,u,m;s.parameters={...s.parameters,docs:{...(b=s.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    enableHover: true,
    enableDrag: true,
    enableSelect: true,
    enablePan: true,
    enableZoom: true
  }
}`,...(m=(u=s.parameters)==null?void 0:u.docs)==null?void 0:m.source}}};var g,p,v;c.parameters={...c.parameters,docs:{...(g=c.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    enableHover: true,
    enableDrag: false,
    enableSelect: false,
    enablePan: true,
    enableZoom: true
  }
}`,...(v=(p=c.parameters)==null?void 0:p.docs)==null?void 0:v.source}}};var y,x,S;i.parameters={...i.parameters,docs:{...(y=i.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    enableHover: true,
    enableDrag: true,
    enableSelect: false,
    enablePan: false,
    enableZoom: false
  }
}`,...(S=(x=i.parameters)==null?void 0:x.docs)==null?void 0:S.source}}};const E=["AllEnabled","ViewOnly","DragOnly"];export{s as AllEnabled,i as DragOnly,c as ViewOnly,E as __namedExportsOrder,w as default};
