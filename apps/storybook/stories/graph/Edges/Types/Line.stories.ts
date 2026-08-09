import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type GraphEdge,
  type GraphNode
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Edges/Types/Line' };
export default meta;
type Story = StoryObj;

/**
 * `pathType: 'straight'` — the baseline line. A hub-and-spoke layout with
 * five spokes, one per canonical edge state (`default`, `selected`,
 * `highlighted`, `dimmed`, `disabled`), so the colour-coded states from
 * `DEFAULT_EDGE_STATE_CONFIGS` (auto-registered on `GraphLayer`) read at a
 * glance alongside the path shape.
 *
 * Drag any spoke node to confirm the line re-routes live — `straight` is
 * the simplest router (`[source, target]`) and `normal` is the simplest
 * pathStyle (`M, L`).
 */
export const Line: Story = {
  render: () => createContainer({ id: 'graph-edge-types-line' }),

  play: async ({ canvasElement }) => {
    // Hub at origin, five spokes at angles -90°, -18°, 54°, 126°, 198°
    // (72° apart, starting straight up), radius 180. Positions hardcoded
    // per the storybook data convention — no helper math at module scope.
    const nodes: GraphNode[] = [
      { type: 'node', id: 'hub',         position: { x:    0, y:    0 } },
      { type: 'node', id: 'default',     position: { x:    0, y: -180 } },
      { type: 'node', id: 'selected',    position: { x:  171, y:  -56 } },
      { type: 'node', id: 'highlighted', position: { x:  106, y:  146 } },
      { type: 'node', id: 'dimmed',      position: { x: -106, y:  146 } },
      { type: 'node', id: 'disabled',    position: { x: -171, y:  -56 } },
    ];

    const edges: GraphEdge[] = [
      { type: 'edge', id: 'line-default',     source: 'hub', target: 'default',
        style: { shape: { pathType: 'straight' }, labelText: 'line-default' } },
      { type: 'edge', id: 'line-selected',    source: 'hub', target: 'selected',
        style: { shape: { pathType: 'straight' }, labelText: 'line-selected' },
        states: ['selected'] },
      { type: 'edge', id: 'line-highlighted', source: 'hub', target: 'highlighted',
        style: { shape: { pathType: 'straight' }, labelText: 'line-highlighted' },
        states: ['highlighted'] },
      { type: 'edge', id: 'line-dimmed',      source: 'hub', target: 'dimmed',
        style: { shape: { pathType: 'straight' }, labelText: 'line-dimmed' },
        states: ['dimmed'] },
      { type: 'edge', id: 'line-disabled',    source: 'hub', target: 'disabled',
        style: { shape: { pathType: 'straight' }, labelText: 'line-disabled' },
        states: ['disabled'] },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-types-line')!;
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
          node: {
            style: {
              shape: { kind: 'circle', radius: 14 },
              bgFill: 0x4f9cf9,
              bgStrokeColor: 0x1d4ed8,
              bgStrokeWidth: 1.5
            }
          },
          edge: {
            style: {
              strokeColor: 0x94a3b8,
              strokeWidth: 1.5,
              arrowTargetShape: 'triangle',
              labelFontSize: 10,
              labelFontWeight: 500,
              labelColor: 0x334155,
              labelPlacement: 'center',
              labelAutoRotate: true,
              labelKeepUpright: true,
              labelBackgroundFill: 0xffffff,
              labelBackgroundStrokeColor: 0xe2e8f0,
              labelBackgroundStrokeWidth: 1,
              labelBackgroundCornerRadius: 3,
              labelBackgroundPadding: 3
            }
          }
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
  }
};
