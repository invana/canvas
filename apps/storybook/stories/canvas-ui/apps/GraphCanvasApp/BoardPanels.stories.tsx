/**
 * **Board panels — the rail and its one floating panel.** `<BoardPanels>` draws
 * a vertical rail top-right (a saved `<ControlPanel id="board-rail">` of
 * `board.panel` toggles) and floats the open panel just left of it on the kit's
 * `FloatingPanel` — title · count · its own actions · ✕. One panel at a time:
 * opening another replaces it, its icon or ✕ closes it.
 *
 * | Panel | Content | Actions in its bar | Modes |
 * |---|---|---|---|
 * | Legend | `LegendViewPanel` — click a type to hide it | — | every |
 * | Styling | `StylingViewPanel` | *Size by connections* | every |
 * | Canvas history | `HistoryViewPanel` | undo · redo | every |
 * | Element | `ElementViewPanel` | — | Edit |
 * | Export | `ExportViewPanel` — Image or Data | — | every, after a line |
 *
 * Switch the mode from the row to see Element join the rail in Edit. ⌘K lists
 * *Panel* too — the rail is a command, not a private toggle.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas } from '@invana/graph';
import { BoardModes, ClickInspectBehaviour, ControlPanel, NodeCentralityBehaviour, type BoardModeSpec } from '@invana/canvas-react';
import {
  BoardPanels,
  CommandPalette,
  ControlItems,
  ElementViewPanel,
  ExportViewPanel,
  GraphCanvasApp,
  HISTORY_CONTROL_ITEMS,
  HistoryViewPanel,
  LegendViewPanel,
  StylingViewPanel,
  type BoardPanelSpec,
  type TypeStylingPatch
} from '@invana/canvas-ui';
import { twitterActivity } from '@invana/graph-datasets';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/BoardPanels' };
export default meta;
type Story = StoryObj;

const MODES: BoardModeSpec[] = [
  { id: 'explore', label: 'Explore', icon: 'compass', description: 'Look, ask and expand' },
  { id: 'edit', label: 'Edit', icon: 'pencil', description: 'Add, change and delete data' }
];

const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };

export const BoardPanelsStory: Story = {
  name: 'BoardPanels',
  render: () => {
    const data = useMemo(() => twitterActivity, []);
    const [styling, setStyling] = useState<TypeStylingPatch>({});

    const panels = useMemo<BoardPanelSpec[]>(
      () => [
        { id: 'legend', title: 'Legend', icon: 'legend', render: (c) => <LegendViewPanel canvas={c as GraphCanvas} className="p-2" /> },
        {
          id: 'styling',
          title: 'Styling',
          icon: 'palette',
          actions: (
            <ControlItems
              items={[{ type: 'toggle', command: 'behaviour.toggle', args: { id: 'size-by-connections' }, icon: 'size-by-connections', label: 'Size by connections' }]}
            />
          ),
          render: (c) => <StylingViewPanel canvas={c as GraphCanvas} value={styling} onChange={setStyling} />
        },
        {
          id: 'history',
          title: 'Canvas history',
          icon: 'history',
          actions: <ControlItems items={HISTORY_CONTROL_ITEMS} />,
          render: (c) => <HistoryViewPanel canvas={c} showUndoRedo={false} />
        },
        {
          id: 'element',
          title: 'Element',
          icon: 'properties',
          modes: ['edit'],
          render: (c) => <ElementViewPanel canvas={c as GraphCanvas} editable />
        },
        { id: 'export', title: 'Export', icon: 'download', separatorBefore: true, render: (c) => <ExportViewPanel canvas={c} filename="twitter" /> }
      ],
      [styling]
    );

    return (
      <GraphCanvasApp data={data} config={CONFIG} header={{ title: 'BoardPanels' }}>
        <BoardModes modes={MODES} />
        <NodeCentralityBehaviour id="size-by-connections" enabled={false} />
        {/* What the Element panel reads: the clicked element. */}
        <ClickInspectBehaviour id="click-inspect" targetLayerId="graph" />
        <ControlPanel id="row" position="top-left" offset={12} surface="hairline" items={[{ type: 'widget', widget: 'board-mode' }]} />
        <BoardPanels panels={panels} defaultOpen="legend" offset={12} />
        <CommandPalette />
      </GraphCanvasApp>
    );
  }
};
