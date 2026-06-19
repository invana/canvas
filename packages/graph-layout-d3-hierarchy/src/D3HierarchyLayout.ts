/**
 * `D3HierarchyLayout` — `Layout` for `@invana/graph` that wraps
 * `d3-hierarchy`'s `tree()` / `cluster()` / `pack()` algorithms (with optional
 * polar projection for radial variants).
 *
 * One-shot synchronous: `apply()` snapshots the store, computes positions in
 * a single pass, bulk-writes them back, emits `start` → `tick` → `end`, and
 * resolves. There is no tick loop — radial / tidy / pack layouts all have a
 * closed-form solution.
 *
 * Tree topology is derived from edges. Each `edge.source → edge.target` is
 * read as "source is parent of target". The snapshot must form a single
 * tree (one root, every non-root has exactly one parent, no cycles); the
 * layout throws otherwise.
 *
 * Pack mode is special: in addition to writing positions, it writes a
 * per-node `data.size = 2 * r` so the renderer can draw each node at the
 * pack-computed diameter. The other modes leave node sizes alone.
 *
 * @example
 * const layout = new D3HierarchyLayout({ mode: 'radial-tree', radius: 400 });
 * await layout.apply(graphLayer);
 */

import {
  cluster as d3cluster,
  hierarchy as d3hierarchy,
  pack as d3pack,
  partition as d3partition,
  tree as d3tree,
} from 'd3-hierarchy';

import { OneShotPositionLayout, type GraphLayer, type LayoutPositions } from '@invana/graph';

import type { D3HierarchyLayoutOptions, D3HierarchyLayoutMode } from './types';

/** Pack-only: per-node circle diameter the layout assigns, applied post-position. */
type SizeMap = Map<string, number>;
/** Sunburst-only: per-node arc params, applied post-position. */
type ArcMap = Map<string, { innerR: number; outerR: number; startAngle: number; endAngle: number }>;

/** Per-run geometry threaded from `computeLayout` to `onPositionsApplied`. */
interface HierarchyMeta {
  sizes: SizeMap | null;
  arcs: ArcMap | null;
}

interface TreeNode {
  id: string;
  /** Original `GraphNode.data` payload, carried through so pack-mode's
   *  `value` accessor can read user data without an extra lookup. */
  data?: unknown;
  children?: TreeNode[];
}

const DEFAULT_MODE: D3HierarchyLayoutMode = 'radial-tree';
const DEFAULT_RADIUS = 400;
const DEFAULT_CARTESIAN_SIZE: [number, number] = [640, 480];
const DEFAULT_PACK_SIZE: [number, number] = [800, 800];

/**
 * Default `value` accessor for pack mode — reads `data.value` if present,
 * otherwise treats the node as having `value: 1` (so a tree with no `value`
 * field still packs sensibly, with all leaves the same size).
 */
const defaultPackValue = (n: { data?: unknown }): number => {
  if (n.data && typeof n.data === 'object' && 'value' in n.data) {
    const v = (n.data as { value?: unknown }).value;
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  }
  return 1;
};

export class D3HierarchyLayout extends OneShotPositionLayout<D3HierarchyLayoutOptions> {
  /**
   * `pack` / `sunburst` replace node *geometry* (circle sizes / arc sectors)
   * rather than move nodes, so tweening their positions would look wrong — snap
   * those. Position modes (tree / cluster / radial-*) honour `transition`.
   */
  protected override shouldTransition(): boolean {
    const mode = this.opts.mode ?? DEFAULT_MODE;
    return mode !== 'pack' && mode !== 'sunburst';
  }

