/**
 * **Category — an unresolved path, and why grey is the right answer**
 *
 * **This story renders every node grey, on purpose.**
 *
 * `nodeValueKey` defaults to `'type'`, and Les Misérables characters *have no
 * `type`* — their community lives on `data.group`. So the path resolves to
 * `undefined` on every node and every node takes `fallbackColor`.
 *
 * That's the designed behaviour for a mis-typed or absent path, and the
 * reasoning is worth stating: a uniform grey graph is a **loud symptom**. The
 * alternative — silently coercing, or picking some other field — would produce a
 * plausible-looking picture built on nothing. `getLegend()` tells the same story,
 * returning a `categories` section with no entries.
 *
 * Compare with `ByCommunity`, which is this story with the path corrected.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { createContainer } from '../../../div-util';
import { mountColorByStory } from './_shared';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/MissingField' };
export default meta;
type Story = StoryObj;

export const MissingFieldStory: Story = {
  name: 'MissingField',
  render: () => createContainer({ id: 'colour-by-missing' }),
  play: async ({ canvasElement }) => {
    await mountColorByStory(canvasElement, 'colour-by-missing', { colorEdges: false });
  },
};
