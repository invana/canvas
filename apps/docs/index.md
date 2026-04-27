---
layout: home

hero:
  name: "@invana/canvas"
  text: "WebGPU-first canvas engine"
  tagline: A high-performance rendering engine and graph visualization toolkit built on PixiJS v8.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/invana/canvas

features:
  - title: WebGPU / WebGL2
    details: Automatic renderer selection — WebGPU where supported, WebGL2 fallback. All rendering is GPU-accelerated canvas only.
  - title: Plugin architecture
    details: Every feature is a CanvasPlugin. Register only what you need. Built-ins include background, shapes, elements, and drawing tools.
  - title: Typed event bus
    details: All internal communication goes through a single typed EventBus. Downstream packages extend the event map via module augmentation — no raw PixiJS events leak out.
  - title: Camera & layers
    details: Infinite pan/zoom viewport via pixi-viewport. Photoshop-style z-ordered layers with per-layer visibility and opacity controls.
---
