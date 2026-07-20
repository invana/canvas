import { CompositeNodeStyleEditor, type CompositeNodeStyleEditorProps } from './composite';
import { SimpleNodeStyleEditor, type SimpleNodeStyleEditorProps } from './simple';

/**
 * Props for {@link NodeStyleEditor} — a discriminated union on the node `kind`.
 * The consumer passes the selected node's kind (from its `shape.kind`:
 * `'composite'` vs a built-in simple kind) plus that variant's own props. The
 * component is engine-agnostic — it can't inspect a live pixi node, so the kind
 * is explicit, per `packages/canvas-ui/CLAUDE.md`.
 */
export type NodeStyleEditorProps =
  | ({ kind?: 'simple' } & SimpleNodeStyleEditorProps)
  | ({ kind: 'composite' } & CompositeNodeStyleEditorProps);

/**
 * Dispatcher over the two full-spec node style editors: renders
 * {@link CompositeNodeStyleEditor} for a composite / card node (editing a
 * `CompositeShapeOption`) and {@link SimpleNodeStyleEditor} otherwise (editing
 * the flat `NodeStyle`). Each variant owns its own form, mapping, and
 * `onSubmit` payload; this only picks which to mount.
 */
export function NodeStyleEditor(props: NodeStyleEditorProps) {
  return props.kind === 'composite' ? (
    <CompositeNodeStyleEditor {...props} />
  ) : (
    <SimpleNodeStyleEditor {...props} />
  );
}
