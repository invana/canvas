export { DensityContourStrokeLayerEditor } from './DensityContourStrokeLayerEditor';
export type { DensityContourStrokeLayerEditorProps } from './DensityContourStrokeLayerEditor';

export type {
  DensityContourStrokeLayerFields,
  DensityContourStrokeLayerFormState,
  DensityContourStrokeLayerOptions,
  DensityContourPaletteName,
  DensityContourRecompute,
} from './types';

// Field config + mapping — supply/override the schema, seed (`optionsToForm`),
// and read edits back (`formToOptions`).
export { densityContourStrokeLayerFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
