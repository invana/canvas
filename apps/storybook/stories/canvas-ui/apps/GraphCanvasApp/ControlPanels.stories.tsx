/**
 * `<GraphCanvasApp>` with its controls in **saved control panels** instead of a
 * header toolbar. The header is off. Every control over the canvas is a
 * `<ControlPanel>` whose `items` are pure JSON (canvas-ui presets), so the panels
 * live in `store.view.definition.controlPanels` and survive export → import.
 *
 * - **Top** — `GRAPH_CONTROL_ITEMS`, the saveable counterpart of
 *   `GraphControlsToolbar`: layout picker (the registered `graph-force` and
 *   `layered` layouts) · run / stop · undo / redo · select mode · edge routing ·
 *   delete · fit / lock · grid.
 * - **Left** — `EDIT_CONTROL_ITEMS` (cut / copy / paste / delete) plus the
 *   `export-state` and `export-image` widgets.
 * - **Bottom-right** — `ZOOM_CONTROL_ITEMS` and the `minimap-toggle` widget.
 *
 * Undo / redo and the clipboard commands exist only while
 * `<GraphHistoryProvider>` / `<GraphClipboardProvider>` are mounted, so they wrap
 * the panels here (inside the canvas, after the bundle's graph layer). Select a
 * node and delete it, then undo. Or save the state, reload it, and the panels
 * come back with it.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ControlPanel, ElkLayout, GraphClipboardProvider, GraphHistoryProvider } from '@invana/canvas-react';
import {
  EDIT_CONTROL_ITEMS,
  GRAPH_CONTROL_ITEMS,
  GraphCanvasApp,
  ZOOM_CONTROL_ITEMS,
} from '@invana/canvas-ui';
import { lesMiserables } from '@invana/graph-datasets';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/ControlPanels' };
export default meta;
type Story = StoryObj;

const DATA = lesMiserables;

export const ControlPanelsStory: Story = {
  name: 'ControlPanels',
  render: () => (
    <GraphCanvasApp data={DATA} showHeader={false}>
      {/* A second registered layout, so the layout picker has a choice. */}
      <ElkLayout id="layered" targetLayerId="graph" fitPadding={null} />

      <GraphHistoryProvider>
        <GraphClipboardProvider>
          <ControlPanel id="graph-controls" position="top" items={GRAPH_CONTROL_ITEMS} />
          <ControlPanel
            id="edit"
            position="left"
            items={[
              ...EDIT_CONTROL_ITEMS,
              { type: 'divider' },
              { type: 'widget', widget: 'export-state', options: { filename: 'control-panels' } },
              { type: 'widget', widget: 'export-image', options: { filename: 'control-panels' } }
            ]}
          />
          <ControlPanel
            id="view"
            position="bottom-right"
            items={[...ZOOM_CONTROL_ITEMS, { type: 'divider' }, { type: 'widget', widget: 'minimap-toggle', options: { defaultOn: false } }]}
          />
        </GraphClipboardProvider>
      </GraphHistoryProvider>
    </GraphCanvasApp>
  )
};
