import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CanvasMessageBar,
  CanvasSettingsBrowser,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  GraphNodeContextMenu,
  type GraphNodeMenuContext,
  GraphBackgroundContextMenu,
  Panel,
  PanelContent,
  type LayoutFactory,
  ThemeToggle,
  useDevTool,
  useMiniMap,
} from '@invana/canvas-react';
import type { GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { ThemeProvider } from '@invana/themes';
import type { MenuItem } from '@invana/ui';

// The full editor registry — one descriptor per Behaviour / Layer / Layout
// editor in `@invana/canvas-ui`, matched to the live bundle by `instanceof`.
import { ALL_SETTINGS_EDITORS } from './allEditors';

/**
 * `canvas-ui/editors/Live Settings Editors` — the settings editors driving a
 * **fully-featured** `GraphCanvasApp`, surfaced through a right-side
 * **file-browser settings panel** (`<CanvasSettingsBrowser>`).
 *
 * The browser introspects the app's live bundle — every registered Layer,
 * Behaviour and Layout — and lists them in a nested accordion (folders =
 * Layers / Behaviours / Layouts, files = instances). Expanding a row reveals
 * its schema-driven editor from `@invana/canvas-ui`; the editor emits a
 * serialisable patch that applies **live** via `canvas.update(...)` →
 * `setOptions`. Bundle instances without an editor (yet) are still listed with a
 * "no editor" placeholder — the panel reflects the whole visualisation state,
 * not just the editable slice.
 *
 * The editors are **injected** as descriptors (the browser lives in
 * `@invana/canvas-react`, which can't import the editor package): each closes
 * over an editor component + its `optionsToForm` / `formToOptions` mapping and
 * matches its class by `instanceof`. This is exactly how the Invana building
 * studio would wire the same panel.
 */
const meta: Meta = { title: 'canvas-ui/editors/Live Settings Editors' };
export default meta;
type Story = StoryObj;

// Multi-layout picker for the header toolbar — the app's `activeLayout` is
// `'graph-force'`; selecting one swaps the active layout live.
const LAYOUTS: Record<string, LayoutFactory> = {
  'd3-force': () =>
    new D3ForceLayout({ charge: { strength: -240 }, link: { distance: 70 }, animate: false }),
  'elk-layered': () => new ElkLayout({ algorithm: 'layered', direction: 'RIGHT' }),
};
const LAYOUT_LABEL: Record<string, string> = { 'd3-force': 'Force', 'elk-layered': 'Layered' };

const groupOf = (n: GraphNode): number => (n.data as { group?: number } | undefined)?.group ?? 0;

const nodeMenu = (ctx: GraphNodeMenuContext): MenuItem[] => [
  { id: 'inspect', label: `Inspect ${ctx.id}`, onClick: () => window.alert(`Node ${ctx.id}`) },
];
const backgroundMenu = (): MenuItem[] => [
  { id: 'about', label: 'Les Misérables co-appearances', onClick: () => window.alert('Demo graph') },
];

export const LiveSettingsEditors: Story = {
  name: 'Live Settings Editors',
  render: function Render() {
    const dev = useDevTool({ corner: 'top-left', margin: { x: 12, y: 48 } });
    const mini = useMiniMap({ backgroundLayerId: 'background', position: 'bottom-left' });

    // Les Misérables ships no `type`; give each node its community group as its
    // type (so the bundle's colour-by-label behaviour tints by community) and
    // each edge the `APPEARS_WITH` label.
    const data = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: `Group ${groupOf(n)}` })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };

    return (
      // GraphCanvasApp reads light/dark from a host <ThemeProvider> (and throws
      // without one).
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          onReady={(c) => c?.showMessage('Open the right panel to edit any layer / behaviour / layout')}
          config={{
            layouts: {
              'graph-force': {
                charge: { strength: -240 },
                link: { distance: 70 },
                collide: { radius: 18 },
                animate: false,
              },
            },
          }}
          header={{
            title: 'Live Settings Editors',
            center: <GraphControlsToolbar layouts={LAYOUTS} layoutLabel={LAYOUT_LABEL} />,
            right: (ctx) => (
              <>
                {mini.button}
                {dev.button}
                <ThemeToggle ctx={ctx} />
              </>
            ),
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        >
          {/* Extra layers — minimap + on-demand dev overlay. */}
          {mini.layer}
          {dev.layer}

          {/* Right-click menus. */}
          <GraphNodeContextMenu items={nodeMenu} />
          <GraphBackgroundContextMenu items={backgroundMenu} />

          {/* The star: a docked right-side settings browser over the live bundle.
              A full-height <Panel> positions a <PanelContent> whose scrollable
              body holds the file-browser accordion. */}
          <Panel position="right">
            <PanelContent header="Canvas Settings" fill width={360}>
              <CanvasSettingsBrowser registry={ALL_SETTINGS_EDITORS} activeLayoutId="graph-force" />
            </PanelContent>
          </Panel>
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
