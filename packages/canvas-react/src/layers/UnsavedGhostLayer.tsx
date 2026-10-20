import * as graph from '@invana/graph';
import type { GraphData, GraphEdge, GraphNode, UnsavedChangesSummary } from '@invana/graph';
import { useEffect } from 'react';

import { useCanvas } from '../CanvasContext';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';

export interface UnsavedGhostLayerProps {
  /** Layer id; default `'unsaved-ghosts'`. */
  id?: string;
  /** The `UnsavedChangesBehaviour` whose deletions are drawn; default `'unsaved-changes'`. */
  trackerId?: string;
  /** The graph layer the deletions came from; default `'graph'`. */
  sourceLayerId?: string;
}

/** A ghost: faded and dashed. */
const GHOST_NODE = { bgAlpha: 0.25, bgStrokeAlpha: 0.6, bgStrokeDashArray: [4, 3] as [number, number], labelAlpha: 0.5 };
const GHOST_EDGE = { strokeAlpha: 0.35, strokeDashArray: [4, 4] as [number, number] };
/** An end a ghost relationship still needs, drawn by the graph layer already: invisible here. */
const ANCHOR = { bgAlpha: 0, bgStrokeAlpha: 0, labelText: '' };

/**
 * Draws what was **deleted** since the last save as ghosts, in place, under the
 * graph — so a deletion stays visible until it is saved. Reads the
 * `UnsavedChangesBehaviour`; draws nothing while there are no deletions.
 *
 * Its own `GraphLayer` (`zIndex -1`, not hittable), detached from the canvas's
 * history: ghosts are never undoable and never saved. A ghost relationship whose
 * other end is still on the board gets an invisible anchor at that node, moved
 * with it.
 */
export function UnsavedGhostLayer({ id = 'unsaved-ghosts', trackerId = 'unsaved-changes', sourceLayerId = 'graph' }: UnsavedGhostLayerProps) {
  const canvas = useCanvas();
  const { summary } = useUnsavedChanges(trackerId, canvas);

  useEffect(() => {
    const layer = new graph.GraphLayer({
      id,
      zIndex: -1,
      hittable: false,
      options: { node: { style: GHOST_NODE }, edge: { style: GHOST_EDGE } },
    });
    canvas.layers.add(layer);
    // Ghosts are a drawing of the change set, never a change themselves.
    layer.store.attachLog(undefined);
    return () => void canvas.layers.remove(id);
  }, [canvas, id]);

  useEffect(() => {
    const ghosts = canvas.layers.get<graph.GraphLayer>(id);
    const source = canvas.layers.get<graph.GraphLayer>(sourceLayerId);
    if (!ghosts || !source) return;
    const draw = () => ghosts.store.internal.run(() => ghosts.setData(ghostData(summary, source)));
    draw();
    // An anchor follows its live node.
    if (summary.edges.deleted.length === 0) return;
    let frame = 0;
    const off = source.events.on('positions:updated', () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        draw();
      });
    });
    return () => {
      off();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [canvas, id, sourceLayerId, summary]);

  return null;
}

/** The deleted nodes and relationships, plus an invisible anchor for each live end. */
function ghostData(summary: UnsavedChangesSummary, source: graph.GraphLayer): GraphData {
  // A ghost wears what the graph drew for it, faded and dashed on top.
  const ghostNode = (n: GraphNode): GraphNode => ({ ...n, states: [], style: { ...source.resolveNodeStyle(n), ...GHOST_NODE } });
  const ghostEdge = (e: GraphEdge): GraphEdge => ({ ...e, states: [], style: { ...source.resolveEdgeStyle(e), ...GHOST_EDGE } });
  const nodes = new Map<string, GraphNode>(summary.nodes.deleted.map((n) => [n.id, ghostNode(n)]));
  const edges: GraphEdge[] = [];
  for (const e of summary.edges.deleted) {
    for (const end of [e.source, e.target]) {
      if (nodes.has(end)) continue;
      const live = source.store.getNode(end);
      if (live) nodes.set(end, { id: end, type: live.type, position: live.position, style: { ...source.resolveNodeStyle(live), ...ANCHOR } });
    }
    if (nodes.has(e.source) && nodes.has(e.target)) edges.push(ghostEdge(e));
  }
  return { nodes: [...nodes.values()], edges };
}
