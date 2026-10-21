/**
 * **`<GraphBoard>` with nothing but data.** Every default on:
 *
 * | Where | What |
 * |---|---|
 * | top-left | the mode picker (Explore · Edit · Annotate · Present), then the mode's tools |
 * | top-right | the rail — Legend · Styling · History · Element · Changes · Export |
 * | bottom-left | the minimap over zoom · fit · lock, in work modes |
 * | right-click | board · node · relationship · selection menus |
 *
 * Click a character: the Element panel opens on it. Switch to Edit: *N* adds a
 * node, *C* connects, Shift held connects while it is held. No backend — Save
 * in Changes runs the board's own `unsaved.save`.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import { GraphBoard } from '@invana/canvas-ui';
import { valjeanScenes } from './data';

const meta: Meta = { title: 'canvas-ui/apps/GraphBoard/GraphBoard' };
export default meta;
type Story = StoryObj;

export const GraphBoardStory: Story = {
  name: 'GraphBoard',
  render: function Render() {
    const data = useMemo(valjeanScenes, []);
    return (
      <div className="h-screen">
        <GraphBoard data={data} />
      </div>
    );
  }
};