  /**
   * Compute positions for the whole snapshot in one pass. The base writes them
   * (snap or tween), then calls {@link onPositionsApplied} to flush any pack /
   * sunburst geometry. Lifecycle (`start` → `tick` → `end`) is owned by the base.
   */
  protected computeLayout(layer: GraphLayer): LayoutPositions<HierarchyMeta> | null {
    const store = layer.store;

    // 1. Snapshot store → ids + parent/child map. Build TreeNode objects up
    //    front (one per node) so we can stitch them by reference instead of
    //    looking ids up during the recursive build. The original `data`
    //    payload travels along so pack-mode's `value` accessor can read it.
    const ids: string[] = [];
    const nodeById = new Map<string, TreeNode>();
    for (const n of store.nodes()) {
      ids.push(n.id);
      nodeById.set(n.id, { id: n.id, data: n.data });
    }
    if (ids.length === 0) return null;

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
    const isPack = mode === 'pack';
    const isSunburst = mode === 'sunburst';

    const h = d3hierarchy<TreeNode>(root, (d) => d.children);

    if (isSunburst) {
      // Sunburst = polar `d3.partition`. Same value/sort plumbing as pack:
      // each leaf contributes its `value` (default reads `data.value`);
      // siblings sort descending by value for a stable visual order. The
      // partition layout assigns `(x0, x1, y0, y1)` to every node, with
      // `x` in [0, 2π] (angle, 0 = 12 o'clock running clockwise — d3's
      // convention) and `y` in [0, radius²] (the squared-radius form gives
      // every ring equal area when we take `sqrt(y)` below).
      const valueFn = this.opts.value ?? defaultPackValue;
      h.sum((d) => valueFn(d));
      const sortFn =
        this.opts.sort === undefined
          ? (a: { value?: number }, b: { value?: number }): number =>
              (b.value ?? 0) - (a.value ?? 0)
          : this.opts.sort;
      if (sortFn !== null) h.sort(sortFn);

      const radius = this.opts.radius ?? DEFAULT_RADIUS;
      const partitionFn = d3partition<TreeNode>().size([2 * Math.PI, radius * radius]);
      partitionFn(h);
    } else if (isPack) {
      // Pack needs an accumulated value per node. `.sum(fn)` walks bottom-up,
      // so internal nodes get the sum of their leaves. Sort siblings by
      // descending value (d3's recommended default) for tighter packing —
      // unless the caller explicitly passed `sort: null` to preserve input
      // order.
      const valueFn = this.opts.value ?? defaultPackValue;
      h.sum((d) => valueFn(d));
      const sortFn =
        this.opts.sort === undefined
          ? (a: { value?: number }, b: { value?: number }): number =>
              (b.value ?? 0) - (a.value ?? 0)
          : this.opts.sort;
      if (sortFn !== null) h.sort(sortFn);

      const packFn = d3pack<TreeNode>()
        .size(this.opts.size ?? DEFAULT_PACK_SIZE)
        .padding(this.opts.padding ?? 0);
      packFn(h);
    } else {
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
    }

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
    /** Pack-only: per-node diameter the layout assigns. Empty for other modes. */
    const sizes = new Map<string, number>();
    /** Sunburst-only: per-node arc params. Empty for other modes. */
    const arcs = new Map<
      string,
      { innerR: number; outerR: number; startAngle: number; endAngle: number }
    >();
    h.each((node) => {
      let x: number;
      let y: number;
      if (isSunburst) {
        // Every sunburst node renders as an arc centred at the same origin —
        // the per-node geometry is the arc spec, not a translated position.
        // d3.partition writes (x0, x1, y0, y1) with `x` in [0, 2π] (angle,
        // 0 = 12 o'clock) and `y` in [0, radius²]. Convert to ArcShape's
        // convention (0 = 3 o'clock, increasing clockwise on screen) by
        // subtracting π/2, and take `sqrt(y)` so each ring covers equal area
        // per unit `value` — d3's standard sunburst projection.
        const p = node as typeof node & {
          x0?: number;
          x1?: number;
          y0?: number;
          y1?: number;
        };
        arcs.set(node.data.id, {
          innerR: Math.sqrt(p.y0 ?? 0),
          outerR: Math.sqrt(p.y1 ?? 0),
          startAngle: (p.x0 ?? 0) - Math.PI / 2,
          endAngle: (p.x1 ?? 0) - Math.PI / 2,
        });
        x = 0;
        y = 0;
      } else if (isPack) {
        // Pack writes node.x / node.y / node.r in [0, w] × [0, h]. Centre
        // the pack on the world origin so a `fitContent` frames it
        // naturally without the caller knowing the pack viewport. `r` is
        // added by d3.pack() and isn't on the base HierarchyNode type, so
        // we cast.
        const packed = node as typeof node & { r?: number };
        const [w, hSize] = this.opts.size ?? DEFAULT_PACK_SIZE;
        x = (node.x ?? 0) - w / 2;
        y = (node.y ?? 0) - hSize / 2;
        // Diameter goes back to the renderer via store.updateNode below.
        sizes.set(node.data.id, 2 * (packed.r ?? 0));
      } else if (isRadial) {
        const angle = node.x ?? 0;
        // For the root, `r` is 0 → use `rootEpsilon` so the projected point
        // sits a sub-pixel distance off origin in the angle direction. See
        // the comment above on why the path style needs this.
        const r = node.y === 0 ? rootEpsilon : node.y ?? 0;
        x = r * Math.cos(angle - Math.PI / 2);
        y = r * Math.sin(angle - Math.PI / 2);
      } else {
        // Cartesian d3 layouts produce x along the breadth axis (sibling
        // separation) and y along the depth axis (root → leaves). For
        // 'vertical' that maps to (cartesian_x = breadth, cartesian_y = depth).
        // For 'horizontal' the depth axis runs left→right, so we swap:
        // (cartesian_x = depth, cartesian_y = breadth). Centering on the
        // breadth axis lets a fresh `fitContent` frame the tree without the
        // caller knowing the layout's bounds.
        const orientation = this.opts.orientation ?? 'vertical';
        const w = this.opts.size?.[0] ?? DEFAULT_CARTESIAN_SIZE[0];
        const breadth = (node.x ?? 0) - w / 2;
        const depth = node.y ?? 0;
        if (orientation === 'horizontal') {
          x = depth;
          y = breadth;
        } else {
          x = breadth;
          y = depth;
        }
      }
      positions.set(node.data.id, [x + cx, y + cy]);
    });

    // 5. Pack into the position buffer (id order); stash pack/sunburst geometry
    //    for `onPositionsApplied` (the base writes positions first).
    const buffer = new Float32Array(ids.length * 2);
    for (let i = 0, j = 0; i < ids.length; i++, j += 2) {
      const p = positions.get(ids[i]!);
      if (p) {
        buffer[j] = p[0];
        buffer[j + 1] = p[1];
      }
    }
    return {
      ids,
      positions: buffer,
      meta: { sizes: isPack ? sizes : null, arcs: isSunburst ? arcs : null },
    };
  }

