export { LabelCollisionEditor } from './LabelCollisionEditor';
export type { LabelCollisionEditorProps } from './LabelCollisionEditor';

export type { LabelCollisionFields, LabelCollisionFormState, LabelCollisionOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { labelCollisionFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
