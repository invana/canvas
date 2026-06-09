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

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  DragNodeBehaviour,
  ClickSelectBehaviour,
  ClickInspectBehaviour,
  CreateNodeBehaviour,
  DrawEdgeBehaviour,
  EraseBehaviour,
  ParallelEdgeBehaviour,
  GraphNodeContextMenu,
  GraphEdgeContextMenu,
  GraphBackgroundContextMenu,
  GraphHistoryProvider,
  GraphToolProvider,
  HistoryContext,
  ModellerToolbar,
  InspectorPanel,
  Panel,
  ToolbarItems,
  useGraphCanvasUpdate,
  useSystemTheme,
  useTool,
  useDrawHistory,
  useFitContent,
  useClearGraph,
} from '@invana/canvas-react';
import type {
  CanvasConfig,
  GraphNodeMenuContext,
  GraphEdgeMenuContext,
  GraphBackgroundMenuContext,
  ToolbarItem,
} from '@invana/canvas-react';
import type {
  GraphData,
  GraphEdge,
  NodeShapeOptions,
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

// Serialisable settings by id (same shape as the imperative `canvasOptions`).
// The always-on camera behaviours live here; the tool-gated drawing behaviours
// keep their reactive `enabled={tool === …}` on the children below (config
// can't express a value that tracks React state). Theme-driven colours
// (node/edge stroke, background) come from the patches + `useSystemTheme`.
const MODELLER_OPTIONS: CanvasConfig = {
  layers: {
    // Theme-driven background colours live only in M_LIGHT/M_DARK (pushed by
    // <SystemTheme>) — not here, or the base config would clobber the resolved
    // theme on mount (the <Canvas> applies config after the SystemTheme effect).
    background: { type: 'pattern', patternType: 'grid' },
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 22 },
          bgFill: 0x3b82f6,
          bgStrokeWidth: 2,
          labelColor: 0xf8fafc,
          labelFontSize: 13,
          labelPlacement: 'center',
        },
      },
      edge: { style: { strokeWidth: 2 } },
    },
  },
  behaviours: { pan: { enabled: true }, wheel: { enabled: true } },
};

const M_LIGHT: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#f8fafc', color: '#94a3b8' },
    graph: { node: { style: { bgStrokeColor: 0xffffff } }, edge: { style: { strokeColor: 0xcbd5e1 } } },
  },
};
const M_DARK: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#0f172a', color: '#334155' },
    graph: { node: { style: { bgStrokeColor: 0x0f172a } }, edge: { style: { strokeColor: 0x475569 } } },
  },
};

/** Follows the OS scheme by pushing the matching colour patch through update(). */
function SystemTheme() {
  useSystemTheme(M_LIGHT, M_DARK);
  return null;
}

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
 * The drawing behaviours + toolbar + right-click context menus. Lives inside
 * both providers so it can read the active tool (`useTool`) and journal gestures
 * (`useDrawHistory` / `useClearGraph`). Each behaviour's `enabled` is gated on
 * the active tool — only one is live at a time. The three `<Graph*ContextMenu>`
 * are mounted here too (rather than in a separate component) because their menu
 * actions need those same tool + history hooks.
 */
/** Manual theme toggle — pushes a light/dark patch via `useGraphCanvasUpdate`. */
function ThemeControl() {
  const update = useGraphCanvasUpdate();
  const [kind, setKind] = useState<'light' | 'dark'>(() => (osPrefersDark() ? 'dark' : 'light'));
  const toggle = (): void => {
    const next = kind === 'dark' ? 'light' : 'dark';
    setKind(next);
    update(next === 'dark' ? M_DARK : M_LIGHT);
    applyChromeTheme(next === 'dark');
  };
  const items: ToolbarItem[] = [
    {
      type: 'toggle',
      key: 'theme',
      icon: Sun,
      activeIcon: Moon,
      label: 'Switch to dark theme',
      activeLabel: 'Switch to light theme',
      active: kind === 'dark',
      onToggle: toggle,
    },
  ];
  return <ToolbarItems items={items} orientation="horizontal" />;
}

