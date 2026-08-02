/**
 * **Range — a continuous ramp over an explicit domain**
 *
 * `mode: 'range'` reads a field as a **magnitude** and interpolates along a
 * colour ramp, rather than treating each distinct number as its own category.
 *
 * That distinction is the reason the mode exists. `data.scenes` (total shared
 * scenes — a derived field, see `_shared.ts`) runs 1–158. In `'category'` mode,
 * 87 and 88 shared scenes are two unrelated values and get two unrelated
 * colours. Here they are adjacent points on one scale, and Valjean's centrality
 * is legible at a glance.
 *
 * The domain is set explicitly. Omit it and the behaviour auto-scans the field
 * across the layer — convenient, but a node arriving later that widens the range
 * **recolours every other node**, so pin it for stable colours across a
 * streaming load.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { createContainer } from '../../../div-util';
import { mountColorByStory } from './_shared';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/RangeContinuous' };
export default meta;
type Story = StoryObj;

export const RangeContinuousStory: Story = {
  name: 'RangeContinuous',
  render: () => createContainer({ id: 'colour-by-range' }),
  play: async ({ canvasElement }) => {
    await mountColorByStory(canvasElement, 'colour-by-range', { mode: 'range', nodeValueKey: 'data.scenes', nodeDomain: [1, 158], colorEdges: false });
  },
};
