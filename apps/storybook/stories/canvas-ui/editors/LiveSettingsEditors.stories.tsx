import { useEffect, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CanvasMessageBar,
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
  useCanvas,
  useDevTool,
  useGraphCanvasOptions,
  useMiniMap,
} from '@invana/canvas-react';
import {
  CanvasSettingsPanelView,
  type CanvasSettingsDefinition,
  type CanvasSettingsInstance,
  type SettingsSection,
} from '@invana/canvas-ui';
import type { GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { ThemeProvider } from '@invana/themes';
import type { MenuItem } from '@invana/ui';

import { resolveKind, readOptions } from './liveCanvasDefinition';

/**
 * `canvas-ui/editors/Live Settings Editors` — a **fully-featured** `GraphCanvasApp`
 * whose whole visualisation state is edited through a right-side
 * **`<CanvasSettingsPanelView>`** (from `@invana/canvas-ui`).
 *
 * A small `<LiveCanvasSettingsPanel>` introspects the app's live bundle — every
 * registered Layer, Behaviour and Layout — maps each instance to the panel's
 * JSON definition (`kind` + current engine-shaped `settings`), and renders the
 * panel. Every edit applies **live** via `canvas.update(...)` → `setOptions`;
 * toggling a behaviour enables/disables it, and picking a layout makes it active.
 * Instances whose class the registry doesn't recognise still list with a "no
 * editor" placeholder — the panel reflects the whole state, not just the editable
 * slice.
 *
 * The introspection ↔ panel bridge lives here (in the story) because the panel is
 * engine-agnostic (`@invana/canvas-ui` can't import the engine) — this is exactly
 * how the Invana building studio would wire it.
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
function LiveCanvasSettingsPanel() {
  const canvas = useCanvas();
  const [options, update] = useGraphCanvasOptions();

  // The registered instances (id + kind). Captured in an effect — the panel is a
  // later child than the bundle it inspects, so the registration effects have
  // already run by the time this fires (reading during render would see an empty
  // registry). Their *settings* + *enabled* then come reactively from `options`.
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
      // The docked <PanelContent> already supplies the "Canvas Settings" header +
      // scroll, so flatten the panel's own card chrome + title here.
      title={null}
      className="border-0 bg-transparent shadow-none"
      onChange={(section: SettingsSection, id, patch) => update({ [section]: { [id]: patch } })}
      onToggle={(section: SettingsSection, id, enabled) => update({ [section]: { [id]: { enabled } } })}
      onActiveLayoutChange={(id) => update({ activeLayout: id })}
    />
  );
}

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

          {/* The star: a docked right-side canvas settings panel over the live
              bundle. A full-height <Panel> positions a <PanelContent> whose
              scrollable body holds the JSON-driven settings panel. */}
          <Panel position="right">
            <PanelContent header="Canvas Settings" fill width={360}>
              <LiveCanvasSettingsPanel />
            </PanelContent>
          </Panel>
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
