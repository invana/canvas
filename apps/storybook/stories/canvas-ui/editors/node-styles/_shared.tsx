/**
 * Shared scaffolding for the `node-styles` editor stories — one small live
 * `<GraphCanvasApp>` harness reused by every editor's story so each file only
 * declares its own right-panel. Not a story itself (no `.stories` suffix).
 */

import { useContext, useState, type ReactNode } from 'react';
import type { CompositeShapeOption, GraphData, GraphLayer, NodeStyle } from '@invana/graph';
import {
  CanvasMessageBar,
  GraphBackgroundContextMenu,
  GraphCanvasApp,
  GraphCanvasContext,
  GraphControlsToolbar,
  GraphNodeContextMenu,
  GraphStatusBar,
  ThemeToggle,
  ToolbarItems,
  useCanvas,
  useDevTool,
  useMiniMap,
  useSelection,
  type GraphNodeMenuContext,
  type LayoutFactory,
} from '@invana/canvas-react';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { ThemeProvider } from '@invana/themes';
import type { MenuItem } from '@invana/ui';
import { Palette } from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

/** A composite / card node shape — the composite editors edit this. */
export const CARD_SHAPE: CompositeShapeOption = {
  kind: 'composite',
  width: 172,
  height: 66,
  cornerRadius: 10,
  fill: 0x1e293b,
  stroke: { color: 0x475569, width: 1 },
  parts: [
    { part: 'rect', x: 0, y: 0, width: 6, height: 66, fill: 0x38bdf8 }, // accent bar
    { part: 'label', x: 18, y: 14, text: 'Service', fontSize: 15, fontWeight: 700, fill: 0xf8fafc },
    { part: 'label', x: 18, y: 38, text: 'composite card', fontSize: 11, fill: 0x94a3b8 },
  ],
};

const card = (id: string, title: string, accent: number, x: number, y: number): GraphData['nodes'][number] => ({
  id,
  position: { x, y },
  style: {
    shape: {
      ...CARD_SHAPE,
      parts: [
        { part: 'rect', x: 0, y: 0, width: 6, height: 66, fill: accent },
        { part: 'label', x: 18, y: 14, text: title, fontSize: 15, fontWeight: 700, fill: 0xf8fafc },
        { part: 'label', x: 18, y: 38, text: 'composite card', fontSize: 11, fill: 0x94a3b8 },
      ],
    },
  },
});

/** Four simple nodes — one per shape kind, distinct fills. */
export const SIMPLE_DATA: GraphData = {
  nodes: [
    { id: 'alpha', position: { x: -150, y: -60 }, style: { shape: { kind: 'circle', radius: 28 }, bgFill: 0x3b82f6, labelText: 'Alpha', labelColor: 0xffffff, labelPlacement: 'center' } },
    { id: 'beta', position: { x: 150, y: -60 }, style: { shape: { kind: 'rect', width: 64, height: 46, cornerRadius: 8 }, bgFill: 0x10b981, labelText: 'Beta', labelColor: 0x052e16, labelPlacement: 'center' } },
    { id: 'gamma', position: { x: -150, y: 90 }, style: { shape: { kind: 'star', points: 5, innerRadius: 14, outerRadius: 30 }, bgFill: 0xf59e0b, labelText: 'Gamma', labelColor: 0x451a03, labelPlacement: 'center' } },
    { id: 'delta', position: { x: 150, y: 90 }, style: { shape: { kind: 'regular-polygon', sides: 6, radius: 28 }, bgFill: 0x8b5cf6, labelText: 'Delta', labelColor: 0xffffff, labelPlacement: 'center' } },
  ],
  edges: [
    { id: 'e1', source: 'alpha', target: 'beta' },
    { id: 'e2', source: 'beta', target: 'delta' },
    { id: 'e3', source: 'delta', target: 'gamma' },
    { id: 'e4', source: 'gamma', target: 'alpha' },
  ],
};

/** Three composite card nodes. */
export const COMPOSITE_DATA: GraphData = {
  nodes: [
    card('service', 'Service', 0x38bdf8, 0, -80),
    card('gateway', 'Gateway', 0x34d399, -170, 90),
    card('worker', 'Worker', 0xf472b6, 170, 90),
  ],
  edges: [
    { id: 'e1', source: 'service', target: 'gateway' },
    { id: 'e2', source: 'service', target: 'worker' },
  ],
};

