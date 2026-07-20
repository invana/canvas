export { SimpleNodeStyleEditor } from './SimpleNodeStyleEditor';
export type { SimpleNodeStyleEditorProps } from './SimpleNodeStyleEditor';

export type {
  NodeStyleFields,
  NodeStyleFormState,
  ShapeKind,
  StrokeAlignment,
  StrokeCap,
  StrokeJoin,
  LabelPlacement,
} from './types';

// Field configs + mapping — exported so the consumer can supply/override the
// schema, seed the form (`styleToForm`), and read edits back (`formToStyle`).
export {
  nodeStyleFields,
  geometryFields,
  BACKGROUND_FIELDS,
  STROKE_FIELDS,
  LABEL_FIELDS,
} from './fields';
export { styleToForm, formToStyle, defaultShapeFor } from './mapping';
