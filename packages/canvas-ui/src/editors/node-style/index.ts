// Node style editors. `NodeStyleEditor` is the dispatcher: it renders the
// full-spec **simple** editor (`SimpleNodeStyleEditor`, flat `NodeStyle`) or the
// full-spec **composite** editor (`CompositeNodeStyleEditor`, a
// `CompositeShapeOption`) based on the `kind` prop. Both variants — and their
// field configs + mappers (`styleToForm`/`formToStyle`,
// `compositeToForm`/`formToComposite`) — are re-exported for standalone use.
export { NodeStyleEditor } from './NodeStyleEditor';
export type { NodeStyleEditorProps } from './NodeStyleEditor';

export * from './simple';
export * from './composite';