/** Four simple nodes + one card — the mixed graph for the dispatcher / overview. */
export const MIXED_DATA: GraphData = {
  nodes: [...SIMPLE_DATA.nodes, card('service', 'Service', 0x38bdf8, 0, 15)],
  edges: [
    { id: 'm1', source: 'alpha', target: 'service' },
    { id: 'm2', source: 'beta', target: 'service' },
    { id: 'm3', source: 'gamma', target: 'service' },
    { id: 'm4', source: 'delta', target: 'service' },
  ],
};

// ─── Panel helpers ─────────────────────────────────────────────────────────────

/** The selected node resolved off the live `GraphLayer` — `null` until something
 * is selected. Panels call this, then render the matching editor seeded from
 * `style`. */
export function useSelectedNode(): { layer: GraphLayer; id: string; style: Partial<NodeStyle> } | null {
  const canvas = useCanvas();
  const { selectedNodeIds } = useSelection();
  const id = selectedNodeIds[0];
  const layer = canvas.layers.get('graph') as GraphLayer | undefined;
  const node = id && layer ? layer.store.getNode(id) : undefined;
  if (!layer || !id || !node) return null;
  return { layer, id, style: layer.resolveNodeStyle(node) };
}

/** Muted "nothing selected" hint shown in a panel. */
export function SelectPrompt({ text }: { text: string }) {
  return <div style={{ padding: 16, fontSize: 13, color: 'var(--muted-foreground, #71717a)' }}>{text}</div>;
}

// ─── App harness ───────────────────────────────────────────────────────────────

const LAYOUTS: Record<string, LayoutFactory> = {
  'd3-force': () => new D3ForceLayout({ charge: { strength: -260 }, link: { distance: 120 }, animate: false }),
  'elk-layered': () => new ElkLayout({ algorithm: 'layered', direction: 'RIGHT' }),
};
const LAYOUT_LABEL: Record<string, string> = { 'd3-force': 'Force', 'elk-layered': 'Layered' };

const nodeMenu = (ctx: GraphNodeMenuContext): MenuItem[] => [
  { id: 'inspect', label: `Inspect ${ctx.id}`, onClick: () => window.alert(`Node ${ctx.id}`) },
];
const backgroundMenu = (): MenuItem[] => [
  { id: 'about', label: 'Node style editors demo', onClick: () => window.alert('Demo graph') },
];

/** Holds panel rendering until `GraphCanvasApp`'s lifted `CanvasContext` is
 * published (it's `null` until then, and the panel's engine hooks throw on null). */
function PanelGate({ children }: { children: ReactNode }) {
  const canvas = useContext(GraphCanvasContext);
  if (!canvas) return null;
  return <>{children}</>;
}

export interface LiveStyleEditorAppProps {
  /** Header title. */
  title: string;
  /** Ready-toast message. */
  message: string;
  /** Graph data to load. */
  data: GraphData;
  /** The docked right-region panel (an editor bound to the live graph). */
  panel: ReactNode;
}

/**
 * The reusable live harness: a full `<GraphCanvasApp>` with a header toggle that
 * docks `panel` into the resizable `right` region. Colour-by-label is disabled
 * so per-node style edits stick; the layout is a static settle so the graph
 * holds still while editing.
 */
export function LiveStyleEditorApp({ title, message, data, panel }: LiveStyleEditorAppProps) {
  const dev = useDevTool({ corner: 'top-left', margin: { x: 12, y: 48 } });
  const mini = useMiniMap({ backgroundLayerId: 'background', position: 'bottom-left' });
  const [open, setOpen] = useState(true);

  return (
    <ThemeProvider>
      <GraphCanvasApp
        data={data}
        onReady={(c) => c?.showMessage(message)}
        config={{
          behaviours: { color: { enabled: false } },
          layouts: {
            'graph-force': { charge: { strength: -260 }, link: { distance: 120 }, collide: { radius: 30 }, animate: false },
          },
        }}
        header={{
          title,
          center: <GraphControlsToolbar layouts={LAYOUTS} layoutLabel={LAYOUT_LABEL} />,
          right: (ctx) => (
            <>
              {dev.button}
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'toggle',
                    key: 'editor',
                    icon: Palette,
                    label: 'Editor: hidden',
                    activeLabel: 'Editor: shown',
                    active: open,
                    onToggle: () => setOpen((v) => !v),
                  },
                ]}
              />
              <ThemeToggle ctx={ctx} />
            </>
          ),
        }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        right={open ? { content: <PanelGate>{panel}</PanelGate>, defaultSize: '360px', maxSize: '460px', collapsible: true } : undefined}
      >
        {mini.layer}
        {dev.layer}
        <GraphNodeContextMenu items={nodeMenu} />
        <GraphBackgroundContextMenu items={backgroundMenu} />
      </GraphCanvasApp>
    </ThemeProvider>
  );
}
