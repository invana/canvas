export { MapLayerEditor } from './MapLayerEditor';
export type { MapLayerEditorProps } from './MapLayerEditor';

export type { MapLayerFields, MapLayerFormState, MapLayerOptions } from './types';

// Field config + mapping — supply/override the schema, seed (`optionsToForm`),
// and read edits back (`formToOptions`).
export { mapLayerFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
