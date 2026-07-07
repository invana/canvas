export { BubbleSetsLayerEditor } from './BubbleSetsLayerEditor';
export type { BubbleSetsLayerEditorProps } from './BubbleSetsLayerEditor';

export type {
  BubbleSetsLayerFields,
  BubbleSetsLayerFormState,
  BubbleSetsLayerOptions,
  BubbleSetStyle,
  BubbleSetsSmoothness,
  BubbleSetsRecompute,
} from './types';

// Field config + mapping — supply/override the schema, seed (`optionsToForm`),
// and read edits back (`formToOptions`).
export { bubbleSetsLayerFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
