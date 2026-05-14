/**
 * `D3HierarchyLayout` — `Layout` for `@invana/graph` that wraps
 * `d3-hierarchy`'s `tree()` / `cluster()` algorithms (with optional polar
 * projection for radial variants).
 *
 * One-shot synchronous: `apply()` snapshots the store, computes positions in
 * a single pass, bulk-writes them back, emits `start` → `tick` → `end`, and
 * resolves. There is no tick loop — radial / tidy layouts have a closed-form
 * solution.
 *
 * Tree topology is derived from edges. Each `edge.source → edge.target` is
 * read as "source is parent of target". The snapshot must form a single
 * tree (one root, every non-root has exactly one parent, no cycles); the
 * layout throws otherwise.
 *
 * @example
 * const layout = new D3HierarchyLayout({ mode: 'radial-tree', radius: 400 });
 * await layout.apply(graphLayer);
 */

import { cluster as d3cluster, hierarchy as d3hierarchy, tree as d3tree } from 'd3-hierarchy';

import { Layout } from '@invana/canvas';
import type { GraphLayer } from '@invana/graph';

import type { D3HierarchyLayoutOptions, D3HierarchyLayoutMode } from './types';

interface TreeNode {
  id: string;
  children?: TreeNode[];
}

const DEFAULT_MODE: D3HierarchyLayoutMode = 'radial-tree';
const DEFAULT_RADIUS = 400;
const DEFAULT_CARTESIAN_SIZE: [number, number] = [640, 480];

export class D3HierarchyLayout extends Layout<GraphLayer> {
  private readonly opts: D3HierarchyLayoutOptions;
  /** True while a run is active. Guards `stop()` so `end` only fires once. */
  private running = false;

  constructor(opts: D3HierarchyLayoutOptions = {}) {
    super();
    this.opts = opts;
  }

