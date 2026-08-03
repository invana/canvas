/**
 * **Canvas Boards** — multiple independent canvases in one **tab panel**, built on
 * `@invana/canvas-ui`'s `CanvasPagesViewPanel` (Bootstrap `nav-tabs` styling; the
 * active tab exposes a caret dropdown of host-supplied actions). Each tab is a
 * fully self-contained `<GraphCanvasApp>` with its **own engine instance and its
 * own state** (config, camera, layout positions, selection) — boards share nothing
 * but the host `<ThemeProvider>`. You can **add** boards, **switch** between them,
 * and — from the active tab's caret — **rename**, **duplicate**, or **remove** one.
 *
 * **State is retained across switches.** Every board stays *mounted* — the inactive
 * ones are hidden (not destroyed), each kept at full size and absolutely stacked,
 * so toggling a tab is pure visibility. Pan/zoom one board, switch away and back,
 * and it's exactly where you left it.
 *
 * **Delete tears the board down** (`<GraphCanvasApp>` unmounts → `Canvas.destroy()`),
 * freeing its engine + GPU context. Destroying one canvas while siblings stay live
 * required an engine teardown guard: a label decoration's Pixi `Text` returns its
 * glyph render-texture to Pixi's *process-shared* `TexturePool`, and a missing
 * size-bucket used to throw mid-unmount — `PrimitivesRenderer.disposeDecoration`
 * now destroys decorations best-effort so teardown can't crash. (Deeper fix =
 * per-renderer texture pool; tracked.)
 *
 * **Forward note (`@invana/canvas-state`).** Today each board's state lives inside
 * its own engine. Under the planned state layer each board owns its own
 * **`CanvasState { view, data }`** (see `docs/canvas-state-plan.md`) — at which
 * point the scalable shape flips to *render only the active board* and **rehydrate
 * its `CanvasState` on switch**, so a board's state survives even an unmount and
 * you're not holding a live GPU context per inactive tab (risk **A** in
 * `docs/graph-canvas-apps-plan.md`).
 */

import { useRef, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TextResolutionLODBehaviour, useLayout, type LayoutFactory } from '@invana/canvas-react';
import { GraphCanvasApp } from '@invana/canvas-ui';
import {
  CanvasPagesViewPanel,
  type CanvasHeaderAction,
  type CanvasPage,
  type CanvasPageMenuItem,
} from '@invana/canvas-ui';
import { Copy, Info, Pencil, Settings, Trash2 } from 'lucide-react';
import type { EdgeStyle, GraphData, GraphNode, NodeStyle } from '@invana/graph';
import { ThemeProvider } from '@invana/themes';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { D3HierarchyLayout } from '@invana/graph-layout-d3-hierarchy';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/CanvasBoards' };
export default meta;
type Story = StoryObj;

// ── Sample graphs (each ≤ 12 nodes, shaped for its layout) ────────────────────

/** A 10-person team and who collaborates with whom — general force layout. */
const TEAM_GRAPH: GraphData = {
  nodes: [
    { type: 'node', id: 'Alice' }, { type: 'node', id: 'Bob' }, { type: 'node', id: 'Carol' }, { type: 'node', id: 'Dave' }, { type: 'node', id: 'Eve' },
    { type: 'node', id: 'Frank' }, { type: 'node', id: 'Grace' }, { type: 'node', id: 'Heidi' }, { type: 'node', id: 'Ivan' }, { type: 'node', id: 'Judy' },
  ],
  edges: [
    { id: 'c1', source: 'Alice', target: 'Bob', type: 'collaborates' },
    { id: 'c2', source: 'Alice', target: 'Carol', type: 'collaborates' },
    { id: 'c3', source: 'Bob', target: 'Carol', type: 'collaborates' },
    { id: 'c4', source: 'Carol', target: 'Dave', type: 'collaborates' },
    { id: 'c5', source: 'Dave', target: 'Eve', type: 'collaborates' },
    { id: 'c6', source: 'Eve', target: 'Frank', type: 'collaborates' },
    { id: 'c7', source: 'Frank', target: 'Dave', type: 'collaborates' },
    { id: 'c8', source: 'Carol', target: 'Grace', type: 'collaborates' },
    { id: 'c9', source: 'Grace', target: 'Heidi', type: 'collaborates' },
    { id: 'c10', source: 'Heidi', target: 'Ivan', type: 'collaborates' },
    { id: 'c11', source: 'Ivan', target: 'Grace', type: 'collaborates' },
    { id: 'c12', source: 'Eve', target: 'Judy', type: 'collaborates' },
    { id: 'c13', source: 'Judy', target: 'Alice', type: 'collaborates' },
  ],
};

