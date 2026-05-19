---
layout: home

hero:
  name: '@invana/canvas'
  text: 'WebGPU-first canvas engine'
  tagline: 'Layer / Behaviour / Layout architecture for graph visualization. WebGPU with automatic WebGL2 fallback.'
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Architecture
      link: /guide/architecture
    - theme: alt
      text: API Reference
      link: /api/

features:
  - title: Layer-first composition
    details: 'Compose scenes from independent Layers with explicit z-order. World-space layers (camera-affected) and screen-space layers (overlays) share one base.'
  - title: Behaviours are opt-in
    details: 'Pan, zoom, pinch, keyboard camera input — every behaviour is registered and enabled explicitly. No auto-activation, no hidden gestures.'
  - title: Domain-free primitives
    details: 'Shapes, connectors, markers, routers, anchors, pathStyles, and decorations live in a five-registry renderer. Domain packages compose primitives; primitives never reference domain concepts.'
---
