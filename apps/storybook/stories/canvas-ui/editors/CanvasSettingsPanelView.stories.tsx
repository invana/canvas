/**
 * `<CanvasSettingsPanelView>` from `@invana/canvas-ui` — one JSON-driven settings
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

import { useContext, useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CanvasSettingsPanelView,
  type CanvasSettingsDefinition,
  type CanvasSettingsInstance,
  type SettingsSection,
} from '@invana/canvas-ui';
import {
  CanvasMessageBar,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  GraphCanvasContext,
  GraphNodeContextMenu,
  type GraphNodeMenuContext,
  GraphBackgroundContextMenu,
  type LayoutFactory,
  ThemeToggle,
  ToolbarItems,
  useCanvas,
  useDevTool,
  useGraphCanvasOptions,
  useMiniMap,
} from '@invana/canvas-react';
import type { GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { ThemeProvider } from '@invana/themes';
import type { MenuItem } from '@invana/ui';
import { Settings } from 'lucide-react';

import { resolveKind, readOptions } from './liveCanvasDefinition';

const meta: Meta = { title: 'canvas-ui/editors/CanvasSettingsPanelView' };
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

  const toggle = (section: SettingsSection, id: string, enabled: boolean) =>
    setDefinition((d) => ({
      ...d,
      [section]: (d[section] ?? []).map((inst) => (inst.id === id ? { ...inst, enabled } : inst)),
    }));

  return (
    <div style={pageStyle}>
      <div style={{ width: 380 }}>
        <CanvasSettingsPanelView
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

/**
 * Renders the settings panel over the live canvas — both **reading and writing
 * through `@invana/canvas-store`** so it and the header's Select picker are two
 * views of one source of truth:
 *
 * - `useGraphCanvasOptions()` reads `store.view.definition` **reactively** — the
 *   panel re-renders whenever any layer/behaviour/layout config changes, from
 *   anywhere (the header's Select switch, other UI, or the engine).
 * - Every edit / toggle / layout pick writes via that hook's `update` →
 *   `canvas.update(...)`, which updates the store definition AND applies to the
 *   instances. So flipping a tool in the header updates the panel and vice-versa,
 *   with no event wiring.
 *
 * The instance **list** (id + `kind`) comes from the live registries once — the
 * store keeps options keyed by id but is domain-free (no class/kind), so we
 * resolve `kind` by `instanceof` here. Must be a `<GraphCanvasApp>` descendant.
 */
function LiveCanvasSettingsPanelInner() {
  const canvas = useCanvas();
  const [options, update] = useGraphCanvasOptions();

  // The registered instances (id + kind). Captured in an effect keyed on
  // `canvas` — from the `right` region this reads the lifted-context engine,
  // which only turns non-null once `<CanvasReady>` (the bundle's last child)
  // fires, i.e. after every layer/behaviour/layout has registered, so the
  // registries are already populated. Their *settings* + *enabled* then come
  // reactively from `options`.
  const [instances, setInstances] = useState<{
    layers: { id: string; kind?: string; inst: unknown }[];
    behaviours: { id: string; kind?: string; inst: unknown }[];
    layouts: { id: string; kind?: string; inst: unknown }[];
  }>({ layers: [], behaviours: [], layouts: [] });

  useEffect(() => {
    const map = (list: readonly { id: string }[]) =>
      list.map((i) => ({ id: i.id, kind: resolveKind(i), inst: i as unknown }));
    setInstances({
      layers: map(canvas.layers.list()),
      behaviours: map(canvas.behaviours.list()),
      layouts: map(canvas.layouts.list()),
    });
  }, [canvas]);

  // Merge the stable instance list with the reactive store definition. Settings =
  // the instance's full options as a base, with the store's serialisable slice
  // (the reactive, authoritative part) layered on top; `enabled` reads from the
  // store, falling back to the live instance until the store carries it.
  const definition: CanvasSettingsDefinition = useMemo(() => {
    const build = (
      list: { id: string; kind?: string; inst: unknown }[],
      bag: Record<string, Record<string, unknown>> | undefined,
      withEnabled: boolean,
    ): CanvasSettingsInstance[] =>
      list.map(({ id, kind, inst }) => {
        const stored = bag?.[id];
        return {
          id,
          kind: kind ?? (inst as object).constructor.name,
          settings: { ...readOptions(inst), ...(stored ?? {}) },
          ...(withEnabled
            ? {
                enabled:
                  (stored as { enabled?: boolean } | undefined)?.enabled ??
                  (inst as { enabled?: boolean }).enabled,
              }
            : {}),
        };
      });

    return {
      layers: build(instances.layers, options.layers, false),
      behaviours: build(instances.behaviours, options.behaviours, true),
      layouts: build(instances.layouts, options.layouts, false),
      activeLayoutId: options.activeLayout ?? undefined,
    };
  }, [instances, options]);

  return (
    <CanvasSettingsPanelView
      definition={definition}
      // The `right` region already wraps content in an `overflow-auto bg-card`
      // panel, so keep the view's own "Canvas Settings" heading but flatten its
      // inner Card chrome (no nested card-in-card / double background).
      className="border-0 bg-transparent shadow-none"
      onChange={(section: SettingsSection, id, patch) => update({ [section]: { [id]: patch } })}
      onToggle={(section: SettingsSection, id, enabled) => update({ [section]: { [id]: { enabled } } })}
      onActiveLayoutChange={(id) => update({ activeLayout: id })}
    />
  );
}

/**
 * Gate for the panel: the `right` region renders under `GraphCanvasApp`'s
 * **lifted** `CanvasContext`, which is `null` until Main's ready-bridge publishes
 * the engine — unlike an in-`<Canvas>` child, which only mounts once ready. The
 * inner panel's engine hooks (`useCanvas` / `useGraphCanvasOptions`) throw on a
 * null canvas, so hold rendering until the lifted context turns non-null.
 */
function LiveCanvasSettingsPanel() {
  const canvas = useContext(GraphCanvasContext);
  if (!canvas) return null;
  return <LiveCanvasSettingsPanelInner />;
}

/**
 * A **fully-featured** `<GraphCanvasApp>` whose whole visualisation state is edited
 * through the app's docked, resizable `right` region hosting a
 * `<CanvasSettingsPanelView>`. A header settings toggle mounts / unmounts the
 * region. The introspection ↔ panel bridge lives here (in the story) because the
 * panel is engine-agnostic (`@invana/canvas-ui` can't import the engine) — this is
 * exactly how the Invana building studio would wire it.
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
          // The star: the app's own docked, resizable `right` region hosts the
          // JSON-driven settings panel over the live bundle (same wiring as
          // FullFeatured's inspector). The region supplies the `overflow-auto
          // bg-card` chrome + scroll; the panel renders its own heading. Its
          // content is rendered inside the lifted Canvas/GraphCanvas contexts, so
          // <LiveCanvasSettingsPanel>'s engine hooks resolve the live instance.
          right={
            settingsOpen
              ? {
                  content: <LiveCanvasSettingsPanel />,
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
  alignItems: 'flex-start',
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
