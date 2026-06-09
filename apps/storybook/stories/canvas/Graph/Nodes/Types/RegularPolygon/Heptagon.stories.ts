import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphCanvas,
  GraphLayer,
  type CanonicalStateName,
  type GraphNode,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Nodes/Types/RegularPolygon/Heptagon' };
export default meta;
type Story = StoryObj;

/**
 * **Heptagon** regular-polygon variant (`sides: 7`). With `rotation = 0`
 * the first vertex points straight up. Shown across the resting `default`
 * plus the five canonical interaction states (`hovered`, `selected`,
 * `highlighted`, `dimmed`, `disabled`).
 */
export const Heptagon: Story = {
  render: () => createContainer({ id: 'graph-node-types-regpoly-heptagon' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-types-regpoly-heptagon')!;

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

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // The label text is a resolver, so it stays in the constructor; every
    // other node style field is a literal and moves into canvasOptions.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges: [] },
        node: {
          style: {
            labelText: (n: GraphNode) => (n.data as TileData | undefined)?.state ?? '',
          },
        },
      },
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: { kind: 'regular-polygon', sides: 7, radius: 50 },
              bgFill: 0x3b82f6,
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 0,
              bgStrokeAlignment: 'outside',
              labelColor: 0x0f172a,
              labelFontSize: 12,
              labelFontWeight: 600,
              labelPlacement: 'bottom',
              labelOffsetY: 14,
            },
          },
        },
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
