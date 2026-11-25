/**
 * **`<GraphBoard>`'s layout switcher, open.** The row's *Layout ▾* — the active
 * preset's glyph and a chevron, after Select ▾ · Hand — opens the preset cards:
 * Network · Tree ↓ · Flow → · Radial, each with its options and *Run again*.
 *
 * It runs `layout.preset`, the same binding as right-click → *Layout…*, so the
 * two always agree, and the pick is undoable (⌘Z puts the button back). The row
 * shows in Explore · Edit · Annotate; see `GraphBoardLayoutSwitcherFocus` for
 * the view modes, where it is gone.
 *
 * rfc:feat-2026-11-25-the-board-hides-its-layout-switcher
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import { GraphBoard } from '@invana/canvas-ui';
import { valjeanScenes } from './data';

const meta: Meta = { title: 'canvas-ui/apps/GraphBoard/GraphBoardLayoutSwitcher' };
export default meta;
type Story = StoryObj;

export const GraphBoardLayoutSwitcherStory: Story = {
  name: 'GraphBoardLayoutSwitcher',
  render: function Render() {
    const data = useMemo(valjeanScenes, []);
    return (
      <div className="h-screen">
        <GraphBoard data={data} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    // The row mounts once the engine is ready — wait for its layout button, then open it.
    for (let i = 0; i < 100; i++) {
      const button = canvasElement.querySelector<HTMLButtonElement>('button[aria-label^="Layout ·"]');
      if (button) {
        button.click();
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
};
