/**
 * The classic **Tree of Life** — a small phylogenetic tree of 145 prokaryote +
 * eukaryote species partitioned into the three top-level kingdoms (Bacteria,
 * Eukaryota, Archaea). It's the dataset behind d3's
 * [Tree of Life](https://observablehq.com/@d3/tree-of-life) example, sourced
 * from Ciccarelli et al. (2006).
 *
 * Two shapes are exposed:
 *  - `lifeTreeHierarchy` — the parsed Newick tree as a `{name, length, children?}`
 *    nested object.
 *  - `lifeTreeAsGraph()` — a flat `{nodes, edges}` projection that drops
 *    straight into `GraphLayer.setData`. Each edge points from parent to
 *    child; each node carries its inherited `kingdom` so consumers can colour
 *    sub-trees by domain of life.
 *
 * @example
 * import { lifeTreeAsGraph } from '@invana/graph-datasets';
 * graphLayer.setData(lifeTreeAsGraph());
 */

import type { CanvasData } from '../types';

import { LIFE_TREE_NEWICK } from './newick';

/** The three domains of life. Set on every node beneath a top-level clade. */
export type LifeTreeKingdom = 'Bacteria' | 'Eukaryota' | 'Archaea';

/** Node shape in the parsed Newick hierarchy. */
export interface LifeTreeNode {
  /** Clade or species name. May be empty for anonymous internal nodes. */
  name: string;
  /** Branch length to parent (substitution rate). `undefined` on the root. */
  length?: number;
  /** Child clades. Leaves omit this field. */
  children?: LifeTreeNode[];
}

/** A single node in the flat projection. */
export interface LifeTreeGraphNode {
  id: string;
  data: {
    /** Original Newick name. Empty for anonymous internal clades. */
    name: string;
    /** Depth from root. Root is 0. */
    depth: number;
    /** True iff this node has no children. */
    isLeaf: boolean;
    /** Branch length to parent (substitution rate). `undefined` on the root. */
    length?: number;
    /**
     * Top-level domain of life. Inherited from the nearest ancestor whose name
     * is `'Bacteria'`, `'Eukaryota'`, or `'Archaea'`. The root and its two
     * pre-domain wrapper nodes have no kingdom.
     */
    kingdom?: LifeTreeKingdom;
  };
}

/** A single parent→child edge in the flat projection. */
export interface LifeTreeGraphEdge {
  id: string;
  source: string;
  target: string;
}

/** Output of {@link lifeTreeAsGraph}. */
export interface LifeTreeGraphData {
  nodes: LifeTreeGraphNode[];
  edges: LifeTreeGraphEdge[];
}

const KINGDOMS = new Set<string>(['Bacteria', 'Eukaryota', 'Archaea']);

/**
 * Minimal Newick parser. Handles the dialect used by the d3 tree-of-life
 * dataset:
 *
 *   tree     = subtree ';'
 *   subtree  = leaf | internal
 *   leaf     = label
 *   internal = '(' subtree (',' subtree)* ')' label
 *   label    = name? (':' length)? ('[' comment ']')?
 *
 * Comments (`[...]`) are bootstrap values; we discard them. Names containing
 * `/` (e.g. `Tropheryma_whipplei_TW08/27`) are passed through verbatim.
 */
function parseNewick(text: string): LifeTreeNode {
  let pos = 0;

  const skipComment = (): void => {
    if (text[pos] !== '[') return;
    while (pos < text.length && text[pos] !== ']') pos++;
    if (text[pos] === ']') pos++;
  };

  const parseLabel = (): { name: string; length?: number } => {
    let name = '';
    while (pos < text.length && '(),:;'.indexOf(text[pos]!) === -1) {
      if (text[pos] === '[') {
        skipComment();
        continue;
      }
      name += text[pos++];
    }
    let length: number | undefined;
    if (text[pos] === ':') {
      pos++;
      let n = '';
      while (pos < text.length && /[\d.eE+\-]/.test(text[pos]!)) n += text[pos++];
      length = n.length > 0 ? parseFloat(n) : undefined;
    }
    skipComment();
    return { name, length };
  };

  const parseNode = (): LifeTreeNode => {
    let children: LifeTreeNode[] | undefined;
    if (text[pos] === '(') {
      pos++;
      children = [parseNode()];
      while (text[pos] === ',') {
        pos++;
        children.push(parseNode());
      }
      if (text[pos] === ')') pos++;
    }
    const { name, length } = parseLabel();
    return children ? { name, length, children } : { name, length };
  };

  const root = parseNode();
  return root;
}

