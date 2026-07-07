export { ContextMenuEditor } from './ContextMenuEditor';
export type { ContextMenuEditorProps } from './ContextMenuEditor';

export type { ContextMenuFields, ContextMenuFormState, ContextMenuOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { contextMenuFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
