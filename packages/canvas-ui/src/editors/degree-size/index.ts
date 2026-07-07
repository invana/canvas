export { DegreeSizeEditor } from './DegreeSizeEditor';
export type { DegreeSizeEditorProps } from './DegreeSizeEditor';

export type { DegreeSizeFields, DegreeSizeFormState, DegreeSizeOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { degreeSizeFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
