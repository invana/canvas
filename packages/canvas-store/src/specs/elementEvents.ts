/**
 * Element-level pointer events — what a drawing backend reports about the
 * shapes and connectors it holds.
 *
 * Part of the pixi-free spec vocabulary: every payload is plain data in world
 * coordinates, so a domain behaviour subscribes to these without knowing which
 * backend produced them. Canvas-wide input (`input:camera:*`) lives on the
 * kernel bus instead; this is the element-scoped channel.
 */

import type { EventMap } from '../events/EventEmitter';

export interface ElementEventMap extends EventMap {
  'shape:pointerover':     { id: string; worldX: number; worldY: number };
  'shape:pointerout':      { id: string; worldX: number; worldY: number };
  'shape:pointerdown':     { id: string; worldX: number; worldY: number; button: number; pointerId: number };
  'shape:pointerup':       { id: string; worldX: number; worldY: number; button: number; pointerId: number };
  /** Left-button click. Right-button → `shape:contextmenu`. */
  'shape:click':           { id: string; worldX: number; worldY: number; button: number };
  'shape:doubleclick':     { id: string; worldX: number; worldY: number; button: number };
  'shape:contextmenu':     { id: string; worldX: number; worldY: number };
  /**
   * Sub-part pointer transitions — fired only for shapes that implement
   * {@link IShape.hitTestPart} (e.g. a composite card with `hitId`-tagged
   * parts). `partId` is the id the shape returned for the point under the
   * cursor. `partover` fires on entering a part; `partout` on leaving it (to
   * another part of the same shape, or off the shape entirely).
   */
  'shape:partover':        { id: string; partId: string; worldX: number; worldY: number };
  'shape:partout':         { id: string; partId: string };
  /**
   * Right-click over a hittable sub-part. Emitted *instead of*
   * `shape:contextmenu` when the cursor is over a `hitId`-tagged part, so a
   * consumer can show a part-scoped menu (e.g. a field row) and reserve the
   * shape-level menu for the rest of the card.
   */
  'shape:partcontextmenu': { id: string; partId: string; worldX: number; worldY: number };
  'connector:pointerover': { id: string; worldX: number; worldY: number };
  'connector:pointerout':  { id: string; worldX: number; worldY: number };
  'connector:pointerdown': { id: string; worldX: number; worldY: number; button: number; pointerId: number };
  'connector:pointerup':   { id: string; worldX: number; worldY: number; button: number; pointerId: number };
  /** Left-button click. Right-button → `connector:contextmenu`. */
  'connector:click':       { id: string; worldX: number; worldY: number; button: number };
  'connector:doubleclick': { id: string; worldX: number; worldY: number; button: number };
  'connector:contextmenu': { id: string; worldX: number; worldY: number };
  /** Right-button release on empty canvas — no shape/connector was hit. */
  'background:contextmenu': { worldX: number; worldY: number };
}
