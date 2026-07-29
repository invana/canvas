/**
 * `SubgraphPositionLayout` — the base for one-shot layouts that can be run over
 * an **arbitrary set of nodes and edges**, rather than only over a whole layer.
 *
 * Subclasses implement {@link computeSubgraphLayout} (place these ids, given
 * these edges and sizes) instead of `computeLayout(layer)`. Declaring that
 * capability buys them **group containment for free**: this base runs the
 * layout once per group — deepest first — packs each group's members into a box
 * sized from the group's own {@link GroupOptions}, treats that box as a single
 * super-node one level up, and finally translates every member into place.
 *
 * ## Why a declared capability rather than a fake layer
 *
 * The alternative was to hand a layout a filtered *view* of the `GraphLayer` and
 * let it believe it was laying out the whole graph. That needs no subclass
 * changes, but it makes "can this layout be nested?" a runtime gamble: the view
 * has to implement whatever slice of the layer/store surface each layout happens
 * to reach for, discovered by inspection and free to regress silently. A layout
 * that implements {@link computeSubgraphLayout} states its independence from the
 * layer in the type system — and a snapshot-driven compute is the shape these
 * layouts want anyway if they ever move off the main thread.
 *
 * ## What recursion cannot do
 *
 * A group's members are laid out **blind to the outside world** — edges leaving
 * the group don't influence placement inside it, so a member with an external
 * neighbour can land on the far side of its box. Engines with native compound
 * support (ELK's `elk.hierarchyHandling: INCLUDE_CHILDREN`) route across
 * container boundaries and don't have this weakness, which is why `ElkLayout`
 * keeps its own path instead of extending this class. Recursion buys correct
 * *containment* everywhere; it doesn't buy ELK-quality aesthetics.
 *
 * @see docs/group-aware-layouts-plan.md
 */

import type { GraphLayer } from '../layer/GraphLayer';
import { OneShotPositionLayout, type LayoutPositions, type OneShotLayoutOptions } from './OneShotPositionLayout';
import {
  buildGroupForest,
  collectLayoutEdges,
  collectPlaceableNodes,
  groupInsets,
  groupSizeFloor,
  resolveNodeSize,
  type GroupForestNode,
  type LayoutEdge,
  type LayoutNodeSize,
} from './groups';

/** A point in layout space. Centre coordinates, matching `GraphNode.position`. */
interface Vec2 {
  x: number;
  y: number;
}

/**
 * The node/edge set handed to {@link SubgraphPositionLayout.computeSubgraphLayout}.
 *
 * A subgraph is self-contained: every edge's endpoints are in `ids`, and every
 * id has a size. When the run is nested, `groupId` names the group whose members
 * these are — a layout may use it for messages, but must not read the store
 * through it (the point of the snapshot is that it doesn't have to).
 */
export interface LayoutSubgraph {
  /** The nodes to place. Never empty. */
  readonly ids: readonly string[];
  /** Edges between `ids`. Deduplicated; no self-loops. */
  readonly edges: readonly LayoutEdge[];
  /**
   * The footprint to reserve for `id`. For a nested group this is the **box**
   * computed from its members, not the frame's stored size.
   */
  sizeOf(id: string): LayoutNodeSize;
  /** Current position of `id`, when it has one (for layouts that seed from it). */
  getPosition(id: string): Vec2 | undefined;
  /**
   * The node's opaque `data` payload — what value accessors read (circle-pack
   * sizing, sunburst weights). Kept on the snapshot so a layout never needs the
   * store to reach it.
   */
  dataOf(id: string): unknown;
  /**
   * Whether `id` is a group container rather than an ordinary node.
   *
   * A layout that derives topology from *edges* needs this: a group frame has
   * no edges of its own, so an algorithm that treats every id as part of the
   * edge graph will read it as a disconnected component (a second tree root, an
   * isolated cluster) and either fail or place it nonsensically. Layouts that
   * only place boxes can ignore it.
   */
  isGroup(id: string): boolean;
  /** The group these nodes are members of; `undefined` at the top level. */
  readonly groupId?: string;
}

/** Options shared by every layout that can lay groups out recursively. */
export interface SubgraphLayoutOptions extends OneShotLayoutOptions {
  /**
   * Lay `parentId` **groups** out as containers — each group's members are
   * placed among themselves, then the whole group is placed as one box at its
   * parent's level. Only nodes whose resolved style carries `group` count as
   * containers; a plain `parentId` tree is unaffected.
   *
   * Default `false`. Containment is exact, but a group's interior is solved
   * without sight of its external edges — see the class docs. Prefer
   * `ElkLayout` when edge routing across group boundaries matters.
   */
  includeGroups?: boolean;
}

/**
 * The interior solution for one group: where its members sit in the group's own
 * coordinates, and how big the resulting box is.
 */
interface GroupBox {
  /** Box footprint including insets and any declared floor. */
  size: LayoutNodeSize;
  /** Member centres in local coordinates (as returned by the subclass). */
  local: Map<string, Vec2>;
  /** Local AABB of the members, before insets. */
  contentMin: Vec2;
  /** Local AABB extent of the members. */
  contentSize: LayoutNodeSize;
}

