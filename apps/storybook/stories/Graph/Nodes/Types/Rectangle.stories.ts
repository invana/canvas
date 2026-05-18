import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphLayer,
  type CanonicalStateName,
  type GraphNode,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Types/Rectangle' };
export default meta;
type Story = StoryObj;

/**
 * Catalogue story for the **rectangle** node shape (`shape.kind: 'rect'`).
 *
 * Draws a 3×2 grid of rect nodes — one cell per standard appearance:
 * the resting `default` plus the five canonical interaction states
 * (`hovered`, `selected`, `highlighted`, `dimmed`, `disabled`) auto-merged
 * into every layer's state catalogue. State is supplied data-driven via
 * the `states` field on each `NodeData`.
 */
export const Rectangle: Story = {
  render: () => createContainer({ id: 'graph-node-types-rectangle' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-types-rectangle')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    interface TileData {
      readonly state: 'default' | CanonicalStateName;
    }

    // 3×2 grid. Cell pitch 240 × 180. Origin at (0, 0).
    const nodes: NodeData<TileData>[] = [
      { id: 'n-default',     position: { x: -240, y: -90 }, data: { state: 'default'     } },
      { id: 'n-hover',       position: { x:    0, y: -90 }, data: { state: 'hovered'     }, states: ['hovered']     },
      { id: 'n-selected',    position: { x:  240, y: -90 }, data: { state: 'selected'    }, states: ['selected']    },
      { id: 'n-highlighted', position: { x: -240, y:  90 }, data: { state: 'highlighted' }, states: ['highlighted'] },
      { id: 'n-dimmed',      position: { x:    0, y:  90 }, data: { state: 'dimmed'      }, states: ['dimmed']      },
      { id: 'n-disabled',    position: { x:  240, y:  90 }, data: { state: 'disabled'    }, states: ['disabled']    },
    ];

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'rect', width: 140, height: 64, cornerRadius: 10 },
            bgFill: 0x3b82f6,
            bgStrokeColor: 0xffffff,
            bgStrokeWidth: 0,
            bgStrokeAlignment: 'outside',
            labelText: (n: GraphNode) => (n.data as TileData | undefined)?.state ?? '',
            labelColor: 0xffffff,
            labelFontSize: 13,
            labelFontWeight: 600,
            labelPlacement: 'center',
          },

        }
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
