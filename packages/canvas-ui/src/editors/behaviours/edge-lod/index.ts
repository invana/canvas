export { EdgeLODEditorPanel } from './EdgeLODEditorPanel';
export type { EdgeLODEditorPanelProps } from './EdgeLODEditorPanel';

export type { EdgeLODFields, EdgeLODFormState, EdgeLODKeepBy, EdgeLODOptions } from './types';

// Field config + mapping — supply/override the schema, seed (`optionsToForm`),
// read edits back (`formToOptions`).
export { edgeLODFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
