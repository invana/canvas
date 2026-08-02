/**
 * **Category — the cardinality cap**
 *
 * `maxCategories` guards against colouring by a high-cardinality field. Les
 * Misérables has 11 communities; capping at **4** gives the first four a colour
 * and collapses the remaining seven into the fallback grey.
 *
 * The point is that the truncation becomes **visible** — `getLegend()` emits a
 * single `other (7)` row — rather than silently cycling the palette until
 * unrelated values share a colour, which is what unbounded assignment does. Try
 * `nodeValueKey: 'id'` with the cap off to see the failure it exists to prevent:
 * 77 characters, 77 "categories", 12 palette colours.
 *
 * Set it to `Infinity` to disable.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { createContainer } from '../../../div-util';
import { mountColorByStory } from './_shared';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/MaxCategories' };
export default meta;
type Story = StoryObj;

export const MaxCategoriesStory: Story = {
  name: 'MaxCategories',
  render: () => createContainer({ id: 'colour-by-cap' }),
  play: async ({ canvasElement }) => {
    await mountColorByStory(canvasElement, 'colour-by-cap', { nodeValueKey: 'data.group', colorEdges: false, maxCategories: 4 });
  },
};
