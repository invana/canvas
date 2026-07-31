/**
 * `<SimpleNodeStyleEditorPanel>` — the full-spec editor for a **simple** node (the
 * flat `NodeStyle`: Geometry / Background / Stroke / Label). Docked into a live
 * `<GraphCanvasApp>` of simple nodes; select one, edit, Apply → it updates live.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { SimpleNodeStyleEditorPanel, formToStyle, styleToForm, type NodeStyleFields } from '@invana/canvas-ui';

import { LiveStyleEditorApp, SIMPLE_DATA, SelectPrompt, useSelectedNode } from './_shared';

const meta: Meta = { title: 'canvas-ui/editors/node-styles/SimpleNodeStyleEditorPanel' };
export default meta;
type Story = StoryObj;

function Panel() {
  const sel = useSelectedNode();
  if (!sel) return <SelectPrompt text="Select a node to edit its style." />;
  const { layer, id, style } = sel;
  return (
    <SimpleNodeStyleEditorPanel
      key={id}
      defaults={styleToForm(style)}
      onSubmit={(values: NodeStyleFields) =>
        layer.store.updateNode(id, { style: { ...style, ...formToStyle(values) } })
      }
    />
  );
}

export const SimpleNodeStyleEditorPanelStory: Story = {
  name: 'SimpleNodeStyleEditorPanel',
  render: () => (
    <LiveStyleEditorApp
      title="SimpleNodeStyleEditorPanel"
      message="Select a simple node, then edit its style in the right panel"
      data={SIMPLE_DATA}
      panel={<Panel />}
    />
  ),
};
