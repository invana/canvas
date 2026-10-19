/**
 * **`LegendViewPanel` — what the colours on the board mean.** The drawn node
 * types as dots and relationship types as lines, each with its live count,
 * coloured as drawn. Each entry is the switch for its type: a click hides every
 * node (or relationship) of it through `graph.typeVisible` — one undoable write —
 * and the entry stays, struck, to bring it back. Bare content: here it docks in
 * the app's `right` region; on the board the rail opens it (`BoardPanels`).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas } from '@invana/graph';
import { GraphCanvasApp, LegendViewPanel } from '@invana/canvas-ui';
import { twitterActivity } from '@invana/graph-datasets';
import { PanelContent } from '@invana/ui';

const meta: Meta = { title: 'canvas-ui/view-panels/LegendViewPanel' };
export default meta;
type Story = StoryObj;

const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };

export const LegendViewPanelStory: Story = {
  name: 'LegendViewPanel',
  render: () => {
    const data = useMemo(() => twitterActivity, []);
    return (
      <GraphCanvasApp
        data={data}
        config={CONFIG}
        header={{ title: 'LegendViewPanel' }}
        right={{
          content: (ctx) => (
            <PanelContent titleText="Legend">
              <LegendViewPanel canvas={ctx.canvas as GraphCanvas | null} className="p-2" />
            </PanelContent>
          ),
          defaultSize: '280px'
        }}
      />
    );
  }
};
