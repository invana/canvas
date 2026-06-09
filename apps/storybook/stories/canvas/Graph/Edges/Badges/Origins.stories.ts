import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type BadgeOrigin,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Edges/Badges/Origins' };
export default meta;
type Story = StoryObj;

/**
 * `EdgeBadge.origin` — which point of the badge AABB lands at the path
 * anchor. All four edges share `placement: 'middle'`; only the origin
 * differs, so the badge shifts predictably relative to the line.
 *
 * - **`'center'`** (default for edge badges) — badge centres on the line
 *   point.
 * - **`'top'`** — badge's top-midpoint lands on the path, so the badge
 *   extends *below* the line.
 * - **`'bottom'`** — badge's bottom-midpoint lands on the path, so the
 *   badge sits *above* the line.
 * - **`'top-right'`** — badge's top-right corner lands on the path; the
 *   badge sits diagonally down-left of the anchor.
 *
 * Defaults differ between shape badges and edge badges: shape badges
 * default to the *mirror* of placement (outside the host edge); edge
 * badges default to `'center'` (centred on the path point) because the
 * path has no inherent "outside" direction.
 */
export const Origins: Story = {
  render: () => createContainer({ id: 'graph-edges-badges-origins' }),

  play: async ({ canvasElement }) => {
    const variants: { origin?: BadgeOrigin; label: string }[] = [
      { origin: 'center',    label: "origin: 'center' (default)" },
      { origin: 'top',       label: "origin: 'top' (badge below line)" },
      { origin: 'bottom',    label: "origin: 'bottom' (badge above line)" },
      { origin: 'top-right', label: "origin: 'top-right'" },
    ];

    const nodes: NodeData[] = variants.flatMap((v, i) => [
      {
        id: `src-${i}`,
        position: { x: -260, y: (i - 1.5) * 110 },
        style: {
          shape: { kind: 'circle', radius: 14 },
          bgFill: 0x60a5fa,
          labelText: v.label,
          labelColor: 0x0f172a,
          labelFontSize: 11,
          labelPlacement: 'left',
          labelOffsetX: -10,
        },
      },
      {
        id: `tgt-${i}`,
        position: { x: 260, y: (i - 1.5) * 110 },
        style: {
          shape: { kind: 'circle', radius: 14 },
          bgFill: 0x34d399,
        },
      },
    ]);

    const edges: EdgeData[] = variants.map((v, i) => ({
      id: `e-${i}`,
      source: `src-${i}`,
      target: `tgt-${i}`,
      style: {
        badges: [
          {
            id: 'demo',
            placement: 'middle',
            ...(v.origin !== undefined ? { origin: v.origin } : {}),
            shape: { kind: 'rect', width: 24, height: 18, cornerRadius: 4 },
            fill: 0xdc2626,
            strokeColor: 0xffffff,
            strokeWidth: 1.5,
          },
        ],
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-edges-badges-origins',
    )!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges } },
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph' }));

    const canvasOptions = {
      layers: {
        graph: { edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 1.5, arrowTargetShape: 'none' } } },
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true }, 'drag-node': { enabled: true } },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
