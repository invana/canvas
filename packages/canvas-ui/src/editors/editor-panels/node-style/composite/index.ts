export { CompositeNodeStyleEditorPanel } from './CompositeNodeStyleEditorPanel';
export type { CompositeNodeStyleEditorPanelProps } from './CompositeNodeStyleEditorPanel';

export type {
  CompositeFormState,
  CompositeScalarFields,
  CompositePartRow,
  CompositeRootKind,
  CompositePartKind,
  CompositeIconKind,
} from './types';

// Field configs + mapping — supply/override the schema, seed the form
// (`compositeToForm`), and read edits back (`formToComposite`).
export {
  compositeScalarFields,
  basicCompositeFields,
  advancedCompositeScalarFields,
  rootFields,
  partRowFields,
} from './fields';
export { compositeToForm, formToComposite } from './mapping';
