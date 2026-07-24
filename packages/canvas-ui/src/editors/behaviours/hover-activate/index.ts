export { HoverActivateEditorPanel } from './HoverActivateEditorPanel';
export type { HoverActivateEditorPanelProps } from './HoverActivateEditorPanel';

export type { HoverActivateFields, HoverActivateFormState, HoverActivateOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { hoverActivateFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