  /**
   * Flush pack circle sizes / sunburst arc geometry onto `style.shape` once the
   * node positions have settled. Each in its own store batch so the renderer
   * sees a single coalesced flush. No-op for the position-only modes.
   */
  protected override onPositionsApplied(layer: GraphLayer, meta: unknown): void {
    const store = layer.store;
    const { sizes, arcs } = (meta as HierarchyMeta | undefined) ?? { sizes: null, arcs: null };

    if (sizes) {
      // Pack: project each diameter onto `style.shape` as a circle radius.
      store.batch(() => {
        for (const [id, diameter] of sizes) {
          const existing = store.getNode(id);
          if (!existing) continue;
          const existingStyle =
            existing.style && typeof existing.style === 'object'
              ? (existing.style as Record<string, unknown>)
              : {};
          store.updateNode(id, {
            style: { ...existingStyle, shape: { kind: 'circle', radius: diameter / 2 } },
          });
        }
      });
    }

    if (arcs) {
      // Sunburst: the renderer reads the `kind: 'arc'` discriminant + radii/angles.
      store.batch(() => {
        for (const [id, arc] of arcs) {
          const existing = store.getNode(id);
          if (!existing) continue;
          const existingStyle =
            existing.style && typeof existing.style === 'object'
              ? (existing.style as Record<string, unknown>)
              : {};
          store.updateNode(id, {
            style: {
              ...existingStyle,
              shape: {
                kind: 'arc',
                innerR: arc.innerR,
                outerR: arc.outerR,
                startAngle: arc.startAngle,
                endAngle: arc.endAngle,
              },
            },
          });
        }
      });
    }
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
