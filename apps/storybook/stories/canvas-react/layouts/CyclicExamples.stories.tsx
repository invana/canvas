/**
 * Cyclic streaming layouts — the live-append demo seeded with a **ring** (a
 * closed 6-node cycle) the stream then grows outward from. Because the seed is
 * cyclic, only layouts that cope with arbitrary graphs are offered:
 *
 *   - **Force (d3)** — incremental on each append; placed nodes stay put.
 *   - **ELK** (layered / stress / tree / radial / force) — handles any graph;
 *     a full one-shot re-layout each chunk.
 *   - **Geometric** (grid / snake / circular) — ignore edges entirely, so the
 *     cycle is irrelevant.
 *
 * Tree/DAG-only layouts (d3-hierarchy, d3-sankey) can't run here — they need an
 * acyclic, single-rooted graph; see the sibling `AcyclicExamples` story.
 *
 * The whole chrome (combined toolbar, stream controls, layout switcher, …) is
 * shared with that story via {@link StreamingDemo}; this file only supplies the
 * ring seed and the cyclic-capable layout menu.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { GraphData } from '@invana/graph';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { GeometricLayout } from '@invana/graph-layout-geometric';
import { GLIDE, LAYER_ID, PALETTE, StreamingDemo, type LayoutEntry } from '../streaming-demo';

const meta: Meta = { title: 'canvas-react/layouts/CyclicExamples' };
export default meta;
type Story = StoryObj;

/** Small starting graph — a ring (closed cycle) the stream grows outward from. */
function seedRing(n: number): GraphData {
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: `seed${i}`,
    data: { group: i % PALETTE.length },
  }));
  // The wrap-around edge `seed{n-1} → seed0` closes the loop — that's what makes
  // this graph cyclic and rules out the tree/DAG layouts.
  const edges = Array.from({ length: n }, (_, i) => ({
    id: `seedE${i}`,
    source: `seed${i}`,
    target: `seed${(i + 1) % n}`,
    data: { value: 1 },
  }));
  return { nodes, edges };
}

// Every non-force layout the cyclic switcher offers. ELK handles arbitrary
// graphs; the geometric layouts ignore edges — both stay happy as the stream
// grows the cyclic graph.
const EXTRA_LAYOUTS: readonly LayoutEntry[] = [
  {
    id: 'elk-layered',
    label: 'Layered (ELK)',
    make: () =>
      new ElkLayout({ id: 'elk-layered', targetLayerId: LAYER_ID, algorithm: 'layered', direction: 'RIGHT', ...GLIDE }),
  },
  {
    id: 'elk-stress',
    label: 'Stress (ELK)',
    make: () => new ElkLayout({ id: 'elk-stress', targetLayerId: LAYER_ID, algorithm: 'stress', ...GLIDE }),
  },
  {
    id: 'elk-mrtree',
    label: 'Tree (ELK)',
    make: () => new ElkLayout({ id: 'elk-mrtree', targetLayerId: LAYER_ID, algorithm: 'mrtree', ...GLIDE }),
  },
  {
    id: 'elk-radial',
    label: 'Radial (ELK)',
    make: () => new ElkLayout({ id: 'elk-radial', targetLayerId: LAYER_ID, algorithm: 'radial', ...GLIDE }),
  },
  {
    id: 'elk-force',
    label: 'Force (ELK)',
    make: () => new ElkLayout({ id: 'elk-force', targetLayerId: LAYER_ID, algorithm: 'force', ...GLIDE }),
  },
  {
    id: 'geometric-grid',
    label: 'Grid',
    make: () => new GeometricLayout({ id: 'geometric-grid', targetLayerId: LAYER_ID, mode: 'grid', ...GLIDE }),
  },
  {
    id: 'geometric-snake',
    label: 'Snake',
    make: () => new GeometricLayout({ id: 'geometric-snake', targetLayerId: LAYER_ID, mode: 'snake', ...GLIDE }),
  },
  {
    id: 'geometric-circular',
    label: 'Circular',
    make: () => new GeometricLayout({ id: 'geometric-circular', targetLayerId: LAYER_ID, mode: 'circular', ...GLIDE }),
  },
];

export const CyclicExamples: Story = {
  render: () => <StreamingDemo makeSeed={() => seedRing(6)} extraLayouts={EXTRA_LAYOUTS} />,
};
