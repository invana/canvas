/**
 * **`ExportViewPanel` — what leaves the board.** Two tabs:
 *
 * | Tab | Choices | Saves |
 * |---|---|---|
 * | Image | in view · whole board · PNG or SVG · background · scale · aspect ratio | `twitter-board.png` (or `-view`, `.svg`) |
 * | Data | whole board · selection (the selected nodes and the edges between them) | `exported-data.json` — `{ "nodes": [...], "edges": [...] }` |
 *
 * Each exported node is its `id`, `type`, `data` and `position`; each edge its
 * `id`, `source`, `target`, `type` and `data` — what the elements are, not how
 * they are drawn. Select a few nodes (Shift-drag) to switch the Data tab to
 * *Selection*. Bare content: here it docks in the app's `right` region; on the
 * board the rail opens it (`BoardPanels`).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import { ExportViewPanel, GraphCanvasApp } from '@invana/canvas-ui';
import { twitterActivity } from '@invana/graph-datasets';
import { PanelContent } from '@invana/ui';

const meta: Meta = { title: 'canvas-ui/view-panels/ExportViewPanel' };
export default meta;
type Story = StoryObj;

const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };

export const ExportViewPanelStory: Story = {
  name: 'ExportViewPanel',
  render: () => {
    const data = useMemo(() => twitterActivity, []);
    return (
      <GraphCanvasApp
        data={data}
        config={CONFIG}
        header={{ title: 'ExportViewPanel' }}
        right={{
          content: (ctx) => (
            <PanelContent titleText="Export">
              {ctx.canvas ? (
                <ExportViewPanel canvas={ctx.canvas} filename="twitter" />
              ) : (
                <p className="text-muted-foreground p-3 text-sm">Waiting for the canvas…</p>
              )}
            </PanelContent>
          ),
          defaultSize: '320px'
        }}
      />
    );
  }
};
