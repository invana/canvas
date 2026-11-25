/**
 * **`<GraphBoard>` in Focus — no layout switcher.** The row that carries
 * *Layout ▾* shows only in the work modes (Explore · Edit · Annotate); Focus
 * and Present yield the board to the drawing, so the switcher goes with the
 * rest of the row. Right-click → *Layout…* still opens the preset cards.
 * Esc returns to Explore, and the switcher with it.
 *
 * rfc:feat-2026-11-25-the-board-hides-its-layout-switcher
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useMemo } from 'react';
import { GraphBoard } from '@invana/canvas-ui';
import type { GraphCanvas } from '@invana/graph';
import { valjeanScenes } from './data';

const meta: Meta = { title: 'canvas-ui/apps/GraphBoard/GraphBoardLayoutSwitcherFocus' };
export default meta;
type Story = StoryObj;

export const GraphBoardLayoutSwitcherFocusStory: Story = {
  name: 'GraphBoardLayoutSwitcherFocus',
  render: function Render() {
    const data = useMemo(valjeanScenes, []);
    // The mode command registers with the board's chrome; switch once it has.
    const onReady = useCallback((canvas: GraphCanvas | null) => {
      if (canvas) setTimeout(() => void canvas.commands.run('board.mode', { value: 'focus' }), 50);
    }, []);
    return (
      <div className="h-screen">
        <GraphBoard data={data} onReady={onReady} />
      </div>
    );
  }
};
