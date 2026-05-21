import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Edges/Badges/PathOffset' };
export default meta;
type Story = StoryObj;

/**
 * `EdgeBadge.pathOffset` shifts the anchor along the **local tangent** at
 * `placement` — positive = forward toward `'end'`, negative = backward
 * toward `'start'`. Lets you nudge a badge along the path without
 * changing its parametric `t`.
 *
 * Three identical edges with a badge anchored at `'middle'` — only
 * `pathOffset` differs (-60, 0, +60 px). The lil-gui slider sweeps it
 * live so you can watch a single badge slide along the line.
 *
 * `pathOffset` is additive on top of the endpoint-clearance shift that
 * `'start'` / `'end'` apply automatically — useful for fine-tuning, not a
 * replacement for the named anchors.
 */
export const PathOffset: Story = {
  render: () => createContainer({ id: 'graph-edges-badges-pathoffset' }),

  play: async ({ canvasElement }) => {
    const offsets = [-60, 0, 60];
    const nodes: NodeData[] = offsets.flatMap((offset, i) => [
      {
        id: `src-${i}`,
        position: { x: -260, y: (i - 1) * 110 },
        style: {
          shape: { kind: 'circle', radius: 14 },
          bgFill: 0x60a5fa,
          labelText: `pathOffset: ${offset}`,
          labelColor: 0x0f172a,
          labelFontSize: 11,
          labelPlacement: 'left',
          labelOffsetX: -10,
        },
      },
      {
        id: `tgt-${i}`,
        position: { x: 260, y: (i - 1) * 110 },
        style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x34d399 },
      },
    ]);

    const edges: EdgeData[] = offsets.map((offset, i) => ({
      id: `e-${i}`,
      source: `src-${i}`,
      target: `tgt-${i}`,
      style: {
        badges: [
          {
            id: 'demo',
            placement: 'middle',
            pathOffset: offset,
            shape: { kind: 'rect', width: 60, height: 20, cornerRadius: 4 },
            fill: 0xdc2626,
            strokeColor: 0xffffff,
            strokeWidth: 1.5,
            labelText: `${offset > 0 ? '+' : ''}${offset}`,
            labelColor: 0xffffff,
            labelFontSize: 11,
          },
        ],
      },
    }));

    // Fourth edge driven live by the GUI for a sweep demo.
    nodes.push(
      { id: 'live-src', position: { x: -260, y: 200 }, style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x60a5fa, labelText: 'live sweep', labelColor: 0x0f172a, labelFontSize: 11, labelPlacement: 'left', labelOffsetX: -10 } },
      { id: 'live-tgt', position: { x:  260, y: 200 }, style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x34d399 } },
    );
    const liveOffset = { value: 0 };
    edges.push({
      id: 'live',
      source: 'live-src',
      target: 'live-tgt',
      style: {
        badges: [
          {
            id: 'sweep',
            placement: 'middle',
            pathOffset: liveOffset.value,
            shape: { kind: 'circle', radius: 10 },
            fill: 0xfacc15,
            strokeColor: 0x0f172a,
            strokeWidth: 1.5,
          },
        ],
      },
    });

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-edges-badges-pathoffset',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 1.5, arrowTargetShape: 'none' } },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );
    canvas.camera.fitContent(graph.getBounds(), 80);

    const apply = (): void => {
      graph.store.updateEdge('live', {
        style: {
          badges: [
            {
              id: 'sweep',
              placement: 'middle',
              pathOffset: liveOffset.value,
              shape: { kind: 'circle', radius: 10 },
              fill: 0xfacc15,
              strokeColor: 0x0f172a,
              strokeWidth: 1.5,
            },
          ],
        },
      });
    };

    const gui = new GUI({ title: 'pathOffset live sweep' });
    onStoryTeardown(() => gui.destroy());
    gui.add(liveOffset, 'value', -200, 200, 1).name('pathOffset (px)').onChange(apply);
  },
};
