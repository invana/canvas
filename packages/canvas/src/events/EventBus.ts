import { EventEmitter } from '../utils/EventEmitter.js';
import type { CanvasEventMap } from '../types/events.js';

/**
 * EventBus — central typed event bus for the canvas.
 *
 * All plugins and internal systems communicate through this bus.
 * No raw PixiJS events are exposed to consumers.
 *
 * The event map (`CanvasEventMap`) is an **open interface** — downstream
 * packages can extend it via TypeScript module augmentation:
 *
 * ```ts
 * declare module '@invana/canvas' {
 *   interface CanvasEventMap {
 *     'graph:node:click': GraphNodeClickEvent;
 *   }
 * }
 * ```
 */
export class EventBus extends EventEmitter<CanvasEventMap> {}
