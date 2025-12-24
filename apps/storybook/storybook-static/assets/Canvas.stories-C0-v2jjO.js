import{C as F}from"./index-CpvLR3Io.js";import"./iframe-vPjueFsm.js";import"./_commonjsHelpers-CqkleIqs.js";const H=async n=>{const d=document.createElement("div");d.className="canvas-container",d.id=`canvas-${Date.now()}`;const l=document.createElement("div");l.className="controls",l.innerHTML=`
    <button id="fit-btn">Fit to Content</button>
    <button id="reset-btn">Reset View</button>
    <button id="zoom-in-btn">Zoom In</button>
    <button id="zoom-out-btn">Zoom Out</button>
    <button id="toggle-theme-btn">Toggle Theme</button>
    <button id="add-node-btn">Add Node</button>
  `,d.appendChild(l);const a=document.createElement("div");return a.className="info-panel",a.innerHTML="Loading...",d.appendChild(a),setTimeout(async()=>{var C,v,y,E,f,$;const e=new F(d,{theme:n.theme,autoResize:!0});await e.initialize();const h=[];for(let t=0;t<n.nodeCount;t++){const o=["circle","rectangle","hexagon","triangle","diamond"];h.push({id:`node-${t}`,label:`Node ${t}`,x:Math.random()*800-400,y:Math.random()*600-300,type:`type-${t%5}`,style:{shape:o[t%o.length],label:{text:`Node ${t}`,visible:!0,position:"bottom"}}})}const p=[];for(let t=0;t<n.edgeCount;t++){const o=`node-${Math.floor(Math.random()*n.nodeCount)}`;let g=`node-${Math.floor(Math.random()*n.nodeCount)}`;for(;g===o;)g=`node-${Math.floor(Math.random()*n.nodeCount)}`;const N=["straight","bezier","orthogonal"];p.push({id:`edge-${t}`,source:o,target:g,style:{type:N[t%N.length]}})}e.import({nodes:h,edges:p}),e.fitToContent();const r=()=>{const t=e.getViewportState();a.innerHTML=`
        Renderer: ${e.isWebGPU?"WebGPU":"WebGL"}<br>
        Nodes: ${e.getNodes().length} | Edges: ${e.getEdges().length}<br>
        Zoom: ${t.zoom.toFixed(2)} | Pan: (${t.x.toFixed(0)}, ${t.y.toFixed(0)})<br>
        Selected: ${e.selection.selectedNodes.length} nodes
      `};e.on("viewport:changed",r),e.on("selection:changed",r),r(),(C=document.getElementById("fit-btn"))==null||C.addEventListener("click",()=>{e.fitToContent()}),(v=document.getElementById("reset-btn"))==null||v.addEventListener("click",()=>{e.resetView()}),(y=document.getElementById("zoom-in-btn"))==null||y.addEventListener("click",()=>{e.zoomIn()}),(E=document.getElementById("zoom-out-btn"))==null||E.addEventListener("click",()=>{e.zoomOut()});let u=n.theme;(f=document.getElementById("toggle-theme-btn"))==null||f.addEventListener("click",()=>{u=u==="light"?"dark":"light",e.setTheme(u)});let b=n.nodeCount;($=document.getElementById("add-node-btn"))==null||$.addEventListener("click",()=>{e.addNode({id:`node-${b++}`,x:Math.random()*400-200,y:Math.random()*300-150,style:{shape:"circle",label:{text:`New ${b}`,visible:!0}}}),r()}),e.on("node:click",t=>{const{node:o}=t;e.selectNode(o.id)}),e.on("node:hover",t=>{const{node:o}=t;console.log("Hovered:",o.id)}),e.on("canvas:click",()=>{e.clearSelection()})},0),d},V={title:"Canvas/Basic",render:n=>H(n),argTypes:{theme:{control:"select",options:["light","dark"],description:"Canvas theme"},nodeCount:{control:{type:"range",min:1,max:100,step:1},description:"Number of nodes to generate"},edgeCount:{control:{type:"range",min:0,max:50,step:1},description:"Number of edges to generate"}},args:{theme:"light",nodeCount:10,edgeCount:8}},s={args:{theme:"light",nodeCount:10,edgeCount:8}},i={args:{theme:"dark",nodeCount:10,edgeCount:8}},c={args:{theme:"light",nodeCount:50,edgeCount:40}},m={args:{theme:"light",nodeCount:20,edgeCount:0}};var k,x,L;s.parameters={...s.parameters,docs:{...(k=s.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    theme: 'light',
    nodeCount: 10,
    edgeCount: 8
  }
}`,...(L=(x=s.parameters)==null?void 0:x.docs)==null?void 0:L.source}}};var M,T,w;i.parameters={...i.parameters,docs:{...(M=i.parameters)==null?void 0:M.docs,source:{originalSource:`{
  args: {
    theme: 'dark',
    nodeCount: 10,
    edgeCount: 8
  }
}`,...(w=(T=i.parameters)==null?void 0:T.docs)==null?void 0:w.source}}};var z,I,B;c.parameters={...c.parameters,docs:{...(z=c.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    theme: 'light',
    nodeCount: 50,
    edgeCount: 40
  }
}`,...(B=(I=c.parameters)==null?void 0:I.docs)==null?void 0:B.source}}};var S,D,G;m.parameters={...m.parameters,docs:{...(S=m.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    theme: 'light',
    nodeCount: 20,
    edgeCount: 0
  }
}`,...(G=(D=m.parameters)==null?void 0:D.docs)==null?void 0:G.source}}};const W=["Default","DarkTheme","LargeGraph","NoEdges"];export{i as DarkTheme,s as Default,c as LargeGraph,m as NoEdges,W as __namedExportsOrder,V as default};
