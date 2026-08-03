import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphCanvas,
  GraphLayer,
  type CanonicalStateName,
  type GraphNode,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Types/Arc/FullAnnulus' };
export default meta;
type Story = StoryObj;

/**
 * **Full annulus** arc variant — sweep ≥ 2π with `innerR > 0` produces a
 * complete ring. Shown across the resting `default` plus the five
 * canonical interaction states (`hovered`, `selected`, `highlighted`,
 * `dimmed`, `disabled`) auto-merged into every layer's state catalogue.
 *
 * State is supplied data-driven via each node's `states` field.
 */
export const FullAnnulusStory: Story = {
  name: 'FullAnnulus',
  render: () => createContainer({ id: 'graph-node-types-arc-full-annulus' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-types-arc-full-annulus')!;

    interface TileData {
      readonly state: 'default' | CanonicalStateName;
    }

    const TAU = Math.PI * 2;

    // 3×2 grid. Cell pitch 200 × 180. Origin at (0, 0).
    const nodes: GraphNode<TileData>[] = [
      { type: 'node', id: 'n-default',     position: { x: -200, y: -90 }, data: { state: 'default'     } },
      { type: 'node', id: 'n-hover',       position: { x:    0, y: -90 }, data: { state: 'hovered'     }, states: ['hovered']     },
      { type: 'node', id: 'n-selected',    position: { x:  200, y: -90 }, data: { state: 'selected'    }, states: ['selected']    },
      { type: 'node', id: 'n-highlighted', position: { x: -200, y:  90 }, data: { state: 'highlighted' }, states: ['highlighted'] },
      { type: 'node', id: 'n-dimmed',      position: { x:    0, y:  90 }, data: { state: 'dimmed'      }, states: ['dimmed']      },
      { type: 'node', id: 'n-disabled',    position: { x:  200, y:  90 }, data: { state: 'disabled'    }, states: ['disabled']    },
    ];

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Resolver fields (labelText) stay in the constructor; the literal style
    // fields move into canvasOptions.layers.graph.node.style.
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
              shape: {
                kind: 'arc',
                innerR: 35,
                outerR: 60,
                startAngle: 0,
                endAngle: TAU,
              },
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
