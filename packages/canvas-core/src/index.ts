/**
 * @aspect-ui/canvas-core
 * 
 * High-performance canvas rendering engine with WebGPU-first design.
 * 
 * ## Architecture Overview
 * 
 * ```
 * ┌─────────────────────────────────────────────────────────┐
 * │                     Canvas (main)                       │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
 * │  │  Viewport   │  │  Registry   │  │     Layers      │  │
 * │  │ (pan/zoom)  │  │(extensible) │  │(bg/edge/node)   │  │
 * │  └─────────────┘  └─────────────┘  └─────────────────┘  │
 * └─────────────────────────────────────────────────────────┘
 *                            │
 *                            ▼
 * ┌─────────────────────────────────────────────────────────┐
 * │                     UI Shapes                           │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
 * │  │  NodeShape  │  │  EdgeShape  │  │    BaseShape    │  │
 * │  └─────────────┘  └─────────────┘  └─────────────────┘  │
 * └─────────────────────────────────────────────────────────┘
 *                            │
 *                            ▼
 * ┌─────────────────────────────────────────────────────────┐
 * │                     Primitives                          │
 * │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐        │
 * │  │ shapes │  │ paths  │  │ arrows │  │effects │        │
 * │  └────────┘  └────────┘  └────────┘  └────────┘        │
 * │  (Pure functions - all PixiJS Graphics calls here)     │
 * └─────────────────────────────────────────────────────────┘
 * ```
 * 
 * ## Quick Start
 * 
 * ```typescript
 * import { Canvas, NodeShape, EdgeShape } from '@aspect-ui/canvas-core';
 * 
 * const canvas = new Canvas({
 *   container: document.getElementById('app')!,
 *   width: 1200,
 *   height: 800,
 * });
 * 
 * await canvas.init();
 * 
 * // Create nodes
 * const node1 = new NodeShape({
 *   data: { id: 'n1', x: 100, y: 200, shape: 'circle', label: 'Node 1' },
 *   style: { fill: '#4a90d9', stroke: '#2d5a87', strokeWidth: 2 },
 *   registry: canvas.registry,
 * });
 * 
 * const node2 = new NodeShape({
 *   data: { id: 'n2', x: 400, y: 200, shape: 'roundedRect', label: 'Node 2' },
 *   style: { fill: '#50c878', stroke: '#3d9d5c', strokeWidth: 2 },
 *   registry: canvas.registry,
 * });
 * 
 * // Create edge
 * const edge = new EdgeShape({
 *   data: {
 *     id: 'e1',
 *     source: { x: node1.x, y: node1.y },
 *     target: { x: node2.x, y: node2.y },
 *     pathType: 'bezier',
 *     arrowTarget: 'triangle',
 *   },
 *   style: { stroke: '#666', strokeWidth: 2 },
 *   registry: canvas.registry,
 * });
 * 
 * // Add to canvas
 * canvas.addToNodeLayer(node1);
 * canvas.addToNodeLayer(node2);
 * canvas.addToEdgeLayer(edge);
 * ```
 * 
 * ## Extending with Custom Shapes
 * 
 * ```typescript
 * // Register a custom shape
 * canvas.registry.registerShape('star', (g, params, style) => {
 *   // Draw a star shape
 *   const { x, y, size } = params;
 *   const points = [];
 *   for (let i = 0; i < 10; i++) {
 *     const r = i % 2 === 0 ? size : size / 2;
 *     const angle = (i * Math.PI) / 5 - Math.PI / 2;
 *     points.push({ x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r });
 *   }
 *   
 *   g.moveTo(points[0].x, points[0].y);
 *   for (let i = 1; i < points.length; i++) {
 *     g.lineTo(points[i].x, points[i].y);
 *   }
 *   g.closePath();
 *   
 *   if (style.fill) g.fill({ color: style.fill });
 *   if (style.stroke) g.stroke({ color: style.stroke, width: style.strokeWidth ?? 1 });
 * });
 * 
 * // Use the custom shape
 * const starNode = new NodeShape({
 *   data: { id: 'star1', x: 300, y: 300, shape: 'star', size: 40 },
 *   style: { fill: '#ffd700', stroke: '#b8860b', strokeWidth: 2 },
 *   registry: canvas.registry,
 * });
 * ```
 */

// ============================================================================
// CANVAS
// ============================================================================

export { Canvas } from './canvas';
export type { CanvasOptions, CanvasState } from './canvas';

export { Viewport } from './canvas';
export type { ViewportOptions, ViewportState } from './canvas';

export { Registry, defaultRegistry } from './canvas';
export type { BuiltInShapeType, BuiltInPathType, ShapeDrawer, PathDrawer } from './canvas';

// ============================================================================
// UI SHAPES
// ============================================================================

export { BaseShape, NodeShape, EdgeShape } from './ui-shapes';
export type {
  BaseShapeData,
  BaseShapeStyle,
  BaseShapeOptions,
  NodeData,
  NodeStyle,
  NodeShapeOptions,
  NodeShapeType,
  EdgeData,
  EdgeStyle,
  EdgeShapeOptions,
  EdgePathType,
} from './ui-shapes';

// ============================================================================
// PRIMITIVES
// ============================================================================

// Re-export primitives for advanced usage
export * from './primitives';
