export { ThemeEditor } from './ThemeEditor';
export type { ThemeEditorProps } from './ThemeEditor';

export type { ThemeFields, ThemeFormState, ThemeOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { themeFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
