/**
 * Acyclic streaming layouts — the live-append demo seeded with a **single-rooted
 * tree** the stream grows by hanging each new node off exactly one existing
 * node. Because the graph stays a tree (one root, no cycles, every non-root has
 * one parent) at every step, the full tree/DAG layout family is available
 * alongside the general-purpose ones:
 *
 *   - **Force (d3)** — incremental on each append.
 *   - **d3-hierarchy** — tidy `tree` / `cluster`, their `radial-*` variants,
 *     plus `pack` (circle-packing) and `sunburst` (the last two replace node
 *     *geometry*, so they snap rather than glide and morph the circles into
 *     sized discs / arc sectors as the tree grows).
 *   - **ELK** (layered / tree) and **geometric** (grid / circular) for contrast.
 *
 * `pack` / `sunburst` rewrite node geometry while active; the switcher resets
 * each node back to a plain circle on every layout change (see
 * {@link StreamingDemo}), so those morphed shapes don't bleed into the next,
 * position-only layout. (d3-sankey is intentionally absent: a random,
 * unit-weight, ever-growing tree isn't the bounded weighted flow DAG sankey is
 * built for — it collapses the node rects to near-zero and looks broken.)
 * Cyclic graphs live in the sibling `CyclicLayouts` story.
 *
 * The whole chrome is shared with that story via {@link StreamingDemo}; this
 * file only supplies the tree seed and the acyclic-capable layout menu.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { GraphData } from '@invana/graph';
import { D3HierarchyLayout } from '@invana/graph-layout-d3-hierarchy';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { GeometricLayout } from '@invana/graph-layout-geometric';
import { GLIDE, LAYER_ID, PALETTE, StreamingDemo, type LayoutEntry } from './streaming-demo';

const meta: Meta = { title: 'canvas-react/AcyclicLayouts' };
export default meta;
type Story = StoryObj;

/**
 * Small starting graph — a single-rooted tree (`seed0` is the root). Each later
 * seed hangs off a randomly chosen earlier one, so the graph has exactly one
 * node with no incoming edge and every other node has exactly one parent: the
 * precondition the d3-hierarchy and d3-sankey layouts require.
 */
function seedTree(n: number): GraphData {
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: `seed${i}`,
    data: { group: i % PALETTE.length },
  }));
  const edges = Array.from({ length: n - 1 }, (_, i) => {
    const child = i + 1;
    const parent = Math.floor(Math.random() * child); // any earlier node → no cycle
    return { id: `seedE${child}`, source: `seed${parent}`, target: `seed${child}`, data: { value: 1 } };
  });
  return { nodes, edges };
}

// Every non-force layout the acyclic switcher offers. The d3-hierarchy modes and
// d3-sankey need the tree/DAG seed; ELK and geometric are along for contrast.
const EXTRA_LAYOUTS: readonly LayoutEntry[] = [
  {
    id: 'hierarchy-tree',
    label: 'Tree (d3)',
    // `nodeSize` (not `size`) so the tidy tree *grows* with the stream — fixed
    // [breadth, depth] spacing per node — instead of compressing every leaf into
    // a fixed 640×480 box and overlapping. `fitContent` frames it on switch.
    make: () =>
      new D3HierarchyLayout({ id: 'hierarchy-tree', targetLayerId: LAYER_ID, mode: 'tree', nodeSize: [28, 80], ...GLIDE }),
  },
  {
    id: 'hierarchy-cluster',
    label: 'Cluster (d3)',
    // Same fix as 'tree': a dendrogram aligns every leaf on the breadth axis, so
    // a fixed `size` crushes them together — `nodeSize` spreads them out and lets
    // the layout extend as the stream adds leaves.
    make: () =>
      new D3HierarchyLayout({ id: 'hierarchy-cluster', targetLayerId: LAYER_ID, mode: 'cluster', nodeSize: [28, 80], ...GLIDE }),
  },
  {
    id: 'hierarchy-radial-tree',
    label: 'Radial Tree (d3)',
    // A streaming tree reaches dozens–hundreds of nodes, so the polar radius has
    // to be generous: d3 fits every depth ring inside `radius` and spreads the
    // leaves over the outer circumference (`2π·radius`). At 300 that arc length
    // drops below a node diameter and the glyphs overlap ("packaged"); 900 keeps
    // them apart, and the on-switch `fitContent` frames the bigger circle.
    make: () =>
      new D3HierarchyLayout({ id: 'hierarchy-radial-tree', targetLayerId: LAYER_ID, mode: 'radial-tree', radius: 900, ...GLIDE }),
  },
  {
    id: 'hierarchy-radial-cluster',
    label: 'Radial Cluster (d3)',
    make: () =>
      new D3HierarchyLayout({ id: 'hierarchy-radial-cluster', targetLayerId: LAYER_ID, mode: 'radial-cluster', radius: 900, ...GLIDE }),
  },
  {
    id: 'hierarchy-pack',
    label: 'Pack (d3)',
    make: () => new D3HierarchyLayout({ id: 'hierarchy-pack', targetLayerId: LAYER_ID, mode: 'pack' }),
  },
  {
    id: 'hierarchy-sunburst',
    label: 'Sunburst (d3)',
    make: () => new D3HierarchyLayout({ id: 'hierarchy-sunburst', targetLayerId: LAYER_ID, mode: 'sunburst', radius: 320 }),
  },
  {
    id: 'elk-layered',
    label: 'Layered (ELK)',
    make: () =>
      new ElkLayout({ id: 'elk-layered', targetLayerId: LAYER_ID, algorithm: 'layered', direction: 'RIGHT', ...GLIDE }),
  },
  {
    id: 'elk-mrtree',
    label: 'Tree (ELK)',
    make: () => new ElkLayout({ id: 'elk-mrtree', targetLayerId: LAYER_ID, algorithm: 'mrtree', ...GLIDE }),
  },
  {
    id: 'geometric-grid',
    label: 'Grid',
    make: () => new GeometricLayout({ id: 'geometric-grid', targetLayerId: LAYER_ID, mode: 'grid', ...GLIDE }),
  },
  {
    id: 'geometric-circular',
    label: 'Circular',
    make: () => new GeometricLayout({ id: 'geometric-circular', targetLayerId: LAYER_ID, mode: 'circular', ...GLIDE }),
  },
];

export const AcyclicLayouts: Story = {
  render: () => <StreamingDemo makeSeed={() => seedTree(6)} extraLayouts={EXTRA_LAYOUTS} />,
};
