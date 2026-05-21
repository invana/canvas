import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type BadgeOrigin, type NodeData } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Badges/Origins' };
export default meta;
type Story = StoryObj;

/**
 * `NodeBadge.origin` — which point of the badge AABB lands at the host
 * anchor. All four hosts share the same `placement: 'top-right'`; only
 * `origin` differs, so the badge shifts predictably around the corner.
 *
 * - **default (mirror)** — origin omitted; resolves to the *mirror* of
 *   placement (here `'bottom-left'`). The badge sits fully outside the
 *   host's top-right corner — classic "no-overlap" anchor.
 * - **`'center'`** — badge centres on the corner, half-overhanging the
 *   host edge. The notification-bubble convention.
 * - **`'bottom-right'`** — badge's own bottom-right corner lands at the
 *   host corner — badge sits fully *inside* the host's top-right quadrant.
 * - **`'top-left'`** — badge's own top-left corner lands at the host
 *   corner — badge sits fully outside the corner but in the opposite
 *   quadrant from the default (exaggerated outside).
 */
export const Origins: Story = {
  render: () => createContainer({ id: 'graph-nodes-badges-origins' }),

  play: async ({ canvasElement }) => {
    type OriginVariant = {
      readonly id: string;
      readonly label: string;
      readonly origin?: BadgeOrigin;
    };

    const variants: OriginVariant[] = [
      { id: 'default',       label: 'default (mirror)' },
      { id: 'center',        label: "origin: 'center'",         origin: 'center' },
      { id: 'bottom-right',  label: "origin: 'bottom-right'",   origin: 'bottom-right' },
      { id: 'top-left',      label: "origin: 'top-left'",       origin: 'top-left' },
    ];

    const nodes: NodeData[] = variants.map((v, i) => ({
      id: v.id,
      position: { x: (i - 1.5) * 220, y: 0 },
      style: {
        shape: { kind: 'rect', width: 110, height: 80, cornerRadius: 10 },
        bgFill: 0x60a5fa,
        bgStrokeColor: 0xffffff,
        bgStrokeWidth: 1,
        labelText: v.label,
        labelColor: 0xffffff,
        labelFontSize: 11,
        labelPlacement: 'center',
        badges: [
          {
            id: 'demo',
            placement: 'top-right',
            ...(v.origin !== undefined ? { origin: v.origin } : {}),
            shape: { kind: 'circle', radius: 11 },
            fill: 0xdc2626,
            strokeColor: 0xffffff,
            strokeWidth: 2,
          },
        ],
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-nodes-badges-origins',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({ id: 'graph', options: {} });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });

    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
