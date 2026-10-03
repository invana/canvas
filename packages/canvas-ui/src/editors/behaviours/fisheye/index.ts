export { FisheyeEditorPanel } from './FisheyeEditorPanel';
export type { FisheyeEditorPanelProps } from './FisheyeEditorPanel';

export type {
  FisheyeFields,
  FisheyeFormState,
  FisheyeOptions,
  FisheyeTrigger,
  FisheyeWheelModifier,
  FisheyeWheelModifierField,
} from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { fisheyeFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
