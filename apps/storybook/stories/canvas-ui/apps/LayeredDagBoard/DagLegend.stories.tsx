/**
 * **`<DagLegend>` — the strip along a DAG board's bottom**, on its own: one key
 * per tone and line the board draws, then a note. With `error` the strip says
 * that instead, in the destructive colour.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DagLegend } from '@invana/canvas-ui';
import { PLAN_LEGEND } from './data';

const meta: Meta = { title: 'canvas-ui/apps/LayeredDagBoard/DagLegend' };
export default meta;
type Story = StoryObj;

export const DagLegendStory: Story = {
  name: 'DagLegend',
  render: () => (
    <div className="flex flex-col gap-3 p-4">
      <DagLegend legend={PLAN_LEGEND} />
      <DagLegend legend={PLAN_LEGEND} error="That dependency would make a loop: review → scope → review." />
    </div>
  ),
};
