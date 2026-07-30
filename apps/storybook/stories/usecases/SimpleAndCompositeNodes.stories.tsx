/**
 * **Simple + composite nodes** — a small use case mixing the node renderings on
 * one canvas, composed straight from `<GraphCanvasApp>` (the batteries-included
 * bundle: background · graph · d3-force · pan / zoom / drag / hover / click-select).
 *
 *   - **`Person` → rectangular composite card** — the built-in `idCard`
 *     structure + styling (type tag · divider · avatar beside name + role).
 *   - **`Organization` → elliptical composite card** — a freeform card whose
 *     `frame` is an `ellipse`, demonstrating that a composite can be *any*
 *     silhouette, not just a rectangle. Its fill, border and the hover / select
 *     ring + halo all follow the ellipse.
 *   - **`Concept` → simple circle** — the built-in `circle` structure, a single
 *     shape with a label.
 *
 * The card silhouette comes from `CompositeFrame` (`rect` default, or `ellipse` /
 * `regular-polygon` / `polygon`). Decorations trace whatever frame the composite
 * uses — hover highlights, click selects (ring + halo) — with the text intact.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider, useTheme } from '@invana/themes';
import { RichSelect } from '@invana/ui';
import { ClickViewBehaviour, HoverElementPreviewBehaviour, type LayoutFactory } from '@invana/canvas-react';
import { EdgeDetailView, GraphCanvasApp, GraphControlsToolbar, HoverElementPreviewCard, MiniMapToggleButton, NodeDetailView, Panel, PanelContent, ThemeToggle, type GraphCanvasAppControlContext } from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import type {
  FreeformStructure,
  GraphData,
  HoverElementPreviewCardsByType,
  NodeStructureRegistry,
  NodeTypeRegistry,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { GeometricLayout } from '@invana/graph-layout-geometric';

const meta: Meta = { title: 'usecases/SimpleAndCompositeNodes' };
export default meta;
type Story = StoryObj;

// Layout factories for the header's layout picker (module-scoped so the
// references stay stable across renders). The cards are wide, so every flavour
// gets generous spacing. The bundle's initial `graph-force` run still applies
// `config.layouts['graph-force']`; switching from the toolbar swaps in one of
// these against the live graph layer.
const LAYOUTS: Record<string, LayoutFactory> = {
  'd3-force': () =>
    new D3ForceLayout({ charge: { strength: -1400 }, link: { distance: 220 }, collide: { radius: 130 }, animate: false }),
  'elk-layered': () =>
    new ElkLayout({ algorithm: 'layered', direction: 'RIGHT', nodeSpacing: 90, layerSpacing: 160 }),
  circular: () => new GeometricLayout({ mode: 'circular', radius: 360 }),
};
const LAYOUT_LABEL: Record<string, string> = {
  'd3-force': 'Force',
  'elk-layered': 'Layered',
  circular: 'Circular',
};

// Per-type hover-preview cards. The headless `HoverElementPreviewBehaviour`
// resolves these dotted field paths against the hovered node and the React
// wrapper draws + anchors the card — one card layout per node `type`, matching
// the structure each type renders with.
const HOVER_CARDS: HoverElementPreviewCardsByType = {
  nodes: {
    Person: {
      // `data.avatar` holds ids (`'ada'`), not image URLs — the card's structure
      // slot resolves them, but the raw preview spec would render a broken <img>,
      // so the card leans on title / subtitle / rows instead.
      title: { field: 'data.name' },
      subtitle: { field: 'data.role' },
      rows: [{ label: 'Type', field: 'type' }],
    },
    Organization: {
      title: { field: 'data.name' },
      rows: [
        { label: 'Type', field: 'type' },
        { label: 'Founded', field: 'data.founded' },
      ],
    },
    Concept: {
      title: { field: 'data.name' },
      rows: [{ label: 'Type', field: 'type' }],
    },
  },
};

// The named theme families that have a matching `@invana/graph` palette. The
// host `<ThemeProvider>` also ships `tailwind` / `vite`, but those map to the
// `default` canvas palette — so we offer only the six with a distinct look.
const THEME_FAMILIES = ['default', 'forest', 'ocean', 'gold', 'rose', 'minimal'] as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Header theme chrome: the built-in light/dark `ThemeToggle` plus a family
 * picker. Both drive the host `<ThemeProvider>` (`useTheme`), and
 * `<GraphCanvasApp>` republishes the resolved mode + family to the engine
 * `ThemeBehaviour` — so switching either repaints the whole canvas (background,
 * nodes, edges, labels), not just the shell.
 */
function ThemeControls({ ctx }: { ctx: GraphCanvasAppControlContext }) {
  const { theme, setTheme } = useTheme();
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <RichSelect
        label="Theme"
        align="end"
        value={theme}
        onChange={(v) => setTheme(v as string)}
        options={THEME_FAMILIES.map((t) => ({ value: t, label: cap(t) }))}
      />
      <ThemeToggle ctx={ctx} />
    </div>
  );
}

