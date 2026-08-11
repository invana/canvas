import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type GraphNode } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Etc/Custom' };
export default meta;
type Story = StoryObj;

/**
 * Validates that brand-new state names register inline via per-node
 * `state` (the overlay catalogue) without any layer-level config. The name
 * in `states[]` just has to match a key in `state` — no `setNodeStateConfig`
 * call required.
 *
 * Two tiles use `'criticalAlert'`, one uses `'pinned'`. Both states are
 * defined per-node via the v3 shape; the canonical 8 states are
 * unaffected.
 */
export const Custom: Story = {
  render: () => createContainer({ id: 'graph-states-custom' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-states-custom',
    )!;

    const nodes: GraphNode[] = [
      { type: 'node',
        id: 'alert-1',
        position: { x: -180, y: 0 },
        style: {
          shape: { kind: 'rect', width: 120, height: 56, cornerRadius: 8 },
          bgFill: 0xffffff,
          bgStrokeColor: 0x4a90e2,
          bgStrokeWidth: 2,
          labelText: 'criticalAlert',
          labelColor: 0x2c3e50,
          labelPlacement: 'center',
          labelFontSize: 14,
          labelFontWeight: 700
        },
        state: {
          criticalAlert: {
            bgFill: 0xffaa00,
            bgStrokeColor: 0xff0000,
            bgStrokeWidth: 4,
            labelColor: 0xffffff
          }
        },
        states: ['criticalAlert']
      },
      { type: 'node',
        id: 'alert-2',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'rect', width: 120, height: 56, cornerRadius: 8 },
          bgFill: 0xffffff,
          bgStrokeColor: 0x4a90e2,
          bgStrokeWidth: 2,
          labelText: 'criticalAlert',
          labelColor: 0x2c3e50,
          labelPlacement: 'center',
          labelFontSize: 14,
          labelFontWeight: 700
        },
        state: {
          criticalAlert: {
            bgFill: 0xffaa00,
            bgStrokeColor: 0xff0000,
            bgStrokeWidth: 4,
            labelColor: 0xffffff
          }
        },
        states: ['criticalAlert']
      },
      { type: 'node',
        id: 'pinned',
        position: { x: 180, y: 0 },
        style: {
          shape: { kind: 'rect', width: 120, height: 56, cornerRadius: 8 },
          bgFill: 0xffffff,
          bgStrokeColor: 0x4a90e2,
          bgStrokeWidth: 2,
          labelText: 'pinned',
          labelColor: 0x2c3e50,
          labelPlacement: 'center',
          labelFontSize: 14,
          labelFontWeight: 700
        },
        state: {
          pinned: {
            bgFill: 0xfde68a,
            bgStrokeColor: 0xb45309,
            bgStrokeWidth: 3
          }
        },
        states: ['pinned']
      },
    ];

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges: [] } }
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    canvas.camera.fitContent(graph.getBounds(), 80);
  }
};
