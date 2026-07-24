export { ElkLayoutEditorPanel } from './ElkLayoutEditorPanel';
export type { ElkLayoutEditorPanelProps } from './ElkLayoutEditorPanel';

export type { ElkLayoutFields, ElkLayoutFormState, ElkLayoutOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { elkLayoutFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
