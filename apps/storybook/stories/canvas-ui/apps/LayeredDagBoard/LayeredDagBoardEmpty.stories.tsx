/**
 * **`<LayeredDagBoard>` with nothing to draw** — `emptyHint` stands in for the
 * board, so a host's empty plan says what to do next instead of showing a
 * blank canvas.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayeredDagBoard } from '@invana/canvas-ui';

const meta: Meta = { title: 'canvas-ui/apps/LayeredDagBoard/LayeredDagBoardEmpty' };
export default meta;
type Story = StoryObj;

export const LayeredDagBoardEmptyStory: Story = {
  name: 'LayeredDagBoardEmpty',
  render: () => (
    <div className="h-screen">
      <LayeredDagBoard
        data={{ nodes: [], edges: [] }}
        chrome="panel"
        emptyHint="No tasks in this project yet. Add one, then use Connect to say what waits on what."
      />
    </div>
  ),
};
