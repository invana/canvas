export { GraphLegendLayerEditorPanel } from './GraphLegendLayerEditorPanel';
export type { GraphLegendLayerEditorPanelProps } from './GraphLegendLayerEditorPanel';

export type {
  GraphLegendCountMode,
  GraphLegendLayerFields,
  GraphLegendLayerFormState,
  GraphLegendLayerOptions,
  GraphLegendMode,
  GraphLegendPosition,
  GraphLegendSort,
} from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { graphLegendLayerFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
