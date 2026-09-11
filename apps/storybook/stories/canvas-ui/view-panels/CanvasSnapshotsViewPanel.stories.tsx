/**
 * **The saved snapshots of a canvas.** A header-toggled, right-docked
 * **`<CanvasSnapshotsViewPanel>`** over the ~20-service **microservices** topology:
 * one row per snapshot, grouped by the day it was captured — *Today* ·
 * *Yesterday* · the weekday · the date — newest first, each carrying a thumbnail,
 * a renameable title and what changed.
 *
 * **The panel does the work.** Given the live `canvas` it captures
 * (`exportState()` — definition, interaction and every data layer's records with
 * their positions — plus a thumbnail of what you were looking at), restores
 * (`importState`, **in place**), renames, deletes, and says what it did through
 * `canvas.showMessage`. This story passes `canvas` and four callbacks and writes
 * nothing else: that is the whole host.
 *
 * The callbacks are where a real host earns its keep —
 * `onCreateSnapshot(snapshot)` hands back the new row with its `state`, so Invana
 * can `POST` it to `canvas_snapshots` and restore it in a later session;
 * `onUpdateSnapshot` and `onDeleteSnapshot` report the rest. They may return a
 * promise, and a rejection rolls the change back rather than leaving a row that
 * exists only in the browser. Here they log — open the console to watch them fire.
 *
 * This story runs the panel **uncontrolled**: it owns its list, which is why it
 * starts empty and fills as you capture. `story:canvas-ui/apps/AppLayoutV2` shows
 * the other mode, where a shell keeps one list per board and passes `snapshots`.
 *
 * **The thumbnail is the restore control** — click the picture to load that
 * snapshot; there is no restore button and no *Current* badge, only a highlight on
 * the row that is loaded. A row whose picture never arrived still gets a frame, so
 * no row is a dead end.
 */
import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { D3ForceLayout } from '@invana/canvas-react';
import {
  CanvasMessageBar,
  CanvasSnapshotsViewPanel,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  ToolbarItems,
  useSidePanels,
  type CanvasSnapshot,
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData } from '@invana/graph';
import { microservices } from '@invana/graph-datasets/usecase-demos';
import { History, Moon, Sun } from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/view-panels/CanvasSnapshotsViewPanel' };
export default meta;
type Story = StoryObj;

export const CanvasSnapshotsViewPanelStory: Story = {
  name: 'CanvasSnapshotsViewPanel',
  render: function Render() {
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);

    // **This is the whole host.** The panel captures, restores, renames and
    // deletes on its own; what a host adds is persistence. Invana would POST
    // these to `canvas_snapshots` — the story logs them, so the seam is visible
    // in code without the panel growing a debug surface.
    //
    // Each callback may return a promise: reject it and the panel rolls the
    // change back and says so. Returning nothing (as here) is the simple case.
    const onCreateSnapshot = useCallback((snapshot: CanvasSnapshot) => {
      // `snapshot.state` is the document — persist the row whole and it restores
      // in any later session.
      console.info('onCreateSnapshot', snapshot.id, snapshot.summary, snapshot.state);
    }, []);

    const onUpdateSnapshot = useCallback((snapshot: CanvasSnapshot, change: { label?: string }) => {
      console.info('onUpdateSnapshot', snapshot.id, change);
    }, []);

    const onDeleteSnapshot = useCallback((id: string) => {
      console.info('onDeleteSnapshot', id);
    }, []);

    const onRestoreSnapshot = useCallback((snapshot: CanvasSnapshot) => {
      console.info('onRestoreSnapshot', snapshot.id);
    }, []);

    const dock = useSidePanels(
      [
        {
          id: 'snapshots',
          icon: History,
          label: 'History',
          render: () => (
            <CanvasSnapshotsViewPanel
              canvas={canvas}
              onCreateSnapshot={onCreateSnapshot}
              onUpdateSnapshot={onUpdateSnapshot}
              onDeleteSnapshot={onDeleteSnapshot}
              onRestoreSnapshot={onRestoreSnapshot}
            />
          ),
        },
      ],
      { defaultOpenId: 'snapshots', section: { defaultSize: '320px', maxSize: '420px' } },
    );

    const data = useMemo<GraphData>(
      () => ({
        nodes: microservices.nodes.map((n) => ({
          id: n.id,
          type: n.data.tier,
          data: n.data,
          style: { shape: { kind: 'circle', radius: 13 }, labelText: n.id, labelPlacement: 'bottom', labelFontSize: 10 },
        })),
        edges: microservices.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'CALLS',
          data: e.data,
          style: { strokeWidth: 1.2, strokeAlpha: 0.7, arrowTargetShape: 'triangle', arrowTargetSize: 6 },
        })),
      }),
      [],
    );

    const config: CanvasConfig = useMemo(
      () => ({
        activeLayout: 'force',
        layers: { background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.6 } },
        behaviours: { 'click-select': { enabled: true } },
        layouts: { force: { charge: { strength: -520 }, link: { distance: 120 }, collide: {}, animate: false } },
      }),
      [],
    );

    const onReady = useCallback((c: GraphCanvas | null) => {
      setCanvas(c);
      c?.showMessage('History on the right — grouped by day, newest first');
    }, []);

    return (
      <GraphCanvasApp
        data={data}
        config={config}
        onReady={onReady}
        header={{
          title: 'CanvasSnapshotsViewPanel',
          center: <GraphControlsToolbar />,
          right: (ctx) => (
            <ToolbarItems
              orientation="horizontal"
              items={[
                ...dock.items,
                {
                  type: 'toggle',
                  key: 'theme',
                  icon: Sun,
                  activeIcon: Moon,
                  label: 'Switch to dark theme',
                  activeLabel: 'Switch to light theme',
                  active: ctx.themeKind === 'dark',
                  onToggle: ctx.toggleTheme,
                },
              ]}
            />
          ),
        }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        right={dock.region}
      >
        <D3ForceLayout id="force" targetLayerId="graph" />
      </GraphCanvasApp>
    );
  },
};
