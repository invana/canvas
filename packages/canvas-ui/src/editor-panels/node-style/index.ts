// Node style editors. `NodeStyleEditorPanel` is the dispatcher: it renders the
// full-spec **simple** editor (`SimpleNodeStyleEditorPanel`, flat `NodeStyle`) or the
// full-spec **composite** editor (`CompositeNodeStyleEditorPanel`, a
// `CompositeShapeOption`) based on the `kind` prop. Both variants — and their
// field configs + mappers (`styleToForm`/`formToStyle`,
// `compositeToForm`/`formToComposite`) — are re-exported for standalone use.
export { NodeStyleEditorPanel } from './NodeStyleEditorPanel';
export type { NodeStyleEditorPanelProps } from './NodeStyleEditorPanel';

export * from './simple';
export * from './composite';