export const SimpleAndCompositeNodes: Story = {
  render: () => {
    // A viewport-fixed minimap of the graph, toggled from a header button.

    const data: GraphData = {
      nodes: [
        { id: 'ada', type: 'Person', data: { name: 'Ada Lovelace', role: 'Mathematician', avatar: 'ada' } },
        { id: 'alan', type: 'Person', data: { name: 'Alan Turing', role: 'Computer Scientist', avatar: 'alan' } },
        { id: 'grace', type: 'Person', data: { name: 'Grace Hopper', role: 'Rear Admiral', avatar: 'grace' } },
        { id: 'tim', type: 'Person', data: { name: 'Tim Berners-Lee', role: 'Engineer', avatar: 'tim' } },
        { id: 'cambridge', type: 'Organization', data: { name: 'Univ. of Cambridge', founded: 'est. 1209' } },
        { id: 'cern', type: 'Organization', data: { name: 'CERN', founded: 'est. 1954' } },
        { id: 'ae', type: 'Concept', data: { name: 'Analytical Engine' } },
        { id: 'tm', type: 'Concept', data: { name: 'Turing Machine' } },
        { id: 'cobol', type: 'Concept', data: { name: 'COBOL' } },
        { id: 'www', type: 'Concept', data: { name: 'World Wide Web' } },
      ],
      edges: [
        { id: 'e1', source: 'ada', target: 'ae', type: 'DESIGNED' },
        { id: 'e2', source: 'alan', target: 'tm', type: 'DESCRIBED' },
        { id: 'e3', source: 'grace', target: 'cobol', type: 'CREATED' },
        { id: 'e4', source: 'tim', target: 'www', type: 'INVENTED' },
        { id: 'e5', source: 'alan', target: 'cambridge', type: 'STUDIED_AT' },
        { id: 'e6', source: 'tim', target: 'cern', type: 'WORKED_AT' },
        { id: 'e7', source: 'ada', target: 'alan', type: 'INFLUENCED' },
      ],
    };

    // An elliptical composite card. `frame: { kind: 'ellipse' }` makes the card
    // body an ellipse; freeform elements are absolutely placed (centred here),
    // and the engine traces the ellipse for fill, border AND every decoration.
    const orgBadge: FreeformStructure = {
      name: 'orgBadge',
      kind: 'freeform',
      width: 190,
      height: 128,
      frame: { kind: 'ellipse' },
      bgRole: 'cardBg',
      strokeRole: 'accent',
      strokeWidth: 1.5,
      elements: [
        { id: 'name', type: 'text', bind: 'data.name', x: 95, y: 46, anchor: 'center', maxWidth: 150, fontSize: 15, fontWeight: 700, colorRole: 'heading' },
        { id: 'founded', type: 'text', bind: 'data.founded', x: 95, y: 70, anchor: 'center', maxWidth: 150, fontSize: 12, colorRole: 'muted' },
      ],
    };
    const nodeStructureTemplates: NodeStructureRegistry = { orgBadge };

    // Map each node `type` to a structure (+ styling for the non-freeform ones).
    // `idCard` / `circle` are built in; `orgBadge` is the freeform ellipse above.
    const nodeTypes: NodeTypeRegistry = {
      Person: {
        structure: 'idCard',
        styling: 'idCard',
        bindings: { type: 'type', avatar: 'data.avatar', title: 'data.name', subtitle: 'data.role' },
      },
      // Freeform structures are self-contained — styling / bindings are ignored.
      Organization: { structure: 'orgBadge', styling: '', bindings: {} },
      Concept: { structure: 'circle', styling: 'circle', bindings: { label: 'data.name' } },
    };

    const config: CanvasConfig = {
      // The styling templates own node colour (theme roles), so the bundle's
      // colour-by-type behaviour is off — otherwise it would repaint fills.
      behaviours: { color: { enabled: false } },
      layers: { graph: { nodeStructureTemplates, nodeTypes } },
      // Cards are wide — space the force layout out so they don't overlap.
      layouts: { 'graph-force': { charge: { strength: -1400 }, link: { distance: 220 }, collide: { radius: 130 } } },
    };

    return (
      // <GraphCanvasApp> reads light/dark from a host <ThemeProvider> (required).
      // The bundle already enables the standard behaviours — pan / zoom / drag /
      // hover / click-select; `<GraphControlsToolbar>` adds the layout picker +
      // select-mode (rectangle / lasso) controls on top. The appended children
      // add a hover-preview card and a click-to-view detail dock without touching
      // the bundle.
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          header={{
            title: 'Simple + Composite Nodes',
            center: <GraphControlsToolbar layouts={LAYOUTS} layoutLabel={LAYOUT_LABEL} />,
            right: (ctx) => (
              <>
                <MiniMapToggleButton backgroundLayerId="background" position="bottom-right" />
                <ThemeControls ctx={ctx} />
              </>
            ),
          }}
        >
          {/* Dwell over a node → a per-type preview card (distinct from the
              bundle's `HoverActivateBehaviour`, which only highlights). */}
          <HoverElementPreviewBehaviour
            targetLayerId="graph"
            placement="auto"
            cards={HOVER_CARDS}
            renderCard={(snapshot) => <HoverElementPreviewCard card={snapshot.card} />}
          />

          {/* Click a node / edge → read-only properties dock on the right. The
              behaviour tracks the clicked element (decoupled from selection) and
              renders `panel(ctx)` verbatim — we supply the placement + chrome. A
              background click or the close button clears it. */}
          <ClickViewBehaviour
            targetLayerId="graph"
            panel={(ctx) => (
              <Panel position="right" style={{ top: 12, bottom: 12 }}>
                <PanelContent header={ctx.label} onClose={ctx.close} fill width={300}>
                  {ctx.kind === 'edge' ? (
                    <EdgeDetailView ctx={ctx} />
                  ) : (
                    <NodeDetailView ctx={ctx} />
                  )}
                </PanelContent>
              </Panel>
            )}
          />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
