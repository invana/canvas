export { LabelResolutionLODEditor } from './LabelResolutionLODEditor';
export type { LabelResolutionLODEditorProps } from './LabelResolutionLODEditor';

export type {
  LabelResolutionLODFields,
  LabelResolutionLODFormState,
  LabelResolutionLODOptions,
} from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { labelResolutionLodFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
