/**
 * Graph **modeller / drawing** tool — a `NavHorizontal` tool switch
 * (Select / Add node / Connect) over the canvas:
 *
 *   - **Select** — drag nodes, click to select (DragNode + ClickSelect on).
 *   - **Add**    — click empty canvas to drop a node (CreateNode on).
 *   - **Connect**— drag node→node to draw an edge (dashed rubber-band; DrawEdge
 *                  on, DragNode off). Release on the same node for a self-loop.
 *                  Parallel edges between a pair fan out automatically.
 *
 * The active tool stays highlighted (its nav item gets `bg-primary` styling)
 * until you exit drawing — click **Select**, click the active tool again,
 * press **Esc**, or use the right-click menu.
 */

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MousePointer2, Plus, Spline } from 'lucide-react';
import {
  Canvas,
  BackgroundLayer,
  ClickSelectBehaviour,
  ContextMenuBehaviour,
  CreateNodeBehaviour,
  DragNodeBehaviour,
  DragPanBehaviour,
  DrawEdgeBehaviour,
  GraphLayer,
  ParallelEdgeBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas-react';
import type { GraphData, ContextMenuEvent, GraphEdge } from '@invana/graph';
import { NavHorizontal, NestedMenu, TooltipProvider, type MenuItem } from '@invana/ui';

const meta: Meta = { title: 'canvas-react/usecases/GraphModeller' };
export default meta;
type Story = StoryObj;

type Mode = 'select' | 'add' | 'connect';
const LABEL: Record<Mode, string> = { select: 'Select', add: 'Add node', connect: 'Connect' };

/** CSS applied to the active tool's nav item (design-kit / shadcn tokens). */
const ACTIVE = 'bg-primary text-primary-foreground rounded-md';

const SEED: GraphData = {
  nodes: [
    { id: 'a', position: { x: -120, y: -60 }, style: { labelText: 'A' } },
    { id: 'b', position: { x: 120, y: -60 }, style: { labelText: 'B' } },
    { id: 'c', position: { x: 0, y: 90 }, style: { labelText: 'C' } },
  ],
  edges: [{ id: 'a-b', source: 'a', target: 'b' }],
};

/**
 * Group by unordered node pair so edges drawn either way fan apart together.
 * Self-loops (source === target) are excluded — they use loop routing, not
 * the parallel-edge bow.
 */
const undirectedPair = (e: GraphEdge): string | null =>
  e.source === e.target ? null : [e.source, e.target].sort().join('::');

const HINTS: Record<Mode, string> = {
  select: 'Drag a node to move it · click to select · shift-click to multi-select',
  add: 'Click empty canvas to add a node · Esc to exit',
  connect: 'Drag node→node to connect · release on the same node for a self-loop · Esc to exit',
};

function Modeller() {
  const [mode, setMode] = useState<Mode>('select');
  const [counts, setCounts] = useState({ nodes: SEED.nodes.length, edges: SEED.edges.length });
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  // Esc → cancel any in-progress draw (the behaviour's onDisable does that)
  // and return to the neutral Select tool. Also closes the context menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setMode('select');
        setMenu(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Dismiss the context menu on any outside pointer-down.
  useEffect(() => {
    if (!menu) return;
    const close = (): void => setMenu(null);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [menu]);

  const onContextMenu = useCallback((e: ContextMenuEvent): void => {
    setMenu({ x: e.screen.x, y: e.screen.y });
  }, []);

  const pick = (m: Mode): MenuItem => ({
    id: m,
    label: mode === m ? `${LABEL[m]} ✓` : LABEL[m],
    onClick: () => {
      setMode(m);
      setMenu(null);
    },
  });
  const menuItems: MenuItem[] = [
    pick('select'),
    pick('add'),
    pick('connect'),
    ...(mode !== 'select'
      ? [
          {
            id: 'exit',
            label: 'Exit to Select',
            shortcut: 'Esc',
            onClick: () => {
              setMode('select');
              setMenu(null);
            },
          } satisfies MenuItem,
        ]
      : []),
  ];

  return (
    <TooltipProvider>
      <div style={containerStyle}>
      <NavHorizontal
        leftNavItems={[
          {
            key: 'select',
            name: 'Select',
            label: 'Select',
            icon: MousePointer2,
            onClick: () => setMode('select'),
            className: mode === 'select' ? ACTIVE : '',
          },
          {
            key: 'add',
            name: 'Add node',
            label: 'Add node',
            icon: Plus,
            onClick: () => setMode('add'),
            className: mode === 'add' ? ACTIVE : '',
          },
          {
            key: 'connect',
            name: 'Connect',
            label: 'Connect',
            icon: Spline,
            onClick: () => setMode('connect'),
            className: mode === 'connect' ? ACTIVE : '',
          },
        ]}
        center={<span style={metaTextStyle}>{HINTS[mode]}</span>}
        right={
          <span style={metaTextStyle}>
            {counts.nodes} nodes · {counts.edges} edges
          </span>
        }
      />

      <div style={hostStyle}>
        <Canvas autoResize>
          <BackgroundLayer patternType="grid" />
          <GraphLayer
            id="graph"
            data={SEED}
            node={{
              style: {
                shape: { kind: 'circle', radius: 22 },
                bgFill: 0x3b82f6,
                bgStrokeColor: 0xffffff,
                bgStrokeWidth: 2,
                labelColor: 0xf8fafc,
                labelFontSize: 13,
                labelPlacement: 'center',
              },
            }}
            edge={{ style: { strokeColor: 0x94a3b8, strokeWidth: 2 } }}
          />

          <DragPanBehaviour />
          <WheelZoomBehaviour />

          {/* Mode-gated — only `enabled` flips; nothing remounts. */}
          <DragNodeBehaviour layerId="graph" enabled={mode === 'select'} />
          <ClickSelectBehaviour layerId="graph" enabled={mode === 'select'} multiple />
          <CreateNodeBehaviour
            layerId="graph"
            enabled={mode === 'add'}
            onNodeCreate={() => setCounts((c) => ({ ...c, nodes: c.nodes + 1 }))}
          />
          <DrawEdgeBehaviour
            layerId="graph"
            enabled={mode === 'connect'}
            allowSelfLoop
            onEdgeCreate={() => setCounts((c) => ({ ...c, edges: c.edges + 1 }))}
          />
          {/* Fan out edges that share a node pair (drawn either direction). */}
          <ParallelEdgeBehaviour layerId="graph" spacing={18} groupBy={undirectedPair} />
          {/* Right-click anywhere to switch tools / exit drawing. */}
          <ContextMenuBehaviour layerId="graph" onContextMenu={onContextMenu} />
        </Canvas>

        {menu && (
          <div
            style={{ position: 'absolute', left: menu.x, top: menu.y, zIndex: 1000 }}
            onPointerDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <NestedMenu menuItems={menuItems} />
          </div>
        )}
      </div>
      </div>
    </TooltipProvider>
  );
}

const containerStyle: CSSProperties = { display: 'flex', flexDirection: 'column', height: '100vh' };
const hostStyle: CSSProperties = { flex: 1, minHeight: 0, position: 'relative' };
const metaTextStyle: CSSProperties = { opacity: 0.7, fontSize: 13 };

export const GraphModeller: Story = {
  render: () => <Modeller />,
};
