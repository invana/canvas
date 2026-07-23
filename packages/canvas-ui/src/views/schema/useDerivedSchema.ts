// useDerivedSchema — a reactive {@link GraphSchema} for a live graph canvas.
//
// Resolves the target `GraphLayer` and returns **authoritative-else-observed**:
// `store.schema` (an authoritative schema a data source declared via `setSchema`
// — e.g. the full Neo4j DB schema) when present, otherwise `deriveSchema(store)`
// (the schema of what's actually loaded). Recomputes on store topology/data
// changes *and* on `'schema'` (an authoritative set/clear), coalesced to one pass
// per animation frame. Empty until a layer + store are available.

import { useEffect, useState } from 'react';
import type { GraphCanvas, GraphLayer } from '@invana/graph';
import { deriveSchema, type DeriveSchemaOptions, type GraphSchema } from '@invana/graph';

const EMPTY: GraphSchema = { nodeTypes: [], edgeTypes: [] };

export interface UseDerivedSchemaOptions extends DeriveSchemaOptions {
  /** GraphLayer id to read. Default `'graph'`. */
  layerId?: string;
}

/**
 * The reactive schema of `canvas`'s `layerId` layer — the authoritative schema if
 * one was set on the store, else the schema derived from the loaded data.
 * Recomputes (coalesced per frame) on topology/data/`schema` changes; empty while
 * the canvas/layer is null.
 *
 * `nodeTypeOf` / `edgeTypeOf` feed the effect's dependency list — pass **stable**
 * (memoized or module-level) functions, or the subscription re-establishes each
 * render.
 */
export function useDerivedSchema(
  canvas: GraphCanvas | null | undefined,
  { layerId = 'graph', nodeTypeOf, edgeTypeOf }: UseDerivedSchemaOptions = {},
): GraphSchema {
  const layer = canvas?.layers.get<GraphLayer>(layerId) ?? undefined;
  const store = layer?.store;
  const [schema, setSchema] = useState<GraphSchema>(EMPTY);

  useEffect(() => {
    if (!store) {
      setSchema(EMPTY);
      return;
    }
    let frame = 0;
    // Authoritative wins; else derive the observed schema from the loaded data.
    const recompute = (): void => setSchema(store.schema ?? deriveSchema(store, { nodeTypeOf, edgeTypeOf }));
    // Coalesce a burst of topology events (e.g. a bulk `setData`) into one
    // recompute on the next frame; a leading recompute runs synchronously.
    const schedule = (): void => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        recompute();
      });
    };
    recompute();
    const unsubs = [
      store.events.on('node:add', schedule),
      store.events.on('node:remove', schedule),
      store.events.on('node:update', schedule),
      store.events.on('edge:add', schedule),
      store.events.on('edge:remove', schedule),
      store.events.on('edge:update', schedule),
      store.events.on('schema', schedule),
    ];
    return () => {
      if (frame) cancelAnimationFrame(frame);
      for (const off of unsubs) off();
    };
  }, [store, nodeTypeOf, edgeTypeOf]);

  return schema;
}
