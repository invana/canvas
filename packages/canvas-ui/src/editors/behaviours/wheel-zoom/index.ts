export { WheelZoomEditorPanel } from './WheelZoomEditorPanel';
export type { WheelZoomEditorPanelProps } from './WheelZoomEditorPanel';

export type { WheelZoomFields, WheelZoomFormState, WheelZoomOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { wheelZoomFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
