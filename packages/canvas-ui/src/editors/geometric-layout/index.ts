export { GeometricLayoutEditor } from './GeometricLayoutEditor';
export type { GeometricLayoutEditorProps } from './GeometricLayoutEditor';

export type {
  GeometricLayoutFields,
  GeometricLayoutFormState,
  GeometricLayoutOptions,
  GeometricLayoutMode,
} from './types';

// Field config + mapping — supply/override the schema, seed (`optionsToForm`),
// and read edits back (`formToOptions`).
export { geometricLayoutFields, modeFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