/** A CI/CD build pipeline — a directed DAG that reads as clean layers in ELK. */
const PIPELINE_GRAPH: GraphData = {
  nodes: [
    { type: 'node', id: 'Source' }, { type: 'node', id: 'Install' }, { type: 'node', id: 'Lint' }, { type: 'node', id: 'Typecheck' },
    { type: 'node', id: 'Test' }, { type: 'node', id: 'Build' }, { type: 'node', id: 'Bundle' }, { type: 'node', id: 'Deploy' }, { type: 'node', id: 'Notify' },
  ],
  edges: [
    { id: 'p1', source: 'Source', target: 'Install', type: 'then' },
    { id: 'p2', source: 'Install', target: 'Lint', type: 'then' },
    { id: 'p3', source: 'Install', target: 'Typecheck', type: 'then' },
    { id: 'p4', source: 'Install', target: 'Test', type: 'then' },
    { id: 'p5', source: 'Lint', target: 'Build', type: 'then' },
    { id: 'p6', source: 'Typecheck', target: 'Build', type: 'then' },
    { id: 'p7', source: 'Test', target: 'Build', type: 'then' },
    { id: 'p8', source: 'Build', target: 'Bundle', type: 'then' },
    { id: 'p9', source: 'Bundle', target: 'Deploy', type: 'then' },
    { id: 'p10', source: 'Deploy', target: 'Notify', type: 'then' },
  ],
};

/** A company org chart — a single-root tree (parent → child = "manages"). */
const ORG_GRAPH: GraphData = {
  nodes: [
    { type: 'node', id: 'CEO' }, { type: 'node', id: 'CTO' }, { type: 'node', id: 'CFO' }, { type: 'node', id: 'CMO' },
    { type: 'node', id: 'Backend' }, { type: 'node', id: 'Frontend' }, { type: 'node', id: 'DevOps' }, { type: 'node', id: 'QA' },
    { type: 'node', id: 'Accounting' }, { type: 'node', id: 'Payroll' }, { type: 'node', id: 'Content' }, { type: 'node', id: 'Ads' },
  ],
  edges: [
    { id: 'o1', source: 'CEO', target: 'CTO', type: 'manages' },
    { id: 'o2', source: 'CEO', target: 'CFO', type: 'manages' },
    { id: 'o3', source: 'CEO', target: 'CMO', type: 'manages' },
    { id: 'o4', source: 'CTO', target: 'Backend', type: 'manages' },
    { id: 'o5', source: 'CTO', target: 'Frontend', type: 'manages' },
    { id: 'o6', source: 'CTO', target: 'DevOps', type: 'manages' },
    { id: 'o7', source: 'CTO', target: 'QA', type: 'manages' },
    { id: 'o8', source: 'CFO', target: 'Accounting', type: 'manages' },
    { id: 'o9', source: 'CFO', target: 'Payroll', type: 'manages' },
    { id: 'o10', source: 'CMO', target: 'Content', type: 'manages' },
    { id: 'o11', source: 'CMO', target: 'Ads', type: 'manages' },
  ],
};

// ── Board templates — a pool the tab bar creates new boards from ───────────────

