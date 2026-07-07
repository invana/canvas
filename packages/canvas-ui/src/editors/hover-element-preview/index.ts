export { HoverElementPreviewEditor } from './HoverElementPreviewEditor';
export type { HoverElementPreviewEditorProps } from './HoverElementPreviewEditor';

export type {
  HoverElementPreviewFields,
  HoverElementPreviewFormState,
  HoverElementPreviewOptions,
} from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { hoverElementPreviewFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
