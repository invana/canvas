/**
 * Graph **modeller / drawing** tool — a full drawing toolbar (`ModellerToolbar`)
 * over the canvas, the modeller counterpart of the `HistoryToolbar` pattern:
 *
 *   - **Select** — drag nodes, click to select (DragNode + ClickSelect on).
 *   - **Add**    — click empty canvas to drop a node (CreateNode on). The shape
 *                  picker chooses what the next click drops (circle / rect /
 *                  diamond).
 *   - **Connect**— drag node→node to draw an edge (dashed rubber-band; DrawEdge
 *                  on). Release on the same node for a self-loop. Parallel edges
 *                  between a pair fan out automatically.
 *   - **Delete** — click a node (cascades its edges) or an edge to erase it
 *                  (Erase on).
 *
 * Clicking a single node or edge (in Select) opens an `InspectorPanel`. In this
 * modeller both edit a single **type** field (`InspectorPanel typeAsLabel`) that
 * also drives the drawn label — in modelling the type *is* what's shown — plus
 * arbitrary **key/value properties** (`data`); edges add a **Reverse direction**
 * button. Apply commits an undoable update. The inspector is driven by a dedicated
 * `ClickInspectBehaviour` (separate from `ClickSelectBehaviour`), so it always
 * follows the element you last clicked, independent of the selection used for
 * multi-node drag.
 *
 * The toolbar self-wires from two providers: `GraphToolProvider` holds the
 * active tool + node shape (the behaviours below gate their `enabled` on
 * `useTool().tool`); `GraphHistoryProvider` makes **every** edit — add, connect,
 * delete, drag, clear — undoable via the bar's Undo / Redo. `useDrawHistory`
 * journals the create / connect / delete gestures.
 *
 * Click **Select**, click the active tool again, or press **Esc** to leave a
 * drawing tool.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  MousePointer2,
  Plus,
  Spline,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Circle,
  Square,
  Diamond,
  Sun,
  Moon,
} from 'lucide-react';
import {
  Canvas,
  BackgroundLayer,
  GraphLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  ResponsiveThemeBehaviour,
  DragNodeBehaviour,
  ClickSelectBehaviour,
  ClickInspectBehaviour,
  CreateNodeBehaviour,
  DrawEdgeBehaviour,
  EraseBehaviour,
  ParallelEdgeBehaviour,
  ContextMenuBehaviour,
  ContextMenuOverlay,
  GraphHistoryProvider,
  GraphToolProvider,
  ModellerToolbar,
  InspectorPanel,
  Panel,
  ThemeToggle,
  useCanvas,
  useTool,
  useDrawHistory,
  useFitContent,
  useClearGraph,
  useContextMenu,
} from '@invana/canvas-react';
import type {
  GraphData,
  GraphEdge,
  NodeShapeOptions,
  ContextMenuEvent,
  ClickInspectBehaviour as EngineClickInspectBehaviour,
  GraphLayer as EngineGraphLayer,
} from '@invana/graph';
import { TooltipProvider, type MenuItem } from '@invana/ui';

const meta: Meta = { title: 'canvas-react/usecases/GraphModeller' };
export default meta;
type Story = StoryObj;

const SEED: GraphData = {
  nodes: [
    { id: 'a', position: { x: -120, y: -60 }, style: { labelText: 'A' } },
    { id: 'b', position: { x: 120, y: -60 }, style: { labelText: 'B' } },
    { id: 'c', position: { x: 0, y: 90 }, style: { labelText: 'C' } },
  ],
  edges: [{ id: 'a-b', source: 'a', target: 'b' }],
};

/** Node shapes the Add tool can drop, keyed by the picker's option key. */
const SHAPES: Record<string, NodeShapeOptions> = {
  circle: { kind: 'circle', radius: 22 },
  rect: { kind: 'rect', width: 52, height: 36, cornerRadius: 6 },
  diamond: { kind: 'regular-polygon', sides: 4, radius: 26 },
};

/**
 * Group by unordered node pair so edges drawn either way fan apart together.
 * Self-loops (source === target) are excluded — they use loop routing, not
 * the parallel-edge bow.
 */
const undirectedPair = (e: GraphEdge): string | null =>
  e.source === e.target ? null : [e.source, e.target].sort().join('::');

