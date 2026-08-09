import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphCanvas,
  GraphLayer,
  type CanonicalStateName,
  type GraphNode
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Types/Polygon/Trapezoid' };
export default meta;
type Story = StoryObj;

/**
 * **Trapezoid** polygon variant — isosceles trapezoid (narrow top, wide
 * bottom). Shown across the resting `default` plus the five canonical
 * interaction states (`hovered`, `selected`, `highlighted`, `dimmed`,
 * `disabled`).
 */
export const Trapezoid: Story = {
  render: () => createContainer({ id: 'graph-node-types-polygon-trapezoid' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-types-polygon-trapezoid')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    interface TileData {
      readonly state: 'default' | CanonicalStateName;
    }

    const nodes: GraphNode<TileData>[] = [
      { type: 'node', id: 'n-default',     position: { x: -240, y: -90 }, data: { state: 'default'     } },
      { type: 'node', id: 'n-hover',       position: { x:    0, y: -90 }, data: { state: 'hovered'     }, states: ['hovered']     },
      { type: 'node', id: 'n-selected',    position: { x:  240, y: -90 }, data: { state: 'selected'    }, states: ['selected']    },
      { type: 'node', id: 'n-highlighted', position: { x: -240, y:  90 }, data: { state: 'highlighted' }, states: ['highlighted'] },
      { type: 'node', id: 'n-dimmed',      position: { x:    0, y:  90 }, data: { state: 'dimmed'      }, states: ['dimmed']      },
      { type: 'node', id: 'n-disabled',    position: { x:  240, y:  90 }, data: { state: 'disabled'    }, states: ['disabled']    },
    ];

    // Resolver fields stay in the constructor; literal style rides on config.
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
                  { x: -55, y:  30 },
                  { x: -25, y: -30 },
                  { x:  25, y: -30 },
                  { x:  55, y:  30 },
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
              labelOffsetY: 16
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
