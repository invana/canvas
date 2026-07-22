/**
 * `<CanvasSettingsPanel>` from `@invana/canvas-ui` — one JSON-driven settings
 * panel over a whole canvas definition, docked into a real `<GraphCanvasApp>`'s
 * `right` region. It introspects the live bundle's registered **layers /
 * behaviours / layouts**, lists them in a file-browser accordion (folders =
 * sections, files = instances), expands each row in place to a schema-driven
 * `SettingsPanel`, and applies every edit live via `canvas.update(...)`.
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasSettingsPanel } from '@invana/canvas-ui';
import type { LayoutFactory } from '@invana/canvas-react';
import { CanvasMessageBar, GraphCanvasApp, GraphControlsToolbar, GraphStatusBar, GraphNodeContextMenu, type GraphNodeMenuContext, GraphBackgroundContextMenu, ThemeToggle, ToolbarItems, useDevTool, useMiniMap } from '@invana/canvas-ui';
import type { GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { ThemeProvider } from '@invana/themes';
import type { MenuItem } from '@invana/ui';
import { Settings } from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/editors/CanvasSettingsEditor' };
export default meta;
type Story = StoryObj;

// ─── Live Settings Editors ─────────────────────────────────────────────────────

// Multi-layout picker for the header toolbar — the app's `activeLayout` is
// `'graph-force'`; selecting one swaps the active layout live.
const LAYOUTS: Record<string, LayoutFactory> = {
  'd3-force': () =>
    new D3ForceLayout({ charge: { strength: -240 }, link: { distance: 70 }, animate: true }),
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

/**
 * A **fully-featured** `<GraphCanvasApp>` whose whole visualisation state is edited
 * through the app's docked, resizable `right` region hosting the store-connected
 * `<CanvasSettingsPanel>` (from `@invana/canvas-ui`). A header settings toggle
 * mounts / unmounts the region. There is **no bridge to write** — the panel finds
 * the canvas via context, introspects the registries, resolves each instance's
 * editor by its `kind`, and applies every edit through `@invana/canvas-store`.
 * This is exactly how the Invana building studio would drop it in.
 */
export const LiveSettingsEditors: Story = {
  name: 'Live Settings Editors',
  render: function Render() {
    const dev = useDevTool({ corner: 'top-left', margin: { x: 12, y: 48 } });
    const mini = useMiniMap({ backgroundLayerId: 'background', position: 'bottom-left' });
    // The settings panel is toggled from the header — mounting the `right` region
    // when open, unmounting it (canvas reclaims the width) when closed. Open by
    // default so the editors are visible on load.
    const [settingsOpen, setSettingsOpen] = useState(true);

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
                // No fixed link distance / collide radius — let collision derive
                // each node's radius from its render bounds so nodes of any size
                // don't overlap (see GraphCanvasApp BASE_CONFIG).
                link: {},
                collide: {},
                // Live, animated settle by default — the settings panel's
                // "Animate" toggle starts on and the Run button flips to Stop.
                animate: true,
              },
            },
          }}
          header={{
            title: 'Live Settings Editors',
            center: <GraphControlsToolbar layouts={LAYOUTS} layoutLabel={LAYOUT_LABEL} />,
            right: (ctx) => (
              <>
                {dev.button}
                {/* Settings toggle — shows / hides the docked right panel. */}
                <ToolbarItems
                  orientation="horizontal"
                  items={[
                    {
                      type: 'toggle',
                      key: 'settings',
                      icon: Settings,
                      label: 'Settings: hidden',
                      activeLabel: 'Settings: shown',
                      active: settingsOpen,
                      onToggle: () => setSettingsOpen((v) => !v),
                    },
                  ]}
                />
                <ThemeToggle ctx={ctx} />
              </>
            ),
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          // The star: the app's docked, resizable `right` region hosts the
          // store-connected `<CanvasSettingsPanel>` over the live bundle. The
          // region supplies the `overflow-auto bg-card` chrome + scroll; the panel
          // flattens its own inner card (className) and renders inside the lifted
          // Canvas/GraphCanvas contexts, so it binds to this canvas with no props.
          right={
            settingsOpen
              ? {
                  content: <CanvasSettingsPanel className="border-0 bg-transparent shadow-none" />,
                  defaultSize: '360px',
                  maxSize: '460px',
                  collapsible: true,
                }
              : undefined
          }
        >
          {/* Extra layers — minimap + on-demand dev overlay. */}
          {mini.layer}
          {dev.layer}

          {/* Right-click menus. */}
          <GraphNodeContextMenu items={nodeMenu} />
          <GraphBackgroundContextMenu items={backgroundMenu} />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};

