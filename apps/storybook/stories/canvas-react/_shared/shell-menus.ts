// Default right-click menu builders for the story shell — navigation + selection
// + highlight, each a single engine method off the `canvas` handed in on the
// menu context. Read-only (no structural edits); a story overrides any of them
// via `<StoryGraphApp nodeMenu / edgeMenu / backgroundMenu>`. Lifted verbatim
// from `GraphVisualiserApp.stories.tsx`.

import type {
  GraphBackgroundMenuContext,
  GraphEdgeMenuContext,
  GraphNodeMenuContext,
} from '@invana/canvas-react';
import type * as graph from '@invana/graph';
import type { MenuItem } from '@invana/ui';

import { FOCUS_ZOOM } from './shell-config';

/** Node menu: focus / select / select-neighbourhood / highlight. */
export function defaultNodeItems({ id, canvas }: GraphNodeMenuContext): MenuItem[] {
  const layer = canvas.layers.get<graph.GraphLayer>('graph');
  if (!layer) return [];
  const select = canvas.behaviours.get<graph.ClickSelectBehaviour>('click-select');
  return [
    {
      id: 'focus',
      label: 'Focus on node',
      // Select the node, then focus the camera on it (centre + zoom in).
      onClick: () => {
        select?.select(id, 'shape');
        layer.focusNode(id, { zoom: FOCUS_ZOOM });
      },
    },
    { id: 'select', label: 'Select node', onClick: () => select?.select(id, 'shape') },
    {
      id: 'select-hood',
      label: 'Select neighbourhood',
      onClick: () => select?.selectNeighbourhood(id),
    },
    {
      id: 'highlight',
      label: 'Highlight neighbours',
      onClick: () => layer.highlightNeighbourhood(id),
    },
  ];
}

/** Edge menu: focus / select / highlight (with its endpoints). */
export function defaultEdgeItems({ id, canvas }: GraphEdgeMenuContext): MenuItem[] {
  const layer = canvas.layers.get<graph.GraphLayer>('graph');
  if (!layer) return [];
  const store = layer.store;
  const select = canvas.behaviours.get<graph.ClickSelectBehaviour>('click-select');
  return [
    {
      id: 'focus',
      label: 'Focus on edge',
      // Centre + select the edge (no forced zoom — a long edge would clip).
      onClick: () => {
        select?.select(id, 'connector');
        layer.focusEdges([id]);
      },
    },
    { id: 'select', label: 'Select edge', onClick: () => select?.select(id, 'connector') },
    {
      id: 'highlight',
      label: 'Highlight edge',
      onClick: () => {
        // One batch → one flush → one paint.
        store.batch(() => {
          store.addEdgeState(id, 'highlighted');
          const ed = store.getEdge(id);
          if (ed) {
            store.addNodeState(ed.source, 'highlighted');
            store.addNodeState(ed.target, 'highlighted');
          }
        });
      },
    },
  ];
}

/** Background menu: fit / select-all / clear-selection / clear-highlights. */
export function defaultBackgroundItems({ canvas }: GraphBackgroundMenuContext): MenuItem[] {
  const layer = canvas.layers.get<graph.GraphLayer>('graph');
  if (!layer) return [];
  const store = layer.store;
  const select = canvas.behaviours.get<graph.ClickSelectBehaviour>('click-select');
  return [
    {
      id: 'fit',
      label: 'Fit to content',
      onClick: () => canvas.camera.fitContent(layer.getBounds(), 80),
    },
    { id: 'select-all', label: 'Select all', shortcut: '⌘A', onClick: () => select?.selectAll() },
    { id: 'clear-sel', label: 'Clear selection', onClick: () => select?.clearSelection() },
    {
      id: 'clear-hl',
      label: 'Clear highlights',
      onClick: () => {
        store.clearNodeState('highlighted');
        store.clearEdgeState('highlighted');
      },
    },
  ];
}
