/**
 * The two halves every dataset in this package ships.
 *
 * A dataset is a **folder**, not a module: `data.ts` holds what to draw and
 * `settings.ts` holds how it should look. Both are plain values — importing a
 * dataset costs a JSON parse, never a transform — so a consumer wires a complete
 * visualisation in two props:
 *
 * ```tsx
 * import { data, settings } from '@invana/graph-datasets/…';
 * <GraphCanvasApp data={data} config={settings} />
 * ```
 *
 * @module
 */

import type { CanvasConfig } from '@invana/canvas';
import type { GraphData } from '@invana/graph';

/**
 * **What to draw** — engine-ready graph data, exactly the shape
 * `GraphLayer.setData` / `<GraphCanvasApp data={…}>` take. Nodes are
 * `{ id, type?, data?, position?, … }` and edges `{ id, source, target, type? }`.
 *
 * Datasets are authored *in this shape*: `data.ts` is the on-disk contract, and
 * a consumer never maps or renames a field on the way in. (This supersedes the
 * older `{ id, label, properties }` property-graph records, which every consumer
 * had to translate at `setData` time.)
 */
export type CanvasData = GraphData;

/**
 * **How it should look** — the dataset's recommended visualisation as pure
 * JSON, deep-merged over whatever base config the consumer already has.
 *
 * Two rules make these settings portable:
 *
 * 1. **Keyed by the `<GraphCanvasApp>` bundle's ids** — layers `background` /
 *    `graph`, layouts `graph-force`, behaviours `pan` · `wheel` · `drag-node` ·
 *    `hover` · `color` · `click-select` · `theme`. A canvas composed by hand
 *    needs settings keyed by *its* own ids. Where a dataset wants a layout the
 *    bundle doesn't register (ELK, Sankey, …), its `activeLayout` names an id
 *    the consumer is expected to mount — each `settings.ts` says which.
 * 2. **Serialisable** — no functions, no class references. Per-node resolvers
 *    (`shape: (node) => …`, `bgFill: (node) => …`) stay with the consumer; these
 *    settings persist, diff, and drive the settings editor as plain data.
 */
export type CanvasSettings = CanvasConfig;
