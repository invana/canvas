// Schema view — the graph's metagraph (node/edge types + connectivity) derived
// from a live source canvas, rendered as an interactive metagraph (`SchemaViewer`)
// with a `SchemaToolbar` (nodes · layout · edges · fit; the toolbar lives in
// `../../toolbars`). The `deriveSchema` core + `useDerivedSchema` hook are reusable
// standalone.

export { SchemaViewer } from './SchemaViewer';
export type { SchemaViewerProps } from './SchemaViewer';

// Derivation core + reactive hook — reusable without the view.
export { useDerivedSchema } from './useDerivedSchema';
export type { UseDerivedSchemaOptions } from './useDerivedSchema';
export {
  deriveSchema,
  schemaSignature,
  schemaToMetaGraph,
  typeColor,
  defaultNodeTypeOf,
  defaultEdgeTypeOf,
} from './schema';
export type {
  GraphSchema,
  SchemaNodeType,
  SchemaEdgeType,
  SchemaEdgeConnection,
  SchemaProperty,
  SchemaMetaGraphOptions,
  DeriveSchemaOptions,
  SchemaNodeMode,
  SchemaLayoutKind,
  SchemaEdgeRouting,
} from './schema';
