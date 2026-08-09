/**
 * `<CanvasSettingsEditorPanel>` from `@invana/canvas-ui` — one JSON-driven settings
 * panel over a whole canvas definition, docked into a real `<GraphCanvasApp>`'s
 * `right` region. It introspects the live bundle's registered **layers /
 * behaviours / layouts**, lists them in a file-browser accordion (folders =
 * sections, files = instances), expands each row in place to a schema-driven
 * `SettingsPanel`, and applies every edit live via `canvas.update(...)`.
 *
 * Docked via **`useSidePanels`** (the activity-bar controller): its descriptor
 * becomes the header toggle item and, while open, the resizable `right` region —
 * toggling swaps the dock in/out without reloading the canvas. `data`, `config`,
 * and `onReady` are **memoised**, so collapsing / expanding the settings (a
 * re-render) keeps their identity stable and never reloads the engine — the
 * view-panel standard (see `FindInCanvasViewPanel.stories.tsx`).
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DevInfoLayer, MiniMapLayer } from '@invana/canvas-react';
import type { LayoutFactory } from '@invana/canvas-react';
import {
  CanvasMessageBar,
  CanvasSettingsEditorPanel,
  GraphBackgroundContextMenu,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphNodeContextMenu,
  type GraphNodeMenuContext,
  GraphStatusBar,
  ToolbarItems,
  useSidePanels
} from '@invana/canvas-ui';
import type { GraphCanvas } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { ThemeProvider } from '@invana/themes';
import type { MenuItem } from '@invana/ui';
import { Gauge, Map, Moon, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/editors/CanvasSettingsEditorPanel' };
export default meta;
type Story = StoryObj;

// ─── Live Settings Editors ─────────────────────────────────────────────────────

// Multi-layout picker for the header toolbar — the app's `activeLayout` is
// `'graph-force'`; selecting one swaps the active layout live.
const LAYOUTS: Record<string, LayoutFactory> = {
  'd3-force': () =>
    new D3ForceLayout({ charge: { strength: -240 }, link: { distance: 70 }, animate: true }),
  'elk-layered': () => new ElkLayout({ algorithm: 'layered', direction: 'RIGHT' })
};
const LAYOUT_LABEL: Record<string, string> = { 'd3-force': 'Force', 'elk-layered': 'Layered' };

const nodeMenu = (ctx: GraphNodeMenuContext): MenuItem[] => [
  { id: 'inspect', label: `Inspect ${ctx.id}`, onClick: () => window.alert(`Node ${ctx.id}`) },
];
const backgroundMenu = (): MenuItem[] => [
  { id: 'about', label: 'Les Misérables co-appearances', onClick: () => window.alert('Demo graph') },
];

/**
 * A **fully-featured** `<GraphCanvasApp>` whose whole visualisation state is edited
 * through the app's docked, resizable `right` region hosting the store-connected
 * `<CanvasSettingsEditorPanel>` (from `@invana/canvas-ui`). A header settings toggle
 * mounts / unmounts the region. There is **no bridge to write** — it's handed the
 * live engine as its required `canvas` prop (from the region's `content` fn),
 * introspects the registries, resolves each instance's editor by its `kind`, and
 * applies every edit through `@invana/canvas-store`. This is exactly how the
 * Invana building studio would drop it in.
 */
export const CanvasSettingsEditorPanelStory: Story = {
  name: 'CanvasSettingsEditorPanel',
  render: function Render() {
    // The settings panel docks through the activity-bar controller: its descriptor
    // becomes the header toggle + (while open) the resizable `right` region. Open
    // by default so the editors are visible on load. The region's `content` fn
    // hands the live engine to the panel's `canvas` prop; the flattened card lets
    // the region supply chrome + scroll.
    const dock = useSidePanels(
      [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (canvas) => (
            <CanvasSettingsEditorPanel canvas={canvas} className="border-0 bg-transparent shadow-none" />
          )
        },
      ],
      { defaultOpenId: 'settings', section: { defaultSize: '360px', maxSize: '460px' } },
    );

    // Screen-fixed overlays driven as toolbar items (own their on-state; the
    // layers render as GraphCanvasApp children below, gated on it).
    const [minimapOn, setMinimapOn] = useState(true);
    const [devOn, setDevOn] = useState(false);

    // Les Misérables ships no `type`; give each node its community group as its
    // type (so the bundle's colour-by-label behaviour tints by community) and each
    // edge the `APPEARS_WITH` label. Memoised so toggling the panel (a re-render)
    // keeps a stable identity and never reloads the engine.
    const data = useMemo(
      () => lesMiserables,
      [],
    );

    // Memoised for the same stable-identity reason as `data`.
    const config = useMemo(
      () => ({
        layouts: {
          'graph-force': {
            charge: { strength: -240 },
            // No fixed link distance / collide radius — let collision derive each
            // node's radius from its render bounds so nodes of any size don't
            // overlap (see GraphCanvasApp BASE_CONFIG).
            link: {},
            collide: {},
            // Live, animated settle by default — the settings panel's "Animate"
            // toggle starts on and the Run button flips to Stop.
            animate: true
          }
        }
      }),
      [],
    );

    const onReady = useCallback((c: GraphCanvas | null) => {
      c?.showMessage('Open the right panel to edit any layer / behaviour / layout');
    }, []);

    return (
      // GraphCanvasApp reads light/dark from a host <ThemeProvider> (and throws
      // without one).
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Live Settings Editors',
            center: <GraphControlsToolbar layouts={LAYOUTS} layoutLabel={LAYOUT_LABEL} />,
            // One shared toolbar — the settings toggle plus minimap / dev-overlay /
            // theme, all as items.
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  ...dock.items,
                  {
                    type: 'toggle',
                    key: 'minimap',
                    icon: Map,
                    label: 'Minimap: off',
                    activeLabel: 'Minimap: on',
                    active: minimapOn,
                    onToggle: () => setMinimapOn((v) => !v)
                  },
                  {
                    type: 'toggle',
                    key: 'devinfo',
                    icon: Gauge,
                    label: 'Dev overlay: off',
                    activeLabel: 'Dev overlay: on',
                    active: devOn,
                    onToggle: () => setDevOn((v) => !v)
                  },
                  {
                    type: 'toggle',
                    key: 'theme',
                    icon: Sun,
                    activeIcon: Moon,
                    label: 'Switch to dark theme',
                    activeLabel: 'Switch to light theme',
                    active: ctx.themeKind === 'dark',
                    onToggle: ctx.toggleTheme
                  },
                ]}
              />
            )
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          // The active panel docks into the app's resizable `right` region (or none).
          right={dock.region}
        >
          {/* Screen-fixed overlays driven by the header toggle items above. */}
          {minimapOn && <MiniMapLayer backgroundLayerId="background" position="bottom-left" />}
          {devOn && <DevInfoLayer enabled corner="top-left" margin={{ x: 12, y: 48 }} />}

          {/* Right-click menus. */}
          <GraphNodeContextMenu items={nodeMenu} />
          <GraphBackgroundContextMenu items={backgroundMenu} />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  }
};
