export { ContentLODEditor } from './ContentLODEditor';
export type { ContentLODEditorProps } from './ContentLODEditor';

export type { ContentLODFields, ContentLODFormState, ContentLODOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { contentLODFields, textLODFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
