/**
 * `<SimpleNodeStyleEditor>` — the full-spec editor for a **simple** node (the
 * flat `NodeStyle`: Geometry / Background / Stroke / Label). Docked into a live
 * `<GraphCanvasApp>` of simple nodes; select one, edit, Apply → it updates live.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { SimpleNodeStyleEditor, formToStyle, styleToForm, type NodeStyleFields } from '@invana/canvas-ui';

import { LiveStyleEditorApp, SIMPLE_DATA, SelectPrompt, useSelectedNode } from './_shared';

const meta: Meta = { title: 'canvas-ui/editors/node-styles' };
export default meta;
type Story = StoryObj;

function Panel() {
  const sel = useSelectedNode();
  if (!sel) return <SelectPrompt text="Select a node to edit its style." />;
  const { layer, id, style } = sel;
  return (
    <SimpleNodeStyleEditor
      key={id}
      defaults={styleToForm(style)}
      onSubmit={(values: NodeStyleFields) =>
        layer.store.updateNode(id, { style: { ...style, ...formToStyle(values) } })
      }
    />
  );
}

export const Simple: Story = {
  name: 'SimpleNodeStyleEditor',
  render: () => (
    <LiveStyleEditorApp
      title="SimpleNodeStyleEditor"
      message="Select a simple node, then edit its style in the right panel"
      data={SIMPLE_DATA}
      panel={<Panel />}
    />
  ),
};
