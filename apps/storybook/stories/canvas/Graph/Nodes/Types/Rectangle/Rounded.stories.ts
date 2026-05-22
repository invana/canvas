import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphLayer,
  type CanonicalStateName,
  type GraphNode,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Nodes/Types/Rectangle/Rounded' };
export default meta;
type Story = StoryObj;

/**
 * **Rounded** rect variant (`cornerRadius: 24`). Generous radius
 * approaching pill territory but still distinctly rectangular. Shown
 * across the resting `default` plus the five canonical interaction states
 * (`hovered`, `selected`, `highlighted`, `dimmed`, `disabled`).
 */
export const Rounded: Story = {
  render: () => createContainer({ id: 'graph-node-types-rrect-rounded' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-types-rrect-rounded')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    interface TileData {
      readonly state: 'default' | CanonicalStateName;
    }

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
            shape: { kind: 'rect', width: 140, height: 64, cornerRadius: 24 },
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
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