interface BoardTemplate {
  title: string;
  data: GraphData;
  factory: LayoutFactory;
  node: NodeStyle;
  edge: EdgeStyle;
}

// Module-scoped so the factory / style references stay stable across renders.
const TEMPLATES: BoardTemplate[] = [
  {
    title: 'Team',
    data: TEAM_GRAPH,
    factory: () =>
      new D3ForceLayout({ charge: { strength: -400 }, link: { distance: 90 }, animate: false }),
    node: { shape: { kind: 'circle', radius: 10 }, bgFill: 0x60a5fa },
    edge: { strokeWidth: 1.25, strokeColor: 0x94a3b8, arrowTargetShape: 'none' },
  },
  {
    title: 'Build pipeline',
    data: PIPELINE_GRAPH,
    factory: () =>
      new ElkLayout({ algorithm: 'layered', direction: 'RIGHT', nodeSpacing: 40, layerSpacing: 90 }),
    node: {
      shape: { kind: 'rect', width: 72, height: 26, cornerRadius: 5 },
      bgFill: 0x059669,
      bgStrokeColor: 0x065f46,
      bgStrokeWidth: 1.5,
      labelPlacement: 'inside-center',
      labelAlign: 'center',
      labelOffsetX: 0,
      labelOffsetY: 0,
      labelFontSize: 10,
    },
    edge: { strokeWidth: 1.5, strokeColor: 0x64748b, arrowTargetShape: 'triangle' },
  },
  {
    title: 'Org chart',
    data: ORG_GRAPH,
    factory: () => new D3HierarchyLayout({ mode: 'radial-tree' }),
    node: {
      shape: { kind: 'regular-polygon', sides: 6, radius: 11 },
      bgFill: 0xfbbf24,
      bgStrokeColor: 0xb45309,
      bgStrokeWidth: 1.5,
    },
    edge: { strokeWidth: 1.25, strokeColor: 0xd97706, arrowTargetShape: 'none' },
  },
];

// ── Per-board internals ───────────────────────────────────────────────────────

/**
 * Drop inside a `<GraphCanvasApp>` to apply a one-off layout to its graph on
 * mount (resolving that app's own engine from context). Pair with
 * `config={{ activeLayout: '' }}` so the bundle's force layout stays dormant.
 */
function ApplyLayout({ factory }: { factory: LayoutFactory }): null {
  const layouts = useRef({ active: factory }).current;
  useLayout(layouts, { layerId: 'graph' });
  return null;
}

/** One board = one independent `<GraphCanvasApp>` (its own engine + state). */
function CanvasBoard({ template }: { template: BoardTemplate }): ReactNode {
  return (
    <GraphCanvasApp
      data={template.data}
      showHeader={false}
      config={{
        activeLayout: '',
        behaviours: { color: { enabled: false } },
        layers: {
          graph: {
            node: { style: { ...template.node, labelText: (n: GraphNode) => n.id } },
            edge: { style: template.edge },
          },
        },
      }}
    >
      <ApplyLayout factory={template.factory} />
      <TextResolutionLODBehaviour targetLayerId="graph" />
    </GraphCanvasApp>
  );
}

// ── Tab shell ─────────────────────────────────────────────────────────────────

interface Board {
  id: number;
  templateIndex: number;
  /** Optional user-renamed title; falls back to the template's title. */
  title?: string;
}

/**
 * The boards shell — `@invana/canvas-ui`'s {@link CanvasPagesViewPanel} over a
 * stack of canvases. Each board maps to one page whose `content` is its own
 * `<GraphCanvasApp>`. The view keeps every page mounted and hides the inactive
 * ones (`keepMounted`, its default), so a board keeps its camera / layout /
 * selection across tab switches. `+` (`onAdd`) adds a board cycling through
 * {@link TEMPLATES}; the **active tab's caret** opens the `pageMenuItems` dropdown
 * — here **Rename**, **Duplicate**, and **Remove** (destructive, and disabled on
 * the last remaining board so the strip always keeps one). Remove unmounts the
 * board's canvas, tearing the engine down.
 */
