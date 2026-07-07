export { ColorByLabelEditor } from './ColorByLabelEditor';
export type { ColorByLabelEditorProps } from './ColorByLabelEditor';

export type { ColorByLabelFields, ColorByLabelFormState, ColorByLabelOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { colorByLabelFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
