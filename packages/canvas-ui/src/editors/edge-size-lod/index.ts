export { EdgeSizeLODEditor } from './EdgeSizeLODEditor';
export type { EdgeSizeLODEditorProps } from './EdgeSizeLODEditor';

export type { EdgeSizeLODFields, EdgeSizeLODFormState, EdgeSizeLODOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { edgeSizeLodFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
