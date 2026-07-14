/**
 * **Canvas Boards** — multiple independent canvases in one **tab panel**. Each tab
 * is a fully self-contained `<GraphCanvasApp>` with its **own engine instance and
 * its own state** (config, camera, layout positions, selection) — boards share
 * nothing but the host `<ThemeProvider>`. You can **add** boards, **switch**
 * between them, and **delete** them.
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

import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  GraphCanvasApp,
  TextResolutionLODBehaviour,
  useLayout,
  type LayoutFactory,
} from '@invana/canvas-react';
import type { EdgeStyle, GraphData, GraphNode, NodeStyle } from '@invana/graph';
import { ThemeProvider } from '@invana/themes';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { D3HierarchyLayout } from '@invana/graph-layout-d3-hierarchy';

const meta: Meta = { title: 'canvas-react/graph-canvas-app/CanvasBoards' };
export default meta;
type Story = StoryObj;

// ── Sample graphs (each ≤ 12 nodes, shaped for its layout) ────────────────────

/** A 10-person team and who collaborates with whom — general force layout. */
const TEAM_GRAPH: GraphData = {
  nodes: [
    { id: 'Alice' }, { id: 'Bob' }, { id: 'Carol' }, { id: 'Dave' }, { id: 'Eve' },
    { id: 'Frank' }, { id: 'Grace' }, { id: 'Heidi' }, { id: 'Ivan' }, { id: 'Judy' },
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
    { id: 'Source' }, { id: 'Install' }, { id: 'Lint' }, { id: 'Typecheck' },
    { id: 'Test' }, { id: 'Build' }, { id: 'Bundle' }, { id: 'Deploy' }, { id: 'Notify' },
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
    { id: 'CEO' }, { id: 'CTO' }, { id: 'CFO' }, { id: 'CMO' },
    { id: 'Backend' }, { id: 'Frontend' }, { id: 'DevOps' }, { id: 'QA' },
    { id: 'Accounting' }, { id: 'Payroll' }, { id: 'Content' }, { id: 'Ads' },
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
}

/** One tab button — active gets the primary tint; carries a delete affordance. */
function TabButton({
  label,
  active,
  onSelect,
  onDelete,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}): ReactNode {
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid var(--border, #e2e8f0)',
    cursor: 'pointer',
    fontSize: 13,
    color: active ? 'var(--primary, #2563eb)' : 'var(--muted-foreground, #64748b)',
    background: active ? 'color-mix(in srgb, var(--primary, #2563eb) 12%, transparent)' : 'transparent',
    borderColor: active ? 'color-mix(in srgb, var(--primary, #2563eb) 30%, transparent)' : 'var(--border, #e2e8f0)',
  };
  return (
    <span style={style} onClick={onSelect} role="tab" aria-selected={active}>
      {label}
      {onDelete ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete ${label}`}
          title="Delete this canvas"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'inherit',
            lineHeight: 1,
            padding: 0,
            fontSize: 14,
          }}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

/**
 * The boards shell — a tab bar over a stack of canvases. Boards stay mounted; the
 * active one is shown, the rest hidden (state preserved). `+` adds a board cycling
 * through {@link TEMPLATES}; `×` deletes one (unmounting its canvas → engine torn
 * down), keeping at least one board.
 */
function CanvasBoards(): ReactNode {
  const nextId = useRef(2);
  const [boards, setBoards] = useState<Board[]>([
    { id: 0, templateIndex: 0 },
    { id: 1, templateIndex: 1 },
  ]);
  const [activeId, setActiveId] = useState(0);

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

  return (
    <ThemeProvider>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100vh',
          background: 'var(--background, #fff)',
          color: 'var(--foreground, #0f172a)',
        }}
      >
        {/* Tab bar */}
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: 8,
            borderBottom: '1px solid var(--border, #e2e8f0)',
          }}
          role="tablist"
        >
          {boards.map((b) => (
            <TabButton
              key={b.id}
              label={TEMPLATES[b.templateIndex]!.title}
              active={b.id === activeId}
              onSelect={() => setActiveId(b.id)}
              onDelete={boards.length > 1 ? () => deleteBoard(b.id) : undefined}
            />
          ))}
          <button
            type="button"
            onClick={addBoard}
            aria-label="New board"
            style={{
              marginLeft: 4,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px dashed var(--border, #cbd5e1)',
              background: 'transparent',
              color: 'var(--muted-foreground, #64748b)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            + New board
          </button>
        </div>

        {/* Board stack — every board mounted; inactive ones hidden (state kept). */}
        <div style={{ position: 'relative', flex: '1 1 auto', minHeight: 0 }}>
          {boards.map((b) => {
            const active = b.id === activeId;
            return (
              <div
                key={b.id}
                style={{
                  position: 'absolute',
                  inset: 0,
                  visibility: active ? 'visible' : 'hidden',
                  pointerEvents: active ? 'auto' : 'none',
                  zIndex: active ? 1 : 0,
                }}
              >
                <CanvasBoard template={TEMPLATES[b.templateIndex]!} />
              </div>
            );
          })}
        </div>
      </div>
    </ThemeProvider>
  );
}

export const CanvasBoards_: Story = {
  name: 'CanvasBoards',
  render: () => <CanvasBoards />,
};
