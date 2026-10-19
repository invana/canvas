/**
 * **The view dock — minimap over the zoom bar.** Bottom-left: the minimap,
 * and under it one bar — − · the zoom field ▾ · + · Fit · lock. The field is the
 * `zoom-field` widget (`ZoomField`):
 *
 * | Do | What happens |
 * |---|---|
 * | − / + | step 10 · 25 · 33 · 50 · 67 · 75 · 100 · 125 · 150 · 200 · 300 · 400 % from wherever the zoom is |
 * | click the field, type `150`, Enter | zoom to 150 % (held to 10–400); Esc cancels; ↑ ↓ step |
 * | ▾ | 50 % · 100 % · 200 %, then *Fit to screen* |
 * | Fit · lock | `camera.fit`, `view.lock` |
 *
 * The footer keeps only the pan (`view-readout`, `show: 'pan'`) — the zoom is
 * the dock's.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import { ControlPanel, MiniMapLayer } from '@invana/canvas-react';
import { GraphCanvasApp } from '@invana/canvas-ui';
import { twitterActivity } from '@invana/graph-datasets';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/ZoomField' };
export default meta;
type Story = StoryObj;

const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };

/** The board's edge margin; the minimap sits on the 32 px bar, both 184 px wide. */
const EDGE = 12;

export const ZoomFieldStory: Story = {
  name: 'ZoomField',
  render: () => {
    const data = useMemo(() => twitterActivity, []);
    return (
      <GraphCanvasApp data={data} config={CONFIG} header={{ title: 'ZoomField' }}>
        <MiniMapLayer backgroundLayerId="background" position="bottom-left" width={184} height={116} margin={{ x: EDGE, y: EDGE + 32 }} />
        <ControlPanel
          id="dock"
          position="bottom-left"
          offset={EDGE}
          surface="hairline"
          items={[
            { type: 'widget', widget: 'zoom-field' },
            { type: 'command', key: 'fit', command: 'camera.fit', icon: 'fit', label: 'Fit to screen (⇧1)' },
            { type: 'toggle', key: 'lock', command: 'view.lock', icon: 'lock-open', activeIcon: 'lock', label: 'Lock the view', activeLabel: 'Unlock the view' }
          ]}
        />
        <ControlPanel id="readout" placement="footer-right" items={[{ type: 'widget', widget: 'view-readout', options: { show: 'pan' } }]} />
      </GraphCanvasApp>
    );
  }
};
