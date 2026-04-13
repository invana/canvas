/**
 * Event helper utilities
 * Shared helpers for resolving pointer positions used by RendererNodeBase,
 * RendererEdgeBase, and Canvas to populate CanvasEventMap payloads.
 */

import type { FederatedPointerEvent } from 'pixi.js';
import type { Viewport } from '../viewport/Viewport';
import type { CanvasPointerPosition } from '../types';

/**
 * Convert a PixiJS FederatedPointerEvent into a CanvasPointerPosition
 * containing both screen and world coordinates.
 */
export function resolvePointerPosition(
  event: FederatedPointerEvent,
  viewport: Viewport,
): CanvasPointerPosition {
  const screen = { x: event.globalX, y: event.globalY };
  const world = viewport.toWorld(screen.x, screen.y);
  return { screen, world: { x: world.x, y: world.y } };
}
