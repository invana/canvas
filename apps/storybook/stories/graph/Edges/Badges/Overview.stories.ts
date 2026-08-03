import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type EdgeBadgePlacement,
  type GraphEdge,
  type GraphNode,

  type EdgeStyle,} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Edges/Badges/Overview' };
export default meta;
type Story = StoryObj;

/**
 * Graph-level edge badges (`EdgeStyle.badges`). A badge is rendered as a
 * full-fidelity shape anchored along the routed path. Placement is
 * parametric — `'start' | 'middle' | 'end' | number` (arc-length `t`) — and
 * re-anchors automatically when source / target moves or the path is
 * re-routed.
 *
 * Five rows demonstrating the surface, top to bottom:
 *
 * 1. **Plain chip** — yellow circle at the midpoint (default).
 * 2. **Count chip** — rounded-rect with `labelText` ("12") at the midpoint.
 * 3. **Icon at end** — circular plate with a glyph inset, anchored at
 *    `'end'`. The named `'end'` placement auto-clears the endpoint
 *    silhouette so the badge sits beside the target node, not on it.
 * 4. **Glow on path** — circular plate carrying a `glow` decoration.
 * 5. **Auto-rotating arrow tag** — rect with `autoRotate: true` so it
 *    aligns with the path tangent at `t = 0.5`.
 *
 * Drag the right-hand node of any row to confirm badges re-anchor as the
 * path re-routes.
 */
export const Overview: Story = {
  render: () => createContainer({ id: 'graph-edges-badges' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      // Row 0 — plain chip
      { type: 'node', id: 'r0-src', position: { x: -240, y: -240 }, style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x60a5fa, labelText: 'plain', labelPlacement: 'left', labelOffsetX: -10 } },
      { type: 'node', id: 'r0-tgt', position: { x:  240, y: -240 }, style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x34d399 } },
      // Row 1 — count chip
      { type: 'node', id: 'r1-src', position: { x: -240, y: -120 }, style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x60a5fa, labelText: 'count', labelPlacement: 'left', labelOffsetX: -10 } },
      { type: 'node', id: 'r1-tgt', position: { x:  240, y: -120 }, style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x34d399 } },
      // Row 2 — icon at end
      { type: 'node', id: 'r2-src', position: { x: -240, y:    0 }, style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x60a5fa, labelText: 'icon @ end', labelPlacement: 'left', labelOffsetX: -10 } },
      { type: 'node', id: 'r2-tgt', position: { x:  240, y:    0 }, style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x34d399 } },
      // Row 3 — glow
      { type: 'node', id: 'r3-src', position: { x: -240, y:  120 }, style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x60a5fa, labelText: 'glow', labelPlacement: 'left', labelOffsetX: -10 } },
      { type: 'node', id: 'r3-tgt', position: { x:  240, y:  120 }, style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x34d399 } },
      // Row 4 — auto-rotating arrow tag (use a curve so rotation is visible)
      { type: 'node', id: 'r4-src', position: { x: -240, y:  240 }, style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x60a5fa, labelText: 'autoRotate', labelPlacement: 'left', labelOffsetX: -10 } },
      { type: 'node', id: 'r4-tgt', position: { x:  240, y:  240 }, style: { shape: { kind: 'circle', radius: 14 }, bgFill: 0x34d399 } },
    ];

    const edges: GraphEdge[] = [
      { type: 'edge',
        id: 'r0',
        source: 'r0-src',
        target: 'r0-tgt',
        style: {
          badges: [
            {
              id: 'plain',
              type: 'node',
              placement: 'middle',
              shape: { kind: 'circle', radius: 9 },
              fill: 0xf59e0b,
              strokeColor: 0xffffff,
              strokeWidth: 2,
            },
          ],
        },
      },
      { type: 'edge',
        id: 'r1',
        source: 'r1-src',
        target: 'r1-tgt',
        style: {
          badges: [
            {
              id: 'count',
              type: 'node',
              placement: 'middle',
              shape: { kind: 'rect', width: 28, height: 20, cornerRadius: 10 },
              fill: 0xdc2626,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
              labelText: '12',
              labelColor: 0xffffff,
              labelFontSize: 12,
            },
          ],
        },
      },
      { type: 'edge',
        id: 'r2',
        source: 'r2-src',
        target: 'r2-tgt',
        style: {
          badges: [
            {
              id: 'verified',
              type: 'node',
              placement: 'end',
              shape: { kind: 'circle', radius: 11 },
              fill: 0x1d4ed8,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
              icon: {
                kind: 'glyph',
                char: '✓',
                fontFamily: 'sans-serif',
                fontWeight: 700,
                color: 0xffffff,
                sizeRatio: 0.7,
              },
            },
          ],
        },
      },
      { type: 'edge',
        id: 'r3',
        source: 'r3-src',
        target: 'r3-tgt',
        style: {
          badges: [
            {
              id: 'hot',
              type: 'node',
              placement: 'middle',
              shape: { kind: 'circle', radius: 8 },
              fill: 0xf97316,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
              decorations: [
                {
                  kind: 'glow',
                  color: 0xf97316,
                  strokeWidth: 12,
                  layers: 6,
                  innerAlpha: 0.6,
                },
              ],
            },
          ],
        },
      },
      { type: 'edge',
        id: 'r4',
        source: 'r4-src',
        target: 'r4-tgt',
        style: {
          shape: { pathType: 'bezier' },
          badges: [
            {
              id: 'tag',
              type: 'node',
              placement: 'middle',
              shape: { kind: 'rect', width: 60, height: 18, cornerRadius: 4 },
              fill: 0x7c3aed,
              strokeColor: 0xffffff,
              strokeWidth: 1,
              labelText: 'flow',
              labelColor: 0xffffff,
              labelFontSize: 11,
              autoRotate: true,
              keepUpright: true,
            },
          ],
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edges-badges')!;
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
              labelColor: 0x0f172a,
              labelFontSize: 12,
              labelFontWeight: 500,
              labelAlign: 'right',
            },
          },
          edge: {
            style: {
              strokeColor: 0x94a3b8,
              strokeWidth: 1.5,
              arrowTargetShape: 'triangle',
            },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
      },
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);

    const placements: EdgeBadgePlacement[] = ['start', 'middle', 'end', 0.25, 0.75];

    const settings = {
      placement: 'middle' as EdgeBadgePlacement,
    };

    const apply = (): void => {
      // Re-emit each edge's badges with the live placement choice. The
      // projection runs every time the edge spec is replaced, so a partial
      // spread of the badge keeps every other field intact. Row 2 (`icon
      // at end`) deliberately ignores the GUI placement — it's the one
      // story that wants a non-midpoint anchor as part of the demo.
      for (const edge of edges) {
        if (edge.id === 'r2') continue;
        const badge = (edge.style as EdgeStyle).badges![0]!;
        graph.store.updateEdge(edge.id, {
          style: {
            ...edge.style!,
            badges: [{ ...badge, placement: settings.placement }],
          },
        });
      }
    };

    const gui = new GUI({ title: 'Edge Badges' });
    onStoryTeardown(() => gui.destroy());
    gui
      .add(settings, 'placement', placements as unknown as string[])
      .name('placement (rows 0, 1, 3, 4)')
      .onChange(apply);
    gui.add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit').name('Fit to content');
  },
};
