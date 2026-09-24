/**
 * **Airways global model** — four published domain models (AirRoutes,
 * NewsArticles, Twitter, Deals) and the thirteen stitches declared between
 * them, as Invana's airways demo ships them.
 *
 * It is a graph *of a schema*, not of records: each model is a group node
 * (`type: 'model'`), each node type is a node whose `parentId` is its model,
 * each edge type is an edge inside one model, and each stitch is the only kind
 * of edge that crosses from one model to another — an **anchor** (`SAME_AS`,
 * the same entity keyed differently) or a **relationship** link (its own edge
 * type). `data.kind` says which: `edge` · `anchor` · `relationship`.
 *
 * A node type's `type` is its qualified name (`Twitter.Tweet`), so a config
 * can bind a look per type. `data` carries the label, its description, its
 * ordered `properties` (name, type, identity, the stitches that key on it) and
 * `icon` — an iconify id, an authored presentation hint like `starSchema`'s.
 *
 * The JSON is the source: regenerate it only when the airways demo changes.
 *
 * @example
 * import { airwaysGlobalModel } from '@invana/graph-datasets/usecase-demos';
 */

import raw from './global-model.json';

export const airwaysGlobalModel = raw;

/** {@link airwaysGlobalModel} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data = airwaysGlobalModel;
