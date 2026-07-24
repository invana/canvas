export { TextResolutionLODEditorPanel } from './TextResolutionLODEditorPanel';
export type { TextResolutionLODEditorPanelProps } from './TextResolutionLODEditorPanel';

export type {
  TextResolutionLODFields,
  TextResolutionLODFormState,
  TextResolutionLODOptions,
} from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { textResolutionLodFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
