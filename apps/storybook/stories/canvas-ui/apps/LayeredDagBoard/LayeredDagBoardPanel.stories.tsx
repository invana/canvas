/**
 * **`<LayeredDagBoard chrome="panel">` — a plan drawn in tones, with its
 * legend.** No header or footer: the canvas alone, as a work panel shows it.
 * Each node is seeded in its `data.column` (a wave), then ELK lays the waves
 * out left to right; the critical path is the one thing in the `info` tone.
 *
 * | Do | What happens |
 * |---|---|
 * | click a task | it is selected — the line under the board names it |
 * | click the empty board | the selection clears |
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { type DagBoardSelection, LayeredDagBoard } from '@invana/canvas-ui';
import { Eyebrow } from '@invana/ui';
import { PLAN_LEGEND, projectPlan } from './data';

const meta: Meta = { title: 'canvas-ui/apps/LayeredDagBoard/LayeredDagBoardPanel' };
export default meta;
type Story = StoryObj;

export const LayeredDagBoardPanelStory: Story = {
  name: 'LayeredDagBoardPanel',
  render: function Render() {
    const data = useMemo(projectPlan, []);
    const [selected, setSelected] = useState<DagBoardSelection>(null);
    return (
      <div className="flex h-screen flex-col">
        <div className="min-h-0 flex-1">
          <LayeredDagBoard data={data} chrome="panel" legend={PLAN_LEGEND} selected={selected} onSelect={setSelected} />
        </div>
        <Eyebrow>{selected ? `Selected ${selected.kind} ${selected.id}` : 'Nothing selected'}</Eyebrow>
      </div>
    );
  },
};
