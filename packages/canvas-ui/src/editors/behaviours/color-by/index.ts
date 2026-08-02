export { ColorByEditorPanel } from './ColorByEditorPanel';
export type { ColorByEditorPanelProps } from './ColorByEditorPanel';

export type {
  ColorByFields,
  ColorByFormState,
  ColorByModeValue,
  ColorByOptions,
  ColorByScaleValue,
} from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { colorByFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
