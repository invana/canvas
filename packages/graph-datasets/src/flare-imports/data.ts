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

import type { GraphData } from '@invana/graph';

import { flareAsGraph, type FlareGraphNode, type FlareGraphEdge } from '../flare/data';

/** A synthetic leaf→leaf import edge. */
export interface FlareImportEdge {
  id: string;
  source: string;
  target: string;
}

/** Output of {@link flareImportsAsGraph}. */
export interface FlareImportsGraphData {
  nodes: FlareGraphNode[];
  /** Parent→child edges from the flare hierarchy. Feed these to the layout. */
  treeEdges: FlareGraphEdge[];
  /** Synthetic leaf→leaf import edges. Render these as bundled curves. */
  importEdges: FlareImportEdge[];
}

/** Options for {@link flareImportsAsGraph}. */
export interface FlareImportsOptions {
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
    if (!n.data.isLeaf) continue;
    allLeaves.push(n.id);
    const g = n.data.group ?? '';
    let bucket = leavesByGroup.get(g);
    if (!bucket) {
      bucket = [];
      leavesByGroup.set(g, bucket);
    }
    bucket.push(n.id);
  }

  const importEdges: FlareImportEdge[] = [];
  let edgeCounter = 0;

  for (const sourceId of allLeaves) {
    // Per-leaf RNG seeded by the leaf id, so the synthetic graph is stable
    // across reloads even though we never persist it.
    const rng = mulberry32(hashString(sourceId));
    const sourceGroup =
      nodes.find((n) => n.id === sourceId)?.data.group ?? '';
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

/** The Flare import network, engine-ready. Same value as {@link flareImportsAsGraph}(). */
export const data: GraphData = flareImportsAsGraph() as unknown as GraphData;
