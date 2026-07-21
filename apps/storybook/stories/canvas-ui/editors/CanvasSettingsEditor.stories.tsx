/**
 * `<CanvasSettingsEditor>` from `@invana/canvas-ui` — one JSON-driven settings
 * panel over a whole canvas definition. It takes the serialisable set of
 * registered **layers / behaviours / layouts** + their settings, lists them in a
 * file-browser accordion (folders = sections, files = instances), and expands each
 * row in place to a schema-driven `SettingsPanel`.
 *
 * Two stories:
 *
 * - **Standalone** — a static `CanvasSettingsDefinition` in, and every edit logged
 *   to the side as the engine-shaped patch a host would apply via
 *   `canvas.update({ [section]: { [id]: patch } })`. No engine anywhere.
 * - **Live Settings Editors** — the panel docked into a real `<GraphCanvasApp>`'s
 *   `right` region, introspecting the live bundle and applying every edit live via
 *   `canvas.update(...)`.
 */

import { useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CanvasSettingsEditor,
  CanvasSettingsPanel,
  type CanvasSettingsDefinition,
  type SettingsSection,
} from '@invana/canvas-ui';
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

// ─── Standalone ──────────────────────────────────────────────────────────────

/**
 * A seed definition — the shape a host builds by introspecting a live canvas
 * (`kind` per instance, current engine-shaped `settings`, `enabled` for
 * layers / behaviours, and the active layout id).
 */
const INITIAL_DEFINITION: CanvasSettingsDefinition = {
  layers: [
    {
      id: 'background',
      kind: 'background-layer',
      settings: {
        type: 'pattern',
        patternType: 'dots',
        backgroundColor: 0x0f172a,
        color: 0x334155,
        size: 1.5,
        spacing: 24,
        alpha: 0.6,
        followCamera: true,
      },
    },
    { id: 'minimap', kind: 'minimap-layer', settings: { position: 'bottom-right', width: 240, height: 160, enableDrag: true } },
    { id: 'graph-density', kind: 'density-contour-fill-layer', settings: { bandwidth: 40, thresholds: 8, palette: 'viridis' } },
  ],
  behaviours: [
    { id: 'pan', kind: 'drag-pan', enabled: true, settings: { modifier: 'none', decelerate: true } },
    { id: 'zoom', kind: 'wheel-zoom', enabled: true, settings: { requireCtrl: true, percent: 0.15, smooth: true, smoothFrames: 24 } },
    { id: 'drag', kind: 'drag-node', enabled: true, settings: { pinOnRelease: true, groupAware: true } },
    { id: 'hover', kind: 'hover-activate', enabled: false, settings: { degree: 1, direction: 'both' } },
    { id: 'brush', kind: 'brush-select', enabled: true, settings: { enableElements: ['shape'], style: { fill: 0x3b82f6, fillAlpha: 0.1 } } },
  ],
  layouts: [
    { id: 'force', kind: 'd3-force-layout', settings: { linkDistance: 90, chargeStrength: -300, animate: true } },
    { id: 'elk', kind: 'elk-layout', settings: { algorithm: 'layered', direction: 'RIGHT', nodeSpacing: 40, layerSpacing: 60 } },
  ],
  activeLayoutId: 'force',
};

function StandaloneDemo() {
  const [definition, setDefinition] = useState(INITIAL_DEFINITION);
  const [lastPatch, setLastPatch] = useState<{
    section: SettingsSection;
    id: string;
    patch: Record<string, unknown>;
  } | null>(null);

  // Mirror a live host: fold each edit into the running definition and log the
  // patch a canvas would receive.
  const applyPatch = (section: SettingsSection, id: string, patch: Record<string, unknown>) => {
    setLastPatch({ section, id, patch });
    setDefinition((d) => ({
      ...d,
      [section]: (d[section] ?? []).map((inst) =>
        inst.id === id ? { ...inst, settings: { ...(inst.settings ?? {}), ...patch } } : inst,
      ),
    }));
  };

  // Enable/disable is an `{ enabled }` patch a live host applies via
  // `canvas.update({ [section]: { [id]: { enabled } } })` — log it like any other
  // edit AND flip the instance's `enabled` in the running definition.
  const toggle = (section: SettingsSection, id: string, enabled: boolean) => {
    setLastPatch({ section, id, patch: { enabled } });
    setDefinition((d) => ({
      ...d,
      [section]: (d[section] ?? []).map((inst) => (inst.id === id ? { ...inst, enabled } : inst)),
    }));
  };

  return (
    <div style={pageStyle}>
      {/* Flex + full-height so the panel's PanelStack (which fills its parent)
          has a definite height to occupy. */}
      <div style={{ width: 380, display: 'flex', minHeight: 0 }}>
        <CanvasSettingsEditor
          definition={definition}
          onChange={applyPatch}
          onToggle={toggle}
          onActiveLayoutChange={(id) => setDefinition((d) => ({ ...d, activeLayoutId: id }))}
        />
      </div>

      {/* The last emitted patch and the full definition each get their own
          column, side by side (not stacked). */}
      <div style={colStyle}>
        <div style={labelStyle}>Live → canvas.update()</div>
        <pre style={preStyle}>
          {lastPatch
            ? `canvas.update(${JSON.stringify(
                { [lastPatch.section]: { [lastPatch.id]: lastPatch.patch } },
                null,
                2,
              )})`
            : '// edit any field to see the engine-shaped patch'}
        </pre>
      </div>

      <div style={colStyle}>
        <div style={labelStyle}>Definition document</div>
        <pre style={preStyle}>{JSON.stringify(definition, null, 2)}</pre>
      </div>
    </div>
  );
}

/**
 * Fully **standalone** — a static `CanvasSettingsDefinition` in, and every edit
 * logged as the engine-shaped patch a host would apply. No engine anywhere. Each
 * instance's `settings` are in the engine's option shape; the panel maps them to
 * the flat form via the built-in registry (`kind` → fields + mappers) and maps
 * edits back on the way out.
 */
export const Standalone: Story = {
  render: () => <StandaloneDemo />,
};

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

// ─── Layout (Standalone) ──────────────────────────────────────────────────────

const pageStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  gap: 16,
  height: '100vh',
  padding: 16,
  boxSizing: 'border-box',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: 'var(--background, #fff)',
  color: 'var(--foreground, #111)',
};

const colStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  flex: 1,
  minWidth: 320,
  maxHeight: '100%',
  overflow: 'hidden',
};

const labelStyle: CSSProperties = { fontWeight: 600, fontSize: 13 };

const preStyle: CSSProperties = {
  margin: 0,
  padding: 12,
  fontSize: 12,
  lineHeight: 1.5,
  background: 'var(--muted, #f4f4f5)',
  borderRadius: 8,
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
};