  /**
   * Run the layout against `layer`. Resolves after the single position pass
   * has been written to the store. Lifecycle events fire in order:
   * `start` → `tick` (once) → `end`.
   */
  async apply(layer: GraphLayer): Promise<void> {
    this.stop();
    const store = layer.store;

    // 1. Snapshot store → ids + parent/child map. Build TreeNode objects up
    //    front (one per node) so we can stitch them by reference instead of
    //    looking ids up during the recursive build.
    const ids: string[] = [];
    const nodeById = new Map<string, TreeNode>();
    for (const n of store.nodes()) {
      ids.push(n.id);
      nodeById.set(n.id, { id: n.id });
    }
    if (ids.length === 0) return;

    // Track parent count per node to validate the snapshot is a tree.
    const parentCount = new Map<string, number>();
    for (const id of ids) parentCount.set(id, 0);
    for (const e of store.edges()) {
      const parent = nodeById.get(e.source);
      const child = nodeById.get(e.target);
      if (!parent || !child) {
        throw new Error(
          `D3HierarchyLayout: edge "${e.id}" references unknown endpoint(s) (` +
            `source="${e.source}", target="${e.target}")`,
        );
      }
      parent.children = parent.children ?? [];
      parent.children.push(child);
      parentCount.set(e.target, (parentCount.get(e.target) ?? 0) + 1);
    }

    // 2. Determine root.
    const root = this.resolveRoot(ids, parentCount, nodeById);

    // 3. Build d3 hierarchy + run the chosen layout.
    const mode = this.opts.mode ?? DEFAULT_MODE;
    const isRadial = mode === 'radial-tree' || mode === 'radial-cluster';
    const isCluster = mode === 'cluster' || mode === 'radial-cluster';

    const h = d3hierarchy<TreeNode>(root, (d) => d.children);

    const layoutFn = isCluster ? d3cluster<TreeNode>() : d3tree<TreeNode>();
    if (this.opts.nodeSize !== undefined) {
      layoutFn.nodeSize(this.opts.nodeSize);
    } else if (isRadial) {
      // Radial layouts use [angle, radius] = [2π, radius] in polar space.
      // The radius is then projected to Cartesian distance from origin.
      layoutFn.size([2 * Math.PI, this.opts.radius ?? DEFAULT_RADIUS]);
    } else {
      layoutFn.size(this.opts.size ?? DEFAULT_CARTESIAN_SIZE);
    }
    if (this.opts.separation !== undefined) {
      layoutFn.separation(this.opts.separation);
    }
    layoutFn(h);

    // 4. Project to (x, y). For radial modes, h.x is the angle and h.y is
    //    the radius — convert with the standard polar projection. The
    //    `θ − π/2` rotation puts the root at the origin and the first child
    //    pointing up, matching the d3 example.
    //
    //    Sub-pixel root nudge: in radial modes the root naturally projects
    //    to (0, 0). A polar pathStyle (e.g. `bump-radial`) can't recover an
    //    angle from a zero-radius source, so root edges would degenerate to
    //    straight radial lines. Nudging the root a fraction of a pixel in
    //    the direction of its tree-assigned angle (`h.x`) lets `atan2`
    //    succeed; the offset is imperceptible against typical 3–6px node
    //    glyphs but unblocks the polar curve formula.
    const cx = this.opts.center?.x ?? 0;
    const cy = this.opts.center?.y ?? 0;
    const rootEpsilon = isRadial ? (this.opts.radius ?? DEFAULT_RADIUS) * 0.001 : 0;
    const positions = new Map<string, [number, number]>();
    h.each((node) => {
      let x: number;
      let y: number;
      if (isRadial) {
        const angle = node.x ?? 0;
        // For the root, `r` is 0 → use `rootEpsilon` so the projected point
        // sits a sub-pixel distance off origin in the angle direction. See
        // the comment above on why the path style needs this.
        const r = node.y === 0 ? rootEpsilon : node.y ?? 0;
        x = r * Math.cos(angle - Math.PI / 2);
        y = r * Math.sin(angle - Math.PI / 2);
      } else {
        // Cartesian d3 layouts produce x along the breadth axis and y along
        // the depth axis. Center on the origin so a fresh `fitContent` looks
        // sensible without the caller having to know the layout's bounds.
        const w = this.opts.size?.[0] ?? DEFAULT_CARTESIAN_SIZE[0];
        x = (node.x ?? 0) - w / 2;
        y = node.y ?? 0;
      }
      positions.set(node.data.id, [x + cx, y + cy]);
    });

    // 5. Mark running, fire start, bulk-write, fire tick + end.
    this.running = true;
    this.events.emit('start', {});

    const buffer = new Float32Array(ids.length * 2);
    for (let i = 0, j = 0; i < ids.length; i++, j += 2) {
      const p = positions.get(ids[i]!);
      if (p) {
        buffer[j] = p[0];
        buffer[j + 1] = p[1];
      }
    }
    store.setPositionsBulk(ids, buffer);
    this.events.emit('tick', {});

    if (this.running) {
      this.running = false;
      this.events.emit('end', { reason: 'completed' });
    }
  }

  /** Cancel a run. The synchronous body of `apply()` rarely yields control
   *  long enough for this to fire, but it keeps the API contract symmetric
   *  with iterative layouts. */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.events.emit('end', { reason: 'stopped' });
  }

  // ─── internals ────────────────────────────────────────────────────────

  private resolveRoot(
    ids: string[],
    parentCount: Map<string, number>,
    nodeById: Map<string, TreeNode>,
  ): TreeNode {
    if (this.opts.rootId !== undefined) {
      const node = nodeById.get(this.opts.rootId);
      if (!node) {
        throw new Error(`D3HierarchyLayout: rootId "${this.opts.rootId}" not found`);
      }
      return node;
    }
    let rootId: string | null = null;
    let multipleRoots = false;
    for (const id of ids) {
      if (parentCount.get(id) === 0) {
        if (rootId === null) rootId = id;
        else {
          multipleRoots = true;
          break;
        }
      }
    }
    if (rootId === null) {
      throw new Error(
        'D3HierarchyLayout: no root found — the snapshot has no node without an incoming edge (cycle?)',
      );
    }
    if (multipleRoots) {
      throw new Error(
        'D3HierarchyLayout: snapshot has more than one root. Pass `rootId` to disambiguate.',
      );
    }
    for (const [id, count] of parentCount) {
      if (id !== rootId && count !== 1) {
        throw new Error(
          `D3HierarchyLayout: node "${id}" has ${count} parents — input must be a tree (each non-root node has exactly one parent).`,
        );
      }
    }
    return nodeById.get(rootId)!;
  }
}
