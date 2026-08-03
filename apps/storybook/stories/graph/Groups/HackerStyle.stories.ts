import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  CollapseExpandBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Groups/HackerStyle' };
export default meta;
type Story = StoryObj;

/**
 * Terminal / cyber-deck aesthetic — dark canvas, transparent group
 * frames with neon strokes, glow-fill nodes, dashed neon edges. Shows
 * that the group machinery is style-agnostic: nothing in `GraphLayer`
 * cares about colour palettes; the only knobs are `style.shape` and
 * the flat paint fields.
 *
 * Also demonstrates the practical fix for the "edge hidden inside the
 * group's fill" problem from `GroupWithEdges`: leaving `bgFill` unset
 * keeps the frame interior transparent so connectors stay visible all
 * the way through (the renderer paints all connectors below all shapes;
 * a translucent group still occludes whatever the fill paints over).
 */
export const HackerStyleStory: Story = {
  name: 'HackerStyle',
  render: () => createContainer({ id: 'graph-hacker-style' }),

  play: async ({ canvasElement }) => {
    const NEON_GREEN = 0x39ff14;
    const NEON_CYAN = 0x22d3ee;
    const NEON_MAGENTA = 0xf472b6;
    const BG = 0x0a0e1a;

    const nodes: GraphNode[] = [
      { type: 'node',
        id: 'group-front',
        position: { x: 0, y: 0 },
        style: {
          // Small declared base — autoFit grows the frame around children when
          // expanded; the small size is reused on collapse so the super-node
          // reads as node-sized.
          shape: { kind: 'rect', width: 70, height: 50, cornerRadius: 4 },
          bgStrokeColor: NEON_GREEN,
          bgStrokeWidth: 1.5,
          bgStrokeDashArray: [4, 3],
          group: { autoFit: true, padding: 22 },
          labelText: 'frontend',
          labelColor: NEON_GREEN,
          labelFontSize: 11,
          labelFontFamily: 'ui-monospace, SFMono-Regular, monospace',
          labelFontWeight: 600,
          labelPlacement: 'inside-top-left',
        },
      },
      { type: 'node',
        id: 'web', parentId: 'group-front', position: { x: -40, y: -30 },
        style: { shape: { kind: 'circle', radius: 14 }, bgFill: NEON_GREEN, bgAlpha: 0.95, labelText: 'web', labelColor: NEON_GREEN, labelFontFamily: 'ui-monospace, monospace', labelFontSize: 11, labelPlacement: 'bottom', labelOffsetY: 6 },
      },
      { type: 'node',
        id: 'cdn', parentId: 'group-front', position: { x: 60, y: -30 },
        style: { shape: { kind: 'circle', radius: 14 }, bgFill: NEON_GREEN, bgAlpha: 0.95, labelText: 'cdn', labelColor: NEON_GREEN, labelFontFamily: 'ui-monospace, monospace', labelFontSize: 11, labelPlacement: 'bottom', labelOffsetY: 6 },
      },
      { type: 'node',
        id: 'group-svc',
        position: { x: 360, y: 0 },
        style: {
          // Small declared base — autoFit grows the frame around children when
          // expanded; the small size is reused on collapse so the super-node
          // reads as node-sized.
          shape: { kind: 'rect', width: 70, height: 50, cornerRadius: 4 },
          bgStrokeColor: NEON_CYAN,
          bgStrokeWidth: 1.5,
          bgStrokeDashArray: [4, 3],
          group: { autoFit: true, padding: 22 },
          labelText: 'services',
          labelColor: NEON_CYAN,
          labelFontSize: 11,
          labelFontFamily: 'ui-monospace, SFMono-Regular, monospace',
          labelFontWeight: 600,
          labelPlacement: 'inside-top-left',
        },
      },
      { type: 'node',
        id: 'api', parentId: 'group-svc', position: { x: 310, y: -30 },
        style: { shape: { kind: 'circle', radius: 14 }, bgFill: NEON_CYAN, bgAlpha: 0.95, labelText: 'api', labelColor: NEON_CYAN, labelFontFamily: 'ui-monospace, monospace', labelFontSize: 11, labelPlacement: 'bottom', labelOffsetY: 6 },
      },
      { type: 'node',
        id: 'auth', parentId: 'group-svc', position: { x: 410, y: -30 },
        style: { shape: { kind: 'circle', radius: 14 }, bgFill: NEON_CYAN, bgAlpha: 0.95, labelText: 'auth', labelColor: NEON_CYAN, labelFontFamily: 'ui-monospace, monospace', labelFontSize: 11, labelPlacement: 'bottom', labelOffsetY: 6 },
      },
      { type: 'node',
        id: 'group-data',
        position: { x: 720, y: 0 },
        style: {
          // Small declared base — autoFit grows the frame around children when
          // expanded; the small size is reused on collapse so the super-node
          // reads as node-sized.
          shape: { kind: 'rect', width: 70, height: 50, cornerRadius: 4 },
          bgStrokeColor: NEON_MAGENTA,
          bgStrokeWidth: 1.5,
          bgStrokeDashArray: [4, 3],
          group: { autoFit: true, padding: 22 },
          labelText: 'data',
          labelColor: NEON_MAGENTA,
          labelFontSize: 11,
          labelFontFamily: 'ui-monospace, SFMono-Regular, monospace',
          labelFontWeight: 600,
          labelPlacement: 'inside-top-left',
        },
      },
      { type: 'node',
        id: 'pg', parentId: 'group-data', position: { x: 680, y: -30 },
        style: { shape: { kind: 'circle', radius: 14 }, bgFill: NEON_MAGENTA, bgAlpha: 0.95, labelText: 'pg', labelColor: NEON_MAGENTA, labelFontFamily: 'ui-monospace, monospace', labelFontSize: 11, labelPlacement: 'bottom', labelOffsetY: 6 },
      },
      { type: 'node',
        id: 'redis', parentId: 'group-data', position: { x: 770, y: -30 },
        style: { shape: { kind: 'circle', radius: 14 }, bgFill: NEON_MAGENTA, bgAlpha: 0.95, labelText: 'redis', labelColor: NEON_MAGENTA, labelFontFamily: 'ui-monospace, monospace', labelFontSize: 11, labelPlacement: 'bottom', labelOffsetY: 6 },
      },
    ];

    const edges: GraphEdge[] = [
      { type: 'edge', id: 'web-api', source: 'web', target: 'api', style: { strokeColor: NEON_GREEN, strokeAlpha: 0.7, strokeWidth: 1.5, strokeDashArray: [3, 3], arrowTargetShape: 'none' } },
      { type: 'edge', id: 'cdn-api', source: 'cdn', target: 'api', style: { strokeColor: NEON_GREEN, strokeAlpha: 0.5, strokeWidth: 1, strokeDashArray: [3, 3], arrowTargetShape: 'none' } },
      { type: 'edge', id: 'api-pg', source: 'api', target: 'pg', style: { strokeColor: NEON_CYAN, strokeAlpha: 0.7, strokeWidth: 1.5, strokeDashArray: [3, 3], arrowTargetShape: 'none' } },
      { type: 'edge', id: 'auth-redis', source: 'auth', target: 'redis', style: { strokeColor: NEON_CYAN, strokeAlpha: 0.7, strokeWidth: 1.5, strokeDashArray: [3, 3], arrowTargetShape: 'none' } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-hacker-style')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Dark canvas — the whole aesthetic depends on this. BackgroundLayer
    // is screen-fixed (it inherits ScreenLayer) so it stays put while the
    // camera pans / zooms over the graph above it.
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));

    // Data is content — it rides on the layer via `initData`.
    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag', targetLayerId: 'graph' }));
    canvas.behaviours.register(
      new CollapseExpandBehaviour({ id: 'collapse-expand', targetLayerId: 'graph' }),
    );

    const canvasOptions = {
      layers: {
        bg: { type: 'pattern', patternType: 'dots', backgroundColor: BG, color: 0x1f2937, spacing: 24, size: 1, alpha: 1 },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        drag: { enabled: true },
        'collapse-expand': { enabled: true },
      },
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });

    canvas.camera.fitContent(graph.getBounds(), 120);
  },
};
