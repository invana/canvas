export { NodeScaleLODEditor } from './NodeScaleLODEditor';
export type { NodeScaleLODEditorProps } from './NodeScaleLODEditor';

export type { NodeScaleLODFields, NodeScaleLODFormState, NodeScaleLODOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { nodeScaleLodFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
