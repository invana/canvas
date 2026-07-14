import { useEffect, useState } from 'react';
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
  useGraphCanvasUpdate,
  useMiniMap,
} from '@invana/canvas-react';
import {
  CanvasSettingsPanelView,
  type CanvasSettingsDefinition,
  type SettingsSection,
} from '@invana/canvas-ui';
import type { GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { ThemeProvider } from '@invana/themes';
import type { MenuItem } from '@invana/ui';

import { toSettingsInstance } from './liveCanvasDefinition';

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
 * Introspects the live canvas into a {@link CanvasSettingsDefinition} and renders
 * the panel, wiring every edit back through `canvas.update(...)`. Must be a
 * descendant of `<GraphCanvasApp>` so `useCanvas()` resolves.
 */
function LiveCanvasSettingsPanel({ activeLayoutId }: { activeLayoutId: string }) {
  const canvas = useCanvas();
  const update = useGraphCanvasUpdate();
  const [definition, setDefinition] = useState<CanvasSettingsDefinition>({});

  // Snapshot the bundle once after mount (the panel is a later child than the
  // instances it inspects, so their registration effects have already run).
  useEffect(() => {
    setDefinition({
      layers: canvas.layers.list().map((i) => toSettingsInstance(i, 'layers')),
      behaviours: canvas.behaviours.list().map((i) => toSettingsInstance(i, 'behaviours')),
      layouts: canvas.layouts.list().map((i) => toSettingsInstance(i, 'layouts')),
      activeLayoutId,
    });
  }, [canvas, activeLayoutId]);

  return (
    <CanvasSettingsPanelView
      definition={definition}
      // The docked <PanelContent> already supplies the "Canvas Settings" header +
      // scroll, so flatten the panel's own card chrome + title here.
      title={null}
      className="border-0 bg-transparent shadow-none"
      onChange={(section: SettingsSection, id, patch) => update({ [section]: { [id]: patch } })}
      onToggle={(section: SettingsSection, id, enabled) => {
        update({ [section]: { [id]: { enabled } } });
        // Reflect the toggle in the panel's own state.
        setDefinition((d) => ({
          ...d,
          [section]: (d[section] ?? []).map((inst) =>
            inst.id === id ? { ...inst, enabled } : inst,
          ),
        }));
      }}
      onActiveLayoutChange={(id) => {
        update({ activeLayout: id });
        setDefinition((d) => ({ ...d, activeLayoutId: id }));
      }}
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
              <LiveCanvasSettingsPanel activeLayoutId="graph-force" />
            </PanelContent>
          </Panel>
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
