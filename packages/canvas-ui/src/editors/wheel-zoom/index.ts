export { WheelZoomEditor } from './WheelZoomEditor';
export type { WheelZoomEditorProps } from './WheelZoomEditor';

export type { WheelZoomFields, WheelZoomFormState, WheelZoomOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { wheelZoomFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
