/** Les Misérables cut down for the board stories: Valjean and everyone who shares a scene with him. */

import type { GraphData } from '@invana/graph';
import { flareImportsAsGraph, lesMiserables } from '@invana/graph-datasets';

export function valjeanScenes(): GraphData {
  const ids = new Set(['Valjean']);
  for (const e of lesMiserables.edges) {
    if (e.source === 'Valjean') ids.add(e.target);
    if (e.target === 'Valjean') ids.add(e.source);
  }
  return {
    nodes: lesMiserables.nodes.filter((n) => ids.has(n.id)),
    edges: lesMiserables.edges.filter((e) => ids.has(e.source) && ids.has(e.target))
  };
}

/** Flare's class-to-class imports — ~2,000 relationships, dense enough to fade and thin. */
export function flareImports(): GraphData {
  const { nodes, importEdges } = flareImportsAsGraph();
  return { nodes, edges: importEdges } as unknown as GraphData;
}
