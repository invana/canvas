export { D3HierarchyLayoutEditor } from './D3HierarchyLayoutEditor';
export type { D3HierarchyLayoutEditorProps } from './D3HierarchyLayoutEditor';

export type {
  D3HierarchyLayoutFields,
  D3HierarchyLayoutFormState,
  D3HierarchyLayoutOptions,
} from './types';

// Field config + mapping — exported so the consumer can supply/override the
// schema, seed the form (`optionsToForm`), and read edits back (`formToOptions`).
export { d3HierarchyLayoutFields } from './fields';
export { optionsToForm, formToOptions } from './mapping';
