/**
 * **Four independent `<GraphCanvasApp>`s in one 2×2 grid** — each a fully
 * self-contained app with its **own layout *and* its own styling**, sharing
 * nothing but the host `<ThemeProvider>`. Drop several on a page (a dashboard, a
 * compare view, small-multiples) and each runs in isolation — no global
 * `document` state, no cross-talk.
 *
 * Each quadrant pairs a different layout algorithm with a different node/edge
 * style template, over a small curated graph (≤ 15 nodes) shaped for its layout
 * so all four stay legible even zoomed out:
 *
 *   - **Force** · circles — a 10-person team collaboration graph.
 *   - **ELK layered** · rounded rects — a CI/CD build pipeline (DAG).
 *   - **Hierarchy · radial tree** · hexagons — a company org chart (tree).
 *   - **Geometric · circular** · stars — a 12-city round-the-world tour.
 *
 * The bundle ships a force layout wired to `config.activeLayout`; here that's set
 * to `''` so it stays dormant, and a tiny `<ApplyLayout>` child applies the
 * chosen layout to that app's graph on mount (via `useLayout`, which resolves
 * the app's own engine from context, then fits the view). Styling is the usual
 * per-instance `config.layers.graph` patch, with the bundle's type-colour
 * behaviour off so each template's flat fills win.
 */

import { Children, type ReactNode, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TextResolutionLODBehaviour, useLayout, type LayoutFactory } from '@invana/canvas-react';
import { GraphCanvasApp } from '@invana/canvas-ui';
import type { EdgeStyle, GraphData, GraphNode, NodeStyle } from '@invana/graph';
import { ThemeProvider } from '@invana/themes';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { D3HierarchyLayout } from '@invana/graph-layout-d3-hierarchy';
import { GeometricLayout } from '@invana/graph-layout-geometric';

const meta: Meta = { title: 'canvas-ui/graph-canvas-app/MultipleApps' };
export default meta;
type Story = StoryObj;

/**
 * A 2×2 grid of independent `<GraphCanvasApp>`s under one host `<ThemeProvider>`
 * (theme is the only shared concern — every app needs a provider ancestor). Each
 * top-level child gets its own bounded cell; `minWidth/minHeight: 0` lets the
 * cell shrink so each app's `height: 100%` resolves against the track.
 */
function AppGrid({ children }: { children: ReactNode }): ReactNode {
  return (
    <ThemeProvider>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          // Padding around the grid + a matching gap gutter, so the four apps are
          // evenly spaced from each other and from the edges (not butted together).
          gap: 12,
          padding: 12,
          boxSizing: 'border-box',
          width: '100%',
          height: '100vh',
          background: 'var(--border, #e2e8f0)',
        }}
      >
        {Children.map(children, (child) => (
          <div style={{ minWidth: 0, minHeight: 0, overflow: 'hidden' }}>{child}</div>
        ))}
      </div>
    </ThemeProvider>
  );
}

/**
 * Drop inside a `<GraphCanvasApp>` to apply a one-off layout to its graph on
 * mount (resolving that app's own engine from context). Pair with
 * `config={{ activeLayout: '' }}` so the bundle's default force layout stays
 * dormant and this choice wins. Renders nothing.
 */
function ApplyLayout({ factory }: { factory: LayoutFactory }): null {
  const layouts = useMemo(() => ({ active: factory }), [factory]);
  useLayout(layouts, { layerId: 'graph' });
  return null;
}

// Small, meaningful graphs — each ≤ 15 nodes with real names (used as both id
// and label) so the four apps read clearly even zoomed out, and each shaped for
// its layout (the hierarchy needs a single-root tree; ELK reads best on a DAG).
// Edges carry a `type` (the relation), surfaced if you click one.

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

/** A company org chart — a single-root tree (parent → child = "reports to"). */
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

