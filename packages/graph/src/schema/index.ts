// Graph schema — the metagraph value + the observed (loaded-data) source. The
// authoritative source is `GraphStore.setSchema` / `GraphStore.schema`.
export type {
  GraphSchema,
  SchemaNodeType,
  SchemaEdgeType,
  SchemaEdgeConnection,
  SchemaProperty,
  DeriveSchemaOptions,
} from './types';
export { deriveSchema, schemaSignature, defaultNodeTypeOf, defaultEdgeTypeOf } from './deriveSchema';
