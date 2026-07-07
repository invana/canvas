export { CollapseExpandEditor } from './CollapseExpandEditor';
export type { CollapseExpandEditorProps } from './CollapseExpandEditor';

export type { CollapseExpandFields, CollapseExpandFormState, CollapseExpandOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { collapseExpandFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
