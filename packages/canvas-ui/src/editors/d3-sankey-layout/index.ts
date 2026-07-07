export { D3SankeyLayoutEditor } from './D3SankeyLayoutEditor';
export type { D3SankeyLayoutEditorProps } from './D3SankeyLayoutEditor';

export type {
  D3SankeyLayoutFields,
  D3SankeyLayoutFormState,
  D3SankeyLayoutOptions,
} from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { d3SankeyLayoutFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
