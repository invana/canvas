export { NodeResizeEditor } from './NodeResizeEditor';
export type { NodeResizeEditorProps } from './NodeResizeEditor';

export type { NodeResizeFields, NodeResizeFormState, NodeResizeOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { nodeResizeFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