const HINTS: Record<string, string> = {
  select:
    'Drag a node to move it · click a node or edge to edit it · click empty canvas to clear',
  add: 'Click empty canvas to add a node · pick its shape in the toolbar · Esc to exit',
  connect: 'Drag node→node to connect · release on the same node for a self-loop · Esc to exit',
  delete: 'Click a node (removes its edges) or an edge to erase it · Esc to exit',
};

/**
 * Flip the `@invana/ui` chrome (toolbar buttons, menus) to match the canvas
 * theme, so the floating controls stay legible against the canvas instead of
 * following the OS independently. Mirrors the storybook's own `bootstrapOsTheme`
 * (`.storybook/preview.ts`), which switches the design-kit by `data-theme`.
 */
function applyChromeTheme(dark: boolean): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', dark ? 'default-dark' : 'default-light');
  root.classList.remove('theme-default-light', 'theme-default-dark', 'light', 'dark');
  root.classList.add(dark ? 'theme-default-dark' : 'theme-default-light', dark ? 'dark' : 'light');
}

/** Whether the OS currently prefers a dark colour scheme. */
function osPrefersDark(): boolean {
  return (
    typeof window !== 'undefined'
    && !!window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/**
 * The drawing behaviours + toolbar. Lives inside both providers so it can read
 * the active tool (`useTool`) and journal gestures (`useDrawHistory`). Each
 * behaviour's `enabled` is gated on the active tool — only one is live at a time.
 */
function DrawingTools() {
  const { tool, nodeKind } = useTool();
  const draw = useDrawHistory();

  // The Add tool's createNode factory is captured once by the behaviour; read
  // the live shape + a running counter through refs so it stays current.
  const nodeKindRef = useRef(nodeKind);
  nodeKindRef.current = nodeKind;
  const seqRef = useRef(SEED.nodes.length);

  return (
    <>
      {/* Mode-gated — only `enabled` flips; nothing remounts. */}
      <DragNodeBehaviour layerId="graph" enabled={tool === 'select'} />
      <ClickSelectBehaviour layerId="graph" enabled={tool === 'select'} multiple={false} />
      {/* Click-to-edit target for the InspectorPanel — a dedicated behaviour so
          the editor follows the last-clicked node/edge regardless of the
          (multi-)selection ClickSelect maintains for dragging. */}
      <ClickInspectBehaviour layerId="graph" enabled={tool === 'select'} />
      <CreateNodeBehaviour
        layerId="graph"
        enabled={tool === 'add'}
        createNode={(world) => {
          const n = (seqRef.current += 1);
          return {
            id: `n-${n}-${Date.now().toString(36)}`,
            position: world,
            style: { shape: SHAPES[nodeKindRef.current] ?? SHAPES.circle, labelText: String(n) },
          };
        }}
        onNodeCreate={draw.onNodeCreate}
      />
      <DrawEdgeBehaviour
        layerId="graph"
        enabled={tool === 'connect'}
        allowSelfLoop
        onEdgeCreate={draw.onEdgeCreate}
      />
      <EraseBehaviour layerId="graph" enabled={tool === 'delete'} onErase={draw.onErase} />
      {/* Fan out edges that share a node pair (drawn either direction). */}
      <ParallelEdgeBehaviour layerId="graph" spacing={18} groupBy={undirectedPair} />

      <ModellerToolbar
        icons={{
          select: MousePointer2,
          add: Plus,
          connect: Spline,
          delete: Eraser,
          undo: Undo2,
          redo: Redo2,
          clear: Trash2,
        }}
        nodeKinds={{ circle: 'Circle', rect: 'Rectangle', diamond: 'Diamond' }}
        nodeKindIcons={{ circle: Circle, rect: Square, diamond: Diamond }}
      />

      {/* Switch the graph theme (drives <ResponsiveThemeBehaviour>) to test the
          light/dark node + edge styling without changing the OS appearance. Flips
          the background grid in lockstep so the whole canvas stays coherent. */}
      <Panel position="top-left">
        <ThemeToggle
          lightIcon={Sun}
          darkIcon={Moon}
          backgroundLayerId="background"
          onChange={(kind) => applyChromeTheme(kind === 'dark')}
        />
      </Panel>

      {/* Click a node/edge (Select tool) → edit its `type` (shown as the drawn
          label in modelling) + key/value properties; edges add a reverse-direction
          button. `typeAsLabel` mirrors the type to the label for both. Apply
          commits an undoable update. Reads the click-inspect target above. */}
      <InspectorPanel layerId="graph" position="top-right" typeAsLabel />

      {/* Contextual hint for the active tool. */}
      <Panel position="bottom-center">
        <span style={hintStyle}>{HINTS[tool]}</span>
      </Panel>
    </>
  );
}

/**
 * Right-click context menus for the modeller — node / edge / empty-canvas, each
 * carrying **real, undoable** edits wired through the modeller's hooks (so the
 * toolbar's Undo / Redo reverse them):
 *
 *   - **Node** — Edit (targets it on `ClickInspectBehaviour` → opens the
 *     `InspectorPanel`), Pin / Unpin (`store.updateNode`), Add connected node
 *     (`upsertNode` + `upsertEdge`, journalled via `useDrawHistory`), Delete
 *     (cascade `removeNode`, journalled).
 *   - **Edge** — Edit (targets it on `ClickInspectBehaviour`), Reverse direction
 *     (`updateEdge`), Delete (`removeEdge`, journalled).
 *   - **Canvas** — Add node here (`upsertNode` at the cursor, journalled), Fit to
 *     content (`useFitContent`), Clear all (`useClearGraph`, undoable).
 *
 * Lives inside `<GraphHistoryProvider>` (shares the toolbar's history) and inside
 * `<Canvas>` (whose host is `position: relative`) so `<ContextMenuOverlay>`
 * anchors at the cursor via the event's `screen` coordinates.
 */
function ModellerContextMenu() {
  const canvas = useCanvas();
  const draw = useDrawHistory();
  const { setTool } = useTool();
  const { fitContent } = useFitContent('graph');
  const { clear } = useClearGraph('graph');
  const { menu, open, close } = useContextMenu<MenuItem[]>();
  // Running counter for context-menu-created nodes/edges (distinct `cm-` prefix
  // so ids never collide with the Add tool's `n-` ids).
  const seqRef = useRef(0);

  const onContextMenu = useCallback(
    (e: ContextMenuEvent): void => {
      const layer = canvas.layers.get<EngineGraphLayer>('graph');
      if (!layer) return;
      const store = layer.store;
      const inspect = canvas.behaviours.get<EngineClickInspectBehaviour>('click-inspect');

      // Drop a fresh node at `pos`, optionally linking it from `fromId`; journal
      // both mutations so Undo removes them.
      const addNodeAt = (pos: { x: number; y: number }, fromId?: string): void => {
        const n = (seqRef.current += 1);
        const stamp = Date.now().toString(36);
        const newId = `cm-n-${n}-${stamp}`;
        store.upsertNode({ id: newId, position: pos, style: { labelText: `N${n}` } });
        const created = store.getNode(newId);
        if (created) draw.onNodeCreate(created);
        if (fromId) {
          const edgeId = `cm-e-${n}-${stamp}`;
          store.upsertEdge({ id: edgeId, source: fromId, target: newId });
          const edge = store.getEdge(edgeId);
          if (edge) draw.onEdgeCreate(edge);
        }
      };

      let items: MenuItem[];
      if (e.targetType === 'node' && e.id) {
        const id = e.id;
        const node = store.getNode(id);
        const pinned = node?.pinned ?? false;
        items = [
          {
            id: 'edit',
            label: 'Edit properties…',
            onClick: () => {
              setTool('select'); // arm Select so the inspector + drag are live
              inspect?.setTarget({ kind: 'node', id });
              close();
            },
          },
          {
            id: 'pin',
            label: pinned ? 'Unpin' : 'Pin',
            onClick: () => {
              store.updateNode(id, { pinned: !pinned });
              close();
            },
          },
          {
            id: 'add-connected',
            label: 'Add connected node',
            onClick: () => {
              const origin = node?.position ?? { x: 0, y: 0 };
              addNodeAt({ x: origin.x + 90, y: origin.y + 70 }, id);
              close();
            },
          },
          {
            id: 'delete',
            label: 'Delete node',
            shortcut: '⌫',
            onClick: () => {
              const target = store.getNode(id);
              if (target) {
                // Snapshot incident edges first — `removeNode` cascades them, and
                // the history entry needs them to restore the node's links on Undo.
                const edges = [...store.edgesOf(id, 'both')];
                store.removeNode(id, { cascade: true });
                draw.onErase({ kind: 'node', node: target, edges });
              }
              close();
            },
          },
        ];
      } else if (e.targetType === 'edge' && e.id) {
        const id = e.id;
        items = [
          {
            id: 'edit',
            label: 'Edit properties…',
            onClick: () => {
              setTool('select'); // arm Select so the inspector is live
              inspect?.setTarget({ kind: 'edge', id });
              close();
            },
          },
          {
            id: 'reverse',
            label: 'Reverse direction',
            onClick: () => {
              const edge = store.getEdge(id);
              if (edge) store.updateEdge(id, { source: edge.target, target: edge.source });
              close();
            },
          },
          {
            id: 'delete',
            label: 'Delete edge',
            shortcut: '⌫',
            onClick: () => {
              const edge = store.getEdge(id);
              if (edge) {
                store.removeEdge(id);
                draw.onErase({ kind: 'edge', edge });
              }
              close();
            },
          },
        ];
      } else {
        items = [
          {
            id: 'add',
            label: 'Add node here',
            shortcut: '⌘N',
            onClick: () => {
              addNodeAt({ x: e.world.x, y: e.world.y });
              close();
            },
          },
          { id: 'fit', label: 'Fit to content', onClick: () => { fitContent(); close(); } },
          { id: 'clear', label: 'Clear all', onClick: () => { clear(); close(); } },
        ];
      }

      open(e.screen.x, e.screen.y, items);
    },
    [canvas, draw, setTool, fitContent, clear, open, close],
  );

  return (
    <>
      <ContextMenuBehaviour layerId="graph" onContextMenu={onContextMenu} />
      {menu && <ContextMenuOverlay x={menu.x} y={menu.y} items={menu.items} />}
    </>
  );
}

function Modeller() {
  // The theme toggle pins the chrome theme; restore it to the OS preference on
  // unmount so the pinned theme doesn't leak into the next story.
  useEffect(() => () => applyChromeTheme(osPrefersDark()), []);
  return (
    <TooltipProvider>
      <GraphToolProvider>
        <div style={hostStyle}>
          <Canvas autoResize>
            {/* The `{ light, dark }` pairs follow the OS `prefers-color-scheme`. */}
            <BackgroundLayer
              type="pattern"
              patternType="grid"
              backgroundColor={{ light: '#f8fafc', dark: '#0f172a' }}
              color={{ light: '#94a3b8', dark: '#334155' }}
            />
            <GraphLayer
              id="graph"
              data={SEED}
              node={{
                style: {
                  shape: { kind: 'circle', radius: 22 },
                  bgFill: 0x3b82f6,
                  // bgStrokeColor is theme-driven — see <ResponsiveThemeBehaviour>.
                  bgStrokeWidth: 2,
                  labelColor: 0xf8fafc,
                  labelFontSize: 13,
                  labelPlacement: 'center',
                },
              }}
              // edge strokeColor is theme-driven — see <ResponsiveThemeBehaviour>.
              edge={{ style: { strokeWidth: 2 } }}
            />
            {/* Themes node borders + edge strokes to the OS `prefers-color-scheme`.
                Border matches the background so the node reads as separated from
                the grid. The node fill + label stay fixed — a white label inside
                the solid blue node reads on either theme. */}
            <ResponsiveThemeBehaviour
              layerId="graph"
              node={{ light: { bgStrokeColor: 0xffffff }, dark: { bgStrokeColor: 0x0f172a } }}
              edge={{ light: { strokeColor: 0xcbd5e1 }, dark: { strokeColor: 0x475569 } }}
            />

            <DragPanBehaviour />
            <WheelZoomBehaviour />

            {/* History over the graph store — makes every edit (incl. the draw
                gestures below) undoable via the toolbar's Undo / Redo. */}
            <GraphHistoryProvider layerId="graph">
              <DrawingTools />
              <ModellerContextMenu />
            </GraphHistoryProvider>
          </Canvas>
        </div>
      </GraphToolProvider>
    </TooltipProvider>
  );
}

const hostStyle: CSSProperties = { height: '100vh', position: 'relative' };
const hintStyle: CSSProperties = {
  opacity: 0.7,
  fontSize: 13,
  background: 'var(--color-popover)',
  padding: '4px 10px',
  borderRadius: 6,
};

export const GraphModeller: Story = {
  render: () => <Modeller />,
};
