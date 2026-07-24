export { EraseEditorPanel } from './EraseEditorPanel';
export type { EraseEditorPanelProps } from './EraseEditorPanel';

export type { EraseFields, EraseFormState, EraseOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { eraseFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
