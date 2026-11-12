import { hierarchy, partition, pack, cluster, tree } from 'd3-hierarchy';
import { SubgraphPositionLayout } from '@invana/graph';

// src/D3HierarchyLayout.ts
var DEFAULT_MODE = "radial-tree";
var DEFAULT_RADIUS = 400;
var DEFAULT_CARTESIAN_SIZE = [640, 480];
var DEFAULT_PACK_SIZE = [800, 800];
var defaultPackValue = (n) => {
  if (n.data && typeof n.data === "object" && "value" in n.data) {
    const v = n.data.value;
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  }
  return 1;
};
var D3HierarchyLayout = class extends SubgraphPositionLayout {
  kind = "d3-hierarchy-layout";
  /**
   * `pack` / `sunburst` replace node *geometry* (circle sizes / arc sectors)
   * rather than move nodes, so tweening their positions would look wrong — snap
   * those. Position modes (tree / cluster / radial-*) honour `transition`.
   */
  shouldTransition() {
    const mode = this.opts.mode ?? DEFAULT_MODE;
    return mode !== "pack" && mode !== "sunburst";
  }
  /**
   * `pack` / `sunburst` can't be run per group: their real output is the
   * per-node geometry threaded through the run's `meta` (circle radii, arc
   * sectors), and there is no meaningful way to merge that across one run per
   * group. They fall back to a single flat run — an `autoFit` frame still wraps
   * whatever its members occupy, it just isn't packed into a box.
   */
  canRecurseGroups() {
    const mode = this.opts.mode ?? DEFAULT_MODE;
    return mode !== "pack" && mode !== "sunburst";
  }
  /**
   * Compute positions for one subgraph — the whole graph for a flat run, or a
   * single group's members when `includeGroups` nests them. The base writes the
   * result (snap or tween), then calls {@link onPositionsApplied} to flush any
   * pack / sunburst geometry. Lifecycle (`start` → `tick` → `end`) is the base's.
   */
  computeSubgraphLayout(sub) {
    const recursing = this.opts.includeGroups === true && this.canRecurseGroups();
    const dropFrames = !recursing;
    const ids = [];
    const nodeById = /* @__PURE__ */ new Map();
    for (const id of sub.ids) {
      if (dropFrames && sub.isGroup(id)) continue;
      ids.push(id);
      nodeById.set(id, { id, data: sub.dataOf(id) });
    }
    if (ids.length === 0) return null;
    const parentCount = /* @__PURE__ */ new Map();
    for (const id of ids) parentCount.set(id, 0);
    for (const e of sub.edges) {
      const parent = nodeById.get(e.source);
      const child = nodeById.get(e.target);
      if (!parent || !child) continue;
      parent.children = parent.children ?? [];
      parent.children.push(child);
      parentCount.set(e.target, (parentCount.get(e.target) ?? 0) + 1);
    }
    const root = this.resolveRoot(ids, parentCount, nodeById, recursing, sub.groupId);
    const mode = this.opts.mode ?? DEFAULT_MODE;
    const isRadial = mode === "radial-tree" || mode === "radial-cluster";
    const isCluster = mode === "cluster" || mode === "radial-cluster";
    const isPack = mode === "pack";
    const isSunburst = mode === "sunburst";
    const h = hierarchy(root, (d) => d.children);
    if (isSunburst) {
      const valueFn = this.opts.value ?? defaultPackValue;
      h.sum((d) => valueFn(d));
      const sortFn = this.opts.sort === void 0 ? (a, b) => (b.value ?? 0) - (a.value ?? 0) : this.opts.sort;
      if (sortFn !== null) h.sort(sortFn);
      const radius = this.opts.radius ?? DEFAULT_RADIUS;
      const partitionFn = partition().size([2 * Math.PI, radius * radius]);
      partitionFn(h);
    } else if (isPack) {
      const valueFn = this.opts.value ?? defaultPackValue;
      h.sum((d) => valueFn(d));
      const sortFn = this.opts.sort === void 0 ? (a, b) => (b.value ?? 0) - (a.value ?? 0) : this.opts.sort;
      if (sortFn !== null) h.sort(sortFn);
      const packFn = pack().size(this.opts.size ?? DEFAULT_PACK_SIZE).padding(this.opts.padding ?? 0);
      packFn(h);
    } else {
      const layoutFn = isCluster ? cluster() : tree();
      if (this.opts.nodeSize !== void 0) {
        layoutFn.nodeSize(this.opts.nodeSize);
      } else if (isRadial) {
        layoutFn.size([2 * Math.PI, this.opts.radius ?? DEFAULT_RADIUS]);
      } else {
        layoutFn.size(this.opts.size ?? DEFAULT_CARTESIAN_SIZE);
      }
      if (this.opts.separation !== void 0) {
        layoutFn.separation(this.opts.separation);
      }
      layoutFn(h);
    }
    const cx = this.opts.center?.x ?? 0;
    const cy = this.opts.center?.y ?? 0;
    const rootEpsilon = isRadial ? (this.opts.radius ?? DEFAULT_RADIUS) * 1e-3 : 0;
    const positions = /* @__PURE__ */ new Map();
    const sizes = /* @__PURE__ */ new Map();
    const arcs = /* @__PURE__ */ new Map();
    h.each((node) => {
      let x;
      let y;
      if (isSunburst) {
        const p = node;
        arcs.set(node.data.id, {
          innerR: Math.sqrt(p.y0 ?? 0),
          outerR: Math.sqrt(p.y1 ?? 0),
          startAngle: (p.x0 ?? 0) - Math.PI / 2,
          endAngle: (p.x1 ?? 0) - Math.PI / 2
        });
        x = 0;
        y = 0;
      } else if (isPack) {
        const packed = node;
        const [w, hSize] = this.opts.size ?? DEFAULT_PACK_SIZE;
        x = (node.x ?? 0) - w / 2;
        y = (node.y ?? 0) - hSize / 2;
        sizes.set(node.data.id, 2 * (packed.r ?? 0));
      } else if (isRadial) {
        const angle = node.x ?? 0;
        const r = node.y === 0 ? rootEpsilon : node.y ?? 0;
        x = r * Math.cos(angle - Math.PI / 2);
        y = r * Math.sin(angle - Math.PI / 2);
      } else {
        const orientation = this.opts.orientation ?? "vertical";
        const w = this.opts.size?.[0] ?? DEFAULT_CARTESIAN_SIZE[0];
        const breadth = (node.x ?? 0) - w / 2;
        const depth = node.y ?? 0;
        if (orientation === "horizontal") {
          x = depth;
          y = breadth;
        } else {
          x = breadth;
          y = depth;
        }
      }
      positions.set(node.data.id, [x + cx, y + cy]);
    });
    const buffer = new Float32Array(ids.length * 2);
    for (let i = 0, j = 0; i < ids.length; i++, j += 2) {
      const p = positions.get(ids[i]);
      if (p) {
        buffer[j] = p[0];
        buffer[j + 1] = p[1];
      }
    }
    return {
      ids,
      positions: buffer,
      meta: { sizes: isPack ? sizes : null, arcs: isSunburst ? arcs : null }
    };
  }
  /**
   * Flush pack circle sizes / sunburst arc geometry onto `style.shape` once the
   * node positions have settled. Each in its own store batch so the renderer
   * sees a single coalesced flush. No-op for the position-only modes.
   */
  onPositionsApplied(layer, meta) {
    const store = layer.store;
    const { sizes, arcs } = meta ?? { sizes: null, arcs: null };
    if (sizes) {
      store.batch(() => {
        for (const [id, diameter] of sizes) {
          const existing = store.getNode(id);
          if (!existing) continue;
          const existingStyle = existing.style && typeof existing.style === "object" ? existing.style : {};
          store.internal.updateNode(id, {
            style: { ...existingStyle, shape: { kind: "circle", radius: diameter / 2 } }
          });
        }
      });
    }
    if (arcs) {
      store.batch(() => {
        for (const [id, arc] of arcs) {
          const existing = store.getNode(id);
          if (!existing) continue;
          const existingStyle = existing.style && typeof existing.style === "object" ? existing.style : {};
          store.internal.updateNode(id, {
            style: {
              ...existingStyle,
              shape: {
                kind: "arc",
                innerR: arc.innerR,
                outerR: arc.outerR,
                startAngle: arc.startAngle,
                endAngle: arc.endAngle
              }
            }
          });
        }
      });
    }
  }
  // ─── internals ────────────────────────────────────────────────────────
  /**
   * Find the tree's root, validating that the snapshot is a tree at all.
   *
   * `groupId` names the group whose members are being laid out, when this run is
   * one level of a `includeGroups` recursion. It only affects the error text —
   * but it's the difference between "your graph isn't a tree" and "*this* group
   * isn't a subtree", and the latter is the only one a caller can act on.
   *
   * Failing loudly is deliberate. A group whose members don't form a subtree
   * has no tidy-tree solution, and quietly falling back to some other
   * arrangement inside one box — while every other box is a tree — produces a
   * picture whose inconsistency is much harder to diagnose than an error naming
   * the group.
   */
  resolveRoot(ids, parentCount, nodeById, recursing, groupId) {
    const scope = groupId === void 0 ? "" : ` in group "${groupId}"`;
    if (this.opts.rootId !== void 0) {
      const node = nodeById.get(this.opts.rootId);
      if (!node) {
        if (recursing) return this.findSingleRoot(ids, parentCount, nodeById, scope);
        throw new Error(`D3HierarchyLayout: rootId "${this.opts.rootId}" not found`);
      }
      return node;
    }
    return this.findSingleRoot(ids, parentCount, nodeById, scope);
  }
  /** The parentless node, if there is exactly one. See {@link resolveRoot}. */
  findSingleRoot(ids, parentCount, nodeById, scope) {
    let rootId = null;
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
        `D3HierarchyLayout: no root found${scope} \u2014 every node has an incoming edge (cycle?)`
      );
    }
    if (multipleRoots) {
      throw new Error(
        `D3HierarchyLayout: more than one root${scope}.` + (scope ? " A group laid out with `includeGroups` must contain a single subtree \u2014 its members need one parentless node and edges reaching all the others." : " Pass `rootId` to disambiguate.")
      );
    }
    for (const [id, count] of parentCount) {
      if (id !== rootId && count !== 1) {
        throw new Error(
          `D3HierarchyLayout: node "${id}" has ${count} parents${scope} \u2014 input must be a tree (each non-root node has exactly one parent).`
        );
      }
    }
    return nodeById.get(rootId);
  }
};

export { D3HierarchyLayout };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map