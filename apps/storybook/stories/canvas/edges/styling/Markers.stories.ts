import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin, type IEdgeData, type INodeData } from '@invana/plugins-graph-data';
import { type ArrowSpec, type DrawContext, type Point } from '@invana/plugins-shapes';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Edges/Styling/Markers' };
export default meta;
type Story = StoryObj;

// ── Custom marker: 5-point star burst ─────────────────────────────────────────
// Uses only DrawContext.fillStar — no raw PixiJS imports needed.

function drawStar5Marker(
  ctx: DrawContext,
  tip: Point,
  angle: number,
  spec: ArrowSpec,
): void {
  const size = spec.size ?? 14;
  const color = spec.color ?? '#ffffff';
  const offset = size * 0.55;
  // Place star centre slightly behind the tip so the point touches `tip`
  const cx = tip.x - Math.cos(angle) * offset;
  const cy = tip.y - Math.sin(angle) * offset;
  ctx.fillStar(cx, cy, size * 0.8, {
    fill: color,
    stroke: '#ffffff',
    strokeWidth: 1,
    points: 5,
    innerRatio: 0.42,
    rotation: angle - Math.PI / 2,
  });
}


// ── Story ─────────────────────────────────────────────────────────────────────

export const Markers: Story = {
  name: 'Markers',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;


    // ── Graph data ────────────────────────────────────────────────────────────────

    const nodes: INodeData[] = [
      { id: 'triangle-l', x: -129, y: -390, shape: 'circle', size: 28 },
      { id: 'triangle-r', x: 129, y: -390, shape: 'circle', size: 28 },
      { id: 'triangle-outline-l', x: -129, y: -338, shape: 'circle', size: 28 },
      { id: 'triangle-outline-r', x: 129, y: -338, shape: 'circle', size: 28 },
      { id: 'diamond-l', x: -129, y: -286, shape: 'circle', size: 28 },
      { id: 'diamond-r', x: 129, y: -286, shape: 'circle', size: 28 },
      { id: 'diamond-outline-l', x: -129, y: -234, shape: 'circle', size: 28 },
      { id: 'diamond-outline-r', x: 129, y: -234, shape: 'circle', size: 28 },
      { id: 'circle-l', x: -129, y: -182, shape: 'circle', size: 28 },
      { id: 'circle-r', x: 129, y: -182, shape: 'circle', size: 28 },
      { id: 'circle-outline-l', x: -129, y: -130, shape: 'circle', size: 28 },
      { id: 'circle-outline-r', x: 129, y: -130, shape: 'circle', size: 28 },
      { id: 'circle-plus-l', x: -129, y: -78, shape: 'circle', size: 28 },
      { id: 'circle-plus-r', x: 129, y: -78, shape: 'circle', size: 28 },
      { id: 'square-l', x: -129, y: -26, shape: 'circle', size: 28 },
      { id: 'square-r', x: 129, y: -26, shape: 'circle', size: 28 },
      { id: 'square-outline-l', x: -129, y: 26, shape: 'circle', size: 28 },
      { id: 'square-outline-r', x: 129, y: 26, shape: 'circle', size: 28 },
      { id: 'block-l', x: -129, y: 78, shape: 'circle', size: 28 },
      { id: 'block-r', x: 129, y: 78, shape: 'circle', size: 28 },
      { id: 'classic-l', x: -129, y: 130, shape: 'circle', size: 28 },
      { id: 'classic-r', x: 129, y: 130, shape: 'circle', size: 28 },
      { id: 'ellipse-l', x: -129, y: 182, shape: 'circle', size: 28 },
      { id: 'ellipse-r', x: 129, y: 182, shape: 'circle', size: 28 },
      { id: 'cross-l', x: -129, y: 234, shape: 'circle', size: 28 },
      { id: 'cross-r', x: 129, y: 234, shape: 'circle', size: 28 },
      { id: 'async-l', x: -129, y: 286, shape: 'circle', size: 28 },
      { id: 'async-r', x: 129, y: 286, shape: 'circle', size: 28 },
      { id: 'none-l', x: -129, y: 338, shape: 'circle', size: 28 },
      { id: 'none-r', x: 129, y: 338, shape: 'circle', size: 28 },
      { id: 'star5-l', x: -129, y: 390, shape: 'circle', size: 28 },
      { id: 'star5-r', x: 129, y: 390, shape: 'circle', size: 28 },
    ];

    const edges: IEdgeData[] = [
      {
        id: 'triangle-conn', source: 'triangle-l', target: 'triangle-r',
        pathType: 'straight', label: 'triangle',
        startMarker: { type: 'triangle', size: 14, color: '#4fc3f7' } as ArrowSpec,
        endMarker: { type: 'triangle', size: 14, color: '#4fc3f7' } as ArrowSpec,
        style: { stroke: '#4fc3f7', strokeWidth: 1.8 },
      },
      {
        id: 'triangle-outline-conn', source: 'triangle-outline-l', target: 'triangle-outline-r',
        pathType: 'straight', label: 'triangle-outline',
        startMarker: { type: 'triangle-outline', size: 14, color: '#38bdf8' } as ArrowSpec,
        endMarker: { type: 'triangle-outline', size: 14, color: '#38bdf8' } as ArrowSpec,
        style: { stroke: '#38bdf8', strokeWidth: 1.8 },
      },
      {
        id: 'diamond-conn', source: 'diamond-l', target: 'diamond-r',
        pathType: 'straight', label: 'diamond',
        startMarker: { type: 'diamond', size: 14, color: '#81c784' } as ArrowSpec,
        endMarker: { type: 'diamond', size: 14, color: '#81c784' } as ArrowSpec,
        style: { stroke: '#81c784', strokeWidth: 1.8 },
      },
      {
        id: 'diamond-outline-conn', source: 'diamond-outline-l', target: 'diamond-outline-r',
        pathType: 'straight', label: 'diamond-outline',
        startMarker: { type: 'diamond-outline', size: 14, color: '#4ade80' } as ArrowSpec,
        endMarker: { type: 'diamond-outline', size: 14, color: '#4ade80' } as ArrowSpec,
        style: { stroke: '#4ade80', strokeWidth: 1.8 },
      },
      {
        id: 'circle-conn', source: 'circle-l', target: 'circle-r',
        pathType: 'straight', label: 'circle',
        startMarker: { type: 'circle', size: 14, color: '#ffb74d' } as ArrowSpec,
        endMarker: { type: 'circle', size: 14, color: '#ffb74d' } as ArrowSpec,
        style: { stroke: '#ffb74d', strokeWidth: 1.8 },
      },
      {
        id: 'circle-outline-conn', source: 'circle-outline-l', target: 'circle-outline-r',
        pathType: 'straight', label: 'circle-outline',
        startMarker: { type: 'circle-outline', size: 14, color: '#fb923c' } as ArrowSpec,
        endMarker: { type: 'circle-outline', size: 14, color: '#fb923c' } as ArrowSpec,
        style: { stroke: '#fb923c', strokeWidth: 1.8 },
      },
      {
        id: 'circle-plus-conn', source: 'circle-plus-l', target: 'circle-plus-r',
        pathType: 'straight', label: 'circle-plus',
        startMarker: { type: 'circle-plus', size: 14, color: '#f59e0b' } as ArrowSpec,
        endMarker: { type: 'circle-plus', size: 14, color: '#f59e0b' } as ArrowSpec,
        style: { stroke: '#f59e0b', strokeWidth: 1.8 },
      },
      {
        id: 'square-conn', source: 'square-l', target: 'square-r',
        pathType: 'straight', label: 'square',
        startMarker: { type: 'square', size: 14, color: '#f06292' } as ArrowSpec,
        endMarker: { type: 'square', size: 14, color: '#f06292' } as ArrowSpec,
        style: { stroke: '#f06292', strokeWidth: 1.8 },
      },
      {
        id: 'square-outline-conn', source: 'square-outline-l', target: 'square-outline-r',
        pathType: 'straight', label: 'square-outline',
        startMarker: { type: 'square-outline', size: 14, color: '#f472b6' } as ArrowSpec,
        endMarker: { type: 'square-outline', size: 14, color: '#f472b6' } as ArrowSpec,
        style: { stroke: '#f472b6', strokeWidth: 1.8 },
      },
      {
        id: 'block-conn', source: 'block-l', target: 'block-r',
        pathType: 'straight', label: 'block',
        startMarker: { type: 'block', size: 14, color: '#ce93d8' } as ArrowSpec,
        endMarker: { type: 'block', size: 14, color: '#ce93d8' } as ArrowSpec,
        style: { stroke: '#ce93d8', strokeWidth: 1.8 },
      },
      {
        id: 'classic-conn', source: 'classic-l', target: 'classic-r',
        pathType: 'straight', label: 'classic',
        startMarker: { type: 'classic', size: 14, color: '#c084fc' } as ArrowSpec,
        endMarker: { type: 'classic', size: 14, color: '#c084fc' } as ArrowSpec,
        style: { stroke: '#c084fc', strokeWidth: 1.8 },
      },
      {
        id: 'ellipse-conn', source: 'ellipse-l', target: 'ellipse-r',
        pathType: 'straight', label: 'ellipse',
        startMarker: { type: 'ellipse', size: 14, color: '#4dd0e1' } as ArrowSpec,
        endMarker: { type: 'ellipse', size: 14, color: '#4dd0e1' } as ArrowSpec,
        style: { stroke: '#4dd0e1', strokeWidth: 1.8 },
      },
      {
        id: 'cross-conn', source: 'cross-l', target: 'cross-r',
        pathType: 'straight', label: 'cross',
        startMarker: { type: 'cross', size: 14, color: '#a5f3fc' } as ArrowSpec,
        endMarker: { type: 'cross', size: 14, color: '#a5f3fc' } as ArrowSpec,
        style: { stroke: '#a5f3fc', strokeWidth: 1.8 },
      },
      {
        id: 'async-conn', source: 'async-l', target: 'async-r',
        pathType: 'straight', label: 'async',
        startMarker: { type: 'async', size: 14, color: '#67e8f9' } as ArrowSpec,
        endMarker: { type: 'async', size: 14, color: '#67e8f9' } as ArrowSpec,
        style: { stroke: '#67e8f9', strokeWidth: 1.8 },
      },
      {
        id: 'none-conn', source: 'none-l', target: 'none-r',
        pathType: 'straight', label: "'none' — no marker",
        startMarker: { type: 'none', size: 14, color: '#64748b' } as ArrowSpec,
        endMarker: { type: 'none', size: 14, color: '#64748b' } as ArrowSpec,
        style: { stroke: '#64748b', strokeWidth: 1.8 },
      },
      {
        id: 'star5-conn', source: 'star5-l', target: 'star5-r',
        pathType: 'straight', label: 'custom: star5',
        startMarker: { type: 'star5', size: 14, color: '#fbbf24' } as ArrowSpec,
        endMarker: { type: 'star5', size: 14, color: '#fbbf24' } as ArrowSpec,
        style: { stroke: '#fbbf24', strokeWidth: 1.8 },
      },
    ];

    const canvas = new Canvas({
      container,
      backgroundColor: '#0f172a',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern',
            patternType: 'dots',
            color: '#1e293b',
            backgroundColor: '#0f172a',
            size: 1.2,
            spacing: 28,
          },
        },
        {
          plugin: 'graph-data',
          key: 'graph',
          options: {
            fitOnRender: true,
            fitPadding: 60,
            data: { nodes, edges },
            styles: {
              node: { fill: '#0f172a', stroke: '#334155', strokeWidth: 1 },
            },
          },
        },
      ],
    });
    await canvas.init();

    const graph = canvas.plugins.get<GraphDataPlugin>('graph')!;

    // Register the custom star5 marker before any connectors render
    graph.registerMarker('star5', drawStar5Marker);

    // ── lil-gui ────────────────────────────────────────────────────────────
    const params = { markerSize: 14 };
    const gui = new GUI({ title: 'Marker options', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    gui.add(params, 'markerSize', 6, 28, 1)
      .name('size')
      .onChange((size: number) => {
        edges.forEach(e => {
          const sm = e.startMarker as ArrowSpec;
          graph.updateEdge(e.id, {
            startMarker: { ...sm, size } as ArrowSpec,
            endMarker: { ...sm, size } as ArrowSpec,
          });
        });
      });
  },
};
/**
 * GraphPlugin - Markers
 *
 * Demonstrates all 14 built-in arrowhead marker types available for
 * connector endpoints via `endMarker` / `startMarker`, plus:
 *   - `type: 'none'`  — explicitly suppress a marker
 *   - custom 'star5'  — registered via `graph.registerMarker()`
 *
 * Every row shows one marker type on BOTH ends of a short straight connector
 * so you can compare the source (flipped) and target orientations side by side.
 *
 * A lil-gui panel lets you adjust the marker size live across all connectors.
 *
 * Built-in marker types:
 *   triangle         filled triangle (default)
 *   triangle-outline outlined triangle
 *   diamond          filled diamond
 *   diamond-outline  outlined diamond
 *   circle           filled circle
 *   circle-outline   outlined circle
 *   circle-plus      circle with a plus sign inside
 *   square           filled square
 *   square-outline   outlined square
 *   block            wide filled block arrow
 *   classic          open V-shaped arrowhead
 *   ellipse          ellipse / oval marker
 *   cross            diagonal X marker
 *   async            single-wing half arrow
 *
 * Custom marker API:
 *   graph.registerMarker(name, fn) where fn is:
 *   (ctx: DrawContext, tip: Point, angle: number, spec: ArrowSpec) => void
 *   Only DrawContext methods may be used (no raw PixiJS imports needed).
 */
