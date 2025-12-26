/**
 * Canvas Module
 * 
 * Core canvas orchestration components.
 * 
 * - **Canvas**: Main entry point, manages the PixiJS application
 * - **Viewport**: Pan/zoom handling
 * - **Registry**: Extensible registry for shapes, paths, arrows
 * 
 * @example
 * ```typescript
 * import { Canvas, Registry } from './canvas';
 * 
 * const canvas = new Canvas({
 *   container: document.getElementById('app')!,
 *   width: 1200,
 *   height: 800,
 * });
 * 
 * await canvas.init();
 * 
 * // Register custom shape
 * canvas.registry.registerShape('custom', myCustomDrawer);
 * ```
 */

export { Canvas } from './Canvas';
export type { 
  CanvasOptions, 
  CanvasState, 
  CanvasData, 
  CanvasNodeData, 
  CanvasEdgeData, 
  CanvasStyles 
} from './Canvas';

export { Viewport } from './Viewport';
export type { ViewportOptions, ViewportState } from './Viewport';

export { Registry, defaultRegistry } from './Registry';
export type { BuiltInShapeType, BuiltInPathType, ShapeDrawer, PathDrawer } from './Registry';
