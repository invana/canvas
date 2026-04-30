// ── SelectionStore ────────────────────────────────────────────────────────────
// Tracks the set of currently selected graph element ids.
//
// Pure state container — does not touch the rendered shape state. Behaviour
// plugins (e.g. ClickSelectPlugin) write to it; visual layers (selection
// outlines, info panels) read from it.

import { EventEmitter } from '@invana/canvas';

/** Element kind for items tracked in the selection store. */
export type SelectionElementType = 'shape' | 'connector';

/** Snapshot of current selection — split by element kind. */
export interface SelectionSnapshot {
  shapeIds:     string[];
  connectorIds: string[];
}

/** Event payloads emitted by {@link SelectionStore}. */
export interface SelectionStoreEvents {
  /** Emitted when an id is added to the selection. */
  'selection:added':   { id: string; type: SelectionElementType };
  /** Emitted when an id is removed from the selection. */
  'selection:removed': { id: string; type: SelectionElementType };
  /** Emitted whenever the selection changes (after adds/removes settle). */
  'selection:changed': SelectionSnapshot;
}

/**
 * In-memory store for the currently selected element ids.
 *
 * Multiple elements may be selected at once. Adding an id that is already
 * present is a no-op; removing one that is not present is a no-op.
 */
export class SelectionStore extends EventEmitter<SelectionStoreEvents> {
  private _ids = new Map<string, SelectionElementType>();

  /** Number of elements currently selected. */
  get size(): number { return this._ids.size; }

  /** Returns `true` when the given id is currently selected. */
  has(id: string): boolean { return this._ids.has(id); }

  /** Returns the type of the selected element, or `undefined` if not selected. */
  typeOf(id: string): SelectionElementType | undefined { return this._ids.get(id); }

  /** All currently selected ids (insertion order). */
  getIds(): string[] { return [...this._ids.keys()]; }

  /** Snapshot split by element kind. */
  snapshot(): SelectionSnapshot {
    const shapeIds:     string[] = [];
    const connectorIds: string[] = [];
    for (const [id, type] of this._ids) {
      if (type === 'shape') shapeIds.push(id);
      else                  connectorIds.push(id);
    }
    return { shapeIds, connectorIds };
  }

  /**
   * Add an id to the selection. No-op if already selected.
   * Emits `selection:added` (and the caller should follow with `_emitChanged`).
   */
  add(id: string, type: SelectionElementType): boolean {
    if (this._ids.has(id)) return false;
    this._ids.set(id, type);
    this.emit('selection:added', { id, type });
    return true;
  }

  /**
   * Remove an id from the selection. No-op if not currently selected.
   * Emits `selection:removed`.
   */
  delete(id: string): boolean {
    const type = this._ids.get(id);
    if (type === undefined) return false;
    this._ids.delete(id);
    this.emit('selection:removed', { id, type });
    return true;
  }

  /** Clear the entire selection. Emits `selection:removed` for each id. */
  clear(): void {
    if (this._ids.size === 0) return;
    const entries = [...this._ids];
    this._ids.clear();
    for (const [id, type] of entries) {
      this.emit('selection:removed', { id, type });
    }
  }

  /** Emit `selection:changed` with the current snapshot. */
  emitChanged(): void {
    this.emit('selection:changed', this.snapshot());
  }
}
