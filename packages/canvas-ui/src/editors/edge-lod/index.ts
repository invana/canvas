export { EdgeLODEditor } from './EdgeLODEditor';
export type { EdgeLODEditorProps } from './EdgeLODEditor';

export type { EdgeLODFields, EdgeLODFormState, EdgeLODKeepBy, EdgeLODOptions } from './types';

// Field config + mapping — supply/override the schema, seed (`optionsToForm`),
// read edits back (`formToOptions`).
export { edgeLODFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
