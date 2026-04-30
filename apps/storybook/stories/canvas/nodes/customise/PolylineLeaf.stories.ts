/**
 * GraphDataPlugin — PolylineShape (free-form leaf)
 *
 * Demonstrates the built-in `polyline` shape: any closed perimeter renders
 * as a node, and connectors automatically anchor at the boundary along the
 * curve's actual entry tangent — verifying the new ray-cast attachment.
 *
 * Eight satellite circles surround the leaf and connect from every direction
 * with bezier edges. The arrow tip lands on the leaf perimeter and the
 * curve's tangent at that point projects through the leaf's centroid.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import { PolylineShape } from '@invana/plugins-shapes';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Nodes/Custom Nodes/Polyline (Leaf)' };
export default meta;
type Story = StoryObj;

/**
 * Build a leaf-shaped closed polyline centred at (cx, cy).
 * Combines two parametric arcs so the silhouette has a tip at the top and
 * a stem at the bottom.
 */
function leafOutline(cx: number, cy: number, w: number, h: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const N = 64;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    // Cardioid-ish curve — narrows to a point at the top, rounded at the bottom.
    const r = 0.5 * (1 + Math.cos(t));
    const dx = Math.sin(t) * r;
    const dy = -Math.cos(t) * (0.5 + 0.5 * r);
    pts.push({ x: cx + dx * w * 0.5, y: cy + dy * h * 0.55 });
  }
  return pts;
}

export const PolylineLeaf: Story = {
  name: 'Leaf — Free-form Polyline',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      backgroundColor: '#0b1120',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern',
            patternType: 'dots',
            color: '#1e293b',
            backgroundColor: '#0b1120',
            size: 1.5,
            spacing: 30,
          },
        },
        {
          plugin: 'graph-data',
          key: 'graph',
          options: { fitOnRender: true, fitPadding: 80 },
        },
      ],
    });
    await canvas.init();

    const graph = canvas.plugins.get<GraphDataPlugin>('graph')!;
    graph.registerNode('polyline', PolylineShape as never);

    const leafPoints = leafOutline(0, 0, 360, 460);

    // Eight satellites arranged on a ring.
    const satRadius = 320;
    const satCount  = 8;
    const satellites = Array.from({ length: satCount }, (_, i) => {
      const a = (i / satCount) * Math.PI * 2 - Math.PI / 2;
      return {
        id:    `sat-${i}`,
        shape: 'circle',
        x:     Math.cos(a) * satRadius,
        y:     Math.sin(a) * satRadius,
        radius: 22,
        label: `n${i}`,
        style: { fill: '#1e293b', stroke: '#94a3b8', strokeWidth: 2 },
      };
    });

    const edges = satellites.map((s, i) => ({
      id:       `e-${i}`,
      source:   s.id,
      target:   'leaf',
      pathType: 'bezier' as const,
      endMarker: { type: 'triangle' as const, size: 10 },
      style:    { stroke: '#22c55e', strokeWidth: 2 },
    }));

    graph.setData({
      nodes: [
        {
          id:     'leaf',
          shape:  'polyline',
          x:      0,
          y:      0,
          points: leafPoints,
          label:  'leaf',
          style:  { fill: '#15803d', stroke: '#22c55e', strokeWidth: 2 },
        },
        ...satellites,
      ],
      edges,
    });
  },
};
