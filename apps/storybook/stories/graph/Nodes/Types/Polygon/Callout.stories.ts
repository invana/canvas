import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphCanvas,
  GraphLayer,
  type CanonicalStateName,
  type GraphNode
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Types/Polygon/Callout' };
export default meta;
type Story = StoryObj;

/**
 * **Callout** polygon variant — speech-bubble silhouette with a tail
 * pointing down from the bottom edge. Shown across the resting `default`
 * plus the five canonical interaction states (`hovered`, `selected`,
 * `highlighted`, `dimmed`, `disabled`).
 */
export const Callout: Story = {
  render: () => createContainer({ id: 'graph-node-types-polygon-callout' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-types-polygon-callout')!;

    interface TileData {
      readonly state: 'default' | CanonicalStateName;
    }

    const nodes: GraphNode<TileData>[] = [
      { type: 'node', id: 'n-default',     position: { x: -240, y: -100 }, data: { state: 'default'     } },
      { type: 'node', id: 'n-hover',       position: { x:    0, y: -100 }, data: { state: 'hovered'     }, states: ['hovered']     },
      { type: 'node', id: 'n-selected',    position: { x:  240, y: -100 }, data: { state: 'selected'    }, states: ['selected']    },
      { type: 'node', id: 'n-highlighted', position: { x: -240, y:  100 }, data: { state: 'highlighted' }, states: ['highlighted'] },
      { type: 'node', id: 'n-dimmed',      position: { x:    0, y:  100 }, data: { state: 'dimmed'      }, states: ['dimmed']      },
      { type: 'node', id: 'n-disabled',    position: { x:  240, y:  100 }, data: { state: 'disabled'    }, states: ['disabled']    },
    ];

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // labelText resolver stays in the constructor; literal style goes to config.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges: [] },
        node: {
          style: {
            labelText: (n: GraphNode) => (n.data as TileData | undefined)?.state ?? ''
          }
        }
      }
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: {
                kind: 'polygon',
                vertices: [
                  { x: -55, y: -35 },
                  { x:  55, y: -35 },
                  { x:  55, y:  25 },
                  { x:  10, y:  25 },
                  { x:   0, y:  45 },
                  { x: -10, y:  25 },
                  { x: -55, y:  25 },
                ]
              },
              bgFill: 0x3b82f6,
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 0,
              bgStrokeAlignment: 'outside',
              labelColor: 0x0f172a,
              labelFontSize: 12,
              labelFontWeight: 600,
              labelPlacement: 'bottom',
              labelOffsetY: 22
            }
          }
        }
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);
  }
};
