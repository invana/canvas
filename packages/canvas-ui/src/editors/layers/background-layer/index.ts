export { BackgroundLayerEditorPanel } from './BackgroundLayerEditorPanel';
export type { BackgroundLayerEditorPanelProps } from './BackgroundLayerEditorPanel';

export type {
  BackgroundLayerFields,
  BackgroundLayerFormState,
  BackgroundLayerOptions,
  BackgroundType,
  BackgroundPatternType,
  BackgroundMode,
} from './types';

// Field config + mapping — supply/override the schema, seed (`optionsToForm`),
// and read edits back (`formToOptions`).
export { backgroundLayerFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