export abstract class SubgraphPositionLayout<
  TOpts extends SubgraphLayoutOptions = SubgraphLayoutOptions,
> extends OneShotPositionLayout<TOpts> {
  /**
   * Place `sub.ids` using `sub.edges`, returning **centre** coordinates.
   *
   * Called once for a flat run, or once per group plus once for the top level
   * when {@link SubgraphLayoutOptions.includeGroups} is on. Implementations must
   * treat the subgraph as the whole world: coordinates are interpreted relative
   * to whatever container the run belongs to, so absolute placement (centring on
   * the origin, etc.) is fine and gets translated afterwards.
   *
   * Return `null` to no-op the run.
   */
  protected abstract computeSubgraphLayout(
    sub: LayoutSubgraph,
  ): LayoutPositions | null | Promise<LayoutPositions | null>;

  /**
   * Whether this layout can be run recursively over groups **in its current
   * configuration**. Default `true`.
   *
   * Override to veto per-mode. Two things make a layout un-recursable: output
   * that isn't purely positional (a mode that also assigns node *geometry* —
   * circle-pack radii, sunburst arcs — since the per-run `meta` carrying that
   * geometry can't be merged across many runs), or a topology contract the
   * per-group subgraph can't satisfy. Vetoing falls back to one flat run, which
   * still prunes collapsed members and still lets `autoFit` frames wrap their
   * members — it just doesn't pack them into boxes.
   */
  protected canRecurseGroups(): boolean {
    return true;
  }

  /**
   * Snapshot the layer and either run the subclass once (flat) or drive the
   * group recursion. Subclasses normally leave this alone — override only for a
   * layout that needs the layer itself, and then it probably shouldn't extend
   * this class.
   */
  protected async computeLayout(layer: GraphLayer): Promise<LayoutPositions | null> {
    const placeable = collectPlaceableNodes(layer, this.opts.includeHidden === true);
    if (placeable.size === 0) return null;

    const edges = collectLayoutEdges(layer, placeable);
    const sizes = new Map<string, LayoutNodeSize>();
    const sizeOf = (id: string): LayoutNodeSize => {
      let size = sizes.get(id);
      if (!size) {
        const node = layer.store.getNode(id);
        size = node ? resolveNodeSize(layer, node) : { width: 40, height: 40 };
        sizes.set(id, size);
      }
      return size;
    };
    const getPosition = (id: string): Vec2 | undefined => layer.store.getPosition(id);
    const dataOf = (id: string): unknown => layer.store.getNode(id)?.data;
    const isGroup = (id: string): boolean => {
      const node = layer.store.getNode(id);
      return node ? layer.isGroupNode(node) : false;
    };

    const recursing = this.opts.includeGroups === true && this.canRecurseGroups();
    const forest = recursing ? buildGroupForest(layer, placeable) : null;
    // No group actually nests anything → the recursion would collapse to a
    // single flat run anyway, so skip its bookkeeping entirely.
    const nests = forest?.some((n) => n.children.length > 0) ?? false;
    if (!forest || !nests) {
      return this.runSubgraph({
        ids: [...placeable],
        edges,
        sizeOf,
        getPosition,
        dataOf,
        isGroup,
      });
    }
    return this.solveRecursively(layer, forest, edges, sizeOf, getPosition, dataOf, isGroup);
  }

  /** Run the subclass over one subgraph, normalising an empty result to `null`. */
  private async runSubgraph(sub: LayoutSubgraph): Promise<LayoutPositions | null> {
    const result = await Promise.resolve(this.computeSubgraphLayout(sub));
    if (!result || result.ids.length === 0) return null;
    return result;
  }

  /**
   * The recursive group solve: post-order to size every group from its members,
   * then pre-order to translate local solutions into world coordinates.
   */
  private async solveRecursively(
    layer: GraphLayer,
    forest: GroupForestNode[],
    edges: readonly LayoutEdge[],
    sizeOf: (id: string) => LayoutNodeSize,
    getPosition: (id: string) => Vec2 | undefined,
    dataOf: (id: string) => unknown,
    isGroup: (id: string) => boolean,
  ): Promise<LayoutPositions | null> {
    // Forest parentage, so an edge between two arbitrary nodes can be lifted to
    // whichever pair of siblings represents them at a given level.
    const forestParent = new Map<string, string>();
    const walkParents = (node: GroupForestNode): void => {
      for (const child of node.children) {
        forestParent.set(child.id, node.id);
        walkParents(child);
      }
    };
    for (const root of forest) walkParents(root);

    const boxes = new Map<string, GroupBox>();
    /** Effective footprint: a solved group's box, else the node's own size. */
    const effectiveSize = (id: string): LayoutNodeSize => boxes.get(id)?.size ?? sizeOf(id);

    /**
     * Lift every edge to this level: each endpoint climbs to the sibling that
     * contains it. Edges wholly inside one sibling, or leaving the level
     * entirely, carry no information about how these siblings should sit
     * relative to each other.
     */
    const edgesForLevel = (levelIds: ReadonlySet<string>): LayoutEdge[] => {
      const out: LayoutEdge[] = [];
      const seen = new Set<string>();
      const lift = (id: string): string | undefined => {
        let current: string | undefined = id;
        while (current && !levelIds.has(current)) current = forestParent.get(current);
        return current;
      };
      for (const edge of edges) {
        const source = lift(edge.source);
        const target = lift(edge.target);
        if (!source || !target || source === target) continue;
        const key = `${source} ${target}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ id: `${edge.id} ${source} ${target}`, source, target });
      }
      return out;
    };

    /** Solve one level (a group's members, or the forest roots). */
    const solveLevel = async (
      siblings: GroupForestNode[],
      groupId: string | undefined,
    ): Promise<Map<string, Vec2>> => {
      const ids = siblings.map((s) => s.id);
      const levelIds = new Set(ids);
      const sub: LayoutSubgraph = {
        ids,
        edges: edgesForLevel(levelIds),
        sizeOf: effectiveSize,
        getPosition,
        dataOf,
        isGroup,
        groupId,
      };
      const placed = new Map<string, Vec2>();
      // A single-node level has nothing to solve — and some algorithms reject a
      // one-node graph outright. Put it at the origin of its own frame.
      if (ids.length === 1) {
        placed.set(ids[0]!, { x: 0, y: 0 });
        return placed;
      }
      const result = await this.runSubgraph(sub);
      if (!result) {
        for (const id of ids) placed.set(id, getPosition(id) ?? { x: 0, y: 0 });
        return placed;
      }
      for (let i = 0; i < result.ids.length; i++) {
        placed.set(result.ids[i]!, { x: result.positions[i * 2]!, y: result.positions[i * 2 + 1]! });
      }
      // A layout that placed only some ids leaves the rest where they were.
      for (const id of ids) if (!placed.has(id)) placed.set(id, getPosition(id) ?? { x: 0, y: 0 });
      return placed;
    };

    /** Post-order: solve each group's interior and derive its box size. */
    const sizeGroup = async (node: GroupForestNode): Promise<void> => {
      for (const child of node.children) await sizeGroup(child);
      if (node.children.length === 0) return;

      const local = await solveLevel(node.children, node.id);
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const child of node.children) {
        const p = local.get(child.id)!;
        const s = effectiveSize(child.id);
        minX = Math.min(minX, p.x - s.width / 2);
        minY = Math.min(minY, p.y - s.height / 2);
        maxX = Math.max(maxX, p.x + s.width / 2);
        maxY = Math.max(maxY, p.y + s.height / 2);
      }
      const contentSize = { width: maxX - minX, height: maxY - minY };

      const groupNode = layer.store.getNode(node.id);
      const insets = groupNode
        ? groupInsets(layer, groupNode)
        : { top: 16, right: 16, bottom: 16, left: 16 };
      const floor = groupNode ? groupSizeFloor(layer, groupNode) : undefined;
      const size: LayoutNodeSize = {
        width: Math.max(insets.left + contentSize.width + insets.right, floor?.width ?? 0),
        height: Math.max(insets.top + contentSize.height + insets.bottom, floor?.height ?? 0),
      };
      boxes.set(node.id, { size, local, contentMin: { x: minX, y: minY }, contentSize });
    };
    for (const root of forest) await sizeGroup(root);

    // Top level: every root placed as one box, then translated outward.
    const topLevel = await solveLevel(forest, undefined);

    const ids: string[] = [];
    const xy: number[] = [];
    /** Pre-order: write `node` at `centre`, then place its members inside it. */
    const place = (node: GroupForestNode, centre: Vec2): void => {
      ids.push(node.id);
      xy.push(centre.x, centre.y);
      const box = boxes.get(node.id);
      if (!box) return;
      const groupNode = layer.store.getNode(node.id);
      const insets = groupNode
        ? groupInsets(layer, groupNode)
        : { top: 16, right: 16, bottom: 16, left: 16 };
      // When a declared floor made the box larger than its contents need, centre
      // the slack rather than letting the members hug the top-left corner.
      const slackX = box.size.width - (insets.left + box.contentSize.width + insets.right);
      const slackY = box.size.height - (insets.top + box.contentSize.height + insets.bottom);
      const contentX = centre.x - box.size.width / 2 + insets.left + Math.max(0, slackX) / 2;
      const contentY = centre.y - box.size.height / 2 + insets.top + Math.max(0, slackY) / 2;
      for (const child of node.children) {
        const p = box.local.get(child.id)!;
        place(child, {
          x: contentX + (p.x - box.contentMin.x),
          y: contentY + (p.y - box.contentMin.y),
        });
      }
    };
    for (const root of forest) place(root, topLevel.get(root.id) ?? { x: 0, y: 0 });

    if (ids.length === 0) return null;
    return { ids, positions: new Float32Array(xy) };
  }
}
