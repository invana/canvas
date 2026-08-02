/**
 * **Category — colour by a nested field**
 *
 * The everyday case: one distinct colour per distinct value, handed out from
 * the palette in order of first appearance and remembered, so a value keeps its
 * colour as data arrives.
 *
 * `'data.group'` is a **root-relative dot path**, which is the whole addressing
 * model — the same option that reads `'type'` reaches arbitrarily deep into the
 * payload. This is the case that needed a *function* before
 * (`nodeLabel: (n) => n.data.group`), and a function can never be persisted to
 * `view.definition` or edited in a settings panel. A string path can, which is
 * why it's the primary form and `nodeValueBy` is only the escape hatch for
 * values that must be **computed**.
 *
 * Les Misérables' 11 communities are the closest thing this dataset has to an
 * entity kind — see `MissingField` for what happens when you ask for `type`.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { createContainer } from '../../../div-util';
import { mountColorByStory } from './_shared';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/ByCommunity' };
export default meta;
type Story = StoryObj;

export const ByCommunityStory: Story = {
  name: 'ByCommunity',
  render: () => createContainer({ id: 'colour-by-community' }),
  play: async ({ canvasElement }) => {
    await mountColorByStory(canvasElement, 'colour-by-community', { nodeValueKey: 'data.group', colorEdges: false });
  },
};