/** The parsed Tree of Life as a nested hierarchy. Computed once. */
export const lifeTreeHierarchy: LifeTreeNode = parseNewick(LIFE_TREE_NEWICK);

/**
 * Flatten {@link lifeTreeHierarchy} to a `{nodes, edges}` shape compatible
 * with `GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined
 * path ids so anonymous internal clades — and duplicate names across branches
 * — stay distinct. Each node carries its inherited `kingdom`.
 *
 * The Newick source reuses generic clade labels (e.g. `Bacteria_subclade`)
 * across many sibling positions, so a plain slash-path can collide. When that
 * happens, the colliding child gets a numeric suffix (`_2`, `_3`, …) so every
 * emitted id is unique while the readable path is preserved in the common
 * case.
 */
export function lifeTreeAsGraph(): LifeTreeGraphData {
  const nodes: LifeTreeGraphNode[] = [];
  const edges: LifeTreeGraphEdge[] = [];
  let edgeCounter = 0;
  let anonCounter = 0;
  const seen = new Set<string>();

  interface Pending {
    node: LifeTreeNode;
    parentId: string | null;
    path: string;
    depth: number;
    kingdom: LifeTreeKingdom | undefined;
  }

  // Root's id is its name if any, else `clade_0`. The tree-of-life root is
  // anonymous in this dataset.
  const rootSegment = lifeTreeHierarchy.name || `clade_${anonCounter++}`;
  seen.add(rootSegment);
  const queue: Pending[] = [
    {
      node: lifeTreeHierarchy,
      parentId: null,
      path: rootSegment,
      depth: 0,
      kingdom: undefined,
    },
  ];

  while (queue.length > 0) {
    const { node, parentId, path, depth, kingdom } = queue.shift()!;
    const isLeaf = !node.children || node.children.length === 0;
    nodes.push({
      id: path,
      data: {
        name: node.name,
        depth,
        isLeaf,
        ...(node.length !== undefined ? { length: node.length } : {}),
        ...(kingdom !== undefined ? { kingdom } : {}),
      },
    });
    if (parentId !== null) {
      edges.push({ id: `e${edgeCounter++}`, source: parentId, target: path });
    }
    if (node.children) {
      for (const child of node.children) {
        const segment = child.name || `clade_${anonCounter++}`;
        let candidate = `${path}/${segment}`;
        if (seen.has(candidate)) {
          let n = 2;
          while (seen.has(`${candidate}_${n}`)) n++;
          candidate = `${candidate}_${n}`;
        }
        seen.add(candidate);
        // Inherit kingdom from parent; a node *named* Bacteria/Eukaryota/Archaea
        // seeds it for its whole subtree (the named clade itself is the first
        // node to carry the kingdom).
        const childKingdom: LifeTreeKingdom | undefined = KINGDOMS.has(child.name)
          ? (child.name as LifeTreeKingdom)
          : kingdom;
        queue.push({
          node: child,
          parentId: path,
          path: candidate,
          depth: depth + 1,
          kingdom: childKingdom,
        });
      }
    }
  }

  return { nodes, edges };
}

/** The flattened tree of life, engine-ready. Same value as {@link lifeTreeAsGraph}(). */
export const data: CanvasData = lifeTreeAsGraph() as unknown as CanvasData;
