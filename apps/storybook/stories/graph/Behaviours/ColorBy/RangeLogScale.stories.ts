/**
 * **Range — a log scale for a long-tailed magnitude**
 *
 * Same field as `RangeContinuous`, one option different — and that is the
 * comparison worth making.
 *
 * `data.scenes` is heavily long-tailed: the median character shares 12 scenes,
 * Valjean shares 158. On a `'linear'` scale almost the entire cast sits at the
 * pale end and the gradient is spent on two or three protagonists. `scale: 'log'`
 * spends the ramp where the data actually is, and the supporting cast becomes
 * distinguishable.
 *
 * `'sqrt'` is the gentler middle option. The three continuous scales match
 * `NodeCentralityBehaviour`'s deliberately — the same curve names mean the same
 * thing across behaviours.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { createContainer } from '../../../div-util';
import { mountColorByStory } from './_shared';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/RangeLogScale' };
export default meta;
type Story = StoryObj;

export const RangeLogScaleStory: Story = {
  name: 'RangeLogScale',
  render: () => createContainer({ id: 'colour-by-log' }),
  play: async ({ canvasElement }) => {
    await mountColorByStory(canvasElement, 'colour-by-log', {
      mode: 'range',
      scale: 'log',
      nodeValueKey: 'data.scenes',
      nodeDomain: [1, 158],
      colorEdges: false,
    });
  },
};
