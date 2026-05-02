// ── HoverStore ────────────────────────────────────────────────────────────────
// Tracks the currently hovered graph element id (single id at a time).
//
// The store is a pure state container — it does not touch the rendered shape
// state. Behaviour plugins (e.g. HoverActivatePlugin) write to it and listen
// to changes; visual layers (highlight overlays, info panels) read from it.

import { EventEmitter } from '@invana/canvas-deprecated';

/** Element kind for items tracked in the hover store. */
export type HoverElementType = 'shape' | 'connector';

/** Event payloads emitted by {@link HoverStore}. */
export interface HoverStoreEvents {
  /**
   * Emitted whenever the hovered element changes (including when cleared).
   * `id` and `type` are `null` when nothing is hovered.
   */
  'hover:changed': {
    id:   string | null;
    type: HoverElementType | null;
  };
}

/**
 * In-memory store for the single currently hovered element.
 *
 * Only one element is hovered at any time. Setting a new id replaces the
 * previous one; setting the same id is a no-op.
 */
export class HoverStore extends EventEmitter<HoverStoreEvents> {
  private _id:   string | null = null;
  private _type: HoverElementType | null = null;

  /** Currently hovered element id, or `null` if nothing is hovered. */
  get id(): string | null { return this._id; }

  /** Type of the hovered element, or `null` if nothing is hovered. */
  get type(): HoverElementType | null { return this._type; }

  /** `true` when the given id is currently the hovered element. */
  isHovered(id: string): boolean { return this._id === id; }

  /**
   * Mark an element as hovered. No-op if `id` already matches.
   * Emits `hover:changed` when the value changes.
   */
  set(id: string, type: HoverElementType): void {
    if (this._id === id) return;
    this._id   = id;
    this._type = type;
    this.emit('hover:changed', { id, type });
  }

  /**
   * Clear the hovered element. No-op if nothing is hovered.
   * Emits `hover:changed` with `{ id: null, type: null }` when cleared.
   */
  clear(): void {
    if (this._id === null) return;
    this._id   = null;
    this._type = null;
    this.emit('hover:changed', { id: null, type: null });
  }
}
