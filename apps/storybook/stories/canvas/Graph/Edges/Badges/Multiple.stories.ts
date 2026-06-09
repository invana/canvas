import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Edges/Badges/Multiple' };
export default meta;
type Story = StoryObj;

/**
 * Multiple badges along a single edge. `EdgeStyle.badges` is an ordered
 * array — each entry has its own `placement` (named or numeric `t`),
 * `shape`, and optional decorations / effects. The renderer mounts each
 * under a stable slot id derived from `EdgeBadge.id`, so state-overlay
 * diffing works per-badge.
 *
 * One edge, five badges:
 * - `'start'` — orange dot near the source (auto-clearance shifts it
 *   off the source silhouette).
 * - `t = 0.25` — small flag.
 * - `'middle'` — count chip ("12") at the midpoint.
 * - `t = 0.75` — small flag.
 * - `'end'` — verification glyph near the target (auto-clearance shifts
 *   it off the target silhouette and past any marker).
 *
 * Drag either endpoint to confirm every badge re-anchors as one.
 */
export const Multiple: Story = {
  render: () => createContainer({ id: 'graph-edges-badges-multiple' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      { id: 'src', position: { x: -280, y: 0 }, style: { shape: { kind: 'circle', radius: 16 }, bgFill: 0x60a5fa, labelText: 'source', labelColor: 0x0f172a, labelFontSize: 11, labelPlacement: 'left', labelOffsetX: -10 } },
      { id: 'tgt', position: { x:  280, y: 0 }, style: { shape: { kind: 'circle', radius: 16 }, bgFill: 0x34d399, labelText: 'target', labelColor: 0x0f172a, labelFontSize: 11, labelPlacement: 'right', labelOffsetX: 10 } },
    ];

    const edges: EdgeData[] = [
      {
        id: 'e',
        source: 'src',
        target: 'tgt',
        style: {
          badges: [
            {
              id: 'start',
              placement: 'start',
              shape: { kind: 'circle', radius: 8 },
              fill: 0xf97316,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
            },
            {
              id: 'q1',
              placement: 0.25,
              shape: { kind: 'rect', width: 14, height: 14, cornerRadius: 2 },
              fill: 0xfacc15,
              strokeColor: 0xffffff,
              strokeWidth: 1,
            },
            {
              id: 'middle',
              placement: 'middle',
              shape: { kind: 'rect', width: 30, height: 20, cornerRadius: 10 },
              fill: 0xdc2626,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
              labelText: '12',
              labelColor: 0xffffff,
              labelFontSize: 12,
            },
            {
              id: 'q3',
              placement: 0.75,
              shape: { kind: 'rect', width: 14, height: 14, cornerRadius: 2 },
              fill: 0xfacc15,
              strokeColor: 0xffffff,
              strokeWidth: 1,
            },
            {
              id: 'end',
              placement: 'end',
              shape: { kind: 'circle', radius: 11 },
              fill: 0x1d4ed8,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
              icon: {
                kind: 'glyph',
                char: '✓',
                fontFamily: 'sans-serif',
                fontWeight: 700,
                color: 0xffffff,
                sizeRatio: 0.7,
              },
            },
          ],
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-edges-badges-multiple',
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
        graph: { edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 1.5, arrowTargetShape: 'triangle' } } },
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true }, 'drag-node': { enabled: true } },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
