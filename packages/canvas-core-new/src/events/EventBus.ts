import { EventEmitter } from '../utils/EventEmitter.js';
import type { CanvasEventMap } from '../types/events.js';

/**
 * EventBus — central typed event bus for the canvas.
 * All plugins and internal systems use this; no raw PixiJS events are exposed.
 */
export class EventBus extends EventEmitter<CanvasEventMap & Record<string, unknown>> {}
