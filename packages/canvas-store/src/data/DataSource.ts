import type { FlushMode } from './flush';
import type { LayerFlush } from './LayerData';

/**
 * `DataSource` — the kernel's contract for a **bulk data store** owned by
 * `CanvasStore.data[id]` (decision **D13**: *interface, not inheritance* — see
 * `docs/canvas-store-d13-data-ownership.md`).
 *
 * The kernel owns sources behind this interface **without knowing their domain**:
 * - the default {@link LayerData} satisfies it out of the box, and
 * - a domain store (e.g. `@invana/graph`'s `GraphStore`) *implements* it and is
 *   registered via `CanvasStore.setSource(id, source)`.
 *
 * Only the three members the kernel needs to **own + bridge** a source live here;
 * everything domain-specific (positions fast-path, adjacency, hierarchy, presence)
 * stays off the interface. `CanvasStore` subscribes each source's {@link onFlush}
 * and re-emits it as a coarse `data:flush` on the bus (telemetry / collab); the
 * domain renderer subscribes to the source directly for targeted updates.
 */
export interface DataSource {
  /** Subscribe to the coalesced per-frame change delta. Returns an unsubscribe. */
  onFlush(listener: (delta: LayerFlush) => void): () => void;
  /** Choose **when** the coalesced flush fires; the engine drives `'manual'`. */
  setFlushMode(mode: FlushMode): void;
  /** Drain pending changes now (the engine's single rAF loop calls this once/frame). */
  flush(): void;
}
