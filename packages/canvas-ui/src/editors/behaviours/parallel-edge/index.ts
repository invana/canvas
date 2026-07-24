export { ParallelEdgeEditorPanel } from './ParallelEdgeEditorPanel';
export type { ParallelEdgeEditorPanelProps } from './ParallelEdgeEditorPanel';

export type { ParallelEdgeFields, ParallelEdgeFormState, ParallelEdgeOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { parallelEdgeFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
