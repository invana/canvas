/**
 * Built-in **composite card** node types — ready-made card layouts built on the
 * engine's domain-free `composite` shape, the composite counterpart to the
 * geometry node types in `BUILT_IN_STRUCTURES`.
 *
 * Each card is a {@link CompositeCard} **subclass** driven by a typed **spec**
 * (like `ShapeBase<TSpec>` for `RectShape` / `CircleShape`): every value — width,
 * colours, radii, spacing — lives in `spec`, so *editing the spec* re-styles the
 * card. Override the `protected` section methods only for structural changes.
 * Each card also exports a stock convenience function.
 *
 * ```ts
 * import { UserCard, userCard, type UserCardData } from '@invana/graph';
 *
 * // stock function:
 * shape: (n) => userCard(n.data as UserCardData)
 *
 * // configure via the spec (no subclassing):
 * const card = new UserCard({ width: 300, bg: 0x1e293b, nameColor: 0xffffff });
 * shape: (n) => card.build(n.data as UserCardData)
 *
 * // …or subclass for structure:
 * class MyUser extends UserCard { protected topAccent() {} }
 * ```
 */

export { CompositeCard, type CardFrame } from './base';
export { SchemaTableCard, schemaTableCard, SCHEMA_TABLE_CARD_DEFAULTS, type SchemaTableCardSpec, type SchemaTableCardOptions } from './schemaTable';
export { UserCard, userCard, USER_CARD_DEFAULTS, type UserCardSpec } from './userCard';
export { StatCard, statCard, STAT_CARD_DEFAULTS, type StatCardSpec } from './statCard';
export { TaskCard, taskCard, TASK_CARD_DEFAULTS, type TaskCardSpec } from './taskCard';
export { iconifyUrl, CARD_BG, CARD_STROKE } from './shared';
export type { SchemaField, SchemaTableData, UserCardData, StatCardData, TaskTag, TaskCardData } from './types';
