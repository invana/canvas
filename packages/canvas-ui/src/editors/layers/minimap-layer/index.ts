export { MiniMapLayerEditorPanel } from './MiniMapLayerEditorPanel';
export type { MiniMapLayerEditorPanelProps } from './MiniMapLayerEditorPanel';

export type { MiniMapLayerFields, MiniMapLayerFormState, MiniMapLayerOptions } from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { miniMapLayerFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
