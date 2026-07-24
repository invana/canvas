/**
 * `<NodeStyleEditorPanel>` — the **dispatcher**: it renders `SimpleNodeStyleEditorPanel`
 * or `CompositeNodeStyleEditorPanel` based on the `kind` prop. Docked into a live
 * `<GraphCanvasApp>` of mixed nodes; select any node and the panel auto-picks the
 * matching full editor from its `shape.kind`, editing it live.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CompositeShapeOption } from '@invana/graph';
import {
  NodeStyleEditorPanel,
  compositeToForm,
  formToComposite,
  formToStyle,
  styleToForm,
  type CompositeFormState,
  type NodeStyleFields,
} from '@invana/canvas-ui';

import { LiveStyleEditorApp, MIXED_DATA, SelectPrompt, useSelectedNode } from './_shared';

const meta: Meta = { title: 'canvas-ui/editors/node-styles' };
export default meta;
type Story = StoryObj;

function Panel() {
  const sel = useSelectedNode();
  if (!sel) return <SelectPrompt text="Select any node — simple or card." />;
  const { layer, id, style } = sel;

  if (style.shape?.kind === 'composite') {
    return (
      <NodeStyleEditorPanel
        key={id}
        kind="composite"
        defaults={compositeToForm(style.shape as CompositeShapeOption)}
        onSubmit={(values: CompositeFormState) =>
          layer.store.updateNode(id, { style: { ...style, shape: formToComposite(values) } })
        }
      />
    );
  }
  return (
    <NodeStyleEditorPanel
      key={id}
      kind="simple"
      defaults={styleToForm(style)}
      onSubmit={(values: NodeStyleFields) =>
        layer.store.updateNode(id, { style: { ...style, ...formToStyle(values) } })
      }
    />
  );
}

export const Dispatcher: Story = {
  name: 'NodeStyleEditorPanel',
  render: () => (
    <LiveStyleEditorApp
      title="NodeStyleEditorPanel"
      message="Select any node — the panel picks the simple or composite editor"
      data={MIXED_DATA}
      panel={<Panel />}
    />
  ),
};
