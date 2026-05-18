import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphLayer,
  type CanonicalStateName,
  type GraphNode,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Types/RegularPolygon/Pentagon' };
export default meta;
type Story = StoryObj;

/**
 * **Pentagon** regular-polygon variant (`sides: 5`). With `rotation = 0`
 * the first vertex points straight up. Shown across the resting `default`
 * plus the five canonical interaction states (`hovered`, `selected`,
 * `highlighted`, `dimmed`, `disabled`).
 */
export const Pentagon: Story = {
  render: () => createContainer({ id: 'graph-node-types-regpoly-pentagon' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-types-regpoly-pentagon')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    interface TileData {
      readonly state: 'default' | CanonicalStateName;
    }

    const nodes: NodeData<TileData>[] = [
      { id: 'n-default',     position: { x: -200, y: -90 }, data: { state: 'default'     } },
      { id: 'n-hover',       position: { x:    0, y: -90 }, data: { state: 'hovered'     }, states: ['hovered']     },
      { id: 'n-selected',    position: { x:  200, y: -90 }, data: { state: 'selected'    }, states: ['selected']    },
      { id: 'n-highlighted', position: { x: -200, y:  90 }, data: { state: 'highlighted' }, states: ['highlighted'] },
      { id: 'n-dimmed',      position: { x:    0, y:  90 }, data: { state: 'dimmed'      }, states: ['dimmed']      },
      { id: 'n-disabled',    position: { x:  200, y:  90 }, data: { state: 'disabled'    }, states: ['disabled']    },
    ];

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'regular-polygon', sides: 5, radius: 50 },
            bgFill: 0x3b82f6,
            bgStrokeColor: 0xffffff,
            bgStrokeWidth: 0,
            bgStrokeAlignment: 'outside',
            labelText: (n: GraphNode) => (n.data as TileData | undefined)?.state ?? '',
            labelColor: 0x0f172a,
            labelFontSize: 12,
            labelFontWeight: 600,
            labelPlacement: 'bottom',
            labelOffsetY: 14,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
