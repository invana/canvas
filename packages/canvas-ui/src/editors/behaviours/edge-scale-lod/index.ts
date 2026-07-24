export { EdgeScaleLODEditorPanel } from './EdgeScaleLODEditorPanel';
export type { EdgeScaleLODEditorPanelProps } from './EdgeScaleLODEditorPanel';

export type { EdgeScaleLODFields, EdgeScaleLODFormState, EdgeScaleLODOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { edgeScaleLodFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
