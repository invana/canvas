export { ContentLODEditorPanel } from './ContentLODEditorPanel';
export type { ContentLODEditorPanelProps } from './ContentLODEditorPanel';

export type { ContentLODFields, ContentLODFormState, ContentLODOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { contentLODFields, nodeLabelLODFields, edgeLabelLODFields } from './fields';
export { optionsToForm, formToOptions, labelLodOptionsToForm, labelLodFormToOptions } from './mapping';
