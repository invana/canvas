/**
 * `<CompositeNodeStyleEditorPanel>` — the full-spec editor for a **composite / card**
 * node (a `CompositeShapeOption`: body / root / the `parts[]` list). Docked into
 * a live `<GraphCanvasApp>` of card nodes; select one, edit, Apply → it redraws.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CompositeShapeOption } from '@invana/graph';
import {
  CompositeNodeStyleEditorPanel,
  compositeToForm,
  formToComposite,
  type CompositeFormState
} from '@invana/canvas-ui';

import { COMPOSITE_DATA, LiveStyleEditorApp, SelectPrompt, useSelectedNode } from './_shared';

const meta: Meta = { title: 'canvas-ui/editors/node-styles/CompositeNodeStyleEditorPanel' };
export default meta;
type Story = StoryObj;

function Panel() {
  const sel = useSelectedNode();
  if (!sel) return <SelectPrompt text="Select a card node to edit it." />;
  const { layer, id, style } = sel;
  if (style.shape?.kind !== 'composite') {
    return <SelectPrompt text="Selected node isn't a composite card." />;
  }
  return (
    <CompositeNodeStyleEditorPanel
      key={id}
      defaults={compositeToForm(style.shape as CompositeShapeOption)}
      onSubmit={(values: CompositeFormState) =>
        layer.store.updateNode(id, { style: { ...style, shape: formToComposite(values) } })
      }
    />
  );
}

export const CompositeNodeStyleEditorPanelStory: Story = {
  name: 'CompositeNodeStyleEditorPanel',
  render: () => (
    <LiveStyleEditorApp
      title="CompositeNodeStyleEditorPanel"
      message="Select a card node, then edit its spec in the right panel"
      data={COMPOSITE_DATA}
      panel={<Panel />}
    />
  )
};