function DrawingTools() {
  const { tool, nodeKind, setTool } = useTool();
  const draw = useDrawHistory();
  const { fitContent } = useFitContent('graph');
  const { clear } = useClearGraph('graph');
  // Raw history instance (from `<GraphHistoryProvider>`) — the context-menu
  // edits run as `history.transaction(...)` so the recorder applies + journals
  // them in one undoable step. `draw` above stays for the drawing *behaviours*.
  const history = useContext(HistoryContext);

  // The Add tool's createNode factory is captured once by the behaviour; read
  // the live shape + a running counter through refs so it stays current.
  const nodeKindRef = useRef(nodeKind);
  nodeKindRef.current = nodeKind;
  const seqRef = useRef(SEED.nodes.length);
  // Separate counter for context-menu-created nodes/edges (distinct `cm-` prefix
  // so ids never collide with the Add tool's `n-` ids).
  const cmSeqRef = useRef(0);

  // ─── Context-menu item builders ────────────────────────────────────────────
  // One per target, consumed by the `<Graph*ContextMenu>` rendered below. Each
  // action is a single engine call: structural edits (add / delete) run through
  // `history.transaction` — the recorder applies the mutation AND journals its
  // inverse (cascading incident edges), so the toolbar's Undo / Redo reverse them
  // with no manual snapshotting. Pin and reverse are direct store sugar
  // (`setPinned` / `reverseEdge`). The right-clicked `id` and the live `canvas`
  // arrive on each builder's `ctx`; `autoClose` dismisses the menu after a click.

  // Add a fresh node at `pos`, optionally linking it from `fromId`, as one
  // undoable entry. `rec.addNode` / `rec.addEdge` apply + journal together.
  const addNodeAt = useCallback(
    (pos: { x: number; y: number }, fromId?: string): void => {
      const n = (cmSeqRef.current += 1);
      const stamp = Date.now().toString(36);
      const newId = `cm-n-${n}-${stamp}`;
      history?.transaction('add node', (rec) => {
        rec.addNode({ id: newId, position: pos, style: { labelText: `N${n}` } });
        if (fromId) rec.addEdge({ id: `cm-e-${n}-${stamp}`, source: fromId, target: newId });
      });
    },
    [history],
  );

  const nodeItems = useCallback(
    ({ id, canvas }: GraphNodeMenuContext): MenuItem[] => {
      const layer = canvas.layers.get<EngineGraphLayer>('graph');
      if (!layer) return [];
      const store = layer.store;
      const inspect = canvas.behaviours.get<EngineClickInspectBehaviour>('click-inspect');
      return [
        {
          id: 'edit',
          label: 'Edit properties…',
          // arm Select so the inspector + drag are live
          onClick: () => {
            setTool('select');
            inspect?.setTarget({ kind: 'node', id });
          },
        },
        {
          id: 'pin',
          label: store.isPinned(id) ? 'Unpin' : 'Pin',
          onClick: () => store.setPinned(id, !store.isPinned(id)),
        },
        {
          id: 'add-connected',
          label: 'Add connected node',
          onClick: () => {
            const origin = store.getNode(id)?.position ?? { x: 0, y: 0 };
            addNodeAt({ x: origin.x + 90, y: origin.y + 70 }, id);
          },
        },
        {
          id: 'delete',
          label: 'Delete node',
          shortcut: '⌫',
          onClick: () => history?.transaction('delete node', (rec) => rec.removeNode(id)),
        },
      ];
    },
    [setTool, addNodeAt, history],
  );

  const edgeItems = useCallback(
    ({ id, canvas }: GraphEdgeMenuContext): MenuItem[] => {
      const layer = canvas.layers.get<EngineGraphLayer>('graph');
      if (!layer) return [];
      const store = layer.store;
      const inspect = canvas.behaviours.get<EngineClickInspectBehaviour>('click-inspect');
      return [
        {
          id: 'edit',
          label: 'Edit properties…',
          // arm Select so the inspector is live
          onClick: () => {
            setTool('select');
            inspect?.setTarget({ kind: 'edge', id });
          },
        },
        { id: 'reverse', label: 'Reverse direction', onClick: () => store.reverseEdge(id) },
        {
          id: 'delete',
          label: 'Delete edge',
          shortcut: '⌫',
          onClick: () => history?.transaction('delete edge', (rec) => rec.removeEdge(id)),
        },
      ];
    },
    [setTool, history],
  );

  const backgroundItems = useCallback(
    ({ world, canvas }: GraphBackgroundMenuContext): MenuItem[] => {
      const layer = canvas.layers.get<EngineGraphLayer>('graph');
      if (!layer) return [];
      return [
        {
          id: 'add',
          label: 'Add node here',
          shortcut: '⌘N',
          onClick: () => addNodeAt({ x: world.x, y: world.y }),
        },
        { id: 'fit', label: 'Fit to content', onClick: () => fitContent() },
        { id: 'clear', label: 'Clear all', onClick: () => clear() },
      ];
    },
    [addNodeAt, fitContent, clear],
  );

  return (
    <>
      {/* Mode-gated — only `enabled` flips; nothing remounts. */}
      <DragNodeBehaviour targetLayerId="graph" enabled={tool === 'select'} />
      <ClickSelectBehaviour targetLayerId="graph" enabled={tool === 'select'} multiple={false} />
      {/* Click-to-edit target for the InspectorPanel — a dedicated behaviour so
          the editor follows the last-clicked node/edge regardless of the
          (multi-)selection ClickSelect maintains for dragging. */}
      <ClickInspectBehaviour targetLayerId="graph" enabled={tool === 'select'} />
      <CreateNodeBehaviour
        targetLayerId="graph"
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
        targetLayerId="graph"
        enabled={tool === 'connect'}
        allowSelfLoop
        onEdgeCreate={draw.onEdgeCreate}
      />
      <EraseBehaviour targetLayerId="graph" enabled={tool === 'delete'} onErase={draw.onErase} />
      {/* Fan out edges that share a node pair (drawn either direction). */}
      <ParallelEdgeBehaviour targetLayerId="graph" spacing={18} groupBy={undirectedPair} />

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

      {/* Switch the graph theme (pushes the M_LIGHT / M_DARK patch through
          canvas.update) to test the light/dark node + edge styling without
          changing the OS appearance. Flips the background grid in lockstep so
          the whole canvas stays coherent. */}
      <Panel position="top-left">
        <ThemeControl />
      </Panel>

      {/* Click a node/edge (Select tool) → edit its `type` (shown as the drawn
          label in modelling) + key/value properties; edges add a reverse-direction
          button. `typeAsLabel` mirrors the type to the label for both. Apply
          commits an undoable update. Reads the click-inspect target above. */}
      <InspectorPanel layerId="graph" position="top-right" typeAsLabel />

      {/* Right-click menus — one component per target, each owning its own
          behaviour + overlay + dismissal. Builders defined above (they need the
          tool + draw-history hooks, so they live here rather than in `Modeller`). */}
      <GraphNodeContextMenu items={nodeItems} />
      <GraphEdgeContextMenu items={edgeItems} />
      <GraphBackgroundContextMenu items={backgroundItems} />

      {/* Contextual hint for the active tool. */}
      <Panel position="bottom-center">
        <span style={hintStyle}>{HINTS[tool]}</span>
      </Panel>
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
          {/* Minimal children register the classes by id; MODELLER_OPTIONS holds
              all settings. Node/edge stroke + background colours follow the OS
              scheme via <SystemTheme> (theme-agnostic engine). */}
          <Canvas autoResize config={MODELLER_OPTIONS}>
            <BackgroundLayer id="background" />
            <GraphLayer id="graph" data={SEED} />
            {/* OS dark-mode follow — external colour patches through update(). */}
            <SystemTheme />

            <DragPanBehaviour id="pan" />
            <WheelZoomBehaviour id="wheel" />

            {/* History over the graph store — makes every edit (incl. the draw
                gestures below) undoable via the toolbar's Undo / Redo. */}
            <GraphHistoryProvider layerId="graph">
              <DrawingTools />
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
