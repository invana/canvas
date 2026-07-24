import { CompositeNodeStyleEditorPanel, type CompositeNodeStyleEditorPanelProps } from './composite';
import { SimpleNodeStyleEditorPanel, type SimpleNodeStyleEditorPanelProps } from './simple';

/**
 * Props for {@link NodeStyleEditorPanel} — a discriminated union on the node `kind`.
 * The consumer passes the selected node's kind (from its `shape.kind`:
 * `'composite'` vs a built-in simple kind) plus that variant's own props. The
 * component is engine-agnostic — it can't inspect a live pixi node, so the kind
 * is explicit, per `packages/canvas-ui/CLAUDE.md`.
 */
export type NodeStyleEditorPanelProps =
  | ({ kind?: 'simple' } & SimpleNodeStyleEditorPanelProps)
  | ({ kind: 'composite' } & CompositeNodeStyleEditorPanelProps);

/**
 * Dispatcher over the two full-spec node style editors: renders
 * {@link CompositeNodeStyleEditorPanel} for a composite / card node (editing a
 * `CompositeShapeOption`) and {@link SimpleNodeStyleEditorPanel} otherwise (editing
 * the flat `NodeStyle`). Each variant owns its own form, mapping, and
 * `onSubmit` payload; this only picks which to mount.
 */
export function NodeStyleEditorPanel(props: NodeStyleEditorPanelProps) {
  return props.kind === 'composite' ? (
    <CompositeNodeStyleEditorPanel {...props} />
  ) : (
    <SimpleNodeStyleEditorPanel {...props} />
  );
}
