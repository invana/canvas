/**
 * Built-in **composite card** node types — ready-made card layouts built on the
 * engine's domain-free `composite` shape, the composite counterpart to the
 * geometry node types in `BUILT_IN_STRUCTURES`. Each is a *builder*: it maps a
 * data object to a {@link CompositeShapeOption}, so you use it via a per-node
 * `shape` resolver (colours are data-driven, which a static structure can't do):
 *
 * ```ts
 * import { userCard, type UserCardData } from '@invana/graph';
 * new GraphLayer({ options: { node: { style: {
 *   shape: (n) => userCard(n.data as UserCardData),
 *   bgStrokeWidth: 0,
 * }}}})
 * ```
 *
 * Bring your own by writing another `(data) => CompositeShapeOption` builder.
 */

export { schemaTableCard, type SchemaTableCardOptions } from './schemaTable';
export { userCard } from './userCard';
export { statCard } from './statCard';
export { taskCard } from './taskCard';
export { iconifyUrl, CARD_BG, CARD_STROKE } from './shared';
export type { SchemaField, SchemaTableData, UserCardData, StatCardData, TaskTag, TaskCardData } from './types';