/** A 12-city round-the-world tour — a ring + two long-haul shortcuts (chords). */
const TOUR_GRAPH: GraphData = {
  nodes: [
    { id: 'London' }, { id: 'Paris' }, { id: 'Rome' }, { id: 'Cairo' },
    { id: 'Dubai' }, { id: 'Mumbai' }, { id: 'Singapore' }, { id: 'Tokyo' },
    { id: 'Sydney' }, { id: 'Los Angeles' }, { id: 'New York' }, { id: 'Reykjavik' },
  ],
  edges: [
    { id: 'f1', source: 'London', target: 'Paris', type: 'flight' },
    { id: 'f2', source: 'Paris', target: 'Rome', type: 'flight' },
    { id: 'f3', source: 'Rome', target: 'Cairo', type: 'flight' },
    { id: 'f4', source: 'Cairo', target: 'Dubai', type: 'flight' },
    { id: 'f5', source: 'Dubai', target: 'Mumbai', type: 'flight' },
    { id: 'f6', source: 'Mumbai', target: 'Singapore', type: 'flight' },
    { id: 'f7', source: 'Singapore', target: 'Tokyo', type: 'flight' },
    { id: 'f8', source: 'Tokyo', target: 'Sydney', type: 'flight' },
    { id: 'f9', source: 'Sydney', target: 'Los Angeles', type: 'flight' },
    { id: 'f10', source: 'Los Angeles', target: 'New York', type: 'flight' },
    { id: 'f11', source: 'New York', target: 'Reykjavik', type: 'flight' },
    { id: 'f12', source: 'Reykjavik', target: 'London', type: 'flight' },
    { id: 'x1', source: 'London', target: 'Tokyo', type: 'long-haul' },
    { id: 'x2', source: 'Rome', target: 'Sydney', type: 'long-haul' },
  ],
};

// Module-scoped so the factory / style references stay stable across renders.
const PANELS: {
  title: string;
  data: GraphData;
  factory: LayoutFactory;
  node: NodeStyle;
  edge: EdgeStyle;
}[] = [
  {
    title: 'Team · force · circles',
    data: TEAM_GRAPH,
    factory: () =>
      new D3ForceLayout({ charge: { strength: -400 }, link: { distance: 90 }, animate: false }),
    node: { shape: { kind: 'circle', radius: 10 }, bgFill: 0x60a5fa },
    edge: { strokeWidth: 1.25, strokeColor: 0x94a3b8, arrowTargetShape: 'none' },
  },
  {
    title: 'Build pipeline · ELK layered · rects',
    data: PIPELINE_GRAPH,
    // Generous spacing so the wider rects don't crowd within / between layers.
    factory: () =>
      new ElkLayout({
        algorithm: 'layered',
        direction: 'RIGHT',
        nodeSpacing: 40,
        layerSpacing: 90,
      }),
    node: {
      shape: { kind: 'rect', width: 72, height: 26, cornerRadius: 5 },
      bgFill: 0x059669,
      bgStrokeColor: 0x065f46,
      bgStrokeWidth: 1.5,
      // Label sits inside the rect, truly centred. The bundle's default
      // `labelOffsetY: 4` (for the outside 'bottom' label) would push it low, so
      // zero the offsets and centre-align for an inside label.
      labelPlacement: 'inside-center',
      labelAlign: 'center',
      labelOffsetX: 0,
      labelOffsetY: 0,
      labelFontSize: 10,
    },
    edge: { strokeWidth: 1.5, strokeColor: 0x64748b, arrowTargetShape: 'triangle' },
  },
  {
    title: 'Org chart · radial tree · hexagons',
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
  {
    title: 'City tour · geometric circular · stars',
    data: TOUR_GRAPH,
    factory: () => new GeometricLayout({ mode: 'circular' }),
    node: {
      shape: { kind: 'star', points: 5, innerRadius: 5, outerRadius: 12 },
      bgFill: 0xa78bfa,
      bgStrokeColor: 0x6d28d9,
      bgStrokeWidth: 1,
    },
    edge: { strokeWidth: 1.25, strokeColor: 0x8b5cf6, arrowTargetShape: 'diamond' },
  },
];

export const MultipleApps: Story = {
  render: () => (
    <AppGrid>
      {PANELS.map((p) => (
        <GraphCanvasApp
          key={p.title}
          data={p.data}
          header={{ title: p.title }}
          // `activeLayout: ''` keeps the bundle's force layout dormant (the
          // <ApplyLayout> child runs the chosen layout); type-colour off so the
          // template's flat fills win.
          config={{
            activeLayout: '',
            behaviours: { color: { enabled: false } },
            // Label every node by its name (the id doubles as the label here).
            layers: {
              graph: {
                node: { style: { ...p.node, labelText: (n: GraphNode) => n.id } },
                edge: { style: p.edge },
              },
            },
          }}
        >
          <ApplyLayout factory={p.factory} />
          {/* Re-rasterise labels at higher resolution as the view zooms in, so
              the baked text texture stays crisp instead of scaling up blurry. */}
          <TextResolutionLODBehaviour targetLayerId="graph" />
        </GraphCanvasApp>
      ))}
    </AppGrid>
  ),
};