function CanvasBoards(): ReactNode {
  const nextId = useRef(2);
  const [boards, setBoards] = useState<Board[]>([
    { id: 0, templateIndex: 0 },
    { id: 1, templateIndex: 1 },
  ]);
  const [activeId, setActiveId] = useState(0);

  const titleOf = (b: Board): string => b.title ?? TEMPLATES[b.templateIndex]!.title;

  const addBoard = (): void => {
    const id = nextId.current++;
    const templateIndex = id % TEMPLATES.length;
    setBoards((bs) => [...bs, { id, templateIndex }]);
    setActiveId(id);
  };

  const deleteBoard = (id: number): void => {
    setBoards((bs) => {
      if (bs.length <= 1) return bs; // keep at least one board
      const next = bs.filter((b) => b.id !== id);
      if (id === activeId) setActiveId(next[next.length - 1]!.id);
      return next;
    });
  };

  const renameBoard = (id: number): void => {
    setBoards((bs) =>
      bs.map((b) => {
        if (b.id !== id) return b;
        const next = window.prompt('Rename board', titleOf(b));
        return next && next.trim() ? { ...b, title: next.trim() } : b;
      }),
    );
  };

  // Clone a board (same template + title) right after it, and activate the copy.
  const duplicateBoard = (id: number): void => {
    const src = boards.find((b) => b.id === id);
    if (!src) return;
    const newId = nextId.current++;
    setBoards((bs) => {
      const at = bs.findIndex((b) => b.id === id);
      const copy: Board = { id: newId, templateIndex: src.templateIndex, title: `${titleOf(src)} copy` };
      return [...bs.slice(0, at + 1), copy, ...bs.slice(at + 1)];
    });
    setActiveId(newId);
  };

  // Boards → pages. `content` is each board's own independent `<GraphCanvasApp>`;
  // the tab strip keeps them all mounted (state preserved) and shows the active.
  const pages: CanvasPage[] = boards.map((b) => ({
    id: String(b.id),
    title: titleOf(b),
    content: <CanvasBoard template={TEMPLATES[b.templateIndex]!} />,
  }));

  // The active tab's dropdown actions. Each `onSelect` gets the active page id;
  // "Remove" is destructive and disabled while only one board remains.
  const pageMenuItems: CanvasPageMenuItem[] = [
    { id: 'rename', label: 'Rename', icon: Pencil, onSelect: (id) => renameBoard(Number(id)) },
    { id: 'duplicate', label: 'Duplicate', icon: Copy, onSelect: (id) => duplicateBoard(Number(id)) },
    {
      id: 'remove',
      label: 'Remove',
      icon: Trash2,
      destructive: true,
      separatorBefore: true,
      disabled: boards.length <= 1,
      onSelect: (id) => deleteBoard(Number(id)),
    },
  ];

  // Strip-level extra buttons in the right cluster (left of the pager / +).
  const headerActions: CanvasHeaderAction[] = [
    { id: 'settings', label: 'Settings', icon: Settings, onClick: () => window.alert('Settings') },
    { id: 'about', label: 'About', icon: Info, onClick: () => window.alert('Canvas Boards demo') },
  ];

  return (
    <ThemeProvider>
      <div
        style={{
          width: '100%',
          height: '100vh',
          background: 'var(--background, #fff)',
          color: 'var(--foreground, #0f172a)',
        }}
      >
        <CanvasPagesViewPanel
          pages={pages}
          activeId={String(activeId)}
          onSelect={(id) => setActiveId(Number(id))}
          onAdd={addBoard}
          headerActions={headerActions}
          pageMenuItems={pageMenuItems}
          addLabel="New board"
        />
      </div>
    </ThemeProvider>
  );
}

export const CanvasBoards_: Story = {
  name: 'CanvasBoards',
  render: () => <CanvasBoards />,
};
