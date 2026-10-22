/**
 * **`<LayeredDagBoard layout="fixed">` — the columns are the answer.** An
 * envelope is a classification, not a flow: the steps an agent may run stand
 * in one column and the ones it may not in the next, drawn hollow, faded and
 * dashed. No layout runs, so the two piles stay where they were seeded.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import { LayeredDagBoard } from '@invana/canvas-ui';
import { ENVELOPE_LEGEND, envelope } from './data';

const meta: Meta = { title: 'canvas-ui/apps/LayeredDagBoard/LayeredDagBoardFixed' };
export default meta;
type Story = StoryObj;

export const LayeredDagBoardFixedStory: Story = {
  name: 'LayeredDagBoardFixed',
  render: function Render() {
    const data = useMemo(envelope, []);
    return (
      <div className="h-screen">
        <LayeredDagBoard data={data} chrome="panel" layout="fixed" legend={ENVELOPE_LEGEND} />
      </div>
    );
  },
};
