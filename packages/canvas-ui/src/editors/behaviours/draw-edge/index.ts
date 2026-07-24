export { DrawEdgeEditorPanel } from './DrawEdgeEditorPanel';
export type { DrawEdgeEditorPanelProps } from './DrawEdgeEditorPanel';

export type { DrawEdgeFields, DrawEdgeFormState, DrawEdgeOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { drawEdgeFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
