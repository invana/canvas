/**
 * Flare **with synthetic class-imports** — companion to {@link flareAsGraph}
 * for the d3 *Hierarchical Edge Bundling* demo
 * (https://observablehq.com/@d3/hierarchical-edge-bundling/2).
 *
 * The Observable demo ships a flat `flare-imports.json` where every leaf
 * class carries an `imports: string[]` list of other class names it
 * "depends on". We don't bundle that file (no network fetch available at
 * dataset-build time); instead we generate a deterministic synthetic
 * imports graph over the existing nested `flare.json`, biased so that:
 *
 *  - each leaf imports a small handful of other leaves (1–5);
 *  - ~70% of imports stay inside the leaf's depth-1 package
 *    (`flare.analytics`, `flare.vis`, ...); the rest reach across packages.
 *
 * That bias is what *makes* hierarchical edge bundling worth looking at:
 * intra-package edges form dense, tightly-bundled arcs through one parent;
 * inter-package edges sweep across the centre. Visually it reproduces the
 * d3 demo faithfully; only the specific source/target pairs differ.
 *
 * The generator is seeded by the leaf's id, so the same call always
 * produces the same edges — stories stay snapshot-stable across reloads.
 *
 * @example
 * import { flareImportsAsGraph } from '@invana/graph-datasets';
 * const { nodes, treeEdges, importEdges } = flareImportsAsGraph();
 * graph.setData({ nodes, edges: treeEdges });
 * await new D3HierarchyLayout({ mode: 'radial-cluster' }).apply(graph);
 * // ... then swap to importEdges and render with `pathType: 'bundle'`.
 */

import type { CanvasConfig } from '@invana/canvas';
import type { GraphData, GraphEdge, GraphNode } from '@invana/graph';

import { flareAsGraph } from '../flare/data';

/**
 * The payload flare's node records carry (see `../flare/data`). Read through
 * {@link payload} — node `data` is the engine's opaque bag, so the shape is
 * asserted here, at the point of use, rather than exported as a dataset type.
 */
interface FlareNodePayload {
  readonly name: string;
  readonly depth: number;
  readonly isLeaf: boolean;
  readonly group?: string;
}

const payload = (n: GraphNode): FlareNodePayload => n.data as FlareNodePayload;

/** Output of {@link flareImportsAsGraph}. */
interface FlareImportsGraphData {
  nodes: (GraphNode & { data: FlareNodePayload })[];
  /** Parent→child edges from the flare hierarchy. Feed these to the layout. */
  treeEdges: GraphEdge[];
  /** Synthetic leaf→leaf import edges. Render these as bundled curves. */
  importEdges: GraphEdge[];
}

/** Options for {@link flareImportsAsGraph}. */
interface FlareImportsOptions {
  /** Minimum import out-degree per leaf. Default `1`. */
  readonly minImportsPerLeaf?: number;
  /** Maximum import out-degree per leaf. Default `5`. */
  readonly maxImportsPerLeaf?: number;
  /**
   * Probability that a generated import targets a leaf in the same depth-1
   * package as its source (vs a leaf in any other package). Default `0.7`
   * — produces a dense-intra-package + sparse-cross-package mix that
   * bundles cleanly through the hierarchy.
   */
  readonly intraGroupBias?: number;
}

/**
 * Build the Flare hierarchy plus a deterministic synthetic imports graph
 * over its leaves. See module doc for the generation policy.
 */
export function flareImportsAsGraph(opts: FlareImportsOptions = {}): FlareImportsGraphData {
  const minOut = opts.minImportsPerLeaf ?? 1;
  const maxOut = opts.maxImportsPerLeaf ?? 5;
  const intraBias = opts.intraGroupBias ?? 0.7;

  const { nodes, edges: treeEdges } = flareAsGraph();

  // Index leaves by group (depth-1 package) so we can sample intra-package
  // partners cheaply. Leaves without a group (the root has none, but it's
  // not a leaf anyway) are bucketed under '' and treated as their own group.
  const leavesByGroup = new Map<string, string[]>();
  const allLeaves: string[] = [];
  for (const n of nodes) {
    if (!payload(n).isLeaf) continue;
    allLeaves.push(n.id);
    const g = payload(n).group ?? '';
    let bucket = leavesByGroup.get(g);
    if (!bucket) {
      bucket = [];
      leavesByGroup.set(g, bucket);
    }
    bucket.push(n.id);
  }

  const importEdges: GraphEdge[] = [];
  let edgeCounter = 0;

  for (const sourceId of allLeaves) {
    // Per-leaf RNG seeded by the leaf id, so the synthetic graph is stable
    // across reloads even though we never persist it.
    const rng = mulberry32(hashString(sourceId));
    const sourceGroup =
      nodes.find((n) => n.id === sourceId)?.data === undefined
        ? ''
        : (payload(nodes.find((n) => n.id === sourceId)!).group ?? '');
    const intraBucket = leavesByGroup.get(sourceGroup) ?? [];

    const targetCount = minOut + Math.floor(rng() * (maxOut - minOut + 1));
    const used = new Set<string>([sourceId]);

    for (let i = 0; i < targetCount; i++) {
      const useIntra = rng() < intraBias && intraBucket.length > 2;
      const pool = useIntra ? intraBucket : allLeaves;

      // Reject-sample up to a few attempts to land on an unused, non-self
      // target. Falling through the loop without a hit is fine — synthetic
      // dataset, not every leaf needs a full out-degree.
      let target: string | undefined;
      for (let attempt = 0; attempt < 6; attempt++) {
        const candidate = pool[Math.floor(rng() * pool.length)];
        if (candidate && !used.has(candidate)) {
          target = candidate;
          break;
        }
      }
      if (!target) continue;
      used.add(target);
      importEdges.push({
        id: `imp${edgeCounter++}`,
        type: 'imports',
        source: sourceId,
        target,
      });
    }
  }

  return { nodes, treeEdges, importEdges };
}

/** Cheap, well-mixing 32-bit string hash (FNV-1a). */
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Bit-shift to coerce to unsigned 32-bit before handing to the PRNG.
  return h >>> 0;
}

/**
 * Mulberry32 PRNG — small, fast, and statistically good enough for the
 * "pick a few leaves" loop above. Seeded so dataset output is reproducible.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The Flare **import network**, engine-ready — the picture {@link settings} is
 * written for. The generator returns the tree edges and the import edges
 * separately (a bundled-curve story needs the tree only for the layout), so this
 * is the import half; call {@link flareImportsAsGraph} for both.
 */
export const data: GraphData = (() => {
  const { nodes, importEdges } = flareImportsAsGraph();
  return { nodes, edges: importEdges };
})();

/**
 * Recommended look for the **Flare import network**.
 *
 * Class-to-class imports are a dense directed network, so the edges are hairline
 * and heavily faded — the shape comes from their aggregate, not any single link.
 * Hover lights the 1-hop neighbourhood, which is the only practical way to read an
 * individual class's dependencies at this density.
 */
export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 3.5 },
          bgFill: 0xf472b6,
          bgStrokeWidth: 0,
        },
      },
      edge: {
        style: {
          strokeColor: 0x94a3b8,
          strokeWidth: 0.5,
          strokeAlpha: 0.25,
          arrowTargetShape: 'none',
        },
      },
    },
  },
  layouts: {
    'graph-force': {
      charge: { strength: -120 },
      link: { distance: 36 },
      collide: {},
      animate: false,
    },
  },
  behaviours: {
    color: { enabled: false },
    hover: {
      enabled: true,
      state: 'highlighted',
      inactiveState: 'dimmed',
      degree: 1,
      direction: 'both',
    },
  },
};
