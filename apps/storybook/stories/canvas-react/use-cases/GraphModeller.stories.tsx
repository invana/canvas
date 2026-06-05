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
 * Selecting a single node or edge (in Select) opens an `InspectorPanel` to edit
 * its **label** and arbitrary **key/value properties** (`data`); Apply commits
 * an undoable update.
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

import { useEffect, useRef } from 'react';
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
} from 'lucide-react';
import {
  Canvas,
  BackgroundLayer,
  GraphLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragNodeBehaviour,
  ClickSelectBehaviour,
  CreateNodeBehaviour,
  DrawEdgeBehaviour,
  EraseBehaviour,
  ParallelEdgeBehaviour,
  GraphHistoryProvider,
  GraphToolProvider,
  ModellerToolbar,
  InspectorPanel,
  Panel,
  useCanvas,
  useTool,
  useDrawHistory,
} from '@invana/canvas-react';
import type {
  GraphData,
  GraphEdge,
  NodeShapeOptions,
  GraphLayer as EngineGraphLayer,
} from '@invana/graph';
import { TooltipProvider } from '@invana/ui';

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
  select: 'Drag a node to move it · click to select · shift-click to multi-select',
  add: 'Click empty canvas to add a node · pick its shape in the toolbar · Esc to exit',
  connect: 'Drag node→node to connect · release on the same node for a self-loop · Esc to exit',
  delete: 'Click a node (removes its edges) or an edge to erase it · Esc to exit',
};

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
      <ClickSelectBehaviour layerId="graph" enabled={tool === 'select'} multiple />
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

      {/* Select a single node/edge (Select tool) → edit its label + key/value
          properties here; Apply commits an undoable update. */}
      <InspectorPanel layerId="graph" position="top-right" />

      {/* Contextual hint for the active tool. */}
      <Panel position="bottom-center">
        <span style={hintStyle}>{HINTS[tool]}</span>
      </Panel>
    </>
  );
}

/**
 * Keeps the modeller's theme-dependent colours (node borders + edge strokes) in
 * sync with the OS `prefers-color-scheme`.
 *
 * Why imperative: the `<GraphLayer>` wrapper applies its `node`/`edge` style
 * props only at mount, so React-state colour changes wouldn't reach existing —
 * or freshly-drawn — nodes. Instead we listen to the media query and call the
 * engine layer's `setNodeDefaults` / `setEdgeDefaults`, which patch the shared
 * template and re-render every node/edge in one pass. New nodes dropped by the
 * Add tool inherit the patched template too. (The node fill + label stay fixed —
 * a white label inside the solid blue node reads on either theme.)
 */
function ThemeController() {
  const canvas = useCanvas();
  useEffect(() => {
    const layer = canvas.layers.get<EngineGraphLayer>('graph');
    if (!layer || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = mq.matches;
      // Border matches the background so the node reads as separated from the grid.
      layer.setNodeDefaults({ bgStrokeColor: dark ? 0x0f172a : 0xffffff });
      layer.setEdgeDefaults({ strokeColor: dark ? 0x475569 : 0xcbd5e1 });
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [canvas]);
  return null;
}

function Modeller() {
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
                  // bgStrokeColor is theme-driven — see <ThemeController>.
                  bgStrokeWidth: 2,
                  labelColor: 0xf8fafc,
                  labelFontSize: 13,
                  labelPlacement: 'center',
                },
              }}
              // edge strokeColor is theme-driven — see <ThemeController>.
              edge={{ style: { strokeWidth: 2 } }}
            />
            <ThemeController />

            <DragPanBehaviour />
            <WheelZoomBehaviour />

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
