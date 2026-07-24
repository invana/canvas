import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the CreateNodeBehaviour editor. Empty —
 * `CreateNodeBehaviour` has no serialisable scalar options (only the
 * `createNode` / `onNodeCreate` callbacks plus host-owned base fields). Kept as
 * an exported array so the editor renders and a host can override it once a
 * tunable option (e.g. a default node type) is added.
 */
export const createNodeFields: FieldConfig[] = [];
