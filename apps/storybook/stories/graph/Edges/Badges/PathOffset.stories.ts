import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type GraphEdge,
  type GraphNode
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Edges/Badges/PathOffset' };
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
export const PathOffsetStory: Story = {
  name: 'PathOffset',
  render: () => createContainer({ id: 'graph-edges-badges-pathoffset' }),

  play: async ({ canvasElement }) => {
    const offsets = [-60, 0, 60];
    const nodes: GraphNode[] = offsets.flatMap((offset, i) => [
      {
        id: `src-${i}`,
        type: 'node',
        position: { x: -260, y: (i - 1) * 110 },
        style: {
          shape: { kind: 'circle', radius: 14 },
          bgFill: 0x60a5fa,
          labelText: `pathOffset: ${offset}`,
          labelColor: 0x0f172a,
          labelFontSize: 11,
          labelPlacement: 'left',
          labelOffsetX: -10
        }
      },
      {
        id: `tgt-${i}`,
        type: 'node',
        position: { x: 260, y: (i - 1) * 110 },
        style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x34d399 }
      },
    ]);

    const edges: GraphEdge[] = offsets.map((offset, i) => ({ type: 'edge',
      id: `e-${i}`,
      source: `src-${i}`,
      target: `tgt-${i}`,
      style: {
        badges: [
          {
            id: 'demo',
            type: 'node',
            placement: 'middle',
            pathOffset: offset,
            shape: { kind: 'rect', width: 60, height: 20, cornerRadius: 4 },
            fill: 0xdc2626,
            strokeColor: 0xffffff,
            strokeWidth: 1.5,
            labelText: `${offset > 0 ? '+' : ''}${offset}`,
            labelColor: 0xffffff,
            labelFontSize: 11
          },
        ]
      }
    }));

    // Fourth edge driven live by the GUI for a sweep demo.
    nodes.push(
      { type: 'node', id: 'live-src', position: { x: -260, y: 200 }, style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x60a5fa, labelText: 'live sweep', labelColor: 0x0f172a, labelFontSize: 11, labelPlacement: 'left', labelOffsetX: -10 } },
      { type: 'node', id: 'live-tgt', position: { x:  260, y: 200 }, style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x34d399 } },
    );
    const liveOffset = { value: 0 };
    edges.push({ type: 'edge',
      id: 'live',
      source: 'live-src',
      target: 'live-tgt',
      style: {
        badges: [
          {
            id: 'sweep',
            type: 'node',
            placement: 'middle',
            pathOffset: liveOffset.value,
            shape: { kind: 'circle', radius: 10 },
            fill: 0xfacc15,
            strokeColor: 0x0f172a,
            strokeWidth: 1.5
          },
        ]
      }
    });

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-edges-badges-pathoffset',
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
          edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 1.5, arrowTargetShape: 'none' } }
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true }
      }
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);

    const apply = (): void => {
      graph.store.updateEdge('live', {
        style: {
          badges: [
            {
              id: 'sweep',
              type: 'node',
              placement: 'middle',
              pathOffset: liveOffset.value,
              shape: { kind: 'circle', radius: 10 },
              fill: 0xfacc15,
              strokeColor: 0x0f172a,
              strokeWidth: 1.5
            },
          ]
        }
      });
    };

    const gui = new GUI({ title: 'pathOffset live sweep' });
    onStoryTeardown(() => gui.destroy());
    gui.add(liveOffset, 'value', -200, 200, 1).name('pathOffset (px)').onChange(apply);
  }
};
