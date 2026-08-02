/**
 * **Range — explicit threshold bins**
 *
 * Sometimes the buckets are an editorial decision, not a statistical one:
 * walk-on (under 3 co-stars), minor (3–9), supporting (10–19), principal (20+).
 * `scale: 'threshold'` takes those edges literally, in the field's own units.
 *
 * Three edges give four buckets. The ramp is sampled once per bucket rather than
 * interpolated per value, so the result reads as discrete bands — and
 * `getLegend()` returns `kind: 'bins'` with each band's `from` / `to`, so a
 * legend can state the rule rather than showing a meaningless gradient.
 *
 * `scale: 'quantile'` is the sibling for when you want equal-*count* buckets
 * derived from the data instead of edges you chose.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { createContainer } from '../../../div-util';
import { mountColorByStory } from './_shared';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/RangeThresholdBins' };
export default meta;
type Story = StoryObj;

export const RangeThresholdBinsStory: Story = {
  name: 'RangeThresholdBins',
  render: () => createContainer({ id: 'colour-by-threshold' }),
  play: async ({ canvasElement }) => {
    await mountColorByStory(canvasElement, 'colour-by-threshold', {
      mode: 'range',
      scale: 'threshold',
      nodeValueKey: 'data.degree',
      nodeThresholds: [3, 10, 20],
      colorEdges: false,
    });
  },
};
