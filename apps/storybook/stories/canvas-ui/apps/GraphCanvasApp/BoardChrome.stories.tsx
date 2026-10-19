/**
 * **The board's chrome, every piece in its one place.** The layout the Invana
 * Explorer draws (GC21–GC24), composed only from saved `<ControlPanel>`s and
 * canvas-ui widgets:
 *
 * | Where | What |
 * |---|---|
 * | top-left | one light row: select mode · layout presets · undo / redo · minimap · export · *Present* |
 * | under it | `graph-legend`: node and relationship types with live counts |
 * | bottom-left | the view bar (zoom in · zoom out · fit · full screen · lock), then the minimap, one height, 12 px apart |
 * | footer, right | `view-readout`: zoom and the world point at the viewport centre; a click copies it |
 *
 * The minimap is a `MiniMapLayer` anchored `bottom-left` and inset past the
 * view bar, so the two sit side by side. *Present* opens the walkthrough from
 * `PlaybookPresenterBar/Compact`; here it shows the collapsed toolbar and the
 * presenter bar too.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useMemo, useState } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas } from '@invana/graph';
import { ControlPanel, ElkLayout, MiniMapLayer } from '@invana/canvas-react';
import {
  GraphCanvasApp,
  HISTORY_CONTROL_ITEMS,
  PlaybookPresentButton,
  PlaybookPresenterBar,
  PlaybookStepper,
  SELECT_MODE_CONTROL_ITEMS,
  type ControlWidget
} from '@invana/canvas-ui';
import { lesMiserables } from '@invana/graph-datasets';
import { Sparkles } from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/BoardChrome' };
export default meta;
type Story = StoryObj;

/** The board opens on the Network preset. */
const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };

/** The view bar's height; the minimap matches it. */
const DOCK_H = 142;
/** The board's edge margin, and the gap between the view bar and the minimap. */
const EDGE = 12;
/** The view bar's width: one control plus the panel's padding and border. */
const BAR_W = 31;

const PLAYBOOK = {
  version: 1 as const,
  title: 'Who holds Les Misérables together?',
  source: 'graph',
  steps: [
    {
      id: 'cast',
      title: 'Who is in Les Misérables?',
      narration: '77 characters. An edge means two of them share a scene.',
      view: { camera: 'all' as const }
    },
    {
      id: 'hub',
      title: 'Who holds the story together?',
      narration: 'Valjean. He shares a scene with 36 characters, more than anyone else.',
      view: { select: ['Valjean'], focus: { ids: ['Valjean', 'Javert', 'Fantine', 'Cosette', 'Marius'] }, camera: 'focus' as const }
    }
  ]
};

export const BoardChromeStory: Story = {
  name: 'BoardChrome',
  render: () => <Board />
};

function Board() {
  const [presenting, setPresenting] = useState(false);
  const onReady = useCallback((canvas: GraphCanvas | null) => {
    if (canvas) void canvas.playbook.load(PLAYBOOK);
  }, []);
  const widgets = useMemo<Record<string, ControlWidget>>(
    () => ({
      present: ({ canvas }) => <PlaybookPresentButton canvas={canvas} onPresent={() => setPresenting(true)} />,
      stepper: ({ canvas }) => <PlaybookStepper canvas={canvas} onClose={() => setPresenting(false)} />,
      presenter: ({ canvas }) => (
        <PlaybookPresenterBar
          canvas={canvas}
          variant="compact"
          className="w-[540px] shadow-lg"
          narrationIcon={
            <span className="bg-primary/15 text-primary inline-flex size-5 shrink-0 items-center justify-center rounded-full">
              <Sparkles className="size-3" />
            </span>
          }
        />
      )
    }),
    []
  );

  return (
    <GraphCanvasApp data={lesMiserables} showHeader={false} config={CONFIG} onReady={onReady} controlPanels={{ widgets }}>
      <ElkLayout id="elk" targetLayerId="graph" />

      <ControlPanel
        id="tools"
        position="top-left"
        offset={EDGE}
        items={
          presenting
            ? [{ type: 'widget', widget: 'stepper' }]
            : [
                ...SELECT_MODE_CONTROL_ITEMS,
                { type: 'divider' },
                { type: 'widget', widget: 'layout-presets' },
                { type: 'divider' },
                ...HISTORY_CONTROL_ITEMS,
                { type: 'divider' },
                { type: 'widget', widget: 'export-image', options: { filename: 'board' } },
                { type: 'divider' },
                { type: 'widget', widget: 'present' }
              ]
        }
      />
      <ControlPanel
        id="legend"
        position="top-left"
        offset={{ x: EDGE, y: 51 }}
        surface={false}
        items={[{ type: 'widget', widget: 'graph-legend' }]}
      />

      <ControlPanel
        id="view"
        position="bottom-left"
        offset={EDGE}
        orientation="vertical"
        items={[
          { type: 'command', key: 'zoom-in', command: 'camera.zoomIn', icon: 'zoom-in', label: 'Zoom in' },
          { type: 'command', key: 'zoom-out', command: 'camera.zoomOut', icon: 'zoom-out', label: 'Zoom out' },
          { type: 'command', key: 'fit', command: 'camera.fit', icon: 'maximize', label: 'Fit to content' },
          { type: 'widget', widget: 'fullscreen' },
          { type: 'toggle', key: 'lock', command: 'view.lock', icon: 'lock-open', activeIcon: 'lock', label: 'Lock view', activeLabel: 'Unlock view' }
        ]}
      />
      <MiniMapLayer position="bottom-left" width={184} height={DOCK_H} margin={{ x: EDGE + BAR_W + EDGE, y: EDGE }} />

      <ControlPanel id="readout" placement="footer-right" items={[{ type: 'widget', widget: 'view-readout' }]} />

      <ControlPanel
        id="presenter"
        position="bottom"
        offset={EDGE}
        surface={false}
        visible={presenting}
        items={[{ type: 'widget', widget: 'presenter' }]}
      />
    </GraphCanvasApp>
  );
}
