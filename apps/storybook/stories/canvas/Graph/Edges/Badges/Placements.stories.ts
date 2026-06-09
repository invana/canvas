import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type EdgeBadgePlacement,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Edges/Badges/Placements' };
export default meta;
type Story = StoryObj;

/**
 * Every {@link EdgeBadgePlacement} variant on `EdgeStyle.badges`. Six rows,
 * one per placement variant — `'start'`, `'middle'`, `'end'`, plus three
 * numeric `t` values to show raw arc-length anchoring without
 * endpoint-clearance:
 *
 * - **named `'start'` / `'end'`** — auto-clearance: the badge sits past
 *   the endpoint shape's silhouette (and past any marker) with a small
 *   visual gap.
 * - **`'middle'`** — exact midpoint by arc-length (`t = 0.5`).
 * - **numeric `0`** — raw arc-length at t=0; no clearance, badge sits
 *   centred on the source silhouette point.
 * - **numeric `0.25` / `0.75`** — arbitrary positions along the path.
 * - **numeric `1`** — raw arc-length at t=1; no clearance, badge sits
 *   centred on the target silhouette (the "raw" counterpart to `'end'`).
 */
export const Placements: Story = {
  render: () => createContainer({ id: 'graph-edges-badges-placements' }),

  play: async ({ canvasElement }) => {
    const variants: { placement: EdgeBadgePlacement; label: string }[] = [
      { placement: 'start',  label: "'start' (auto-clearance)" },
      { placement: 'middle', label: "'middle' (t=0.5)" },
      { placement: 'end',    label: "'end' (auto-clearance)" },
      { placement: 0,        label: 't=0 (raw, no clearance)' },
      { placement: 0.25,     label: 't=0.25' },
      { placement: 0.75,     label: 't=0.75' },
      { placement: 1,        label: 't=1 (raw, no clearance)' },
    ];

    const nodes: NodeData[] = variants.flatMap((v, i) => [
      {
        id: `src-${i}`,
        position: { x: -260, y: (i - (variants.length - 1) / 2) * 90 },
        style: {
          shape: { kind: 'circle', radius: 14 },
          bgFill: 0x60a5fa,
          bgStrokeColor: 0xffffff,
          bgStrokeWidth: 1,
          labelText: v.label,
          labelColor: 0x0f172a,
          labelFontSize: 11,
          labelPlacement: 'left',
          labelOffsetX: -10,
          labelAlign: 'right',
        },
      },
      {
        id: `tgt-${i}`,
        position: { x: 260, y: (i - (variants.length - 1) / 2) * 90 },
        style: {
          shape: { kind: 'circle', radius: 14 },
          bgFill: 0x34d399,
          bgStrokeColor: 0xffffff,
          bgStrokeWidth: 1,
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
            placement: v.placement,
            shape: { kind: 'circle', radius: 9 },
            fill: 0xdc2626,
            strokeColor: 0xffffff,
            strokeWidth: 1.5,
          },
        ],
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-edges-badges-placements',
    )!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    const canvasOptions = {
      layers: {
        graph: {
          edge: {
            style: {
              strokeColor: 0x94a3b8,
              strokeWidth: 1.5,
              arrowTargetShape: 'triangle',
            },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
      },
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
