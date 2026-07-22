// useDerivedSchema — a reactive {@link GraphSchema} for a live graph canvas.
//
// Resolves the target `GraphLayer` from the canvas, derives its schema once, and
// recomputes whenever the store's topology/data changes (`node:add/remove/update`
// + edge equivalents). Bursty events during a bulk load are coalesced into a
// single recompute per animation frame, so loading N nodes recomputes once, not
// N times. Returns an empty schema until a layer + store are available.

import { useEffect, useState } from 'react';
import type { GraphCanvas, GraphLayer } from '@invana/graph';

import { deriveSchema, type DeriveSchemaOptions, type GraphSchema } from './schema';

const EMPTY: GraphSchema = { nodeTypes: [], edgeTypes: [] };

export interface UseDerivedSchemaOptions extends DeriveSchemaOptions {
  /** GraphLayer id to read. Default `'graph'`. */
  layerId?: string;
}

/**
 * The reactive schema of `canvas`'s `layerId` layer. Recomputes (coalesced per
 * frame) on store topology/data changes; empty while the canvas/layer is null.
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
    if (!layer || !store) {
      setSchema(EMPTY);
      return;
    }
    let frame = 0;
    const recompute = (): void => setSchema(deriveSchema(layer, { nodeTypeOf, edgeTypeOf }));
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
    ];
    return () => {
      if (frame) cancelAnimationFrame(frame);
      for (const off of unsubs) off();
    };
  }, [layer, store, nodeTypeOf, edgeTypeOf]);

  return schema;
}
