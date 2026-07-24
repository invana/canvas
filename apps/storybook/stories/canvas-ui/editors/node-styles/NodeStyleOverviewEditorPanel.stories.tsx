/**
 * `<NodeStyleOverviewEditorPanel>` — the minimal **colour-only** editor. Docked into a
 * live `<GraphCanvasApp>`, the panel lists one colour picker per node (the editor
 * is just a colour control), and each pick recolours that node **live** via
 * `recolorNodeStyle` — `bgFill` for a simple shape, body + accent for a card.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CompositeShapeOption, GraphLayer } from '@invana/graph';
import {
  NodeStyleOverviewEditorPanel,
  colorToForm,
  formToColor,
  recolorNodeStyle,
  type NodeStyleOverviewFields,
} from '@invana/canvas-ui';
import { useCanvas } from '@invana/canvas-react';

import { LiveStyleEditorApp, MIXED_DATA } from './_shared';

const meta: Meta = { title: 'canvas-ui/editors/node-styles' };
export default meta;
type Story = StoryObj;

/** One node's colour row — recolours that node live on every pick (no Apply). */
function NodeColorRow({ layer, id }: { layer: GraphLayer; id: string }) {
  const node = layer.store.getNode(id);
  if (!node) return null;

  const style = layer.resolveNodeStyle(node);
  const current =
    style.shape?.kind === 'composite'
      ? (style.shape as CompositeShapeOption).fill
      : typeof style.bgFill === 'number'
        ? style.bgFill
        : undefined;
  const label = (typeof style.labelText === 'string' && style.labelText) || id;

  const apply = (values: NodeStyleOverviewFields) => {
    const color = formToColor(values);
    if (color === undefined) return;
    layer.store.updateNode(id, { style: { ...style, ...recolorNodeStyle(style, color) } });
  };

  return (
    <div style={{ borderTop: '1px solid var(--border, #e4e4e7)' }}>
      <div style={{ padding: '10px 16px 0', fontSize: 12, fontWeight: 600, opacity: 0.85 }}>{label}</div>
      <NodeStyleOverviewEditorPanel defaults={colorToForm(current)} onChange={apply} />
    </div>
  );
}

/** Lists a colour picker for every node on the canvas. */
function Panel() {
  const canvas = useCanvas();
  const layer = canvas.layers.get('graph') as GraphLayer | undefined;
  if (!layer) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px 4px', fontSize: 13, fontWeight: 600 }}>Node colors</div>
      {MIXED_DATA.nodes.map((n) => (
        <NodeColorRow key={n.id} layer={layer} id={n.id} />
      ))}
    </div>
  );
}

export const Overview: Story = {
  name: 'NodeStyleOverviewEditorPanel',
  render: () => (
    <LiveStyleEditorApp
      title="NodeStyleOverviewEditorPanel"
      message="Pick a colour for any node in the right panel"
      data={MIXED_DATA}
      panel={<Panel />}
    />
  ),
};
