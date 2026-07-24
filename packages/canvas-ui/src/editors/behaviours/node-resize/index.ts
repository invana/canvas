export { NodeResizeEditorPanel } from './NodeResizeEditorPanel';
export type { NodeResizeEditorPanelProps } from './NodeResizeEditorPanel';

export type { NodeResizeFields, NodeResizeFormState, NodeResizeOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { nodeResizeFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
